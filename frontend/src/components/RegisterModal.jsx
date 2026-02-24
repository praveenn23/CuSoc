import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import OTPVerification from './OTPVerification';
import RegistrationForm from './RegistrationForm';
import SuccessPage from './SuccessPage';
import './RegisterModal.css';

const STEPS = ['otp', 'form', 'success'];

export default function RegisterModal({ isOpen, onClose, eventTitle, isFull }) {
    const [step, setStep] = useState('otp');
    const [verifiedEmail, setVerifiedEmail] = useState('');
    const [verifiedOtp, setVerifiedOtp] = useState('');

    // Reset when modal re-opens
    useEffect(() => {
        if (isOpen) {
            setStep('otp');
            setVerifiedEmail('');
            setVerifiedOtp('');
        }
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleOTPVerified = (email, otp) => {
        setVerifiedEmail(email);
        setVerifiedOtp(otp);
        setStep('form');
    };

    const handleRegistrationSuccess = () => {
        setStep('success');
    };

    // Prevent backdrop click from bubbling
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const stepIndex = STEPS.indexOf(step);
    const stepLabel = ['Verify Email', 'Your Details', 'Confirmed!'];

    return (
        <div
            className="modal-overlay"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-label="Event Registration"
        >
            <div className="modal-box register-modal" id="register-modal">
                {/* ── Header ── */}
                <div className="modal-header">
                    <div className="modal-header-content">
                        <h2 className="modal-title">Register for Event</h2>
                        <p className="modal-subtitle">{eventTitle}</p>
                    </div>
                    {step !== 'success' && (
                        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal" id="btn-modal-close">
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* ── Step Indicator ── */}
                {step !== 'success' && (
                    <div className="modal-steps" aria-label="Registration steps">
                        {['Verify Email', 'Your Details'].map((label, i) => (
                            <div
                                key={i}
                                className={`modal-step ${i === stepIndex ? 'active' : ''} ${i < stepIndex ? 'done' : ''}`}
                            >
                                <div className="modal-step-dot">
                                    {i < stepIndex ? '✓' : i + 1}
                                </div>
                                <span className="modal-step-label">{label}</span>
                            </div>
                        ))}
                        <div className="modal-step-line" style={{ width: `${stepIndex * 100}%` }} />
                    </div>
                )}

                {/* ── Content ── */}
                <div className="modal-body">
                    {isFull && step !== 'success' ? (
                        <div className="modal-full-msg">
                            <div className="modal-full-icon">🚫</div>
                            <h3>Event is Full</h3>
                            <p>Sorry, all seats have been filled. Check back for future events.</p>
                            <button className="btn btn-secondary" onClick={onClose} id="btn-close-full">
                                Close
                            </button>
                        </div>
                    ) : step === 'otp' ? (
                        <OTPVerification onVerified={handleOTPVerified} />
                    ) : step === 'form' ? (
                        <RegistrationForm
                            email={verifiedEmail}
                            otp={verifiedOtp}
                            onSuccess={handleRegistrationSuccess}
                        />
                    ) : (
                        <SuccessPage email={verifiedEmail} eventTitle={eventTitle} onClose={onClose} />
                    )}
                </div>
            </div>
        </div>
    );
}
