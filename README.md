# Telegram private Chatting bot

This is a private chatting bot for telegram. It can prevent other users from directly chatting with you and filter out some scammer.

And `/spotify` command(+ `url`) can help you to get the Spotify song.

You can get a try: [Bot](https://t.me/fwqaaq_chat_bot)

## Deploy

1. `pnpm wrangler init .`
2. Get your `BOT_TOKEN` from [BotFather](https://t.me/botfather)
3. Config `.denoflare` file:
   * `BOT_TOKEN`: Your telegram bot token
   * `MASTER_ID`: Chat ID to receive information from others users
   * `MASTER_USERNAME`: Your telegram username
   * `ACCOUNT_ID`: Your Cloudflare account ID
   * `API_TOKEN`: Your Cloudflare API token
4. Run the bot

    ```bash
   pnpm run dev
    ```

5. Generate d1 Database: `pnpx wrangler@latest d1 create telegram-chat-db`
6. Generate chats table: `npx wrangler d1 execute telegram-chat-db --remote --file=./scripts/create.sql`

Or conifg secrets(`BOT_TOKEN`, `MASTER_ID`, `MASTER_USERNAME`, `ACCOUNT_ID`, `API_TOKEN`) in GitHub Actions.
