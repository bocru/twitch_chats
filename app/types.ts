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
}
export type ChatData = {
  chats: {[key: string]: User}
  stream: {
    vod_id: number
    title: string
    description: {} | string
    created_at: string
    duration: number
  }
}
