import {Box} from '@mui/material'
import type {Options, ProcessedData} from '../types'
import WordCloud from './wordcloud'
import {Trends} from './trends'

export function Display({data, options}: {data: ProcessedData; options: Options}) {
  return (
    <Box sx={{height: '100%', width: '100%', minHeight: 10}}>
      {options.show === 'trends' ? (
        <Trends data={data} options={options} />
      ) : (
        <WordCloud data={data.data} options={options} />
      )}
    </Box>
  )
}
