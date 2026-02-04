# Sound Recorder

This is a sound recording application created in ReactJS. It is a learning exercise. Buyer beware.

This is, in many ways, a recreation of this [dictaphone web application](https://github.com/mdn/web-dictaphone/). 
However, with this version, I plan on making it a [PWA](https://create-react-app.dev/docs/making-a-progressive-web-app/) 
so you can install it on your device and use it without an Internet connection.

## Product Vision

I am a bit of a sound effects enthusiast. I have a small collection of [sound effects](https://freesound.org/people/tedmasterweb/) and used to use a very nice Roland stereo recording device but it can sometimes be a burden to carry around. The feature I liked the most about it was its reliability. It was always ready to go and I could record a sound effect in a matter of seconds. I wanted to create a similar experience for myself.

The main feature of this application will be reliability. Once installed, you tap it to open it and tap the record button to start recording immediately. My plan is save the recording every second so that should the app crash or you accidentally close it, you will not lose your recording.

## Features

I'm implementing features found in the github issues. I've organized them by milestone, but there are potentially hundreds of features and, as of this writing, we are at the very beginning of the project.

- [x] Record audio
- [x] Save audio
- [x] Play audio
- [x] Delete audio
- [x] Download audio
- [x] Install as a PWA
- [x] Rename an audio file
- [ ] Display audio file duration
- [ ] Display audio file size
- [ ] Display audio file format
- [ ] Display audio file sample rate
- [ ] Display audio file bit rate
- [ ] Display audio file channels
- [ ] Display audio file encoding
- [ ] Display audio file codec
- [ ] Display audio file container
- [ ] Display audio file metadata


## Live Demo

You can see a [live demo here](https://tedsecretsource.github.io/sound-recorder/) of the current development version.

## Audio Formats

### Recording Format

The app records in the browser's native format:
- **WebM/Opus** (`audio/webm;codecs="opus"`) - Chrome, Firefox, Edge
- **MP4/AAC** (`audio/mp4`) - Safari fallback

See `src/hooks/useGetMediaRecorder.ts` for implementation.

### Freesound Upload Format

When syncing to Freesound, recordings are converted from WebM/Opus to **WAV** (16-bit PCM) before upload. See `src/utils/audioConverter.ts`.

**Why WAV instead of uploading WebM directly?**
- Freesound officially supports: WAV, FLAC, OGG, MP3, AIFF
- WebM is not officially listed as supported
- WAV is universally accepted and avoids potential compatibility issues

**Trade-offs of WAV conversion:**
- Larger file size (uncompressed PCM vs compressed Opus)
- Lossy conversion (Opus → PCM is a decode, not a transcode)
- More processing time on client

**Future consideration:** Freesound also accepts OGG, which uses the same Opus codec as WebM. A WebM → OGG conversion would be a lossless container change (same audio data, different wrapper). However, browsers don't provide a native API for this conversion. Libraries like FFmpeg.wasm could enable this but would add significant bundle size. For now, WAV conversion is simpler and guaranteed to work.

## Resources

- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)
- [MediaStream Recording](https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API)
- [MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)
- [Mocking methods which are not implemented in JSDOM](https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom)
- [Mocking browser APIs in Jest (localStorage, fetch and more!)](https://bholmes.dev/blog/mocking-browser-apis-fetch-localstorage-dates-the-easy-way-with-jest/)

### Other Related Repos
- [MediaRecorder Pollyfill](https://github.com/ai/audio-recorder-polyfill)
- [React Media Recorder](https://github.com/0x006F/react-media-recorder)
- [use-media-recorder](https://github.com/wmik/use-media-recorder) (React based hooks to utilize the MediaRecorder API for audio, video and screen recording)

### Reported Issues

These are issues I reported / uncovered / contributed to while working on this project.

- [How to mock MediaRecorder API in Jest](https://github.com/facebook/jest/issues/10789)
- [How to mock a read-only property of a native browser object in Jest](https://stackoverflow.com/questions/74133026/how-to-mock-a-read-only-property-of-a-native-browser-object-in-jest)
- [Bug 245056 Audio element displays Error when using Blob URL as src](https://bugs.webkit.org/show_bug.cgi?id=245056)
