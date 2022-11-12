import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation } from "react-router-dom"
import RecorderProvider from './components/RecorderProvider'
import Footer from './components/Footer'
import './App.css';

function App() {

  let location = useLocation()

  const [outlet, setOutlet] = useState(<Outlet />)

  useEffect(() => {
    if( location.pathname === '/' ) {
      setOutlet(<RecorderProvider />)
    } else {
      setOutlet(<Outlet />)
    }
  }, [location])

  return (
    <>
    <header>
      <h1><Link to="/">Sound Recorder</Link></h1>
    </header>
    <main>
      {outlet}
    </main>
    <Footer />
    </>
  );
}

export default App;
