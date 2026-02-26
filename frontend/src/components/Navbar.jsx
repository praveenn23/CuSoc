import cuLogo from '../assets/logos/CU Logo.png';
import oaaLogo from '../assets/logos/LOGO OAA Black.png';
import './Navbar.css';

export default function Navbar() {
    return (
        <header className="navbar" id="top">
            <div className="gdg-strip" />
            <div className="navbar-inner container">
                <div className="navbar-brand">
                    <img src={cuLogo} alt="Chandigarh University" className="nav-logo" />
                    <img src={oaaLogo} alt="LOGO OAA" className="nav-logo" />
                </div>

                <nav className="navbar-links" aria-label="Page navigation">
                    <a href="#about">About</a>
                    <a href="#speakers">Speakers</a>
                    <a href="#register">Register</a>
                </nav>
            </div>
        </header>
    );
}
