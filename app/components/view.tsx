import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import type {ChatData, DateEntry, DetailActions, Details, Options, OptsAction, ProcessedData} from '../types'
import {Display} from './display'
import {createContext, useEffect, useMemo, useReducer, useState, type KeyboardEvent} from 'react'
import {botUsers} from '../page'
import {DatePicker} from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import {cor} from '../lib/stats'

const defaultOpts: Options = {
  channel: '',
  palette: 'nuuk',
  show: 'wordcloud',
  users: [],
  terms: [],
  reversePalette: false,
  keepBots: false,
  keepAts: false,
  nTerms: 500,
  gridSize: 9,
  minSize: 14,
  maxSize: 300,
  minRot: -60,
  maxRot: 60,
  rotStep: 1,
  scaleFactor: 1,
  trendScale: true,
  byCount: true,
  toPercent: true,
  showDetails: true,
  streams: 'n100',
}

export function optionsToString(options: Options) {
  const p: string[] = []
  Object.keys(options).forEach(v => {
    const value = options[v as 'show']
    if (Array.isArray(value) ? value.length : value !== defaultOpts[v as 'show']) {
      p.push(v + '=' + value)
    }
  })
  return '?' + p.join('&')
}
const updateUrlParams = (options: Options) => {
  requestAnimationFrame(() => window.history.replaceState(void 0, '', optionsToString(options)))
}

function editOptions(state: Options, action: OptsAction) {
  const newState = {...state}
  newState[action.key as 'show'] = action.value as 'trends'
  updateUrlParams(newState)
  return newState
}

function editDetails(state: Details, action: DetailActions) {
  if (state.lock && action.key !== 'lock') return state
  if (action.key === 'replace') return {...action.value}
  const newState = {...state}
  if (action.key === 'lock') {
    newState.lock = !state.lock
  } else if (action.key === 'terms') {
    newState.terms = [...action.value]
  } else {
    newState.terms = [...newState.terms]
    newState[action.key as 'lock'] = action.value as boolean
  }
  return newState
}

function top100(value: string, i: number) {
  return i < 100
}

function TermSelect({
  title,
  allOptions,
  selection,
  update,
}: {
  title: string
  allOptions: string[]
  selection: string[]
  update: (action: OptsAction) => void
}) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  useEffect(() => {
    setSuggestions(allOptions.filter(top100))
  }, [allOptions])
  const [search, setSearch] = useState('')
  const addSelection = (option: string) => {
    if (option && !selection.includes(option) && allOptions.includes(option)) {
      update({key: title.toLowerCase() as 'users', value: [...selection, option]})
    }
  }
  return (
    <Autocomplete
      options={suggestions}
      value={selection}
      onChange={(_, value) => {
        setSuggestions(allOptions.filter(top100))
        update({key: title.toLowerCase() as 'users', value: [...value]})
      }}
      onKeyUp={(e: KeyboardEvent<HTMLDivElement>) => {
        const inputValue = 'value' in e.target ? (e.target.value as string) : ''
        let fresh = false
        if ((e.code === 'Enter' || e.code === 'NumpadEnter') && search && (!inputValue || inputValue === search)) {
          addSelection(inputValue)
        }
        setSuggestions((fresh ? allOptions : allOptions.filter(o => o.includes(inputValue))).filter(top100))
      }}
      renderValue={(value: readonly string[], getTagProps) => {
        return value.map((option: string, index: number) => (
          <Chip label={option} {...getTagProps({index})} key={option} />
        ))
      }}
      renderInput={params => (
        <TextField
          {...params}
          size="small"
          value={search}
          label={title}
          onChange={e => {
            setSearch(e.target.value)
          }}
        ></TextField>
      )}
      filterOptions={x => x}
      noOptionsText="Search for options"
      multiple
      disableCloseOnSelect
      filterSelectedOptions
      selectOnFocus
      clearOnBlur
      clearOnEscape
      handleHomeEndKeys
      fullWidth
    ></Autocomplete>
  )
}

export const DataContext = createContext<ProcessedData | null>(null)
export const OptionContext = createContext<Options>(defaultOpts)
export const OptionSetterContext = createContext((action: OptsAction) => {})

