import './style.css'
import { Link } from 'react-router-dom'

const Footer = () => {
    return (
        <footer>
            <p>© Copyright Secret Source Technology 2022</p>
            <p><Link to="/terms_of_use">Terms of Use</Link></p>
            <p><a href="https://github.com/tedsecretsource/sound-recorder/blob/main/LICENSE.md" target="_blank" rel="noreferrer">License</a></p>
        </footer>
    )
}

export default Footer