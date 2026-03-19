import { Linkedin } from 'lucide-react';
import './Speakers.css';

export default function Speakers({ speakers }) {
    const data = Array.isArray(speakers) && speakers.length > 0 ? speakers : [];

    // Hide the entire section until speakers are added via admin panel
    if (data.length === 0) return null;

    // Compute ideal number of grid columns based on speaker count:
    // 1 → 1  (centred),  2 → 2,  3 → 3,  4 → 4,  5+ → 3 (wraps)
    const cols = data.length === 1 ? 1
        : data.length === 2 ? 2
            : data.length === 3 ? 3
                : data.length === 4 ? 4
                    : 3; // 5+ speakers wrap in a 3-col grid

    const gridStyle = {
        '--cols': cols,
        maxWidth: cols <= 2 ? `${cols * 320}px` : undefined,
        margin: cols <= 3 ? '0 auto' : undefined,
    };

    return (
        <section className="speakers-section section" id="speakers" aria-labelledby="speakers-heading">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title" id="speakers-heading">Meet the Speakers</h2>
                    <p className="section-subtitle">
                        Learn from industry experts and Googlers who are shaping the future of technology
                    </p>
                </div>

                <div className="speakers-grid" style={gridStyle}>
                    {data.map((speaker, idx) => {
                        const hasPhoto = !!speaker.photo_url;
                        return (
                            <article className="speaker-card card" key={speaker.id ?? idx}>
                                <div className="speaker-avatar" style={{ background: speaker.color || '#1a73e8' }}>
                                    {hasPhoto
                                        ? <img src={speaker.photo_url} alt={speaker.name}
                                            onError={(e) => { e.target.style.display = 'none'; }} />
                                        : <span>{speaker.initials || speaker.name?.charAt(0)?.toUpperCase() || '?'}</span>
                                    }
                                </div>
                                <div className="speaker-info">
                                    <h3 className="speaker-name">{speaker.name}</h3>
                                    <p className="speaker-role">{speaker.role}</p>
                                    <p className="speaker-bio">{speaker.bio}</p>
                                    <div className="speaker-links">
                                        {speaker.linkedin && (
                                            <a href={speaker.linkedin} target="_blank" rel="noopener noreferrer"
                                                className="speaker-link" aria-label={`${speaker.name} on LinkedIn`}>
                                                <Linkedin size={16} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
