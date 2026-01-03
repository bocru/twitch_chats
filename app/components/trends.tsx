import {init, getInstanceByDom} from 'echarts/core'
import {type LineSeriesOption} from 'echarts/charts'
import {Box} from '@mui/material'
import {useEffect, useMemo, useRef} from 'react'
import type {ChatData, Options, ProcessedData} from '../types'
import type {LineEndLabelOption} from 'echarts/types/src/chart/line/LineSeries.js'

const endLabel: LineEndLabelOption = {
  show: true,
  formatter: ({seriesName}: {seriesName?: string}) => seriesName || '',
}

function extractFreqs(selectUsers: string[], selectTerms: string[], data: ChatData[], dates: Map<string, number>) {
  const terms: {[key: string]: Uint16Array} = {}
  const users: {[key: string]: Uint16Array} = {}
  const nDates = dates.size
  selectTerms.forEach(term => {
    terms[term] = new Uint16Array(nDates).fill(0)
  })
  selectUsers.forEach(user => {
    users[user] = new Uint16Array(nDates).fill(0)
  })
  const filterTerms = !!selectTerms.length
  const filterUsers = !!selectUsers.length
  data.forEach(s => {
    const dateIndex = dates.get(s.stream.date as string) as number
    const chats = s.chats
    Object.keys(chats).forEach(user => {
      if (!filterUsers || user in users) {
        const d = chats[user]
        if (!(user in users)) users[user] = new Uint16Array(nDates).fill(0)
        if (!filterTerms) users[user][dateIndex] += d.nMessages
        const u = d.terms
        Object.keys(u).forEach(term => {
          if (filterTerms) {
            if (term in terms) {
              terms[term][dateIndex] += u[term]
              users[user][dateIndex] += u[term]
            }
          } else {
            if (!(term in terms)) terms[term] = new Uint16Array(nDates).fill(0)
            terms[term][dateIndex] += u[term]
          }
        })
      }
    })
  })
  return {users, terms}
}

export function Trends({data, options}: {data: ProcessedData; options: Options}) {
  const container = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if ('undefined' !== typeof window) {
      const chart = container.current ? init(container.current, 'dark') : null
      const resize = () => chart && chart.resize()
      window.addEventListener('resize', resize)
      return () => {
        chart && chart.dispose()
        window.removeEventListener('resize', resize)
      }
    }
  }, [])
  const selected = options[options.userTrends ? 'users' : 'terms']
  const filteredData = useMemo(() => {
    return options.users.length || options.terms.length
      ? extractFreqs(options.users, options.terms, data.data, data.dates)
      : {users: data.users, terms: data.terms}
  }, [options.users, options.terms])
  const trendData = useMemo(() => {
    const d = filteredData[options.userTrends ? 'users' : 'terms']
    const series: LineSeriesOption[] = []
    selected.forEach(term => {
      const values = d[term]
      if (values) {
        series.push({
          type: 'line',
          name: term,
          endLabel,
          data: [...values],
        })
      }
    })
    return {dates: data.dates, series}
  }, [selected, options.userTrends, filteredData])

  useEffect(() => {
    if (container.current) {
      const chart = getInstanceByDom(container.current)
      if (chart) {
        if (trendData.series.length) {
          chart.setOption(
            {
              color: '#d9ccff',
              backgroundColor: '#00000000',
              animationDuration: 300,
              grid: {top: 30, right: 100, bottom: 60, left: 60},
              tooltip: {
                trigger: 'axis',
                textStyle: {
                  color: '#fff',
                },
                backgroundColor: '#00000060',
                borderWidth: 0,
              },
              xAxis: {
                data: [...trendData.dates.keys()],
                name: 'Date',
                nameLocation: 'center',
                nameGap: 35,
              },
              yAxis: {
                type: 'value',
                name: options.userTrends && !options.terms.length ? 'Messages Sent' : 'Term Count',
                nameLocation: 'center',
                nameRotate: 90,
                nameGap: 40,
                min: (value: {min: number}) => Math.floor(value.min),
              },
              series: trendData.series,
              toolbox: {
                feature: {
                  saveAsImage: {name: `${options.channel}_trends`},
                },
              },
            },
            true,
            true
          )
        } else {
          chart.clear()
        }
      }
    }
  }, [trendData])
  return <Box ref={container} sx={{width: '100%', height: '100%', minHeight: '10px'}} />
}
