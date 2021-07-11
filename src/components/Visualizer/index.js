import { useEffect, useRef } from 'react';
import styles from './style.css';
import PropTypes from 'prop-types';

const Visualizer = ({stream, isRecording, barColor = [0,0,0]}) => {
    const canvasRef = useRef()
    let canvas, audioCtx, canvasCtx
    let analyser, dataArray, bufferLength, previousTimeStamp
    
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
     * This code is particularly complex because you have to know all about
     * audioContext _and_ animation (the canvas element) in order to get it
     * to work. I know almost nothing about both.
     * 
     * @param {*} stream 
     */
    const visualize = (stream) => {
        if( ! audioCtx ) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        }
      
        const source = audioCtx.createMediaStreamSource(stream)
      
        analyser = audioCtx.createAnalyser()
        analyser.fftSize = 256
        bufferLength = analyser.frequencyBinCount
        dataArray = new Uint8Array(bufferLength)
      
        source.connect(analyser)

        /**
         * The following line would be required if we allow the user to, say,
         * set the gain on the input. The gain is essentially a filter that
         * is applied before being sent to the speakers.
         */
        // analyser.connect(audioCtx.destination);
      
        window.requestAnimationFrame(draw)
    }

    /**
     * Draws a frame of animation
     * 
     * We check the previousTimeStamp because if it is the same as the current
     * timestamp, we don't want to animate as the frame is of little value in
     * this context. We only animate the differences.
     * 
     * @param {float} timestamp 
     */
    const draw = (timestamp) => {
        if( previousTimeStamp !== timestamp ) {
            const WIDTH = canvas.width
            const HEIGHT = canvas.height
        
            // https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteTimeDomainData
            analyser.getByteTimeDomainData(dataArray);
    
            var barWidth = (WIDTH / bufferLength)
            var barHeight
            var x = 0
            
            canvasCtx.clearRect(0, 0, WIDTH, HEIGHT)
            
            for(var i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i]
                canvasCtx.fillStyle = `rgb(${barColor[0]}, ${barColor[1]}, ${barColor[2]})`
                canvasCtx.fillRect(x, HEIGHT, barWidth, 0-barHeight/2)
    
                x += barWidth + 1
            }
            previousTimeStamp = timestamp
        }

        window.requestAnimationFrame(draw)
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