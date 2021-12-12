import fetch from './shim/node-fetch'
import secrets from './secrets'

const az = secrets.az_speech

type Profanity = 'masked' | 'removed' | 'raw'
type RecognitionStatus =
  | 'Success'
  | 'NoMatch'
  | 'InitialSilenceTimeout'
  | 'BabbleTimeout'
  | 'Error'

interface RecognizeOptionsParam {
  language: string
  profanity?: Profanity
}

interface RecognizeOptions {
  language: string
  profanity: Profanity | undefined
}

interface RecognizeResult {
  RecognitionStatus: RecognitionStatus
  DisplayText: string
  Offset: number
  Duration: number
}

export default async function recognize(
  oggAudioItem: Blob,
  param: RecognizeOptionsParam
): Promise<RecognizeResult> {
  const params: RecognizeOptions = {
    profanity: undefined,
    ...param,
  }
  const headUrl = new URL(
    `https://${
      az.region
    }.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`
  )
  headUrl.searchParams.set('language', params.language)
  return fetch(String(headUrl), {
    headers: {
      'Ocp-Apim-Subscription-Key': az.key,
      Accept: 'application/json',
      'Content-type': 'audio/ogg; codecs=opus',
    },
    method: 'POST',
    body: oggAudioItem,
  }).then((x: any) => x.json()) as Promise<RecognizeResult>
}