export const DetailContext = createContext<Details>({lock: false, isUser: false, date: '', terms: []})
export const DetailSetterContext = createContext((action: DetailActions) => {})

export function View({rawData, params}: {rawData: ChatData[]; params: {[key: string]: string}}) {
  const [opts, updateOpts] = useReducer(
    editOptions,
    (() => {
      const initial = {...defaultOpts}
      Object.keys(params).forEach(k => {
        if (k in initial) {
          const value = k === 'terms' || k === 'users' ? params[k].split(',') : params[k]
          if (value === 'true' || value === 'false') {
            initial[k as 'keepBots'] = value === 'true'
          } else {
            initial[k as 'show'] = value as 'trends'
          }
        }
      })
      return initial
    })(),
  )
  const [filterByDate, setFilterByDate] = useState(false)
  const [nStreams, setNStreams] = useState(100)
  const [since, setSince] = useState(dayjs().subtract(5, 'month'))
  const [until, setUntil] = useState(dayjs())
  useEffect(() => {
    const time = opts.streams.startsWith('n') ? +opts.streams.substring(1) : opts.streams.split(',')
    if (Array.isArray(time)) {
      if (time[0]) {
        setSince(dayjs(time[0], 'YYYYMMDD'))
      }
      if (time.length > 1) {
        setSince(dayjs(time[1], 'YYYYMMDD'))
      }
    } else {
      setNStreams(time)
    }
  }, [])
  const data = useMemo(() => {
    const time = opts.streams.startsWith('n') ? +opts.streams.substring(1) : opts.streams.split(',')
    const byDate = Array.isArray(time)
    setFilterByDate(byDate)
    const since = byDate && time[0] ? dayjs(time[0], 'YYYYMMDD') : false
    const until = byDate && time.length > 1 ? dayjs(time[1], 'YYYYMMDD') : false
    const offset = byDate ? 0 : rawData.length - time - 1
    const chatData = rawData.filter(
      byDate ?
        ({stream}) => {
          let pass = true
          if (since || until) {
            const date = dayjs(stream.created_at)
            if (since && date < since) pass = false
            if (pass && until && date > until) pass = false
          }
          return pass
        }
      : (_, i) => {
          return i > offset
        },
    )
    const dates: Map<string, DateEntry> = new Map(
      [...new Set(chatData.map(({stream}) => stream.date.format('YY/MM/DD')))].map((date, index) => [
        date,
        {words: 0, messages: 0, index, streams: []},
      ]),
    )
    const nDates = dates.size
    const termStats: {[key: string]: {count: number; cor: number}} = {}
    const userCounts: {[key: string]: number} = {}
    const terms: {[key: string]: Uint16Array} = {}
    const users: {[key: string]: Uint16Array} = {}
    const userTerms: {[key: string]: {[key: string]: number}} = {}
    const termUsers: {[key: string]: {[key: string]: number}} = {}
    chatData.forEach(s => {
      const date = s.stream.date.format('YY/MM/DD')
      const {words, messages, index, streams} = dates.get(date) as DateEntry
      streams.push(s)
      const chats = s.chats
      let totalWords = words
      let totalMessages = messages
      Object.keys(chats).forEach(user => {
        const d = chats[user]
        d.isBot = user in botUsers
        if (!d.isBot) {
          d.badges.forEach(badge => {
            if (badge.setID == 'bot-badge') {
              d.isBot = true
            }
          })
        }
        if (d.isBot) botUsers[user] = true
        if (!(user in users)) users[user] = new Uint16Array(nDates).fill(0)
        totalMessages += d.nMessages
        users[user][index] += d.nMessages
        const u = d.terms
        if (!(user in userTerms)) userTerms[user] = {}
        if (!(user in userCounts)) userCounts[user] = 0
        userCounts[user] += d.nMessages
        const ut = userTerms[user]
        Object.keys(u).forEach(term => {
          if (term.includes(':e')) {
            const parts = term.split(':', 2)
            const emoteText = parts[0] ? parts[0] : ':' + parts[1]
            u[emoteText] = u[term]
            delete u[term]
            term = emoteText
          }
          const termCount = u[term]
          if (!(term in terms)) terms[term] = new Uint16Array(nDates).fill(0)
          if (!(term in termUsers)) termUsers[term] = {}
          if (!(term in termStats)) termStats[term] = {count: 0, cor: 0}
          if (user in termUsers[term]) {
            termUsers[term][user]++
          } else {
            termUsers[term][user] = 1
          }
          if (term in ut) {
            ut[term]++
          } else {
            ut[term] = 1
          }
          totalWords += termCount
          terms[term][index] += termCount
          termStats[term].count += termCount
        })
      })
      dates.set(date, {words: totalWords, messages: totalMessages, index, streams})
    })
    const nVector = Uint16Array.from({length: dates.size}, () => 0)
    dates.forEach(({words, index}) => (nVector[index] = words))
    const datesVector = Uint16Array.from({length: dates.size}, (_, i) => i)
    Object.keys(termStats).forEach(term => {
      termStats[term].cor = cor(datesVector, terms[term], nVector)
    })
    return {data: chatData, termStats, userCounts, dates, terms, users, userTerms, termUsers}
  }, [rawData, opts.streams])
  const allUsers = useMemo(() => {
    return (opts.keepBots ? Object.keys(data.users) : Object.keys(data.users).filter(user => !(user in botUsers))).sort(
      (a, b) => {
        const counts = data.userCounts
        return counts[b] - counts[a]
      },
    )
  }, [data.users, data.userCounts, opts.keepBots, opts.byCount])
  const allTerms = useMemo(() => {
    const stats = data.termStats
    return Object.keys(data.terms).sort(
      opts.byCount ?
        (a, b) => {
          return stats[b].count - stats[a].count
        }
      : (a, b) => {
          return Math.abs(stats[b].cor) - Math.abs(stats[a].cor)
        },
    )
  }, [data.terms, data.termStats, opts.byCount])
  const [detailDisplay, updateDetails] = useReducer(editDetails, {lock: false, isUser: false, date: '', terms: []})
  return (
    <Box
      component="main"
      sx={{position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, p: 0, m: 0, overflow: 'hidden'}}
    >
      <Box sx={{height: '100%', width: 250, overflow: 'hidden'}}>
        <Card sx={{height: '100%', width: '100%', overflow: 'hidden'}}>
          <CardHeader title="Options" />
          <CardContent sx={{overflow: 'hidden', height: 'calc(100% - 120px)', pt: 0, pb: 0}}>
            <Box sx={{overflowY: 'auto', height: '100%', pt: 1}}>
              <Stack spacing={4}>
                <Stack spacing={1}>
                  <FormControl variant="outlined" fullWidth size="small">
                    <InputLabel id="show">Show</InputLabel>
                    <Select
                      labelId="show"
                      label="Show"
                      value={opts.show}
                      onChange={e => updateOpts({key: 'show', value: e.target.value})}
                    >
                      <MenuItem value="wordcloud">Wordcloud</MenuItem>
                      <MenuItem value="trends">Word Trends</MenuItem>
                      <MenuItem value="user_trends">User Trends</MenuItem>
                    </Select>
                  </FormControl>
                  {opts.show !== 'wordcloud' ?
                    <>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={opts.byCount}
                            onChange={() => updateOpts({key: 'byCount', value: !opts.byCount})}
                          ></Switch>
                        }
                        label={
                          <Typography variant="caption">
                            Sorting suggestions by {opts.byCount ? 'count' : 'trend'}
                          </Typography>
                        }
                        labelPlacement="start"
                      />
                      <TermSelect title="Terms" allOptions={allTerms} selection={opts.terms} update={updateOpts} />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={opts.toPercent}
                            onChange={() => updateOpts({key: 'toPercent', value: !opts.toPercent})}
                          ></Switch>
                        }
                        label={
                          <Typography variant="caption">
                            Percent of total{' '}
                            {opts.show === 'user_trends' && !opts.terms.length ? 'messages' : 'word count'}
                          </Typography>
                        }
                        labelPlacement="start"
                      />
                    </>
                  : <>
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={opts.keepAts}
                            onChange={() => updateOpts({key: 'keepAts', value: !opts.keepAts})}
                          ></Switch>
                        }
                        label={<Typography variant="caption">Include Usernames</Typography>}
                        labelPlacement="start"
                      />
                      <Stack spacing={1}>
                        <Tooltip title="Maximum number of terms with the highest values to display." placement="right">
                          <TextField
                            label="Max Terms"
                            type="number"
                            size="small"
                            fullWidth
                            value={opts.nTerms}
                            slotProps={{htmlInput: {min: 1, max: 9999, step: 10}}}
                            onChange={e => updateOpts({key: 'nTerms', value: +e.target.value})}
                          />
                        </Tooltip>
                        <Tooltip title="How close the words can be placed together." placement="right">
                          <TextField
                            label="Grid Size"
                            type="number"
                            size="small"
                            fullWidth
                            value={opts.gridSize}
                            slotProps={{htmlInput: {min: 0, max: 99, step: 1}}}
                            onChange={e => updateOpts({key: 'gridSize', value: +e.target.value})}
                          />
                        </Tooltip>
                        <Tooltip title="Difference in rotation between each word." placement="right">
                          <TextField
                            label="Rotation Step"
                            type="number"
                            size="small"
                            fullWidth
                            value={opts.rotStep}
                            slotProps={{htmlInput: {min: 1, max: 360, step: 1}}}
                            onChange={e => updateOpts({key: 'rotStep', value: +e.target.value})}
                          />
                        </Tooltip>
                        <Stack spacing={1} direction="row">
                          <Tooltip title="Smallest allowed rotation." placement="top">
                            <TextField
                              label="Min Rotation"
                              type="number"
                              size="small"
                              fullWidth
                              value={opts.minRot}
                              slotProps={{htmlInput: {min: -360, max: 360, step: 1}}}
                              onChange={e => updateOpts({key: 'minRot', value: +e.target.value})}
                            />
                          </Tooltip>
                          <Tooltip title="Largest allowed rotation." placement="right">
                            <TextField
                              label="Max Rotation"
                              type="number"
                              size="small"
                              fullWidth
                              value={opts.maxRot}
                              slotProps={{htmlInput: {min: -360, max: 360, step: 1}}}
                              onChange={e => updateOpts({key: 'maxRot', value: +e.target.value})}
                            />
                          </Tooltip>
                        </Stack>
                        <Stack spacing={1} direction="row">
                          <Tooltip title="Size of words with the smallest values." placement="top">
                            <TextField
                              label="Min Size"
                              type="number"
                              size="small"
                              fullWidth
                              value={opts.minSize}
                              slotProps={{htmlInput: {min: 1, max: 9999, step: 1}}}
                              onChange={e => updateOpts({key: 'minSize', value: +e.target.value})}
                            />
                          </Tooltip>
                          <Tooltip title="Size of the words with the largest values." placement="right">
                            <TextField
                              label="Max Size"
                              type="number"
                              size="small"
                              fullWidth
                              value={opts.maxSize}
                              slotProps={{htmlInput: {min: 1, max: 9999, step: 1}}}
                              onChange={e => updateOpts({key: 'maxSize', value: +e.target.value})}
                            />
                          </Tooltip>
                        </Stack>
                        <Stack spacing={1} direction="row">
                          <Tooltip title="Raises the word count by this value." placement="top">
                            <TextField
                              label="Scaling Factor"
                              type="number"
                              size="small"
                              fullWidth
                              value={opts.scaleFactor}
                              slotProps={{htmlInput: {min: 0.1, max: 10, step: 0.1}}}
                              onChange={e => updateOpts({key: 'scaleFactor', value: +e.target.value})}
                              sx={{width: 135}}
                            />
                          </Tooltip>
                          <Tooltip
                            title="If true, multiplies the scaled word count by its correlation with time."
                            placement="right"
                          >
                            <FormControlLabel
                              control={
                                <Switch
                                  size="small"
                                  checked={opts.trendScale}
                                  onChange={() => updateOpts({key: 'trendScale', value: !opts.trendScale})}
                                ></Switch>
                              }
                              label={<Typography variant="caption">Adjust by Trend</Typography>}
                              labelPlacement="start"
                            />
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </>
                  }
                </Stack>
                <Stack spacing={2}>
                  <Typography variant="h6">Filter</Typography>
                  <Stack spacing={1}>
                    <Typography variant="caption">Users</Typography>
                    <Tooltip title="If false, excludes bots from the user list." placement="right">
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={opts.keepBots}
                            onChange={() => updateOpts({key: 'keepBots', value: !opts.keepBots})}
                          ></Switch>
                        }
                        label={<Typography variant="caption">Include Bots</Typography>}
                        labelPlacement="start"
                      />
                    </Tooltip>
                    <TermSelect title="Users" allOptions={allUsers} selection={opts.users} update={updateOpts} />
                  </Stack>
                  <Stack spacing={1}>
                    <Typography variant="caption">Streams</Typography>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={filterByDate}
                          onChange={() =>
                            updateOpts({
                              key: 'streams',
                              value:
                                opts.streams.startsWith('n') ?
                                  `${since.format('YYYYMMDD')},${until.format('YYYYMMDD')}`
                                : 'n' + nStreams,
                            })
                          }
                        ></Switch>
                      }
                      label={
                        <Typography variant="caption">
                          {filterByDate ? 'Streams by date' : 'Most recent streams'}
                        </Typography>
                      }
                      labelPlacement="start"
                    />
                    {filterByDate ?
                      <Stack spacing={1}>
                        <DatePicker
                          label="Since"
                          value={since}
                          onChange={date => {
                            if (date) {
                              setSince(date)
                              setTimeout(() => {
                                updateOpts({
                                  key: 'streams',
                                  value: `${date.format('YYYYMMDD')},${until.format('YYYYMMDD')}`,
                                })
                              }, 100)
                            }
                          }}
                        />
                        <DatePicker
                          label="Until"
                          value={until}
                          onChange={date => {
                            if (date) {
                              setUntil(date)
                              setTimeout(() => {
                                updateOpts({
                                  key: 'streams',
                                  value: `${since.format('YYYYMMDD')},${date.format('YYYYMMDD')}`,
                                })
                              }, 100)
                            }
                          }}
                        />
                      </Stack>
                    : <TextField
                        label="Number of Streams"
                        type="number"
                        size="small"
                        fullWidth
                        value={nStreams}
                        slotProps={{htmlInput: {min: 1, max: 999, step: 1}}}
                        onChange={e => {
                          const value = +e.target.value
                          setNStreams(value)
                          updateOpts({key: 'streams', value: 'n' + value})
                        }}
                      />
                    }
                  </Stack>
                </Stack>
                <Stack spacing={1}>
                  <Typography variant="h6">Style</Typography>
                  <FormControl variant="outlined" fullWidth size="small">
                    <InputLabel id="palette">Color Palette</InputLabel>
                    <Select
                      labelId="palette"
                      label="Color Palette"
                      value={opts.palette}
                      onChange={e => updateOpts({key: 'palette', value: e.target.value})}
                    >
                      <MenuItem value="imola">Imola</MenuItem>
                      <MenuItem value="buda">Buda</MenuItem>
                      <MenuItem value="romaO">RomaO</MenuItem>
                      <MenuItem value="nuuk">Nuuk</MenuItem>
                      <MenuItem value="hawaii">Hawaii</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={opts.reversePalette}
                        onChange={() => updateOpts({key: 'reversePalette', value: !opts.reversePalette})}
                      ></Switch>
                    }
                    label={<Typography variant="caption">Reverse Palette</Typography>}
                    labelPlacement="start"
                  />
                </Stack>
              </Stack>
            </Box>
          </CardContent>
          <CardActions>
            <Button
              onClick={() =>
                window.location.replace(window.location.origin + window.location.pathname + '?channel=' + opts.channel)
              }
              variant="contained"
              color="error"
              fullWidth
            >
              Reset
            </Button>
          </CardActions>
        </Card>
      </Box>
      <Box sx={{position: 'absolute', top: 0, right: 0, bottom: 0, left: 250}}>
        <DataContext.Provider value={data}>
          <OptionContext.Provider value={opts}>
            <OptionSetterContext.Provider value={updateOpts}>
              <DetailSetterContext.Provider value={updateDetails}>
                <DetailContext.Provider value={detailDisplay}>
                  <Display />
                </DetailContext.Provider>
              </DetailSetterContext.Provider>
            </OptionSetterContext.Provider>
          </OptionContext.Provider>
        </DataContext.Provider>
      </Box>
    </Box>
  )
}
