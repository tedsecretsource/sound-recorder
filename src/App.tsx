import { Link, Outlet } from "react-router-dom"
import Footer from './components/Footer'
import './App.css';
import Logo from './components/Logo'
import useGetMediaRecorder from './hooks/useGetMediaRecorder'


function App() {
  return (
    <>
    <header>
      <h1 style={{marginTop: "0", marginBottom: "0"}}>
        <Link to="/" className='logo'>
          <Logo />
          Sound Recorder
        </Link>
      </h1>
    </header>
    <main>
      <Outlet />
    </main>
    <Footer />
    </>
  );
}

export default App;
