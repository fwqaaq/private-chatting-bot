import {
  type Context,
  type NextFunction,
  type Bot,
  type MiddlewareFn,
  type CommandContext,
  InputFile,
} from 'grammy'
import type { Environment, FromInfo } from './type.ts'

export async function preventGroupJoin(ctx: Context, next: NextFunction) {
  const update = ctx.myChatMember
  // not chat_member event, continue next middleware
  if (!update) return await next()
  if (
    update.new_chat_member.status === 'member' ||
    update.new_chat_member.status === 'administrator'
  ) {
    try {
      await ctx.leaveChat()
      console.log(`机器人已离开群组: ${update.chat.id}`)
    } catch (error) {
      console.error(`离开群组时出错: ${error}`)
    }
    // leave the group, stop the middleware chain
    return
  }

  // other chat_member event, continue next middleware
  return await next()
}

export async function handleGeneralMessage(
  ctx: Context,
  next: NextFunction,
  env: Environment,
  bot: Bot,
  msgMap: Map<number, FromInfo>
) {
  if (!ctx.from || ctx.chat?.type !== 'private') {
    return await next()
  }

  if (!ctx.message) return await next()
  // if the message is a command, continue next middleware
  if (ctx.message.text?.startsWith('/')) return await next()
  // if the message is from master, transfer the message to user
  if (ctx.from.username === env.MASTER_USERNAME) {
    // not reply to message
    if (!ctx.message.reply_to_message)
      return await ctx.reply('请回复消息以转发给用户')

    const replyToId = ctx.message.reply_to_message.message_id
    const fromUser = msgMap.get(replyToId)
    // if the message is not from user, return
    if (!fromUser) return await ctx.reply('未找到对应的用户')

    // transfer the message to user
    try {
      await bot.api.sendMessage(
        fromUser.chatId,
        `来自 @${env.MASTER_USERNAME} 的消息: ${ctx.message.text}`,
        {
          reply_parameters: { message_id: fromUser.messageId },
        }
      )
    } catch (e) {
      console.error(`转发消息给用户时出错: ${e}`)
    }
    return await next()
  }

  if (!ctx.from.username) {
    await ctx.reply('如果你想私聊我，请先设置一个用户名')
    return await next()
  }

  try {
    const sendMessage = await bot.api.sendMessage(
      env.MASTER_ID,
      `来自 @${ctx.from.username} 的消息: ${ctx.message.text}`
    )

    msgMap.set(sendMessage.message_id, {
      chatId: ctx.chat.id,
      messageId: ctx.message.message_id,
      username: ctx.from.username,
      time: +Date.now(),
    })
  } catch (e) {
    console.error(`发送消息给 ${env.MASTER_USERNAME} 时出错: ${e}`)
  }

  return await next()
}

export function cleanupMap(
  msgMap: Map<number, FromInfo>,
  time: number = 1000 * 60 * 5
): MiddlewareFn<Context> {
  let initialized = false
  const setupCleanup = () => {
    setInterval(() => {
      const now = +Date.now()
      let count = 0
      for (const [key, value] of msgMap) {
        if (now - value.time > 1000 * 60 * 5) {
          msgMap.delete(key)
          count++
        }
      }
      console.log(`清理了 ${count} 条消息记录`)
    }, time)
  }
  return async (_ctx: Context, next: NextFunction) => {
    if (!initialized) {
      setupCleanup()
      initialized = true
    }
    return await next()
  }
}

// url: spotify URL
export async function spotifyDownloadCommand(ctx: CommandContext<Context>) {
  if (!ctx.match) return await ctx.reply('请输入一个 Spotify 链接')

  const spotifyMetadataUrl = 'https://spotifymate.com'
  const _metadata_res = await fetch(spotifyMetadataUrl)
  const _metadata_text = await _metadata_res.text()
  const _metadata_pattern = /([^"]+)"\s+.+value="([^"]+)/

  const _metadata_match = _metadata_text.match(_metadata_pattern)
  if (!_metadata_match)
    return await ctx.reply('请联系作者，不能获取 metadata 数据')
  const [_, flag, value] = _metadata_match
  const sessionData = _metadata_res.headers.get('Set-Cookie')
  if (!sessionData) return await ctx.reply('请联系作者，不能获取 session 数据')

  const form = new FormData()
  form.append(flag, value)
  form.append('url', ctx.match)

  const _mp3_url_res = await fetch(`${spotifyMetadataUrl}/action`, {
    method: 'POST',
    headers: {
      Cookie: sessionData,
    },
    body: form,
  })
  const text = await _mp3_url_res.text()
  const pattern = /<a\s+[^>]*href\s*=\s*["']([^"']*)["'][^>]*>/i
  const match = text.match(pattern)
  if (!match) return await ctx.reply('请联系作者，不能获取下载链接')
  const [__, mp3] = match

  const _mp3_res = await fetch(mp3)
  const _mp3_blob = await _mp3_res.blob()
  // send audio
  await ctx.replyWithAudio(new InputFile(_mp3_blob))
}
