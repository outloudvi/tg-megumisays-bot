import fetch from './shim/node-fetch'
import { Bot, GrammyError, HttpError } from 'grammy'
import recognize from './cognitive'
import secrets from './secrets'
import { describeUser } from './utils'

const bot = new Bot(secrets.botToken)
const LANG = 'zh-CN'

bot.on('message:voice', async (ctx) => {
  const msgId = `${ctx.msg.message_id}|${ctx.msg.from?.id ?? '-'}`
  const voice = ctx.msg.voice
  if (!voice) return

  const file = await ctx.getFile()
  const path = file.file_path
  if (!path) {
    await ctx.reply('Error: Voice not found!', {
      reply_to_message_id: ctx.msg.message_id,
    })
    return
  }

  console.log(
    `[#${msgId}] Got a voice (${voice.duration}s) from ${
      ctx.msg.from ? describeUser(ctx.msg.from) : 'Unknown user'
    }`
  )

  const data = await fetch(
    `https://api.telegram.org/file/bot${secrets.botToken}/${path}`
  ).then((x: any) => x.blob())
  await ctx.reply(`Recognizing your ${voice.duration}s message...`, {
    reply_to_message_id: ctx.msg.message_id,
  })
  const result = await recognize(data, {
    language: LANG,
  })
  const textReply = (() => {
    switch (result.RecognitionStatus) {
      case 'Success': {
        return `Success!\n${result.DisplayText}`
      }
      case 'BabbleTimeout': {
        return 'Error: Too much noise in the beginning (BabbleTimeout)'
      }
      case 'InitialSilenceTimeout': {
        return 'Error: Too much silence in the beginning (InitialSilenceTimeout)'
      }
      case 'NoMatch': {
        return `Error: Failed to match the language ${LANG} (NoMatch)`
      }
      case 'Error': {
        return 'Error: Internal error.'
      }
      default: {
        return `Error: Unrecognized error (${result.RecognitionStatus})`
      }
    }
  })()

  console.log(`[#${msgId}] Result: ${textReply}`)

  ctx.reply(textReply, {
    reply_to_message_id: ctx.msg.message_id,
  })
})

bot.use(async (ctx, next) => {
  ctx.reply('We only accept voice messages!', {
    reply_to_message_id: ctx.msg?.message_id,
  })
  await next
})

bot.catch((err) => {
  const ctx = err.ctx
  console.error(`Error while handling update ${ctx.update.update_id}:`)
  const e = err.error
  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description)
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e)
  } else {
    console.error('Unknown error:', e)
  }
})

export default bot
