import {Box, Typography} from '@mui/material'
import WordCloud from './wordcloud'
import {Trends} from './trends'
import {useContext} from 'react'
import {OptionContext} from './view'

export function Display() {
  const options = useContext(OptionContext)
  return (
    <Box sx={{height: '100%', width: '100%', minHeight: 10}}>
      {options.show === 'wordcloud' ? (
        <WordCloud />
      ) : (options.show === 'trends' ? options.terms.length : options.users.length) ? (
        <Trends />
      ) : (
        <Typography variant="h6" sx={{p: 5, width: '100%', textAlign: 'center'}}>
          Select {options.show === 'trends' ? 'terms' : 'users'} to show their trends.
        </Typography>
      )}
    </Box>
  )
}
