# TypeScript Migration Plan

0. [install ts-jest](https://jestjs.io/docs/getting-started#via-ts-jest)
1. Rename each .js file to .ts or .tsx (for components)
    a. This is only necessary for files I am adding. I'm not planning on changing server-worker.js
    - I needed to upgrade to node v18 to silence errors about the canvas elements
    - In the end, I didn't need to do this. I just added the canvas module.
    - There seem to be so many things wrong with the project, I don't know where to start.
        - Missing types
        - Need to mock AudioContext
        - Visualizer is not clean seems to be getting in the way of fixing the other issues
    - I think a lot of the issues revolve around the poor organization of the code in Visualizer. I found [this article](https://javascript.plainenglish.io/canvas-animation-inside-react-components-with-requestanimationframe-c5d594afc1b) on using requestAnimationFrame with React and am using that to refactor.
    - Now that the code is refactored, we are left with:
        - useEffect starts the animation by calling `visualize(stream)` and `requestAnimationFrame(tick)`
        - `tick()` manages timing (kind of like a time code mechanism) calling `draw()` to actually draw the frame
        - 
2. Type variables
    - As I start down this path, I found an instance in which all tests were green but the app was crashing. This is because we are mocking getUserMedia in useMediaRecorder. I'm not going to worry about this for now. I'll circle back after refactoring the useEffect in App.tsx.
    - As I started typing variables, I started finding problems with the code, and was frustrated that it was working in all browsers except Safari.
    - I re-read all of the MediaRecorder and MediaStreams documentation.
    - I created a new repo with _just_ enough code to test our my approach, and then a simple test in plain HTML, and finally in plain JS. I found that the plain HTML code worked, so I invested time testing with plain JS, and got it to work too. I then refactored the main code in [the test repo](https://github.com/tedsecretsource/sound-test) and got _it_ to work *too*, so now I'm back here. At this point I'm not going to fix the code on this branch, but I will create a new branch to address it after I've added types.
3. Type functions
4. Type classes


# Implement Terms Navigation

1. Write the first, simple test, that can pass without implementing everything.

Currently, all tests are green but no routing is in place.

As I work on this I find that there are many problems.

1. The type of the stream object could be many things but in the end we can only actually use one type (MediaStream). If the object is set to anything else, it will fail when passing it to MediaRecorder.
2. I'm struggling to overwrite the navigator.mediaDevices.getUserMedia https://stackoverflow.com/questions/65112057/jest-spyon-navigator-mediadevices seems to be the solution

## Mocking Native Objects

I'm convinced the idea of putting native functions (navigator.mediaDevices) into a custom hook just so you can mock them is not a best practice. I seem to have found a way to mock these objects properly, now, after much searching, reading, and some trial and error.

Additionally, React Router requires a certain "template" approach that requires a code reoganization. I could probably accomplish the implementation by creating a separate routes file, but I feel that that's what the App component is about, so, might as well move the crap out of there and into the actual Recorder component.

So, the question is, what is the first step I can take in the reorg without breaking anything? What's the second step? etc.

1. Copy the getUserMedia mechanics into the Recorder component
    a. copy the renderer function
    b. copy the import of useGetUserMedia
    c. copy the let statement to set the value of theStream
2. copy the existing return in Recorder into its own function, renderUI, for example
3. update render router to call new renderUI (instead of <Recorder>)
4. Update the existing return to call the render router

At this point, everything should still be green and continue to work but this is where it gets difficult for me.

Ideally, the next step would be to start using the stream object created inside Recorder so we can eliminate the required parameter (this is another preoptimization or attempt at IoC gone awry).

The problem with this approach is, getUserMedia returns a promise. Thus, all of the functions immediately following the call to useGetUserMedia would run with a null stream.

Now that I've analyzed it a bit more, I think the best approach is to move the initialization into getMediaRecorder and expose the stream object in the return value for use in Visualizer

The steps are then

1. Copy the getUserMedia mechanics into the useMediaRecorder hook
2. Return the stream object
3. Update App so the render calls <Recorder />

    I believe the stream init needs to happen in useEffect but the other constants are then initialized _before_ useEffect finishes (and thus, with incorrect values and ultimately, errors).

    I could try moving the init right into useMediaRecorder but then I have to deal with the varying return types, which is a problem in general (maybe I shouldn't bother worrying about it, yet)

    PREMATURE ABSTRACTION Yes! This is a pre-optimization! I've added an abstraction that I can no longer support! Also, the stream should only ever be null or MediaStream. Allowing it to be DOMException makes things more complex, so this is also something that needs to be fixed, but later if possible.

### Final Instructions

Here are the exact steps I'll follow:

#### Copy useGetUserMedia into useEffect of useMediaRecorder

- Copy the contents of useGetUserMedia into useEffect of useMediaRecorder. Move the existing try/catch blocks to `then` clause of navigator.mediaDevices.getUserMedia.
- Modify the `catch` clause of navigator.mediaDevices.getUserMedia to `console.log(error)`. Modifying `catch` should not turn the tests red because it's accounted for as a valid response (the user denied permissions). At first glance you might think there is a possibility that not refactoring for the `catch` clause could lead to an error, but it won't because the rendering logic in App will still be available and is what determines how the app responds visually, so, we're safe in making this change here now.

#### Add `stream` to the return value of useMediaRecorder

We're doing this so that `stream` is available to Visualizer (since we'll be removing the `stream` parameter from Recorder)

- in useMediaRecorder, mark `useMediaRecorderProps` as optional in the interface
- in useMediaRecorder, delete the `stream` constant destructure definition thingy
    - TypeScript will complain about this, but the tests will still pass
- in useMediaRecorder, add a let for the new `stream` variable
- in useMediaRecorder, set `stream` to the value of the stream returned in the `then` clause of navigator.mediaDevices.getUserMedia
- in useMediaRecorder, add `stream` to the return of useMediaRecorder

At this point we should have decoupled Recorder from the dependency on the `stream` parameter

- in Recorder, set the `stream` parameter as optional in the interface
- in Recorder, add a default value `{}` for `stream` in the function signature
- in Recorder, change `const { stream } = props` to `let { stream } = props`
- in Recorder, remove `stream` from `const { recorder, recordings, setRecordings, isRecording } = useMediaRecorder({stream})`
- in Recorder, add `stream` to the destructure of `const { recorder, recordings, setRecordings, isRecording } = useMediaRecorder()` so it reads `const { recorder, recordings, setRecordings, isRecording, stream } = useMediaRecorder()`

At this point stream is not only truly optional but is returned from useMediaRecorder

- in Recorder, remove the type from `props` in the function signature and add a question mark to `props` to make it optional
- in Recorder, delete the interface definition
- in App, remove the `stream` attribute from the <Recorder /> component
- in Recorder, delete `props?` from the function signature

And now, finally, Recorder has no dependencies on anything. However, App is still responsible for deciding which UI to display (the Loading, Record, or error buttons).

#### Move Record Button logic into Recorder (and out of App)

The aim of this mini-refactor is to make App's sole responsibility be layout related; answer the question: what component should display in <Outlet />

The basic approach will be to recreate the logic in App inside Recorder and once we feel it's set up properly (and disengaged in App), remove that logic from App.

- in Recorder, create a new function, say, recorderUI
- in Recorder, copy current `return` value into recorderUI
- in App, copy recorderRenderer
- in Recorder, paste recorderRenderer
- in Recorder, update the `stream instanceof MediaStream` to return recorderUI
- in Recorder, change every instance of `theStream` to `stream`

### A Wrench in the Works

The next step (see below under What About the Last Steps?) is turning some of the tests red. This is happening because stream is not null but it is also not a MediaStream according to the tests and thus the wrong button is rendering.

I tried adding the missing `stream` object to `mockUseMediaRecorder` but it doesn't seem to make a difference (because it is window.MediaStream, not a proper MediaStream object). In commit e69002d, I fix this issue, but I'd already written the plan that follows and since the plan still seems reasonable, we proceed.

I need to refactor `useMediaRecorder` (the new custom hook should be called useInitMediaRecorder) to _only_ include native browser object calls (`getUserMedia`, `new MediaRecorder`) and return a `MediaRecorder` object, which can then be passed into a new `useConfigureMediaRecorder` custom hook.

By mocking these objects, I can mock `useInitMediaRecorder` but leave `useConfigureMediaRecroder` as is, use it natively (which handles the start, stop, pause, etc. events). My goal here is to only mock the things that have _no_ equivalent inside tests in order to increase test coverage.

#### An Aside on Clean Code

In my opinion, this refactor shows the limitations of jest as a testing framework and the potentially negative impact it can have on code layout. Refactoring code to account for test framework limitations feels a lot like an anti-pattern. To be clear, if I combine calls to `getUserMedia` and `new MediaRecorder()` plus all of the configuration of the MediaRecorder object into a single hook, I then have to mock the entire hook, including all the event handlers, and I then lose the ability to unit test the event handlers, among other things.

If Jest supported `getUserMedia` et al natively, I could simply unit test the `recorder` returned by the existing custom hook and not be concerned with where or how it is initialized.

### Steps to Refactor useMediaRecorder

Note that during these changes we'll make one tiny shortcut: instead of passing the `MediaStream` object around, we'll use the one associated with the `MediaRecorder` object as it is essentially the same thing (might even be _exactly_ the same thing). This will keep our function calls cleaner (fewer parameters).

And because we're doing TDD, let's start this refactor by setting up the tests. **NB**: as this refactor includes modifying existing tests and potentially adding new ones, it will be normal for some of the tests to be red until we update the production code in the next set of steps, as is actually the case right now (one of the tests is red because the test itself, the mock specifically, has issues).

Starting with `src/components/Recorder/index.test.tsx`

- create two stub files with empty exports for the two new hooks in `src/hooks`
- add an import statement for the new useInitMediaRecorder hook at the top of the test
- create a `mockMediaRecorder` function that returns an object that understands start, stop, pause, etc. events and has a MediaStream property just like a real MediaRecorder object
    - to be clear, I didn't exactly do that. I used a different syntax (used an anonymous function)
- mock `useInitMediaRecorder` and set the mock implementation to `mockMediaRecorder`
- update all the existing tests removing the old mockUseMediaRecorder
- add an import to the native browser mocks at the top of the test file

At this point all the tests in Recorder should be equally red but that's OK because we're doing TDD…

- add code to the new custom hook useInitMediaRecorder (no params, returns an initialized MediaRecorder but without setting onstart, onstop, etc.)
- create the new custom hook useConfigureMediaRecorder (requires one MediaRecorder object, returns existing useMediaRecorder objects) - this is a copy of the existing custom hook minus the MR initialization bits
- change useMediaRecorder so it calls the combination of custom hooks and continues to return the same objects (so the API doesn't change but the _implementation_ does)
- in Recorder, add imports for the new hooks
- in Recorder, init the new MR object using the new custom hook `let mr = useInitMediaRecorder()`
- in Recorder, change `useMediaRecorder()` to `useConfigureMediaRecorder(mr)`

At this point, it's possible that all tests are green but because I'm no expert at mocking, it's also probable that no tests are green (or only some are). If there is a way to verify the mocked MediaRecorder object is functioning properly, do that. If tests are still red, then go back to the actual code and see what's not working or not coded properly and make the tests green one by one.

#### What About the Last Steps?

Fact is, we already did these last two steps before refactoring the tests and the native browser stuff. That's what turned one of the tests red and was our cue to revist the tests in general. Thus, these last two steps are no longer needed, yay!

X in Recorder, change `return` to reference `recorderRenderer()`
X in App, change `return` to be simply `<Recorder />`

#### Miscelaneous cleanup

At this point, the system is using the new code. App is now strictly for layout, all media-related calls are in useMediaRecorder, and we can now safely delete all old code.

- in App, delete `let theStream = useGetUserMedia()`
- in App, delete the `recorderRenderer` function
- delete the `useGetUserMedia` hook
- in `src/components/Recorder/index.test.tsx` remove unused functions and imports

Also, as DOMException is no longer a possibility, we can delete the test for that type from `recorderRenderer`. Likewise, in the default `else`, we can display a more realistic message, like, "You need to allow use of your microphone to use this tool" rather than displaying a button.

In useMediaRecorder, we can also remove the optional stream and props parames and interface definition.

And one last thing… The documentation in useMediaRecorder needs to be updated. `stream` is no longer required. `stream` is included in the return value.

And with that, the whole application should be in a much, much better place for adding React Router and carrying on with the display terms task!

## PREMATURE ABSTRACTIONS

- initializing the stream object in the App component and then _passing_ it to the Recorder component as a type of IoC or DI
- setting the stream object to DOMException rather than setting a separate error state or variable to try and minimize the number of variables!
- using custom hooks to facilitate testing rather than doing proper, native mocking, e.g.: useGetUserMedia