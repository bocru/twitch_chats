import {init, getInstanceByDom} from 'echarts/core'
import {Box} from '@mui/material'
import {useEffect, useRef, useState} from 'react'
import type {ChatData, Options} from '../types'

function byValue(a: {value: number}, b: {value: number}) {
  return b.value - a.value
}

export default function WordCloud({options, data}: {options: Options; data: ChatData[]}) {
  const container = useRef<HTMLDivElement>(null)
  const [terms, setTerms] = useState<{name: string; value: number}[]>([])
  useEffect(() => {
    if ('undefined' !== typeof window) {
      const chart = container.current ? init(container.current, 'dark') : null
      const resize = () => chart && chart.resize()
      window.addEventListener('resize', resize)
      return () => {
        if (chart) {
          chart.dispose()
        }
        window.removeEventListener('resize', resize)
      }
    }
  }, [])
  useEffect(() => {
    const termCounts: {[key: string]: number} = {}
    data.forEach(({chats}) => {
      Object.keys(chats).forEach(userName => {
        const user = chats[userName]
        if (options.keepBots || !user.isBot) {
          Object.keys(user.terms).forEach(term => {
            if (term in termCounts) {
              termCounts[term] += user.terms[term]
            } else {
              termCounts[term] = user.terms[term]
            }
          })
        }
      })
    })
    const range = [Infinity, -Infinity]
    const terms = Object.keys(termCounts)
      .map(term => {
        const value = termCounts[term]
        if (range[0] > value) range[0] = value
        if (range[1] < value) range[1] = value
        return {
          name: term.includes(':') ? term.split(':')[0] : term,
          value,
        }
      })
      .sort(byValue)
      .filter((_, i) => i < 700)
    setTerms(terms)
  }, [data, options.keepBots])
  useEffect(() => {
    if (container.current) {
      const chart = getInstanceByDom(container.current)
      if (chart && terms.length) {
        chart.setOption(
          {
            darkMode: true,
            backgroundColor: '#121212',
            series: [
              {
                type: 'wordCloud',
                shape: 'circle',
                keepAspect: false,
                left: 'center',
                top: 'center',
                width: '100%',
                height: '100%',
                sizeRange: [14, 500],
                rotationRange: [90, 0],
                rotationStep: 90,
                gridSize: options.gridSize,
                drawOutOfBound: true,
                shrinkToFit: true,
                layoutAnimation: false,
                textStyle: {
                  fontFamily: 'sans-serif',
                },
                data: terms,
              },
            ],
            toolbox: {
              feature: {
                saveAsImage: {name: `wordcloud`},
              },
            },
          },
          true,
          true
        )
      }
    }
  }, [terms, options.gridSize])
  return <Box ref={container} sx={{width: '100%', height: '100%', minHeight: '10px'}} />
}
