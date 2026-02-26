import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import SeatCounter from './SeatCounter';
import bannerImg from '../assets/Poster/CUSOC.png';
import './EventDetails.css';

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function EventDetails({ event, bookedSeats, totalSeats }) {
    const { title, description, date, venue, time } = event;

    // ── Description Segment Parsing ──────────────────────────────────────────
    const parseDescription = (desc) => {
        if (!desc) return { intro: '', columns: [[], [], []] };

        // Split by markdown headers (## )
        const parts = desc.split(/\n##\s+/);
        const intro = parts[0].trim();

        const sections = parts.slice(1).map(part => {
            const lines = part.trim().split('\n');
            const title = lines[0].trim();
            const contentLines = lines.slice(1).filter(l => l.trim().length > 0);
            return { title, items: contentLines, raw: part };
        });

        // Group into 3 columns for horizontal balance
        const columns = [[], [], []];

        sections.forEach(sec => {
            const t = sec.title.toLowerCase();
            if (t.includes('attend')) {
                columns[0].push(sec);
            } else if (t.includes('learn')) {
                columns[1].push(sec);
            } else if (t.includes('gsoc') || t.includes('outcomes')) {
                columns[2].push(sec);
            } else {
                columns[0].push(sec); // Default
            }
        });

        return { intro, columns };
    };

    const { intro, columns } = parseDescription(description);

    return (
        <section className="event-details" id="about" aria-labelledby="event-title">
            <div className="container">
                <div className="event-details-grid">
                    {/* ── Left: Info ── */}
                    <div className="event-info">
                        <h1 className="event-title" id="event-title">{title}</h1>

                        <div className="event-meta">
                            <div className="meta-item">
                                <span className="meta-icon meta-icon-blue">
                                    <Calendar size={18} />
                                </span>
                                <div>
                                    <div className="meta-label">Date</div>
                                    <div className="meta-value">{formatDate(date)}</div>
                                </div>
                            </div>

                            <div className="meta-item">
                                <span className="meta-icon meta-icon-green">
                                    <Clock size={18} />
                                </span>
                                <div>
                                    <div className="meta-label">Time</div>
                                    <div className="meta-value">
                                        {time || formatTime(date)}
                                    </div>
                                </div>
                            </div>

                            <div className="meta-item">
                                <span className="meta-icon meta-icon-red">
                                    <MapPin size={18} />
                                </span>
                                <div>
                                    <div className="meta-label">Venue</div>
                                    <div className="meta-value">{venue}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: 40 }}>
                            <SeatCounter bookedSeats={bookedSeats} totalSeats={totalSeats} />
                        </div>
                    </div>

                    {/* ── Right: Banner ── */}
                    <div className="event-banner-col">
                        <div className="event-banner-card">
                            <img src={bannerImg} alt="Event Poster" className="event-poster-image" />
                        </div>
                    </div>
                </div>

                {/* ── Segmented Content: 3-Column Full Width Grid ── */}
                <div className="event-features-grid">
                    {/* Column 1: Overview */}
                    <div className="feature-column">
                        <div className="feature-card glass-card">
                            <h3 className="feature-title">About the Event</h3>
                            <p className="feature-desc">{intro}</p>
                        </div>
                        {columns[0].map((sec, i) => (
                            <div key={i} className="feature-card glass-card" style={{ marginTop: 20 }}>
                                <h3 className="feature-title">{sec.title}</h3>
                                {sec.items.length > 0 ? (
                                    <ul className="feature-list">
                                        {sec.items.map((it, j) => <li key={j}>{it}</li>)}
                                    </ul>
                                ) : (
                                    <p className="feature-desc">{sec.raw.split('\n').slice(1).join('\n')}</p>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Column 2: Workshop */}
                    <div className="feature-column">
                        {columns[1].map((sec, i) => (
                            <div key={i} className="feature-card glass-card">
                                <h3 className="feature-title">{sec.title}</h3>
                                <ul className="feature-list">
                                    {sec.items.map((it, j) => <li key={j}>{it}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Column 3: GSoC & Goals */}
                    <div className="feature-column">
                        {columns[2].map((sec, i) => (
                            <div key={i} className="feature-card glass-card" style={{ marginBottom: 20 }}>
                                <h3 className="feature-title">{sec.title}</h3>
                                {sec.items.length > 0 ? (
                                    <ul className="feature-list">
                                        {sec.items.map((it, j) => <li key={j}>{it}</li>)}
                                    </ul>
                                ) : (
                                    <p className="feature-desc">{sec.raw.split('\n').slice(1).join('\n')}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
