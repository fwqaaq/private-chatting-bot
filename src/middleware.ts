import {
  type Context,
  type NextFunction,
  type Bot,
  type MiddlewareFn,
  type CommandContext,
  InputFile,
  BotError,
} from 'grammy'
import type { Environment, FromInfo } from './type.ts'
import { catchError } from './utils.ts'

export async function preventGroupJoin(ctx: Context, next: NextFunction) {
  const update = ctx.myChatMember
  // not chat_member event, continue next middleware
  if (!update) return await next()
  if (
    update.new_chat_member.status === 'member' ||
    update.new_chat_member.status === 'administrator'
  ) {
    const [e] = await catchError(ctx.leaveChat(), [BotError])
    if (e) return console.error(`Error leaving group: ${e}`)
    console.log(`Left group ${ctx.chat?.id}`)

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
    const [e] = await catchError(
      bot.api.copyMessage(
        fromUser.chatId,
        ctx.chat.id,
        ctx.message.message_id,
        {
          reply_parameters: { message_id: fromUser.messageId },
        }
      ),
      [BotError]
    )
    if (e) return await ctx.reply('转发消息失败')
    return await next()
  }

  if (!ctx.from.username) {
    await ctx.reply('如果你想私聊我，请先设置一个用户名')
    return await next()
  }

  const [_e, sendMessage] = await catchError(
    bot.api.forwardMessage(env.MASTER_ID, ctx.chat.id, ctx.message.message_id),
    [BotError]
  )
  if (_e) return await ctx.reply(`发送消息给 ${env.MASTER_USERNAME} 时出错`)

  msgMap.set(sendMessage.message_id, {
    chatId: ctx.chat.id,
    messageId: ctx.message.message_id,
    username: ctx.from.username,
    time: +Date.now(),
  })

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
  await ctx.replyWithAudio(new InputFile(_mp3_blob), {
    reply_parameters: ctx.message && { message_id: ctx.message.message_id },
  })
}
