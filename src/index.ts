import { Bot, webhookCallback } from 'grammy';
import { preventGroupJoin, handleGeneralMessage, spotifyDownloadCommand, deleteDBRecord } from './middleware';
import { type ExecutionContext, type ScheduledController } from '@cloudflare/workers-types';
import type { Environment } from './type';

export default {
	async fetch(request: Request, env: Environment) {
		const bot = new Bot(env.BOT_TOKEN);

		await bot.api.setMyCommands([
			{ command: 'start', description: '开始使用' },
			{ command: 'spotify', description: '下载 Spotify 音乐' },
		]);

		// cleanup map
		// Prevent joining group
		bot.use(preventGroupJoin);
		// process message
		bot.use((ctx, next) => handleGeneralMessage(ctx, next, env, bot));

		bot.command('start', async (ctx) => await ctx.reply(`Hello World. 这是 @${env.MASTER_USERNAME} 的私聊机器人，请不要在群组中使用`));

		bot.command('spotify', spotifyDownloadCommand);

		const cb = webhookCallback(bot, 'cloudflare-mod');

		return await cb(request);
	},
	async scheduler(_controller: ScheduledController, env: Environment, _ctx: ExecutionContext) {
		console.info('[INFO]: 自动任务开始执行');
		const result = await deleteDBRecord(env);
		console.info(`[INFO]: 定时清理完成，删除了 ${result.deletedCount} 条记录`);
	},
};
