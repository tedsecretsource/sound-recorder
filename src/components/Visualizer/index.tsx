import { useEffect, useRef } from 'react';
import './style.css'

interface VisualizerProps {
    stream: MediaStream, 
    barColor: Array<number>
}

const Visualizer = (props: VisualizerProps) => {
    const {stream, barColor} = props
    const canvasRef = useRef(null)
    const requestIdRef = useRef(null);
    let analyser: AnalyserNode, dataArray: Uint8Array, bufferLength: number, previousTimeStamp: number
    
    useEffect(() => {
        visualize(stream)
        requestIdRef.current = requestAnimationFrame(tick)
        return () => {
            cancelAnimationFrame(requestIdRef.current)
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const tick = (timestamp: number) => {
        if (!canvasRef.current) return
        draw(timestamp, canvasRef.current)
        requestIdRef.current = requestAnimationFrame(tick);
    };
    
    /**
     * Renders a visual that shows the microphone is receiving input
     * 
     * This code is particularly complex because you have to know all about
     * audioContext _and_ animation (the canvas element) in order to get it
     * to work. I know almost nothing about both.
     * 
     * @param {*} stream 
     */
    const visualize = (stream: MediaStream) => {
        let audioCtx: AudioContext
        if( ! audioCtx ) {
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
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
    const draw = (timestamp: number, canvas: HTMLCanvasElement) => {
        if( previousTimeStamp !== timestamp ) {
            const canvasCtx = canvas.getContext("2d");
            const WIDTH = canvas.width
            const HEIGHT = canvas.height
        
            // https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteTimeDomainData
            analyser.getByteTimeDomainData(dataArray);
    
            let barWidth: number = (WIDTH / bufferLength)
            let barHeight: number
            let x = 0
            
            canvasCtx.clearRect(0, 0, WIDTH, HEIGHT)
            
            for(let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i]
                canvasCtx.fillStyle = `rgb(${barColor[0]}, ${barColor[1]}, ${barColor[2]})`
                canvasCtx.fillRect(x, HEIGHT, barWidth, 0-barHeight/2)
    
                x += barWidth + 1
            }
            previousTimeStamp = timestamp
        }
    }

      
    
    return (
        <>
            <canvas ref={canvasRef} className="visualizer"></canvas>
        </>
    );
    
}

export default Visualizer