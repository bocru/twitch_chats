import {
  Autocomplete,
  Box,
  Card,
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
  Typography,
} from '@mui/material'
import type {Options, OptsAction, ProcessedData} from '../types'
import {Display} from './display'
import {useMemo, useReducer, useState, type KeyboardEvent} from 'react'
import {botUsers} from './data'

const defaultOpts: Options = {
  channel: '',
  show: 'wordcloud',
  userTrends: false,
  users: [],
  terms: [],
  gridSize: 8,
  keepBots: false,
  keepAts: false,
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
  newState[action.key] = action.value
  updateUrlParams(newState)
  return newState
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
        setSuggestions([])
        update({key: title.toLowerCase() as 'users', value: [...value]})
      }}
      onKeyUp={(e: KeyboardEvent<HTMLDivElement>) => {
        const inputValue = 'value' in e.target ? (e.target.value as string) : ''
        if ((e.code === 'Enter' || e.code === 'NumpadEnter') && search && (!inputValue || inputValue === search)) {
          addSelection(inputValue)
          setSuggestions([])
          return
        }
        const value = e.target.value
        setSuggestions(
          value
            ? allOptions
                .filter(o => o.includes(value))
                .sort()
                .filter((_, i) => i < 100)
            : []
        )
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

export function View({data, params}: {data: ProcessedData; params: {[key: string]: string}}) {
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
            initial[k as 'show'] = value as string
          }
        }
      })
      return initial
    })()
  )
  const allUsers = useMemo(() => {
    return opts.keepBots ? Object.keys(data.users) : Object.keys(data.users).filter(user => !(user in botUsers))
  }, [data.users, opts.keepBots])
  const allTerms = useMemo(() => Object.keys(data.terms), [data.terms])
  return (
    <Box component="main" sx={{position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, p: 0, m: 0}}>
      <Box sx={{position: 'absolute', height: '100%', width: 250}}>
        <Card sx={{height: '100%', width: '100%'}}>
          <CardHeader title="Options" />
          <CardContent>
            <Stack spacing={1}>
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
                    <MenuItem value="trends">Trends</MenuItem>
                  </Select>
                </FormControl>
                {opts.show === 'trends' ? (
                  <>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={opts.userTrends}
                          onChange={() => updateOpts({key: 'userTrends', value: !opts.userTrends})}
                        ></Switch>
                      }
                      label={<Typography variant="caption">User Trends</Typography>}
                      labelPlacement="start"
                    />
                    <TermSelect title="Terms" allOptions={allTerms} selection={opts.terms} update={updateOpts} />
                  </>
                ) : (
                  <>
                    <TextField
                      label="Grid Size"
                      type="number"
                      size="small"
                      fullWidth
                      value={opts.gridSize}
                      slotProps={{htmlInput: {min: 0, max: 99, step: 1}}}
                      onChange={e => updateOpts({key: 'gridSize', value: e.target.value})}
                    />
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
                  </>
                )}
              </Stack>
              <Stack spacing={1}>
                <Typography variant="h6">Filter</Typography>
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
                <TermSelect title="Users" allOptions={allUsers} selection={opts.users} update={updateOpts} />
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
      <Box sx={{position: 'absolute', top: 0, right: 0, bottom: 0, left: 250}}>
        <Display data={data} options={opts} />
      </Box>
    </Box>
  )
}
