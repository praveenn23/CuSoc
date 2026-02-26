import gdgLogo from '../assets/partners/GDG.png';
import eventCrewLogo from '../assets/partners/EvenmtCrew.png';
import cSquareLogo from '../assets/partners/C_Square_Black_1-removebg-preview.png';
import './Partners.css';

// Community partner logos
const PARTNERS = [
    { id: 1, name: 'GDG', logo: gdgLogo },
    // { id: 2, name: 'Event Crew', logo: eventCrewLogo },
    { id: 3, name: 'C Square', logo: cSquareLogo },
];

export default function Partners() {
    // Duplicate for infinite scroll effect (increased for fewer items to ensure smooth loop)
    const tickerItems = [...PARTNERS, ...PARTNERS, ...PARTNERS, ...PARTNERS, ...PARTNERS, ...PARTNERS];

    return (
        <section className="partners-section section">
            <div className="container">
                <div className="section-header reveal">
                    {/* <div className="chip chip-blue" style={{ marginBottom: 12 }}>🤝 Networking</div> */}
                    <h2 className="section-title">Community Partners</h2>
                    <p className="section-subtitle">
                        Supported by leading tech organizations and innovation hubs
                    </p>
                </div>
            </div>

            <div className="partners-ticker">
                <div className="ticker-track">
                    {tickerItems.map((partner, idx) => (
                        <div className="ticker-item" key={`${partner.id}-${idx}`}>
                            <div className="partner-logo-box">
                                <img src={partner.logo} alt={partner.name} title={partner.name} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
