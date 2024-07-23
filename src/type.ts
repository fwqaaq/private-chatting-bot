export interface Environment {
  BOT_TOKEN: string
  MASTER_ID: number
  MASTER_USERNAME: string
}

export interface FromInfo {
  chatId: number
  messageId: number
  username: string
  time: number
}
