'use client'

import {CssBaseline, ThemeProvider, createTheme} from '@mui/material'

const theme = createTheme({palette: {mode: 'dark'}})

export default function Theme({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <ThemeProvider theme={theme} defaultMode="dark" noSsr>
      <div suppressHydrationWarning={true}>
        <CssBaseline />
      </div>
      {children}
    </ThemeProvider>
  )
}
