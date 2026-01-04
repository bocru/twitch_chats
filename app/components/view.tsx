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
import type {Options, OptsAction, ProcessedData} from '../types'
import {Display} from './display'
import {createContext, useEffect, useMemo, useReducer, useState, type KeyboardEvent} from 'react'
import {botUsers} from './data'

const defaultOpts: Options = {
  channel: '',
  palette: 'nuuk',
  show: 'wordcloud',
  userTrends: false,
  users: [],
  terms: [],
  reversePalette: false,
  keepBots: false,
  keepAts: false,
  nTerms: 700,
  gridSize: 6,
  minSize: 14,
  maxSize: 500,
  minRot: -60,
  maxRot: 60,
  rotStep: 1,
  scaleFactor: 1,
  trendScale: true,
  byCount: true,
  toPercent: true,
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
  newState[action.key as 'show'] = action.value as string
  updateUrlParams(newState)
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
    return (opts.keepBots ? Object.keys(data.users) : Object.keys(data.users).filter(user => !(user in botUsers))).sort(
      (a, b) => {
        const counts = data.userCounts
        return counts[b] - counts[a]
      }
    )
  }, [data.users, data.userCounts, opts.keepBots, opts.byCount])
  const allTerms = useMemo(() => {
    const stats = data.termStats
    const by = opts.byCount ? 'count' : 'cor'
    return Object.keys(data.terms).sort((a, b) => {
      return stats[b][by] - stats[a][by]
    })
  }, [data.terms, data.termStats, opts.byCount])
  return (
    <Box component="main" sx={{position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, p: 0, m: 0}}>
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
                      <MenuItem value="trends">Trends</MenuItem>
                    </Select>
                  </FormControl>
                  {opts.show === 'trends' ? (
                    <>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={opts.userTrends}
                            onChange={() => updateOpts({key: 'userTrends', value: !opts.userTrends})}
                          ></Switch>
                        }
                        label={<Typography variant="caption">User Trends</Typography>}
                        labelPlacement="start"
                      />
                      <TermSelect title="Terms" allOptions={allTerms} selection={opts.terms} update={updateOpts} />
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
                      <FormControlLabel
                        control={
                          <Switch
                            size="small"
                            checked={opts.toPercent}
                            onChange={() => updateOpts({key: 'toPercent', value: !opts.toPercent})}
                          ></Switch>
                        }
                        label={
                          <Typography variant="caption">
                            Percent of total {opts.userTrends ? 'messages' : 'wordcount'}
                          </Typography>
                        }
                        labelPlacement="start"
                      />
                    </>
                  ) : (
                    <>
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
                  )}
                </Stack>
                <Stack spacing={1}>
                  <Typography variant="h6">Filter</Typography>
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
            <Display />
          </OptionContext.Provider>
        </DataContext.Provider>
      </Box>
    </Box>
  )
}
