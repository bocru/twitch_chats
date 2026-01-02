import {init, getInstanceByDom} from 'echarts/core'
import {type LineSeriesOption} from 'echarts/charts'
import {Box} from '@mui/material'
import {useEffect, useMemo, useRef} from 'react'
import type {Options, ProcessedData} from '../types'
import type {LineEndLabelOption} from 'echarts/types/src/chart/line/LineSeries.js'

const endLabel: LineEndLabelOption = {
  show: true,
  formatter: ({seriesName}: {seriesName?: string}) => seriesName || '',
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
  const trendData = useMemo(() => {
    const d = data[options.userTrends ? 'users' : 'terms']
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
  }, [selected, options.userTrends])

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
                name: options.userTrends ? 'Messages Sent' : 'Term Count',
                nameLocation: 'center',
                nameRotate: 90,
                nameGap: 40,
                min: (value: {min: number}) => Math.floor(value.min),
              },
              series: trendData.series,
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
