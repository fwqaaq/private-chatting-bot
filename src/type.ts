import type { D1Database } from '@cloudflare/workers-types';
export interface Environment {
	BOT_TOKEN: string;
	MASTER_ID: number;
	MASTER_USERNAME: string;
	DB: D1Database;
}

export interface FromInfo {
	id?: number;
	chat_id: number;
	message_id: number;
	username: string;
	time: number;
	created_at?: string;
}
