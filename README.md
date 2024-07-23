# Telegram private Chatting bot

This is a private chatting bot for telegram. It can prevent other users from directly chatting with you and filter out some scammer.

## Deploy

1. Install [Deno](https://deno.land/) and [denoflare](https://denoflare.dev/)

   ```bash
   deno install -A --name denoflare --force \
   https://raw.githubusercontent.com/skymethod/denoflare/v0.6.0/cli/cli.ts
   ```

2. Get your `BOT_TOKEN` from [BotFather](https://t.me/botfather)
3. Get your Cloudflare `API_ACCOUNT` and `API_TOKEN` from [Cloudflare](https://dash.cloudflare.com/profile/api-tokens)
4. Config `.denoflare` file:
   * `BOT_TOKEN`: Your telegram bot token
   * `MASTER_ID`: Chat ID to receive information from others users
   * `MASTER_USERNAME`: Your telegram username
   * `ACCOUNT_ID`: Your Cloudflare account ID
   * `API_TOKEN`: Your Cloudflare API token
5. Run the bot

    ```bash
    denoflare push my-bot
    ```

Or conifg secrets(`BOT_TOKEN`, `MASTER_ID`, `MASTER_USERNAME`, `ACCOUNT_ID`, `API_TOKEN`) in GitHub Actions.
