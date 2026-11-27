# YouTube

Add courses and lectures from YouTube to Tau so you can take notes while watching. Videos are cached locally for offline playback; when subtitles are available, you can read along and clip lines straight into your notes.

## Get Started in 3 Steps

1. **Install the plugin**: Install "YouTube" from the Plugin Center and enable it right away—no restart needed.
2. **Add a video**: Choose "YouTube" when using "Add video" in a project or inserting a video in the editor or Whiteboards, then paste the video link.
3. **Choose quality**: Once parsed, pick a quality option. Playback begins as soon as the video downloads locally. If the selected quality is unavailable, Tau automatically falls back to the best downloadable format.

The first time you parse a video, Tau downloads a video parser component, which requires access to GitHub.

## What You Can Do

- **Take Video Notes**: Videos added to a project open in a split view—watch on the left and write on the right—with timestamps and frame snapshots. See [Video Notes](https://taunote.app/docs/video-notes/) for details.
- **Read along with subtitles**: Built-in subtitles display automatically, preferring manual captions over auto-generated ones. If subtitles are missing or inaccurate, use transcription to convert speech to text.
- **Embed in notes and Whiteboards**: Insert videos directly into note bodies and Whiteboards alongside your other content.
- **Use as study material**: Add videos as sources in a Notebook so Tau can convert them to text for AI search and Q&A.

Supports video links from `youtube.com`, `youtu.be`, and `yewtu.be`.

## When YouTube Is Unreachable

Open Settings on the plugin details page and enter your proxy under "Network" → "Proxy address", for example `http://127.0.0.1:7890` or `socks5://127.0.0.1:1080`. HTTP, HTTPS, and SOCKS5 proxies are supported. Leave it empty for a direct connection. Subtitle fetching also uses this proxy.

## FAQ

**Does it work on mobile?** No, the YouTube plugin is desktop-only.

**Parsing keeps failing?** First confirm the video opens in your browser; if not, check your Proxy address. On first use, you also need access to GitHub to download the parser component.
