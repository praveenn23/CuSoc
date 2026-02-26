import { useState, useEffect, useCallback } from 'react';
import { Ticket, AlertCircle, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import EventDetails from '../components/EventDetails';
import SeatCounter from '../components/SeatCounter';
import Speakers from '../components/Speakers';
import RegisterModal from '../components/RegisterModal';
import { fetchEvent } from '../services/api';
import './EventPage.css';

export default function EventPage() {
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);

    const loadEvent = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await fetchEvent();
            setEvent(data.event);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load event. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadEvent(); }, [loadEvent]);

    const isFull = event ? event.booked_seats >= event.total_seats : false;
    const remaining = event ? Math.max(0, event.total_seats - event.booked_seats) : 0;

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <>
                <Navbar />
                <div className="page-state-center" role="status" aria-live="polite">
                    <div className="page-loading-animation">
                        <div className="spinner spinner-blue loading-spinner" />
                    </div>
                    <p className="page-state-text">Loading event details…</p>
                </div>
            </>
        );
    }

    // ── Error ────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <>
                <Navbar />
                <div className="page-state-center" role="alert">
                    <div className="page-error-icon">
                        <AlertCircle size={48} />
                    </div>
                    <h2 className="page-error-title">Something went wrong</h2>
                    <p className="page-state-text">{error}</p>
                    <button className="btn btn-primary" onClick={loadEvent} id="btn-retry">
                        <RefreshCw size={16} /> Try Again
                    </button>
                </div>
            </>
        );
    }

    if (!event) return null;

    return (
        <>
            <Navbar />

            {/* ── Event Details Section ── */}
            <main id="main">
                <EventDetails event={event} />

                {/* ── Seat + Register section ── */}
                <section className="register-section section" id="register" aria-label="Registration">
                    <div className="container">
                        <div className="register-grid">
                            {/* Seat Counter */}
                            <SeatCounter
                                totalSeats={event.total_seats}
                                bookedSeats={event.booked_seats}
                            />

                            {/* Register CTA */}
                            <div className="register-cta card">
                                <div className="cta-inner">
                                    <div className="cta-icon">
                                        <Ticket size={28} />
                                    </div>
                                    <div className="cta-content">
                                        <h2 className="cta-title">
                                            {isFull ? 'Event is Full' : 'Secure Your Spot'}
                                        </h2>
                                        <p className="cta-desc">
                                            {isFull
                                                ? 'Unfortunately all seats have been claimed. Stay tuned for future events!'
                                                : `Only ${remaining} seat${remaining !== 1 ? 's' : ''} remaining. Register now before it's too late!`
                                            }
                                        </p>
                                        <button
                                            className={`btn btn-lg cta-btn ${isFull ? 'btn-secondary' : 'btn-primary'}`}
                                            onClick={() => !isFull && setModalOpen(true)}
                                            disabled={isFull}
                                            id="btn-open-register"
                                            aria-label={isFull ? 'Event is full' : 'Open registration form'}
                                        >
                                            {isFull ? ' Event Full' : ' Register Now — It\'s Free!'}
                                        </button>
                                        {!isFull && (
                                            <p className="cta-note">
                                                University email required •
                                                Instant confirmation
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Speakers ── */}
                <Speakers />

                {/* ── Footer ── */}
                <footer className="site-footer">
                    <div className="gdg-strip" />
                    <div className="container footer-inner">
                        <div className="footer-brand">
                            <span>CuSOC: Chandigarh University Source of Code- An Open Source Awareness Session — Chandigarh University</span>
                        </div>
                        <p className="footer-copy">
                            © {new Date().getFullYear()} Praveen Kumar, Chandigarh University. All rights reserved.
                        </p>
                    </div>
                </footer>
            </main>

            {/* ── Registration Modal ── */}
            <RegisterModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    // Refresh seat count after modal closes
                    loadEvent();
                }}
                eventTitle={event.title}
                isFull={isFull}
            />
        </>
    );
}
