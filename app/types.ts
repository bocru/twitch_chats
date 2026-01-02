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
    date?: string
  }
}

export type ProcessedData = {
  data: ChatData[]
  dates: Map<string, number>
  users: {[key: string]: Uint16Array}
  terms: {[key: string]: Uint16Array}
  userTerms: {[key: string]: {[key: string]: number}}
  termUsers: {[key: string]: {[key: string]: number}}
}

export type Options = {
  channel: string
  show: string
  users: string[]
  terms: string[]
  userTrends: false
  gridSize: number
  keepBots: boolean
}

export type OptsAction =
  | {key: 'show'; value: string}
  | {key: 'users' | 'terms'; value: string[]}
  | {key: 'userTrends' | 'keepBots'; value: boolean}
