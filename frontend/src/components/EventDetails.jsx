import { Calendar, Clock, MapPin } from 'lucide-react';
import SeatCounter from './SeatCounter';
import bannerImg from '../assets/Poster/Harsh.png';


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

// ── Hardcoded fallback data (used when DB fields are still empty) ─────────────
const FALLBACK_ABOUT = `Join us for an intensive, hands-on workshop focused on contributing to real-world applications through open-source development. This event is specially designed to bridge the gap between theoretical knowledge and practical implementation by guiding participants through live projects, collaborative workflows, and industry-standard tools.

This is not just a session — it's a practical roadmap for students and developers who aim to build strong open-source profiles and prepare for global programs like Google Summer of Code (GSoC) 2026.`;

const FALLBACK_SECTIONS = [
    {
        title: "What You'll Learn",
        column: 2,
        items: [
            'Understand the fundamentals of open-source ecosystems',
            'Learn how to find and evaluate beginner-friendly repositories',
            'Get hands-on experience with Git, GitHub workflows, and pull requests',
            'Understand issues, commits, branching strategies, and code reviews',
            'Contribute to live projects under expert mentorship',
            'Collaborate with like-minded developers in a structured environment',
            'Learn how to build a strong GitHub profile for internships & global programs',
        ],
    },
    {
        title: 'Who Should Attend?',
        column: 1,
        items: [
            '1st, 2nd, 3rd year B.Tech / B.E students',
            'Developers interested in open-source',
            'Anyone aiming for GSoC 2026',
            'Students who want real-world coding exposure',
        ],
    },
    {
        title: 'GSoC 2026 Insights',
        column: 3,
        items: [
            'Google Summer of Code is a prestigious global program by Google.',
            'Indian students receive approximate stipends of $3,000 – $6,000 USD (based on project size).',
            'Selected contributors receive an official GSoC certificate from Google.',
            'Experience equivalent to a high-quality international internship.',
            'Networking with international mentors and global recognition.',
        ],
    },
    {
        title: 'Key Outcomes',
        column: 3,
        items: [
            'A clear understanding of open-source contribution processes',
            'Practical experience working on production-level code',
            'Improved collaboration and version control skills',
            'A stronger developer profile with real contributions',
            'A roadmap for preparing for GSoC 2026',
        ],
    },
];

// ── Column assignment ─────────────────────────────────────────────────────────
// Sections with an explicit `column` field (1/2/3) go there.
// The rest are spread greedily: each new section goes into whichever column
// currently has the fewest items, keeping the layout visually balanced.
function assignColumns(sections) {
    const cols = [[], [], []];
    const heights = [0, 0, 0]; // track total item count per column

    sections.forEach((sec) => {
        const explicit = sec.column ? sec.column - 1 : null; // 1-based → 0-based
        const target = (explicit !== null && explicit >= 0 && explicit <= 2)
            ? explicit
            : heights.indexOf(Math.min(...heights)); // shortest column
        cols[target].push(sec);
        heights[target] += (sec.items?.length ?? 1);
    });

    return cols;
}

// ── Renders the body of a content section based on its type ──────────────────
function SectionContent({ sec }) {
    if ((sec.type ?? 'bullets') === 'paragraph') {
        return sec.text ? <p className="feature-desc">{sec.text}</p> : null;
    }
    // Default: bullets
    const items = sec.items?.filter(Boolean) ?? [];
    if (!items.length) return null;
    return (
        <ul className="feature-list">
            {items.map((it, j) => <li key={j}>{it}</li>)}
        </ul>
    );
}

export default function EventDetails({ event, bookedSeats, totalSeats, onRegister }) {
    const { title, date, venue, time } = event;

    // Use structured DB fields if available, else fall back to hardcoded values
    const aboutText = event.about_text || FALLBACK_ABOUT;
    const rawSections = Array.isArray(event.event_sections) && event.event_sections.length > 0
        ? event.event_sections
        : FALLBACK_SECTIONS;

    const columns = assignColumns(rawSections);

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
                            <SeatCounter bookedSeats={bookedSeats} totalSeats={totalSeats} onRegister={onRegister} />
                        </div>
                    </div>

                    {/* ── Right: Banner ── */}
                    <div className="event-banner-col">
                        <div className="event-banner-card">
                            <img src={bannerImg} alt="Event Poster" className="event-poster-image" />
                        </div>
                    </div>
                </div>

                {/* ── Dynamic Content Grid ── */}
                {(() => {
                    // Only render column divs that actually have content
                    const col1 = columns[0]; // always has "About the Event" baked in
                    const col2 = columns[1];
                    const col3 = columns[2];

                    // Count how many of col2 / col3 are non-empty to decide grid width
                    const activeCols = 1
                        + (col2.length > 0 ? 1 : 0)
                        + (col3.length > 0 ? 1 : 0);

                    return (
                        <div
                            className="event-features-grid"
                            style={{
                                '--fcols': activeCols,
                                maxWidth: activeCols === 1 ? 560 : undefined,
                                margin: activeCols < 3 ? '80px auto 0' : undefined,
                            }}
                        >
                            {/* Column 1: always visible — About the Event + any col-1 sections */}
                            <div className="feature-column">
                                <div className="feature-card glass-card">
                                    <h3 className="feature-title">About the Event</h3>
                                    <p className="feature-desc">{aboutText}</p>
                                </div>
                                {col1.map((sec, i) => (
                                    <div key={i} className="feature-card glass-card" style={{ marginTop: 0 }}>
                                        <h3 className="feature-title">{sec.title}</h3>
                                        <SectionContent sec={sec} />
                                    </div>
                                ))}
                            </div>

                            {/* Column 2: only render when non-empty */}
                            {col2.length > 0 && (
                                <div className="feature-column">
                                    {col2.map((sec, i) => (
                                        <div key={i} className="feature-card glass-card">
                                            <h3 className="feature-title">{sec.title}</h3>
                                            <SectionContent sec={sec} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Column 3: only render when non-empty */}
                            {col3.length > 0 && (
                                <div className="feature-column">
                                    {col3.map((sec, i) => (
                                        <div key={i} className="feature-card glass-card">
                                            <h3 className="feature-title">{sec.title}</h3>
                                            <SectionContent sec={sec} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })()}
            </div>
        </section>
    );
}
