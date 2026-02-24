import { CheckCircle, Calendar, Mail } from 'lucide-react';
import './SuccessPage.css';

export default function SuccessPage({ email, eventTitle, onClose }) {
    return (
        <div className="success-page">
            <div className="success-confetti" aria-hidden="true">
                {['🎉', '🎊', '✨', '🎈', '🚀'].map((e, i) => (
                    <span key={i} className="confetti-piece" style={{ animationDelay: `${i * 0.1}s` }}>{e}</span>
                ))}
            </div>

            <div className="success-icon-wrap">
                <CheckCircle size={52} strokeWidth={1.5} />
            </div>

            <h2 className="success-title">You're Registered! 🎟️</h2>
            <p className="success-desc">
                Your registration for <strong>{eventTitle}</strong> is confirmed.
                We're excited to see you there!
            </p>

            <div className="success-details-card">
                <div className="success-detail-item">
                    <Mail size={18} />
                    <div>
                        <div className="success-detail-label">Confirmation sent to</div>
                        <div className="success-detail-value">{email}</div>
                    </div>
                </div>
                <div className="success-detail-item">
                    <Calendar size={18} />
                    <div>
                        <div className="success-detail-label">Save the date</div>
                        <div className="success-detail-value">Check your email for event details</div>
                    </div>
                </div>
            </div>

            <div className="success-tips">
                <h3>What's next?</h3>
                <ul>
                    <li>📧 Check your inbox for a confirmation email</li>
                    <li>📅 Add the event to your calendar</li>
                    <li>🔗 Share with your friends!</li>
                </ul>
            </div>

            <button
                className="btn btn-primary btn-full btn-lg"
                onClick={onClose}
                id="btn-success-close"
            >
                Done — See you there! 🎉
            </button>
        </div>
    );
}
