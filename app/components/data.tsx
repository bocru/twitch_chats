import {Backdrop, CircularProgress, Stack, Typography} from '@mui/material'
import {useEffect, useState} from 'react'
import type {ChatData, DateEntry, ProcessedData} from '../types'
import {Close} from '@mui/icons-material'
import {use} from 'echarts/core'
import {GridComponent, ToolboxComponent, TooltipComponent} from 'echarts/components'
import {CanvasRenderer} from 'echarts/renderers'
import {LineChart} from 'echarts/charts'
import {View} from './view'
import {cor} from '../lib/stats'

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
      fetch(`/twitch_chats/channel/${params.channel}.json.gz`)
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
                .map((date, i) => [date, {words: 0, messages: 0, index: i}])
            )
            const nDates = dates.size
            const termStats: {[key: string]: {count: number; cor: number}} = {}
            const userCounts: {[key: string]: number} = {}
            const terms: {[key: string]: Uint16Array} = {}
            const users: {[key: string]: Uint16Array} = {}
            const userTerms: {[key: string]: {[key: string]: number}} = {}
            const termUsers: {[key: string]: {[key: string]: number}} = {}
            chatData.forEach(s => {
              const {words, messages, index} = dates.get(s.stream.date as string) as DateEntry
              const chats = s.chats
              let totalWords = words
              let totalMessages = messages
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
                totalMessages += d.nMessages
                users[user][index] += d.nMessages
                const u = d.terms
                if (!(user in userTerms)) userTerms[user] = {}
                if (!(user in userCounts)) userCounts[user] = 0
                userCounts[user] += d.nMessages
                const ut = userTerms[user]
                Object.keys(u).forEach(term => {
                  if (!(term in terms)) terms[term] = new Uint16Array(nDates).fill(0)
                  if (!(term in termUsers)) termUsers[term] = {}
                  if (!(term in termStats)) termStats[term] = {count: 0, cor: 0}
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
                  totalWords += u[term]
                  terms[term][index] += u[term]
                  termStats[term].count += u[term]
                })
              })
              dates.set(s.stream.date as string, {words: totalWords, messages: totalMessages, index})
            })
            const datesVector = Uint16Array.from({length: dates.size}, (_, i) => i)
            Object.keys(termStats).forEach(term => {
              termStats[term].cor = cor(datesVector, terms[term])
            })
            setData({data: chatData, termStats, userCounts, dates, terms, users, userTerms, termUsers})
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
