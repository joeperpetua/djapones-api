import { Link } from "react-router-dom";
import './Nav.css';

function Nav() {
    return(
        <div className='Nav'>
            <ul>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/search">Search</Link></li>
            </ul>
        </div>
        
    );
}

export default Nav;