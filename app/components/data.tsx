import {Backdrop, CircularProgress, Stack, Typography} from '@mui/material'
import {useEffect, useState} from 'react'
import type {ChatData, ProcessedData} from '../types'
import {Close} from '@mui/icons-material'
import {use} from 'echarts/core'
import {GridComponent, ToolboxComponent, TooltipComponent} from 'echarts/components'
import {CanvasRenderer} from 'echarts/renderers'
import {LineChart} from 'echarts/charts'
import {View} from './view'

const PREFIX = process.env.NODE_ENV === 'development' ? '/twitch_chats/' : ''
const dateFormatter = new Intl.DateTimeFormat('en-US', {month: '2-digit', day: '2-digit'}).format
export function formatDate(date: Date) {
  return `${date.getFullYear().toString().substring(2, 4)}/${dateFormatter(date)}`
}

export const botUsers: {[key: string]: boolean} = {streamelements: true, sery_bot: true, nightbot: true, moobot: true}

export function Data() {
  const [data, setData] = useState<ProcessedData>()
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const [urlParams, setUrlParams] = useState<{[key: string]: string}>({})
  useEffect(() => {
    const search = 'undefined' !== typeof window && window.location.search
    const params: {[key: string]: string} = {}
    if (search) {
      search
        .substring(1)
        .split('&')
        .forEach(e => {
          const parts = e.split('=')
          params[parts[0]] = parts[1]
        })
    }
    setUrlParams(params)
    if (params.channel) {
      fetch(`${PREFIX}/channel/${params.channel}.json.gz`)
        .then(async res => {
          const blob = await res.blob()
          const chatData = (await new Response(
            await blob.stream().pipeThrough(new DecompressionStream('gzip'))
          ).json()) as ChatData[]
          if (chatData) {
            const dates = new Map(
              [
                ...new Set(
                  chatData.map(s => {
                    if (!('date' in s.stream)) {
                      s.stream.date = formatDate(new Date(s.stream.created_at))
                    }
                    return s.stream.date as string
                  })
                ),
              ]
                .sort()
                .map((date, i) => [date, i])
            )
            const nDates = dates.size
            const terms: {[key: string]: Uint16Array} = {}
            const users: {[key: string]: Uint16Array} = {}
            const userTerms: {[key: string]: {[key: string]: number}} = {}
            const termUsers: {[key: string]: {[key: string]: number}} = {}
            chatData.forEach(s => {
              const dateIndex = dates.get(s.stream.date as string) as number
              const chats = s.chats
              Object.keys(chats).forEach(user => {
                const d = chats[user]
                d.isBot = user in botUsers
                if (!d.isBot) {
                  d.badges.forEach(badge => {
                    if (badge.setID == 'bot-badge') {
                      d.isBot = true
                    }
                  })
                }
                if (d.isBot) botUsers[user] = true
                if (!(user in users)) users[user] = new Uint16Array(nDates).fill(0)
                users[user][dateIndex] += d.nMessages
                const u = d.terms
                if (!(user in userTerms)) userTerms[user] = {}
                const ut = userTerms[user]
                Object.keys(u).forEach(term => {
                  if (!(term in terms)) terms[term] = new Uint16Array(nDates).fill(0)
                  if (!(term in termUsers)) termUsers[term] = {}
                  if (user in termUsers[term]) {
                    termUsers[term][user]++
                  } else {
                    termUsers[term][user] = 1
                  }
                  if (term in ut) {
                    ut[term]++
                  } else {
                    ut[term] = 1
                  }
                  terms[term][dateIndex] += u[term]
                })
              })
            })
            setData({data: chatData, dates, terms, users, userTerms, termUsers})
          }
        })
        .catch(() => {
          setFailed(true)
        })
    }
    ;(async () => {
      await import('echarts-wordcloud')
      use([ToolboxComponent, CanvasRenderer, LineChart, GridComponent, TooltipComponent])
      setReady(true)
    })()
  }, [])
  return failed ? (
    <Backdrop open={true}>
      <Stack sx={{alignItems: 'center'}}>
        <Close color="error" fontSize="large" />
        <Typography>Chat has not been collected for this channel.</Typography>
      </Stack>
    </Backdrop>
  ) : data && ready ? (
    <View data={data} params={urlParams} />
  ) : (
    <Backdrop open={true}>
      <Stack>
        <CircularProgress sx={{m: 'auto'}} />
        <Typography>Loading chat data...</Typography>
      </Stack>
    </Backdrop>
  )
}
