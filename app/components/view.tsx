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
import {useReducer, useState, type KeyboardEvent} from 'react'

const defaultOpts: Options = {
  channel: '',
  show: 'trends',
  userTrends: false,
  users: [],
  terms: ['hiccup', '!hic'],
  gridSize: 6,
  keepBots: false,
}

export function optionsToString(options: Options) {
  const p: string[] = []
  Object.keys(options).forEach(v => {
    const value = options[v as 'show']
    if (value !== defaultOpts[v as 'show']) {
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
        update({key: title.toLowerCase() as 'users', value: [...value]})
      }}
      onKeyUp={(e: KeyboardEvent<HTMLDivElement>) => {
        const inputValue = 'value' in e.target ? (e.target.value as string) : ''
        if ((e.code === 'Enter' || e.code === 'NumpadEnter') && search && (!inputValue || inputValue === search)) {
          addSelection(inputValue)
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
          const value = k === 'terms' || k === 'users' ? params[k].split(',') : params[k as 'show']
          initial[k as 'show'] = value as string
        }
      })
      return initial
    })()
  )
  return (
    <Box component="main" sx={{position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, p: 0, m: 0}}>
      <Box sx={{position: 'absolute', height: '100%', width: 250}}>
        <Card sx={{height: '100%', width: '100%'}}>
          <CardHeader title="Options" />
          <CardContent>
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
              <TermSelect
                title="Users"
                allOptions={Object.keys(data.users)}
                selection={opts.users}
                update={updateOpts}
              />
              <TermSelect
                title="Terms"
                allOptions={Object.keys(data.terms)}
                selection={opts.terms}
                update={updateOpts}
              />
            </Stack>
            <Typography variant="h6">Settings</Typography>
            <Stack spacing={1}>
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
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={opts.keepBots}
                    onChange={() => updateOpts({key: 'keepBots', value: !opts.keepBots})}
                  ></Switch>
                }
                label={<Typography variant="caption">Show Bots</Typography>}
                labelPlacement="start"
              />
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
