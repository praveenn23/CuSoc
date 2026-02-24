import './Navbar.css';

export default function Navbar() {
    return (
        <header className="navbar" id="top">
            <div className="gdg-strip" />
            <div className="navbar-inner container">
                <div className="navbar-brand">
                    <div className="navbar-logo" aria-label="CuSOC">
                        <span style={{ color: '#ea4335' }}>C</span>
                        <span style={{ color: '#fbbc04' }}>u</span>
                        <span style={{ color: '#34a853' }}>S</span>
                        <span style={{ color: '#ea4335' }}>O</span>
                        <span style={{ color: '#fbbc04' }}>C</span>
                    </div>
                    <div className="navbar-brand-text">
                        <span className="navbar-title">CuSOC</span>
                        <span className="navbar-subtitle">Chandigarh University</span>
                    </div>
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
