import { Bot, webhookCallback } from 'grammy'
import type { Environment, FromInfo } from './type.ts'
import {
  preventGroupJoin,
  handleGeneralMessage,
  cleanupMap,
} from './middleware.ts'

const msgMap = new Map<number, FromInfo>()

export default {
  async fetch(request: Request, env: Environment) {
    const bot = new Bot(env.BOT_TOKEN)
    const cleanupMapMiddleware = cleanupMap(msgMap)

    // cleanup map
    bot.use(cleanupMapMiddleware)
    // Prevent joining group
    bot.use(preventGroupJoin)
    // process general message
    bot.use((ctx, next) => handleGeneralMessage(ctx, next, env, bot, msgMap))

    bot.command(
      'start',
      async (ctx) =>
        await ctx.reply(
          `Hello World. 这是 @${env.MASTER_USERNAME} 的私聊机器人，请不要在群组中使用`
        )
    )

    // handle message from master
    bot.on('message', async (ctx) => {
      if (!ctx.from?.username || ctx.from.username !== env.MASTER_USERNAME)
        return
      if (!ctx.message.reply_to_message)
        return await ctx.reply('请回复一条消息')

      const replyToId = ctx.message.reply_to_message.message_id
      const fromUser = msgMap.get(replyToId)
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
    })

    const cb = webhookCallback(bot, 'cloudflare-mod')

    return await cb(request)
  },
}
