import useGetMediaRecorder from '../../hooks/useGetMediaRecorder'
import './style.css'

const Settings = () => {
    const mediaRecorder = useGetMediaRecorder()
    
    const mrStatsGenerator = () => {
        if (mediaRecorder) {
            console.table(mediaRecorder.stream.getTracks()[0].getSettings())
            const stats = []
            stats.push({
                key: 'stream ID',
                value: mediaRecorder.stream.id
            })
            stats.push({
                key: 'stream active',
                value: mediaRecorder.stream.active ? 'true' : 'false'
            })
            for( let key in mediaRecorder ) {
                if( typeof mediaRecorder[key] === 'string' 
                    || typeof mediaRecorder[key] === 'number' 
                    || typeof mediaRecorder[key] === 'boolean' ) {
                    stats.push({
                        key: key,
                        value: mediaRecorder[key]
                    })
                }
            }
            return(stats)
        }
    }

    const mrStats = () => {
        const nodes = []
        if (mediaRecorder) {
            mrStatsGenerator().forEach((item) => {
                nodes.push(
                    <p key={item.key}>{item.key}: {item.value}</p>
                )
            })
        } else {
            nodes.push(
                <p key="loading">Loading MediaRecorder…</p>
            )
        }
        return nodes
    }

    return (
        <div className="settings">
            <h1>Settings</h1>
            <div className='media-recorder-stats'>
                <h2>MediaRecorder</h2>
                {mrStats()}
            </div>
        </div>
    )
}

export default Settings