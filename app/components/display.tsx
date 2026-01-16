import {Box, IconButton, Typography} from '@mui/material'
import WordCloud from './wordcloud'
import {Trends} from './trends'
import {useContext} from 'react'
import {OptionContext, OptionSetterContext} from './view'
import {DetailTables} from './tables'
import {ChevronLeft, ChevronRight} from '@mui/icons-material'

export function Display() {
  const options = useContext(OptionContext)
  const updateOpts = useContext(OptionSetterContext)
  const detailsWidth = options.showDetails ? 200 : 0
  return (
    <>
      <Box sx={{height: '100%', width: `calc(100% - ${detailsWidth}px)`, minHeight: 10, overflow: 'hidden'}}>
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
      <Box sx={{position: 'absolute', top: 0, right: 0, bottom: 0, width: detailsWidth + 'px'}}>
        <IconButton
          title="toggle details display"
          onClick={() => {
            updateOpts({key: 'showDetails', value: !options.showDetails})
            requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
          }}
          sx={{position: 'absolute', top: 10, left: -35}}
        >
          {options.showDetails ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
        {options.showDetails ? <DetailTables /> : <></>}
      </Box>
    </>
  )
}
