import useInstallPrompt from '../../hooks/useInstallPrompt'
import './style.css'

const InstallBanner = () => {
    const { showBanner, install, dismiss } = useInstallPrompt()

    if (!showBanner) return null

    return (
        <div className="install-banner">
            <span>Install this app for a better experience</span>
            <div className="install-banner-actions">
                <button onClick={install}>Install</button>
                <button onClick={dismiss} className="install-banner-dismiss" aria-label="Dismiss install banner">×</button>
            </div>
        </div>
    )
}

export default InstallBanner
