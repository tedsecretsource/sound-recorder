import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import TermsOfUse from './components/TermsOfUse';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import {
  createHashRouter,
  RouterProvider
} from "react-router-dom";
import ErrorPage from './404';
import RecordingsList from './components/RecordingsList/RecordingsList';
import Settings from './components/Settings/settings';
import User from './components/User/user';
import Recorder from './components/Recorder';

const router = createHashRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "terms-and-conditions",
        element: <TermsOfUse />,
      },
      {
        path: "recordings",
        element: <RecordingsList />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "user",
        element: <User />,
      },
      {
        path: "/sound-recorder/",
        element: <Recorder />,
      },
    ]
  },
]);

const container = document.getElementById('root');
const root = createRoot(container!)
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();
