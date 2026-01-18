import {
  Box,
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import {useContext, useMemo} from 'react'
import type {DateEntry, ProcessedData} from '../types'
import {DataContext, DetailContext, DetailSetterContext} from './view'

function termsOnDate(getUsers: boolean, date: string, dates: Map<string, DateEntry>) {
  const countSource: {[key: string]: {[key: string]: number}} = {}
  const dateEntry = dates.get(date)
  if (dateEntry) {
    const streams = dateEntry.streams
    if (getUsers) {
      streams.forEach(({chats}) => {
        Object.keys(chats).forEach(userName => {
          const user = chats[userName]
          countSource[userName] = user.terms
        })
      })
    } else {
      streams.forEach(({chats}) => {
        Object.keys(chats).forEach(userName => {
          const terms = chats[userName].terms
          Object.keys(terms).forEach(term => {
            if (!(term in countSource)) countSource[term] = {}
            countSource[term][userName] = terms[term]
          })
        })
      })
    }
  }
  return countSource
}

function top10(value: string, i: number) {
  return i < 10
}

function TermTable({term, counts, isUser}: {term: string; counts: {[key: string]: number}; isUser?: boolean}) {
  const byCount = (a: string, b: string) => counts[b] - counts[a]
  const terms = Object.keys(counts)
  return terms.length ?
      <Box>
        <Typography variant="h5">{term}</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{isUser ? 'Words' : 'Users'}</TableCell>
              <TableCell>Uses</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {terms
              .sort(byCount)
              .filter(top10)
              .map(term => (
                <TableRow key={term}>
                  <TableCell>{term}</TableCell>
                  <TableCell>{counts[term]}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Box>
    : <></>
}

export function DetailTables() {
  const data = useContext(DataContext) as ProcessedData
  const toDisplay = useContext(DetailContext)
  const setDetails = useContext(DetailSetterContext)
  const countSource = useMemo(() => {
    return (
      toDisplay.date ? termsOnDate(toDisplay.isUser, toDisplay.date, data.dates)
      : toDisplay.isUser ? data.userTerms
      : data.termUsers
    )
  }, [toDisplay.isUser, toDisplay.date, data.dates, data.userTerms, data.termUsers])
  const tables = useMemo(() => {
    return toDisplay.terms.map(term => (
      <TermTable key={term} term={term} counts={countSource[term] || {}} isUser={toDisplay.isUser} />
    ))
  }, [countSource, toDisplay.terms, toDisplay.isUser])
  return (
    <Card sx={{height: '100%', p: 0}}>
      <CardHeader
        sx={{p: 0.5}}
        title="Details"
        subheader={
          <>
            {toDisplay.date ?
              <Typography>Date: {toDisplay.date}</Typography>
            : <></>}
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={toDisplay.lock}
                  onChange={() => setDetails({key: 'lock', value: !toDisplay.lock})}
                ></Switch>
              }
              label={<Typography variant="caption">Lock</Typography>}
              labelPlacement="top"
            />
          </>
        }
      />
      <CardContent
        sx={{
          p: 0,
          height: 'calc(100% - 85px)',
          overflow: 'hidden',
          '& td': {pl: 0, pr: 0},
          '& th': {pl: 0, pr: 0},
          '& th:last-of-type': {textAlign: 'right'},
          '& td:first-of-type': {width: 60, overflow: 'hidden', textOverflow: 'ellipsis'},
          '& td:last-of-type': {textAlign: 'right'},
        }}
      >
        <Stack sx={{overflowY: 'auto', maxHeight: '100%', p: 1}} spacing={1}>
          {tables.length ? tables : <Typography>Hover to display breakdowns.</Typography>}
        </Stack>
      </CardContent>
    </Card>
  )
}
