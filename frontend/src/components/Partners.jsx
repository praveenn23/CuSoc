import gdgLogo from '../assets/partners/GDG.png';
import cSquareLogo from '../assets/partners/C_Square_Black_1-removebg-preview.png';
import './Partners.css';

// ── Static fallback partner data ─────────────────────────────────────────────
const STATIC_PARTNERS = [
    { id: 1, name: 'GDG', logo: gdgLogo },
    { id: 3, name: 'C Square', logo: cSquareLogo },
];

export default function Partners({ partners }) {
    // Build display list: prefer dynamic DB data, but keep local logos where logo_url is empty
    const LOCAL_LOGO_MAP = { GDG: gdgLogo, 'C Square': cSquareLogo };

    const data = Array.isArray(partners) && partners.length > 0
        ? partners.map((p) => ({
            ...p,
            // If admin left logo_url blank, try to match a local logo by name
            logo: p.logo_url || LOCAL_LOGO_MAP[p.name] || null,
        }))
        : STATIC_PARTNERS;

    // Duplicate for infinite ticker scroll
    const tickerItems = [...data, ...data, ...data, ...data, ...data, ...data];

    return (
        <section className="partners-section section">
            <div className="container">
                <div className="section-header reveal">
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
                                {partner.logo
                                    ? <img src={partner.logo} alt={partner.name} title={partner.name} />
                                    : <span className="partner-name-text">{partner.name}</span>
                                }
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
