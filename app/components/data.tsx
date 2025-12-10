import {Backdrop, Box, CircularProgress, Stack, Typography} from '@mui/material'
import {useEffect, useState} from 'react'
import type {ChatData} from '../types'
import {Close} from '@mui/icons-material'
import WordCloud from './wordcloud'

const PREFIX = process.env.NODE_ENV === 'development' ? '/twitch_chats/' : ''

export function Data() {
  const [data, setData] = useState<ChatData[]>()
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
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
    if (params.channel) {
      fetch(`${PREFIX}/channel/${params.channel}.json.gz`)
        .then(async res => {
          const blob = await res.blob()
          const chatData = (await new Response(
            await blob.stream().pipeThrough(new DecompressionStream('gzip'))
          ).json()) as ChatData[]
          if (chatData) {
            setData(chatData)
          }
        })
        .catch(() => {
          setFailed(true)
        })
    }
    ;(async () => {
      await import('echarts-wordcloud')
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
    <Box sx={{position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden'}}>
      <WordCloud data={data} />
    </Box>
  ) : (
    <Backdrop open={true}>
      <Stack>
        <CircularProgress sx={{m: 'auto'}} />
        <Typography>Loading chat data...</Typography>
      </Stack>
    </Backdrop>
  )
}
