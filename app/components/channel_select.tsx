import {Button, Stack, TextField} from '@mui/material'
import {useState} from 'react'

export default function ChannelSelect() {
  const [channel, setChannel] = useState('')
  const submit = () =>
    window.location.replace(window.location.origin + window.location.pathname + '?channel=' + channel)
  return (
    <Stack spacing={1} direction="row">
      <TextField
        label="Channel"
        value={channel}
        onChange={e => setChannel(e.target.value)}
        onKeyDown={e => {
          if ((e.code === 'Enter' || e.code === 'NumpadEnter') && channel) submit()
        }}
      />
      <Button disabled={!channel} onClick={submit}>
        Submit
      </Button>
    </Stack>
  )
}
