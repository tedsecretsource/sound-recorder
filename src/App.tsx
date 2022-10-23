import RecorderProvider from './components/RecorderProvider'
import Footer from './components/Footer'
import './App.css';
// import useGetUserMedia from "./hooks/useGetUserMedia";

function App() {
  return (
    <>
    <header>
      <h1>Sound Recorder</h1>
    </header>
    <main>
      <RecorderProvider />
    </main>
    <Footer />
    </>
  );
}

export default App;
