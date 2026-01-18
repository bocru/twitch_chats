import {init, getInstanceByDom} from 'echarts/core'
import {type LineSeriesOption} from 'echarts/charts'
import {Box} from '@mui/material'
import {useContext, useEffect, useMemo, useRef} from 'react'
import type {ChatData, DateEntry, ProcessedData} from '../types'
import type {LineEndLabelOption} from 'echarts/types/src/chart/line/LineSeries.js'
import {palettes} from './palettes'
import {DataContext, DetailSetterContext, OptionContext} from './view'

const endLabel: LineEndLabelOption = {
  show: true,
  formatter: ({seriesName}: {seriesName?: string}) => seriesName || '',
}

function extractFreqs(
  selectUsers: string[],
  selectTerms: string[],
  data: ChatData[],
  dates: Map<string, DateEntry>,
  toPercent: boolean,
) {
  const terms: {[key: string]: number[]} = {}
  const users: {[key: string]: number[]} = {}
  const nDates = dates.size
  selectTerms.forEach(term => {
    terms[term] = Array.from({length: nDates}, () => 0)
  })
  selectUsers.forEach(user => {
    users[user] = Array.from({length: nDates}, () => 0)
  })
  const filterTerms = !!selectTerms.length
  const filterUsers = !!selectUsers.length
  data.forEach(s => {
    const {words, messages, index} = dates.get(s.stream.date.format('YY/MM/DD')) as DateEntry
    const chats = s.chats
    Object.keys(chats).forEach(user => {
      if (!filterUsers || user in users) {
        const d = chats[user]
        if (!(user in users)) users[user] = Array.from({length: nDates}, () => 0)
        if (!filterTerms) users[user][index] += d.nMessages
        const u = d.terms
        Object.keys(u).forEach(term => {
          if (filterTerms) {
            if (term in terms) {
              terms[term][index] += u[term]
              users[user][index] += u[term]
            }
          } else {
            if (!(term in terms)) terms[term] = Array.from({length: nDates}, () => 0)
            terms[term][index] += u[term]
          }
        })
      }
    })
    if (toPercent) {
      Object.keys(terms).forEach(term => (terms[term][index] = (terms[term][index] / words) * 100))
      Object.keys(users).forEach(user => (users[user][index] = (users[user][index] / messages) * 100))
    }
  })
  return {users, terms}
}

export function Trends() {
  const data = useContext(DataContext) as ProcessedData
  const options = useContext(OptionContext)
  const displayDetails = useContext(DetailSetterContext)
  const container = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if ('undefined' !== typeof window) {
      const chart = container.current ? init(container.current, 'dark') : null
      if (container.current) {
        container.current.onclick = () => displayDetails({key: 'lock', value: true})
      }
      const resize = () => chart && chart.resize()
      window.addEventListener('resize', resize)
      return () => {
        chart && chart.dispose()
        window.removeEventListener('resize', resize)
      }
    }
  }, [])
  const selected = options[options.show === 'user_trends' ? 'users' : 'terms']
  const filteredData = useMemo(() => {
    return options.users.length || options.terms.length ?
        extractFreqs(options.users, options.terms, data.data, data.dates, options.toPercent)
      : {users: data.users, terms: data.terms}
  }, [data.data, data.dates, options.users, options.terms, options.toPercent])
  const trendData = useMemo(() => {
    const d = filteredData[options.show === 'user_trends' ? 'users' : 'terms']
    const series: LineSeriesOption[] = []
    const nSelected = selected.length
    const palette = palettes[options.palette]
    const nColors = palette.length
    const getColor =
      options.reversePalette ?
        (freq: number) => palette[Math.round((1 - freq) * nColors)]
      : (freq: number) => palette[Math.round(freq * nColors)]
    selected.forEach((term, i) => {
      const values = d[term]
      if (values) {
        const color = getColor(i / nSelected)
        series.push({
          type: 'line',
          name: term,
          endLabel,
          data: [...values],
          lineStyle: {color},
          itemStyle: {color},
        })
      }
    })
    return {dates: data.dates, series}
  }, [selected, options.show, filteredData, options.palette, options.reversePalette])

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
              grid: {top: 50, right: 100, bottom: 60, left: 60},
              tooltip: {
                trigger: 'axis',
                textStyle: {
                  color: '#fff',
                },
                backgroundColor: '#00000060',
                borderWidth: 0,
                valueFormatter: options.toPercent ? (x: number) => x.toFixed(3) : (x: number) => x,
                triggerEvent: true,
                formatter: (series: {axisValue: string; marker: string; seriesName: string; value: number}[]) => {
                  displayDetails({
                    key: 'replace',
                    value: {
                      lock: false,
                      isUser: options.show === 'user_trends',
                      date: series[0].axisValue,
                      terms: series.map(({seriesName}) => seriesName),
                    },
                  })
                  return (
                    series[0].axisValue +
                    '<br /><table class="tooltip-table"><tbody>' +
                    series
                      .map(
                        options.toPercent ?
                          ({marker, seriesName, value}) =>
                            `<tr><td>${marker} ${seriesName} </td><td>${value.toFixed(3)}</td></tr>`
                        : ({marker, seriesName, value}) =>
                            `<tr><td>${marker} ${seriesName} </td><td>${value}</td></tr>`,
                      )
                      .join('') +
                    '</tbody></table>'
                  )
                },
              },
              title: {
                text:
                  options.show === 'user_trends' && !options.terms.length ?
                    'User Messages Over Time'
                  : (options.show === 'user_trends' && options.terms.length ?
                      'Use of "' + options.terms.join('", "') + '"'
                    : 'Word Use') +
                    ' Over Time' +
                    (options.users.length ? ' by ' + options.users.join(', ') : ''),
                top: 10,
                left: 10,
              },
              xAxis: {
                data: [...trendData.dates.keys()],
                name: 'Date',
                nameLocation: 'center',
                nameGap: 35,
              },
              yAxis: {
                type: 'value',
                name:
                  options.show === 'user_trends' && !options.terms.length ?
                    (options.toPercent ? 'Percent of ' : '') + 'Messages Sent'
                  : options.toPercent ? 'Percent of Words Used'
                  : 'Word Count',
                nameLocation: 'center',
                nameRotate: 90,
                nameGap: 40,
                min: (value: {min: number}) => Math.floor(value.min),
              },
              series: trendData.series,
            },
            true,
            true,
          )
        } else {
          chart.clear()
        }
      }
    }
  }, [trendData])
  return (
    <Box
      ref={container}
      sx={{
        width: '100%',
        height: '100%',
        minHeight: '10px',
        '& canvas': {cursor: 'pointer'},
        '& .tooltip-table td:last-of-type': {textAlign: 'right'},
      }}
    />
  )
}
