import type { Context, NextFunction, Bot, MiddlewareFn } from 'grammy'
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
  //
  if (!ctx.from || ctx.chat?.type !== 'private') {
    return await next()
  }

  // if the message is from master, continue next middleware
  if (ctx.from.username === env.MASTER_USERNAME) {
    return await next()
  }

  if (!ctx.from.username) {
    await ctx.reply('如果你想私聊我，请先设置一个用户名')
    return await next()
  }

  try {
    if (!ctx.message) return await next()
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
