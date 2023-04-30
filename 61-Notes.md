# Refactor so we use React Router useOutletContext

1. Refactor router definition to allow for useOutletContext
    - create a new function called `newRouter` that returns the JSX for the router
    - change the name of the router in the provider to `newRouter`
    - delete the exisitng router function
    - rename `newRouter` to `router` in the provider and the function definition
    - in App.tsx
        - Change {Outlet} to `<Outlet />`
        - delete useEffect (not needed)
        - delete other unused variables and imports
3. Write the missing tests (see https://github.com/tedsecretsource/sound-recorder/issues/61)
    - Again, we need to mock the `useOutletContext` hook and friends
    - Also, the proposed tests are better done in cyprus
4. import useGetMediaRecorder in App.tsx
7. import useOutletContext from react-router-dom in App.tsx
10. Add a type for getUserMedia as per the docs https://reactrouter.com/en/main/hooks/use-outlet-context#useoutletcontext in App.tsx
15. Add an export of a custom hook that returns the value of useOutletContext to App.tsx for the reasons mentioned in the documentation
20. Add a type for the return value of useOutletContext
25. Add the `context` attribute to the `Outlet` component in App.tsx with a value of the return from useGetMediaRecorder