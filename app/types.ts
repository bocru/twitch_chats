import type {Dayjs} from 'dayjs'

export type Terms = {[key: string]: number}
export type userBadge = {
  id?: string
  _id?: string
  version: string
  setID?: string
  __typename?: 'Badge'
}
export type User = {
  name: string
  firstMessage: string
  badges: userBadge[]
  color: string
  terms: Terms
  nMessages: number
  isBot: boolean
}
export type ChatData = {
  chats: {[key: string]: User}
  stream: {
    vod_id: number
    title: string
    description: {} | string
    created_at: string
    duration: number
    date: Dayjs
  }
}

export type DateEntry = {words: number; messages: number; index: number; streams: ChatData[]}

export type ProcessedData = {
  data: ChatData[]
  dates: Map<string, DateEntry>
  termStats: {[key: string]: {count: number; cor: number}}
  userCounts: {[key: string]: number}
  users: {[key: string]: Uint16Array}
  terms: {[key: string]: Uint16Array}
  userTerms: {[key: string]: {[key: string]: number}}
  termUsers: {[key: string]: {[key: string]: number}}
}

export type Options = {
  channel: string
  palette: 'romaO' | 'buda' | 'imola' | 'nuuk' | 'hawaii'
  show: 'wordcloud' | 'trends' | 'user_trends'
  users: string[]
  terms: string[]
  reversePalette: boolean
  keepBots: boolean
  keepAts: boolean
  nTerms: number
  gridSize: number
  minSize: number
  maxSize: number
  minRot: number
  maxRot: number
  rotStep: number
  scaleFactor: number
  trendScale: boolean
  byCount: boolean
  toPercent: boolean
  showDetails: boolean
  streams: string
}

export type OptsAction =
  | {key: 'show'; value: 'wordcloud' | 'trends' | 'user_trends'}
  | {key: 'palette'; value: 'romaO' | 'buda' | 'imola' | 'nuuk' | 'hawaii'}
  | {
      key: 'nTerms' | 'gridSize' | 'rotStep' | 'minRot' | 'maxRot' | 'minSize' | 'maxSize' | 'scaleFactor'
      value: number
    }
  | {key: 'users' | 'terms'; value: string[]}
  | {
      key: 'reversePalette' | 'keepBots' | 'keepAts' | 'trendScale' | 'byCount' | 'toPercent' | 'showDetails'
      value: boolean
    }
  | {key: 'streams'; value: string}

export type Details = {lock: boolean; isUser: boolean; date: string; terms: string[]}

export type DetailActions =
  | {key: 'replace'; value: Details}
  | {key: 'lock' | 'isUser'; value: boolean}
  | {key: 'date'; value: string}
  | {key: 'terms'; value: string[]}
