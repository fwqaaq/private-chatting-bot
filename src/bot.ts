import { Bot, webhookCallback } from 'grammy'
import type { Environment, FromInfo } from './type.ts'
import {
  preventGroupJoin,
  handleGeneralMessage,
  cleanupMap,
  spotifyDownloadCommand,
} from './middleware.ts'

const msgMap = new Map<number, FromInfo>()

export default {
  async fetch(request: Request, env: Environment) {
    const bot = new Bot(env.BOT_TOKEN)

    await bot.api.setMyCommands([
      { command: 'start', description: '开始使用' },
      { command: 'spotify', description: '下载 Spotify 音乐' },
    ])

    const cleanupMapMiddleware = cleanupMap(msgMap)
    // cleanup map
    bot.use(cleanupMapMiddleware)
    // Prevent joining group
    bot.use(preventGroupJoin)
    // process message
    bot.use((ctx, next) => handleGeneralMessage(ctx, next, env, bot, msgMap))

    bot.command(
      'start',
      async (ctx) =>
        await ctx.reply(
          `Hello World. 这是 @${env.MASTER_USERNAME} 的私聊机器人，请不要在群组中使用`
        )
    )

    bot.command('spotify', spotifyDownloadCommand)

    const cb = webhookCallback(bot, 'cloudflare-mod')

    return await cb(request)
  },
}
