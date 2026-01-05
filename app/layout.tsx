import type {Metadata} from 'next'
import Theme from './theme'

export const metadata: Metadata = {
  title: 'Twitch Chats',
  description: 'Twitch chat visualization.',
}

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en">
      <body>
        <Theme>{children}</Theme>
      </body>
    </html>
  )
}
