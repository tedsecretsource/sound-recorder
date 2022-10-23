# Lessons Learned while Learning Jest

1. Don't expect to use only Jest. Jest struggles with certain things and it is just more effective to use something like Cypress or Selenium.
2. A common React pattern seems to be you only test the current component and mock all the children.
3. Mocking native browser objects can be accomplished by importing a module that defines objects in the global space using `Object.defineProperty`.
4. The Jest documentation doesn't really work for me. I can't put my finger on it but I often find myself wondering what the recommended best practices are.
5. (already knew this but have a prime example) Don't test native objects. In my case, I've been working with `MediaRecorder`. There is no need to test the `.start` method. It will work. Likewise, there is no need to test whether or not calling `start` also calls the `onstart` event handler (it will). Therefore, if you have code that you want to test in the `onstart` event handler, you should define it in a _separate_ function and test that function.
6. There is no uncomplicated way to test the code inside the native event handlers of MediaRecorder because MediaRecorder is mocked.