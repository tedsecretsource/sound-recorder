import { useEffect, useRef } from 'react';
import styles from './style.css';
import PropTypes from 'prop-types';

const Visualizer = ({stream, isRecording}) => {
    const canvasRef = useRef()
    let canvas, audioCtx, canvasCtx
    
    useEffect(() => {
        // https://dmitripavlutin.com/react-useref-guide/
        canvasCtx = canvasRef.current.getContext("2d")
        canvas = canvasRef.current
        visualize(stream)
    }, [])

    const visualize = (stream, isRecording) => {
        if(!audioCtx) {
          audioCtx = new AudioContext();
        }
      
        const source = audioCtx.createMediaStreamSource(stream);
      
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
      
        source.connect(analyser);
        //analyser.connect(audioCtx.destination);
      
        draw()
      
        function draw() {
          const WIDTH = canvas.width
          const HEIGHT = canvas.height;
      
          requestAnimationFrame(draw);
      
          analyser.getByteTimeDomainData(dataArray);
      
          canvasCtx.fillStyle = 'rgb(200, 200, 200)';
          canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
      
          canvasCtx.lineWidth = 2;
          canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
      
          canvasCtx.beginPath();
      
          let sliceWidth = WIDTH * 1.0 / bufferLength;
          let x = 0;
      
      
          for(let i = 0; i < bufferLength; i++) {
      
            let v = dataArray[i] / 128.0;
            let y = v * HEIGHT/2;
      
            if(i === 0) {
              canvasCtx.moveTo(x, y);
            } else {
              canvasCtx.lineTo(x, y);
            }
      
            x += sliceWidth;
          }
      
          canvasCtx.lineTo(canvas.width, canvas.height/2);
          canvasCtx.stroke();
      
        }
      }

    //   window.onresize = function() {
    //     canvas.width = mainSection.offsetWidth;
    //   }
      
    //   window.onresize();
      
    
    return (
        <>
            <canvas ref={canvasRef} className="visualizer"></canvas>
        </>
    );
    
}

Visualizer.propTypes = {
    //stream: PropTypes.node
};

export default Visualizer