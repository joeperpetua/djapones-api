import { Link } from "react-router-dom";
import logo from '../../res/logo-rec.png';
import './Nav.css';

function Nav() {
    return(
        <div className='Nav'>
            <ul>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/"><img src={logo} alt="Logo"/></Link></li>
                <li><Link to="/search">Search</Link></li>
            </ul>
        </div>
        
    );
}

export default Nav;