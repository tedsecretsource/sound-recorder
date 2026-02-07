import { useMediaRecorder } from '../../App'
import { useAudioSettings } from '../../contexts/AudioSettingsContext'
import { useRecordingSession } from '../../contexts/RecordingSessionContext'
import {
    AudioQualityPreset,
    SAMPLE_RATE_OPTIONS,
    BITRATE_OPTIONS,
    formatQualityBadge,
    formatBitrate,
    formatSampleRate,
    estimateFileSizePerMinute
} from '../../types/AudioSettings'
import './style.css'

const Settings = () => {
    const { mediaRecorder, isInitializing, error } = useMediaRecorder()
    const { settings, setPreset, setSampleRate, setChannelCount, setBitrate } = useAudioSettings()
    const { state: recordingState } = useRecordingSession()

    const isDisabled = recordingState.isRecording

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
        if (isInitializing) {
            nodes.push(
                <p key="loading">Loading MediaRecorder…</p>
            )
        } else if (error) {
            nodes.push(
                <p key="error">Error: {error}</p>
            )
        } else if (mediaRecorder) {
            mrStatsGenerator()!.forEach((item) => {
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

    const presets: AudioQualityPreset[] = ['voice', 'music', 'hifi', 'custom']

    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPreset(e.target.value as AudioQualityPreset)
    }

    const handleSampleRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSampleRate(Number(e.target.value))
    }

    const handleChannelCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setChannelCount(Number(e.target.value) as 1 | 2)
    }

    const handleBitrateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setBitrate(Number(e.target.value))
    }

    return (
        <div className="settings">
            <h1>Settings</h1>

            <div className="audio-quality-settings">
                <h2>Audio Quality</h2>
                {isDisabled && (
                    <p className="settings-disabled-notice">
                        Settings cannot be changed while recording is in progress.
                    </p>
                )}

                <div className="setting-row">
                    <label htmlFor="preset-select">Quality Preset</label>
                    <select
                        id="preset-select"
                        value={settings.preset}
                        onChange={handlePresetChange}
                        disabled={isDisabled}
                    >
                        {presets.map(preset => (
                            <option key={preset} value={preset}>
                                {formatQualityBadge(preset)}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="file-size-estimate">
                    Estimated file size: {estimateFileSizePerMinute(settings.bitrate)}
                </div>

                <details className="advanced-settings">
                    <summary>Advanced Settings</summary>

                    <div className="setting-row">
                        <label htmlFor="sample-rate-select">Sample Rate</label>
                        <select
                            id="sample-rate-select"
                            value={settings.sampleRate}
                            onChange={handleSampleRateChange}
                            disabled={isDisabled}
                        >
                            {SAMPLE_RATE_OPTIONS.map(rate => (
                                <option key={rate} value={rate}>
                                    {formatSampleRate(rate)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="setting-row">
                        <label htmlFor="channel-count-select">Channels</label>
                        <select
                            id="channel-count-select"
                            value={settings.channelCount}
                            onChange={handleChannelCountChange}
                            disabled={isDisabled}
                        >
                            <option value={1}>Mono</option>
                            <option value={2}>Stereo</option>
                        </select>
                    </div>

                    <div className="setting-row">
                        <label htmlFor="bitrate-select">Bitrate</label>
                        <select
                            id="bitrate-select"
                            value={settings.bitrate}
                            onChange={handleBitrateChange}
                            disabled={isDisabled}
                        >
                            {BITRATE_OPTIONS.map(rate => (
                                <option key={rate} value={rate}>
                                    {formatBitrate(rate)}
                                </option>
                            ))}
                        </select>
                    </div>
                </details>
            </div>

            <div className='media-recorder-stats'>
                <h2>MediaRecorder</h2>
                {mrStats()}
            </div>
        </div>
    )
}

export default Settings
