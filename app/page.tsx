'use client'

import {Backdrop, CircularProgress, Stack, Typography} from '@mui/material'
import {useEffect, useState} from 'react'
import type {ChatData} from './types'
import {use} from 'echarts/core'
import {GridComponent, TitleComponent, TooltipComponent} from 'echarts/components'
import {CanvasRenderer} from 'echarts/renderers'
import {LineChart} from 'echarts/charts'
import {View} from './components/view'
import ChannelSelect from './components/channel_select'
import {LocalizationProvider} from '@mui/x-date-pickers'
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'

const dateFormatter = new Intl.DateTimeFormat('en-US', {month: '2-digit', day: '2-digit'}).format
export function formatDate(date: Date) {
  return `${date.getFullYear().toString().substring(2, 4)}/${dateFormatter(date)}`
}

export const botUsers: {[key: string]: boolean} = {streamelements: true, sery_bot: true, nightbot: true, moobot: true}

export default function Data() {
  const [data, setData] = useState<ChatData[]>()
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
            await blob.stream().pipeThrough(new DecompressionStream('gzip')),
          ).json()) as ChatData[]
          if (chatData) {
            chatData.forEach(({stream}) => {
              stream.date = dayjs(stream.created_at)
            })
            setData(chatData)
          }
        })
        .catch(() => {
          setFailed(true)
        })
    }
    ;(async () => {
      await import('echarts-wordcloud')
      use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, TitleComponent])
      setReady(true)
    })()
  }, [])
  return (
    failed || !urlParams.channel ?
      <Backdrop open={failed || !urlParams.channel}>
        <Stack spacing={1}>
          <Typography>Enter a channel name with collected data:</Typography>
          <ChannelSelect />
        </Stack>
      </Backdrop>
    : data && ready ?
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <View rawData={data} params={urlParams} />
      </LocalizationProvider>
    : <Backdrop open={!ready}>
        <Stack>
          <CircularProgress sx={{m: 'auto'}} />
          <Typography>Loading chat data...</Typography>
        </Stack>
      </Backdrop>
  )
}
