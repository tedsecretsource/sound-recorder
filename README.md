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
