import {Box, Typography} from '@mui/material'
import type {Options, ProcessedData} from '../types'
import WordCloud from './wordcloud'
import {Trends} from './trends'

export function Display({data, options}: {data: ProcessedData; options: Options}) {
  return (
    <Box sx={{height: '100%', width: '100%', minHeight: 10}}>
      {options.show === 'trends' ? (
        (options.userTrends ? options.users.length : options.terms.length) ? (
          <Trends data={data} options={options} />
        ) : (
          <Typography sx={{p: 2}}>Select {options.userTrends ? 'users' : 'terms'} to show their trends.</Typography>
        )
      ) : (
        <WordCloud data={data.data} options={options} />
      )}
    </Box>
  )
}
