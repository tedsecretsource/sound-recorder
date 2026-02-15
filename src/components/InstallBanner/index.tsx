import useInstallPrompt from '../../hooks/useInstallPrompt'
import './style.css'

const InstallBanner = () => {
    const { isInstallable, promptInstall, dismiss } = useInstallPrompt()

    if (!isInstallable) return null

    return (
        <div className="install-banner">
            <span>Install this app for a better experience</span>
            <div className="install-banner-actions">
                <button onClick={promptInstall}>Install</button>
                <button onClick={dismiss} className="install-banner-dismiss" aria-label="Dismiss install banner">×</button>
            </div>
        </div>
    )
}

export default InstallBanner
