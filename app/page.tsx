'use client'

import {CssBaseline, ThemeProvider, createTheme} from '@mui/material'
import {StrictMode} from 'react'
import {Data} from './components/data'

const theme = createTheme({
  palette: {mode: 'dark'},
})

export default function Home() {
  return (
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Data />
      </ThemeProvider>
    </StrictMode>
  )
}
