import { useEffect, useRef } from 'react';
import './style.css'

interface VisualizerProps {
    stream: MediaStream, 
    barColor: Array<number>
}

const Visualizer = (props: VisualizerProps) => {
    const {stream, barColor} = props
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const requestIdRef = useRef<number | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const dataArrayRef = useRef<Uint8Array | null>(null)
    const bufferLengthRef = useRef<number>(0)
    const previousTimeStampRef = useRef<number>(0)
    
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
      
        analyserRef.current = audioCtx.createAnalyser()
        analyserRef.current.fftSize = 256
        bufferLengthRef.current = analyserRef.current.frequencyBinCount
        dataArrayRef.current = new Uint8Array(bufferLengthRef.current)

        source.connect(analyserRef.current)

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
        if( previousTimeStampRef.current !== timestamp && analyserRef.current && dataArrayRef.current ) {
            const canvasCtx = canvas.getContext("2d")
            if (!canvasCtx) return
            const WIDTH = canvas.width
            const HEIGHT = canvas.height
            const centerY = HEIGHT / 2

            // https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/getByteTimeDomainData
            analyserRef.current.getByteTimeDomainData(dataArrayRef.current)

            canvasCtx.clearRect(0, 0, WIDTH, HEIGHT)

            const sliceWidth = WIDTH / bufferLengthRef.current

            // Create gradient for the upper wave (fades upward)
            const upperGradient = canvasCtx.createLinearGradient(0, centerY, 0, 0)
            upperGradient.addColorStop(0, `rgba(${barColor[0]}, ${barColor[1]}, ${barColor[2]}, 0.8)`)
            upperGradient.addColorStop(1, `rgba(${barColor[0]}, ${barColor[1]}, ${barColor[2]}, 0)`)

            // Create gradient for the lower wave (fades downward)
            const lowerGradient = canvasCtx.createLinearGradient(0, centerY, 0, HEIGHT)
            lowerGradient.addColorStop(0, `rgba(${barColor[0]}, ${barColor[1]}, ${barColor[2]}, 0.8)`)
            lowerGradient.addColorStop(1, `rgba(${barColor[0]}, ${barColor[1]}, ${barColor[2]}, 0)`)

            // Build array of points for smooth curve
            const points: {x: number, y: number}[] = []
            for (let i = 0; i < bufferLengthRef.current; i++) {
                const x = i * sliceWidth
                // Normalize: 128 is silence (center), values range 0-255
                // Map to amplitude where 0 = center, positive = above, negative = below
                const amplitude = (dataArrayRef.current[i] - 128) / 128
                const y = centerY - (amplitude * centerY * 0.8) // 0.8 to leave some margin
                points.push({x, y})
            }

            // Draw upper filled wave (from center to wave, with gradient)
            canvasCtx.beginPath()
            canvasCtx.moveTo(0, centerY)

            // Draw smooth curve through points using quadratic bezier
            for (let i = 0; i < points.length - 1; i++) {
                const current = points[i]
                const next = points[i + 1]
                const midX = (current.x + next.x) / 2
                const midY = (current.y + next.y) / 2

                if (i === 0) {
                    canvasCtx.lineTo(current.x, current.y)
                }
                canvasCtx.quadraticCurveTo(current.x, current.y, midX, midY)
            }

            // Connect to last point and close path
            const lastPoint = points[points.length - 1]
            canvasCtx.lineTo(lastPoint.x, lastPoint.y)
            canvasCtx.lineTo(WIDTH, centerY)
            canvasCtx.closePath()
            canvasCtx.fillStyle = upperGradient
            canvasCtx.fill()

            // Draw lower mirrored wave (reflected below center)
            canvasCtx.beginPath()
            canvasCtx.moveTo(0, centerY)

            for (let i = 0; i < points.length - 1; i++) {
                const current = points[i]
                const next = points[i + 1]
                // Mirror the y position around centerY
                const mirroredY = centerY + (centerY - current.y)
                const nextMirroredY = centerY + (centerY - next.y)
                const midX = (current.x + next.x) / 2
                const midY = (mirroredY + nextMirroredY) / 2

                if (i === 0) {
                    canvasCtx.lineTo(current.x, mirroredY)
                }
                canvasCtx.quadraticCurveTo(current.x, mirroredY, midX, midY)
            }

            const lastMirroredY = centerY + (centerY - lastPoint.y)
            canvasCtx.lineTo(lastPoint.x, lastMirroredY)
            canvasCtx.lineTo(WIDTH, centerY)
            canvasCtx.closePath()
            canvasCtx.fillStyle = lowerGradient
            canvasCtx.fill()

            // Draw center line accent
            canvasCtx.beginPath()
            canvasCtx.moveTo(0, centerY)
            for (let i = 0; i < points.length - 1; i++) {
                const current = points[i]
                const next = points[i + 1]
                const midX = (current.x + next.x) / 2
                const midY = (current.y + next.y) / 2

                if (i === 0) {
                    canvasCtx.lineTo(current.x, current.y)
                }
                canvasCtx.quadraticCurveTo(current.x, current.y, midX, midY)
            }
            canvasCtx.lineTo(lastPoint.x, lastPoint.y)
            canvasCtx.strokeStyle = `rgba(${barColor[0]}, ${barColor[1]}, ${barColor[2]}, 1)`
            canvasCtx.lineWidth = 2
            canvasCtx.stroke()

            previousTimeStampRef.current = timestamp
        }
    }

      
    
    return (
        <>
            <canvas ref={canvasRef} className="visualizer"></canvas>
        </>
    );
    
}

export default Visualizer