import { useState, useEffect, useCallback } from 'react';
import { Ticket, AlertCircle, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import EventDetails from '../components/EventDetails';
import SeatCounter from '../components/SeatCounter';
import Speakers from '../components/Speakers';
import Partners from '../components/Partners';
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

            // Structured description with clear headers for reliable parsing
            const detailedDescription = `Join us for an intensive, hands-on workshop focused on contributing to real-world applications through open-source development. This event is specially designed to bridge the gap between theoretical knowledge and practical implementation by guiding participants through live projects, collaborative workflows, and industry-standard tools.

This is not just a session — it’s a practical roadmap for students and developers who aim to build strong open-source profiles and prepare for global programs like Google Summer of Code (GSoC) 2026.

## What You'll Learn
Throughout the session, participants will:
Understand the fundamentals of open-source ecosystems
Learn how to find and evaluate beginner-friendly repositories
Get hands-on experience with Git, GitHub workflows, and pull requests
Understand issues, commits, branching strategies, and code reviews
Contribute to live projects under expert mentorship
Collaborate with like-minded developers in a structured environment
Learn how to build a strong GitHub profile for internships & global programs

## Who Should Attend?
1st, 2nd, 3rd year B.Tech / B.E students
Developers interested in open-source
Anyone aiming for GSoC 2026
Students who want real-world coding exposure

## GSoC 2026 Insights
Google Summer of Code is a prestigious global program by Google.
Indian students receive approximate stipends of $3,000 – $6,000 USD (based on project size).
Selected contributors receive an official GSoC certificate from Google.
Experience equivalent to a high-quality international internship.
Networking with international mentors and global recognition.

## Key Outcomes
A clear understanding of open-source contribution processes
Practical experience working on production-level code
Improved collaboration and version control skills
A stronger developer profile with real contributions
A roadmap for preparing for GSoC 2026`;

            setEvent({
                ...data.event,
                description: detailedDescription
            });
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
            <Navbar onRegister={() => setModalOpen(true)} />

            {/* ── Event Details Section ── */}
            <main id="main">
                <div className="reveal">
                    <EventDetails
                        event={event}
                        bookedSeats={event.booked_seats}
                        totalSeats={event.total_seats}
                    />
                </div>

                {/* ── Speakers ── */}
                <div className="reveal">
                    <Speakers />
                </div>

                {/* ── Community Partners ── */}
                <div className="reveal">
                    <Partners />
                </div>

                {/* ── Footer ── */}
                <footer className="site-footer">
                    <div className="gdg-strip" />
                    <div className="container footer-inner">
                        <div className="footer-brand">
                            <span>CuSOC: Chandigarh University Source of Code- An Open Source Awareness Session — Chandigarh University</span>
                        </div>
                        <p className="footer-copy">
                            © {new Date().getFullYear()}Chandigarh University. All rights reserved.
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
