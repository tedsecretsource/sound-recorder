import { useFreesoundAuth } from '../../contexts/FreesoundAuthContext'
import './style.css'

const User = () => {
    const { isAuthenticated, isLoading, user, error, login, logout } = useFreesoundAuth()

    return (
        <div className="user">
            <h1>User</h1>

            <div className="freesound-settings">
                <h2>Freesound Integration</h2>
                {isLoading ? (
                    <p>Loading...</p>
                ) : isAuthenticated ? (
                    <div className="freesound-connected">
                        <p className="freesound-user">
                            Connected as <strong>{user?.username}</strong>
                        </p>
                        {user && (
                            <p className="freesound-stats">
                                {user.num_sounds} sounds on Freesound
                            </p>
                        )}
                        <button
                            onClick={logout}
                            className="freesound-button freesound-disconnect"
                        >
                            Disconnect
                        </button>
                    </div>
                ) : (
                    <div className="freesound-disconnected">
                        <p>Connect to Freesound to sync your recordings.</p>
                        {error && (
                            <p className="freesound-error">{error}</p>
                        )}
                        <button
                            onClick={login}
                            className="freesound-button freesound-connect"
                        >
                            Connect to Freesound
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default User
