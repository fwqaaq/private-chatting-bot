function main() {
  const [BOT_TOKEN, MASTER_ID, MASTER_USERNAME, ACCOUNT_ID, API_TOKEN] =
    Deno.args

  const path = new URL(import.meta.resolve('../.denoflare'))

  const denoflare = Deno.readTextFileSync(path)

  const file = denoflare
    .replace(/<BOT_TOKEN>/, BOT_TOKEN)
    .replace(/<MASTER_ID>/, MASTER_ID)
    .replace(/<MASTER_USERNAME>/, MASTER_USERNAME)
    .replace(/<ACCOUNT_ID>/, ACCOUNT_ID)
    .replace(/<API_TOKEN>/, API_TOKEN)

  Deno.writeTextFileSync(path, file)
}

main()
