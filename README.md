# Twitch Chats

Collects and processes Twitch video on demand (VoD) chats, and displays them in a web app.

## Collection

Uses [twitch archiver](https://github.com/Brisppy/twitch-archiver) to download VoD chats of channels listed in [scripts/channels.txt](scripts/channels.txt)
(the [scripts/sync.sh](scripts/sync.sh) script).

The [scripts/process.py] script creates a processed version of each chat history, compresses the full text, standardizes directory names,
and outputs the final, combined results for each channel to [public/channel](public/channel).

The [.github/workflows/update.yaml](.github/workflows/update.yaml) workflow regularly runs this process.

## Visualization

The app can be run locally:

```sh
npm run dev
```

Or built for static hosting:

```sh
npm run build
```
