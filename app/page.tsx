'use client'

import {CssBaseline, ThemeProvider, createTheme} from '@mui/material'
import {StrictMode} from 'react'
import {Data} from './components/data'

const theme = createTheme({
  palette: {mode: 'dark', primary: {main: '#c3dcf7'}, secondary: {main: '#fbe85e'}},
})

export default function Home() {
  return (
    <StrictMode>
      <ThemeProvider theme={theme} noSsr>
        <CssBaseline />
        <Data />
      </ThemeProvider>
    </StrictMode>
  )
}
