import { useState, useEffect } from 'react'
import { Link, Outlet, useLocation } from "react-router-dom"
import Footer from './components/Footer'
import './App.css';
import Logo from './components/Logo'
import Recorder from './components/Recorder';

function App() {

  let location = useLocation()

  const [outlet, setOutlet] = useState(<Outlet />)

  useEffect(() => {
    if( location.pathname === '/' ) {
      setOutlet(<Recorder />)
    } else {
      setOutlet(<Outlet />)
    }
  }, [location])

  return (
    <>
    <header>
      <h1 style={{marginTop: "0"}}>
        <Link to="/" className='logo'>
          <Logo />
          <div>Sound Recorder</div>
        </Link>
      </h1>
    </header>
    <main>
      {outlet}
    </main>
    <Footer />
    </>
  );
}

export default App;
