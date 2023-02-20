import { Link } from 'react-router-dom'
import './style.css'

const Footer = () => {
    return (
        <footer>
            <p><Link to="terms-and-conditions">Terms & Conditions</Link></p>
            <p style={{justifySelf: "end"}}><a href="https://github.com/tedsecretsource/sound-recorder/blob/main/LICENSE.md" target="_blank" rel="noreferrer">License</a></p>
            <p style={{gridColumn: "1 / span 2"}}>© Copyright Secret Source Technology 2022</p>
        </footer>
    )
}

export default Footer