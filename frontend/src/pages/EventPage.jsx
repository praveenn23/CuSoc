import { useState, useEffect, useCallback } from 'react';
import { Ticket, AlertCircle, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import EventDetails from '../components/EventDetails';
import SeatCounter from '../components/SeatCounter';
import Speakers from '../components/Speakers';
// import Partners from '../components/Partners';
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

    // ── Reveal Animation Logic ──────────────────────────────────────────────
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                }
            });
        }, { threshold: 0.1 });

        const sections = document.querySelectorAll('.reveal');
        sections.forEach(s => observer.observe(s));

        return () => sections.forEach(s => observer.unobserve(s));
    }, [loading]);

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
            <Navbar onRegister={() => setModalOpen(true)} hasSpeakers={Array.isArray(event.speakers) && event.speakers.length > 0} />

            {/* ── Event Details Section ── */}
            <main id="main">
                <div className="reveal">
                    <EventDetails
                        event={event}
                        bookedSeats={event.booked_seats}
                        totalSeats={event.total_seats}
                        onRegister={() => setModalOpen(true)}
                    />
                </div>

                {/* ── Speakers ── */}
                <div className="reveal">
                    <Speakers speakers={event.speakers} />
                </div>

                {/* ── Community Partners ── */}
                {/* <div className="reveal">
                    <Partners partners={event.partners} />
                </div> */}

                {/* ── Footer ── */}
                <footer className="site-footer">
                    <div className="gdg-strip" />
                    <div className="container footer-inner">
                        <div className="footer-brand">
                            <span>{event.title} — Chandigarh University</span>
                        </div>
                        <p className="footer-copy">
                            © {new Date().getFullYear()} Chandigarh University. All rights reserved.
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
