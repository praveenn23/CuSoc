import { Calendar, Clock, MapPin, Users } from 'lucide-react';
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

export default function EventDetails({ event }) {
    const { title, description, date, venue, time } = event;

    return (
        <section className="event-details" id="about" aria-labelledby="event-title">
            <div className="container">
                <div className="event-details-grid">
                    {/* ── Left: Info ── */}
                    <div className="event-info">
                        <div className="chip chip-blue event-tag">
                            <span className="chip-dot" />
                            Upcoming Event
                        </div>

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

                        <div className="event-description">
                            <h2>About the Event</h2>
                            <p>{description}</p>
                        </div>
                    </div>

                    {/* ── Right: Banner ── */}
                    <div className="event-banner-col">
                        <div className="event-banner-card">
                            <div className="event-banner-gradient">
                                <div className="event-banner-cusoc">
                                    <span style={{ color: '#ea4335' }}>C</span>
                                    <span style={{ color: '#fbbc04' }}>u</span>
                                    <span style={{ color: '#34a853' }}>S</span>
                                    <span style={{ color: '#ea4335' }}>O</span>
                                    <span style={{ color: '#fbbc04' }}>C</span>
                                </div>
                                {/* <div className="event-banner-label">CuSOC</div> */}
                                <div className="event-banner-event-name">{title}</div>
                                <div className="event-banner-dots">
                                    <span />
                                    <span />
                                    <span />
                                    <span />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
