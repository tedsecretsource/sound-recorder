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

#### The Refactor Plan

Rather than create custom hooks, I'm going to create a "provider" component that will be responsible for initializing the MediaRecorder object and then passing it down to the Recorder component. This will allow us to keep the RecorderProvider component as a pure function and serve as a sort of interface that can be easily mocked. Also, for now, I'm going to update `useMediaRecorder` to call `useConfigureMediaRecorder` (basically, a temporary passthru while I finishe the refactor).

#### Update tests to use RecorderProvider

- in `src/__nativeBrowserObjectMocks__/nativeBrowserObjectMocks.ts`, uncomment the `MediaRecorder` mock
- in `src/components/Recorder/index.test.tsx`, update `render( <Recorder />)` in the tests to include the `mr` parameter and set it to the mock `MediaRecorder` object (not entirely sure how to do this…)
- in `src/components/Recorder/index.test.tsx`, remove the code that mocks `useMediaRecorder`

#### Update Recorder to use RecorderProvider

- Create a new component called `RecorderProvider`
- in `RecorderProvider`, add a useEffect that calls `navigator.mediaDevices.getUserMedia` and then calls `new MediaRecorder` with the stream returned from `getUserMedia`, and then sets the `mr` state variable to the result of `new MediaRecorder`
- in `RecorderProvider`, add a `return` statement that calls the `Recorder` component and passes `mr` as a prop
- in Recorder, add an optional `mr` prop to the interface
- in Recorder, add an optional `mr` to the function signature
- in Recorder, add `mr` to the destructure of `props`
- in Recorder, add `mr` to the `useMediaRecorder` call as a parameter
- in useMediaRecorder, add `mr` as an optional parameter to the function signature
- in useMediaRecorder, add `mr` to the destructure of `props`
- in useMediaRecorder, add `mr` to the `useConfigureMediaRecorder` call as a parameter
- in useMediaRecorder, return the configured `mr` object from `useConfigureMediaRecorder`

And again, here we are, at the last step, and the tests are red, and I'm unable to proceed. Reviewing [Manu's code](https://github.com/tedsecretsource/sound-recorder/blob/f4101462cd75f4cb8246f763ba29d78ad0720d1f/src/components/Recorder/index.test.js#L65), I realize that setting the value of isRecording is a duplication of effort because that state is stored directly in the MediaRecorder object. So, I'm going to remove that state from Recorder and instead use the `state` property of the MediaRecorder object.

The aim is to remove unnecessary dependencies so that testing is easier. In this case, the `isRecording` state variable is unnecessary because the MediaRecorder object already has a `state` property that can be used to determine if the recorder is recording or not. Additionally, Visualizer receives a stream object. Instead, I'm going to send it the MediaRecorder object and use the stream property directly.

- in Recorder, change every instance of `isRecording` to `mr.state === 'recording'` (or maybe put it in a function)
- in Recorder, remove `isRecording` from the destructure of `useConfigureMediaRecorder`
- in Recorder, change every instance of `stream` to `mr.stream` or similar

I stopped following my script here because things just weren't working. Specifically, although I seemed to be able to override `mr.state` in the tests, it didn't seem to be having any effect on the rendered component. See below…

~~~~~~~~~~~~~~~ didn't do ~~~~~~~~~~~~~~~
- in Recorder, remove `stream` from the destructure of `useConfigureMediaRecorder`
- in Visualizer, add an optional parameter for the `MediaRecorder` object
- in Visualizer, make the `stream` parameter optional
- in Recorder, add `MediaRecorder` to the attributes of the `Visualizer` component
- in Visualizer, change every instance of `stream` to `mr.stream` or similar, including in the interface definition
- in Recorder, remove `stream` from the attributes of the `Visualizer` component
- in Visualizer, remove `stream` from the interface definition and the function signature
- in useConfigureMediaRecorder, remove `stream` and `isRecording` from the return statement
- in useConfigureMediaRecorder, remove `stream` and `isRecording` from the state
~~~~~~~~~~~~~~~ didn't do ~~~~~~~~~~~~~~~

I didn't do any of the above, really. Instead, I fiddled around to try and understand why the event handlers assigned to the `MediaRecorder` object weren't being called. I even tried manually wiring up the event handlers but that didn't seem to work either.

~~- in App, replace the `Recorder` component with `RecorderProvider`~~

#### isRecording (or similar) is actually required

I need to set a state variable to get the Record / Stop button to render correctly, but that's not the current roadblock…

### Roadblock: Event Handlers Aren't Being Called

Now that I'm mocking the `MediaRecorder` object and I'm able to manually set the `state` property, I'm able to get the tests to pass. However, the event handlers assigned to the `MediaRecorder` object aren't being called. I've tried manually wiring up the event handlers but that didn't seem to work either, probably because the event dispatching is more complex to set up tha I realize. In the end, though, this too is an imperfect approach. If I want to test event handlers, I need to keep them separate from the native object placeholders and think in terms of unit tests.

Also, one of the requirements of hooks is that their contents don't change between renders. As I'm only interested in testing the event handler code (the code I'm adding, not the native behavior), I'm going to use a custom hook to define, and export, the event handlers. This way I can test them separately to make sure I have solid test coverage.

#### Rewrite tests to use new event handlers

In theory this won't require any changes to the tests, but there are some tests that are failing because they are invalid. I'll fix those tests and then add new tests for the event handlers.

Once I've done that, I'll proceed with the refactor below and then add tests for the new event handlers.

#### Testing MediaRecorder Event Handlers

What I'm struggling with is testing the code that executes in native MediaRecorder event handlers. If instead of using the native event handlers (`onstart`, `onstep`, etc.) and instead add that code to the `toggleRecording` function, tests should just pass.

In the end, the solution was to remove the event handlers from the custom hook and, basically, don't use them!

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


# Implementing React Router

- The main react router documentation is the first result in google but followed quickly by the remix-run docs, which makes you wonder which docs are the correct ones.
