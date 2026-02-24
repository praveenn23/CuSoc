import { useState, useRef, useEffect } from 'react';
import { Mail, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';
import { sendOTP, verifyOTP } from '../services/api';
import './OTPVerification.css';

const ALLOWED_DOMAIN = import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || 'cu.edu.in';

export default function OTPVerification({ onVerified }) {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [step, setStep] = useState('email'); // 'email' | 'otp'
    const [loadingSend, setLoadingSend] = useState(false);
    const [loadingVerify, setLoadingVerify] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [countdown, setCountdown] = useState(0);

    const inputRefs = useRef([]);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    // ── Email submit ───────────────────────────────────────────────────────────
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) return setError('Please enter your email address');

        const domain = normalizedEmail.split('@')[1];
        if (!domain || domain !== ALLOWED_DOMAIN) {
            return setError(`Only @${ALLOWED_DOMAIN} email addresses are allowed`);
        }

        setLoadingSend(true);
        try {
            const { data } = await sendOTP(normalizedEmail);
            setSuccess(data.message || `OTP sent to ${normalizedEmail}`);
            setStep('otp');
            setCountdown(60);
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
        } finally {
            setLoadingSend(false);
        }
    };

    // ── OTP input handling ─────────────────────────────────────────────────────
    const handleOtpChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // only digits
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // single digit
        setOtp(newOtp);
        setError('');

        // Auto-advance
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 6) {
            setOtp(pasted.split(''));
            inputRefs.current[5]?.focus();
        }
        e.preventDefault();
    };

    // ── Verify OTP ─────────────────────────────────────────────────────────────
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        const otpString = otp.join('');
        if (otpString.length < 6) return setError('Please enter the complete 6-digit OTP');

        setLoadingVerify(true);
        try {
            await verifyOTP(email.trim().toLowerCase(), otpString);
            onVerified(email.trim().toLowerCase(), otpString);
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid or expired OTP');
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoadingVerify(false);
        }
    };

    // ── Resend OTP ─────────────────────────────────────────────────────────────
    const handleResend = async () => {
        if (countdown > 0) return;
        setError('');
        setSuccess('');
        setOtp(['', '', '', '', '', '']);
        setLoadingSend(true);
        try {
            const { data } = await sendOTP(email.trim().toLowerCase());
            setSuccess(data.message || 'New OTP sent!');
            setCountdown(60);
            inputRefs.current[0]?.focus();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to resend OTP');
        } finally {
            setLoadingSend(false);
        }
    };

    // ── Render: Email step ─────────────────────────────────────────────────────
    if (step === 'email') {
        return (
            <div className="otp-section">
                <div className="otp-icon-wrap">
                    <Mail size={28} />
                </div>
                <h3 className="otp-heading">Verify Your Email</h3>
                <p className="otp-desc">
                    Enter your university email (<strong>@{ALLOWED_DOMAIN}</strong>) to receive an OTP
                </p>

                <form onSubmit={handleSendOTP} className="otp-form" noValidate>
                    <div className="form-group">
                        <label className="form-label" htmlFor="otp-email">University Email</label>
                        <input
                            id="otp-email"
                            type="email"
                            className={`form-input ${error ? 'error' : ''}`}
                            placeholder={`example@${ALLOWED_DOMAIN}`}
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setError(''); }}
                            required
                            autoComplete="email"
                            autoFocus
                        />
                        {error && <span className="form-error">⚠ {error}</span>}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loadingSend}
                        id="btn-send-otp"
                    >
                        {loadingSend
                            ? <><span className="spinner" /> Sending OTP…</>
                            : <>Send OTP <ArrowRight size={16} /></>
                        }
                    </button>
                </form>
            </div>
        );
    }

    // ── Render: OTP step ───────────────────────────────────────────────────────
    return (
        <div className="otp-section">
            <div className="otp-icon-wrap otp-icon-green">
                <ShieldCheck size={28} />
            </div>
            <h3 className="otp-heading">Enter OTP</h3>
            <p className="otp-desc">
                We sent a 6-digit code to <strong>{email}</strong>
            </p>

            {success && <div className="otp-success-msg">✅ {success}</div>}

            <form onSubmit={handleVerifyOTP} className="otp-form" noValidate>
                <div className="otp-boxes" onPaste={handleOtpPaste} aria-label="OTP input">
                    {otp.map((digit, i) => (
                        <input
                            key={i}
                            ref={(el) => (inputRefs.current[i] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            className={`otp-box ${digit ? 'otp-box-filled' : ''} ${error ? 'otp-box-error' : ''}`}
                            value={digit}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            aria-label={`OTP digit ${i + 1}`}
                            id={`otp-digit-${i + 1}`}
                            autoComplete="one-time-code"
                        />
                    ))}
                </div>

                {error && <div className="form-error otp-error">⚠ {error}</div>}

                <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={loadingVerify || otp.join('').length < 6}
                    id="btn-verify-otp"
                >
                    {loadingVerify
                        ? <><span className="spinner" /> Verifying…</>
                        : <>Verify OTP <ShieldCheck size={16} /></>
                    }
                </button>

                <div className="otp-resend">
                    {countdown > 0 ? (
                        <span className="otp-resend-timer">Resend OTP in {countdown}s</span>
                    ) : (
                        <button
                            type="button"
                            className="otp-resend-btn"
                            onClick={handleResend}
                            disabled={loadingSend}
                            id="btn-resend-otp"
                        >
                            <RefreshCw size={14} />
                            {loadingSend ? 'Sending…' : 'Resend OTP'}
                        </button>
                    )}
                    <button
                        type="button"
                        className="otp-change-email"
                        onClick={() => { setStep('email'); setError(''); setOtp(['', '', '', '', '', '']); }}
                        id="btn-change-email"
                    >
                        Change email
                    </button>
                </div>
            </form>
        </div>
    );
}
