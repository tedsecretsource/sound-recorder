import { useEffect, useRef } from 'react';
import styles from './style.css';
import PropTypes from 'prop-types';

const Visualizer = ({stream, isRecording, barColor = [0,0,0]}) => {
    const canvasRef = useRef()
    let canvas, audioCtx, canvasCtx
    
    useEffect(() => {
        // https://dmitripavlutin.com/react-useref-guide/
        canvasCtx = canvasRef.current.getContext("2d")
        canvas = canvasRef.current
        window.onresize = function() {
            canvas.width = document.querySelector('body').offsetWidth
        }
        window.onresize();
        visualize(stream)
    }, [])

    /**
     * Renders a visual that shows the microphone is receiving input
     * 
     * I do not understand this code and have not read all of the documentation.
     * I find it odd that we have a recursive-ish function inside a function and
     * that analyser cannot be passed in via a parameter (only seems to work if
     * defined in the parent function).
     * 
     * This code is particularly complex because you have to know all about
     * audioContext _and_ animation (the canvas element) in order to get it
     * to work. I know almost nothing about both.
     * 
     * @param {*} stream 
     * @param {*} isRecording 
     */
    const visualize = (stream, isRecording) => {
        if(!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        }
      
        const source = audioCtx.createMediaStreamSource(stream);
      
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
      
        source.connect(analyser);
        // analyser.connect(audioCtx.destination);
      
        function draw () {
            const WIDTH = canvas.width
            const HEIGHT = canvas.height
    
            requestAnimationFrame(draw);
    
            analyser.getByteTimeDomainData(dataArray);
    
            canvasCtx.clearRect(0, 0, WIDTH, HEIGHT)
    
            var barWidth = (WIDTH / bufferLength)
            var barHeight
            var x = 0

            for(var i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i]
                canvasCtx.fillStyle = `rgb(${barColor[0]}, ${barColor[1]}, ${barColor[2]})`
                canvasCtx.fillRect(x, HEIGHT, barWidth, 0-barHeight/2)
    
                x += barWidth + 1
            }
        }

        draw(canvas, canvasCtx, analyser, bufferLength, dataArray)
    }

      
    
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