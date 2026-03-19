import { Linkedin } from 'lucide-react';
import prathameshImg from '../assets/guest/PRat.jpg';
import rudrakshImg from '../assets/guest/Rudraks.jpg';
import jasjeetImg from '../assets/guest/Jasjeet.jpg';
import aruImg from '../assets/guest/Aru.jpg';
import './Speakers.css';

// ── Static fallback speaker data (used when DB has no speakers) ──────────────

// Map initials to local photos (for dynamic speakers that have matching initials)


export default function Speakers({ speakers }) {
    // Use dynamic speakers from DB if available and non-empty, else fall back to static data
    const data = Array.isArray(speakers) && speakers.length > 0 ? speakers : STATIC_SPEAKERS;

    // Compute ideal number of grid columns based on speaker count:
    // 1 → 1  (centred),  2 → 2,  3 → 3,  4 → 4,  5+ → 3 (wraps)
    const cols = data.length === 1 ? 1
        : data.length === 2 ? 2
            : data.length === 3 ? 3
                : data.length === 4 ? 4
                    : 3; // 5+ speakers wrap in a 3-col grid

    const gridStyle = {
        '--cols': cols,
        // For 1 or 2 speakers cap the max width so cards don't stretch absurdly wide
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
                        // For dynamic speakers: try to match a local photo by initials, else no img
                        const localAvatar = speaker.photo_url      // 1️⃣ admin-supplied URL
                            || speaker.avatar           // 2️⃣ bundled static photo (fallback speakers only)
                            || LOCAL_AVATAR_MAP[speaker.initials] // 3️⃣ local map by initials
                            || null;

                        return (
                            <article className="speaker-card card" key={speaker.id ?? idx}>
                                <div className="speaker-avatar" style={{ background: speaker.color || '#1a73e8' }}>
                                    {localAvatar
                                        ? <img src={localAvatar} alt={speaker.name} />
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
