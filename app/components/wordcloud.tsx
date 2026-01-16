import {init, getInstanceByDom} from 'echarts/core'
import {Box} from '@mui/material'
import {useContext, useEffect, useMemo, useRef, useState} from 'react'
import type {ProcessedData} from '../types'
import {palettes} from './palettes'
import {DataContext, DetailSetterContext, OptionContext} from './view'

function byValue(a: {value: number}, b: {value: number}) {
  return b.value - a.value
}
const relayout: {effect: number | NodeJS.Timeout; resize: number | NodeJS.Timeout} = {effect: 0, resize: 0}

export default function WordCloud() {
  const data = useContext(DataContext) as ProcessedData
  const options = useContext(OptionContext)
  const displayDetails = useContext(DetailSetterContext)
  const container = useRef<HTMLDivElement>(null)
  const [terms, setTerms] = useState<{name: string; value: number}[]>([])
  useEffect(() => {
    if ('undefined' !== typeof window) {
      const chart = container.current ? init(container.current, 'dark') : null
      if (container.current) {
        container.current.onclick = () => displayDetails({key: 'lock', value: true})
      }
      const resize = () => {
        if (chart) {
          clearTimeout(relayout.resize)
          relayout.resize = setTimeout(() => {
            clearTimeout(relayout.resize)
            requestAnimationFrame(() => chart.resize())
          }, 100)
        }
      }
      window.addEventListener('resize', resize)
      return () => {
        if (chart) {
          chart.dispose()
        }
        window.removeEventListener('resize', resize)
      }
    }
  }, [])
  const termCounts = useMemo(() => {
    const termCounts: {[key: string]: number} = {}
    const selectUsers: {[key: string]: boolean} = {}
    const keepAllUsers = !options.users.length
    const keepAts = options.keepAts
    if (!keepAllUsers) options.users.forEach(user => (selectUsers[user] = true))
    data.data.forEach(({chats}) => {
      Object.keys(chats).forEach(userName => {
        const user = chats[userName]
        if ((options.keepBots || !user.isBot) && (keepAllUsers || userName in selectUsers)) {
          Object.keys(user.terms).forEach(term => {
            if (keepAts || !term.startsWith('@')) {
              if (term in termCounts) {
                termCounts[term] += user.terms[term]
              } else {
                termCounts[term] = user.terms[term]
              }
            }
          })
        }
      })
    })
    return termCounts
  }, [data, options.users, options.keepAts, options.keepBots])
  useEffect(() => {
    const palette = palettes[options.palette]
    const nColors = palette.length - 1
    const nTerms = options.nTerms
    const getColor = options.reversePalette
      ? (freq: number) => palette[Math.round((1 - freq) * nColors)]
      : (freq: number) => palette[Math.round(freq * nColors)]
    const terms = Object.keys(termCounts)
      .map(term => {
        const count = termCounts[term]
        const cor = data.termStats[term].cor
        return {
          name: term,
          stats: {count, cor},
          value: Math.pow(count, options.scaleFactor) * (options.trendScale ? Math.abs(cor) : 1),
          textStyle: {color: '#fff'},
        }
      })
      .sort(byValue)
      .filter((_, i) => i < nTerms)
      .map((e, i) => {
        e.textStyle.color = getColor(data.termStats[e.name].cor > 0 ? i / nTerms / 2 : 0.5 + (1 - i / nTerms) / 2)
        return e
      })
    setTerms(terms)
  }, [termCounts, options.nTerms, options.palette, options.reversePalette, options.scaleFactor, options.trendScale])
  useEffect(() => {
    if (container.current) {
      const chart = getInstanceByDom(container.current)
      if (chart && terms.length) {
        clearTimeout(relayout.effect)
        relayout.effect = setTimeout(() => {
          clearTimeout(relayout.effect)
          requestAnimationFrame(() => {
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
                    sizeRange: [options.minSize, options.maxSize],
                    rotationRange: [options.minRot, options.maxRot],
                    rotationStep: options.rotStep,
                    gridSize: options.gridSize,
                    drawOutOfBound: false,
                    shrinkToFit: true,
                    layoutAnimation: false,
                    textStyle: {
                      fontFamily: 'sans-serif',
                    },
                    data: terms,
                  },
                ],
                tooltip: {
                  textStyle: {color: '#ffffff'},
                  backgroundColor: '#00000085',
                  borderWidth: 0,
                  formatter: ({
                    marker,
                    name,
                    data,
                  }: {
                    marker: string
                    name: string
                    data: {stats: {count: number; cor: number}}
                  }) => {
                    displayDetails({
                      key: 'replace',
                      value: {
                        lock: false,
                        isUser: false,
                        date: '',
                        terms: [name],
                      },
                    })
                    return `${marker} ${name} (n = ${data.stats.count}; <i>r</i> = ${data.stats.cor.toFixed(3)})`
                  },
                },
              },
              true,
              true
            )
          })
        }, 500)
      }
    }
  }, [terms, options.gridSize, options.minSize, options.maxSize, options.rotStep, options.minRot, options.maxRot])
  return <Box ref={container} sx={{width: '100%', height: '100%', minHeight: '10px'}} />
}
