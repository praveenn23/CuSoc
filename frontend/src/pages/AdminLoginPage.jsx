import { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { adminLogin } from '../services/adminApi';
import './AdminLoginPage.css';

export default function AdminLoginPage({ onLogin }) {
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!password.trim()) return setError('Please enter the admin password');
        setLoading(true);
        setError('');
        try {
            const { data } = await adminLogin(password.trim());
            localStorage.setItem('admin_token', data.token);
            onLogin();
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid password. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-bg">
            {/* Top color strip */}
            <div className="gdg-strip" />

            <div className="admin-login-center">
                {/* Logo */}
                <div className="admin-login-logo">
                    <span style={{ color: '#ea4335' }}>C</span>
                    <span style={{ color: '#fbbc04' }}>u</span>
                    <span style={{ color: '#34a853' }}>S</span>
                    <span style={{ color: '#ea4335' }}>O</span>
                    <span style={{ color: '#fbbc04' }}>C</span>
                </div>

                <div className="admin-login-card card">
                    <div className="admin-login-header">
                        <div className="admin-login-icon">
                            <ShieldCheck size={28} />
                        </div>
                        <h1 className="admin-login-title">Admin Panel</h1>
                        <p className="admin-login-subtitle">Sign in to manage your event</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label className="form-label" htmlFor="admin-password">
                                Admin Password
                            </label>
                            <div className="admin-pw-wrap">
                                <Lock size={16} className="admin-pw-icon" />
                                <input
                                    id="admin-password"
                                    type={showPw ? 'text' : 'password'}
                                    className={`form-input admin-pw-input ${error ? 'error' : ''}`}
                                    placeholder="Enter admin password"
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                    autoFocus
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="admin-pw-toggle"
                                    onClick={() => setShowPw(!showPw)}
                                    aria-label={showPw ? 'Hide password' : 'Show password'}
                                >
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {error && <span className="form-error">⚠ {error}</span>}
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-full btn-lg"
                            disabled={loading}
                            id="btn-admin-login"
                        >
                            {loading
                                ? <><span className="spinner" /> Signing in…</>
                                : <><ShieldCheck size={18} /> Sign In</>
                            }
                        </button>
                    </form>

                    <p className="admin-login-back">
                        <a href="/" id="link-back-to-event">← Back to Event Page</a>
                    </p>
                </div>

                <p className="admin-login-footer">
                    © {new Date().getFullYear()} CuSOC — Chandigarh University
                </p>
            </div>
        </div>
    );
}
