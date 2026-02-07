import { NavLink } from 'react-router-dom'
import './style.css'

const Footer = () => {
    return (
        <footer>
            <nav>
                <ul>
                    <li><NavLink to="/" title='Record' className={({ isActive }) => isActive ? `selected` : undefined}>🎙</NavLink></li>
                    <li><NavLink to="/recordings" title='Recordings' className={({ isActive }) => isActive ? `selected` : undefined}>🎧</NavLink></li>
                    <li><NavLink to="/settings" title='Settings' className={({ isActive }) => isActive ? `selected` : undefined}>⚙️</NavLink></li>
                    <li><NavLink to="/user" title='User Details'  className={({ isActive }) => isActive ? `selected` : undefined}>👤</NavLink></li>
                </ul>
            </nav>
        </footer>
    )
}

export default Footer