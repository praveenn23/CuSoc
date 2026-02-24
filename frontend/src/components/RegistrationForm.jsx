import { useState } from 'react';
import { User, Phone, BookOpen, ArrowRight } from 'lucide-react';
import { registerUser } from '../services/api';
import './RegistrationForm.css';

export default function RegistrationForm({ email, otp, onSuccess }) {
    const [form, setForm] = useState({ name: '', phone: '', course: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
        setGlobalError('');
    };

    const validate = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'Full name is required';
        else if (form.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';

        const phoneDigits = form.phone.replace(/\D/g, '');
        if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
        else if (phoneDigits.length < 10) newErrors.phone = 'Enter a valid 10-digit phone number';

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setGlobalError('');
        try {
            await registerUser({
                name: form.name.trim(),
                email,
                phone: form.phone.replace(/\D/g, ''),
                course: form.course.trim() || undefined,
                otp,
            });
            onSuccess();
        } catch (err) {
            setGlobalError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reg-form-section">
            <div className="reg-form-header">
                <div className="reg-email-badge">
                    ✅ Verified: <strong>{email}</strong>
                </div>
            </div>

            {globalError && (
                <div className="reg-global-error" role="alert">
                    ⚠ {globalError}
                </div>
            )}

            <form onSubmit={handleSubmit} className="reg-form" noValidate>
                {/* Full Name */}
                <div className="form-group">
                    <label className="form-label" htmlFor="reg-name">
                        <User size={14} /> Full Name <span className="required-star">*</span>
                    </label>
                    <input
                        id="reg-name"
                        type="text"
                        name="name"
                        className={`form-input ${errors.name ? 'error' : ''}`}
                        placeholder="e.g. Praveen Kumar"
                        value={form.name}
                        onChange={handleChange}
                        autoComplete="name"
                        autoFocus
                    />
                    {errors.name && <span className="form-error">⚠ {errors.name}</span>}
                </div>

                {/* Phone Number */}
                <div className="form-group">
                    <label className="form-label" htmlFor="reg-phone">
                        <Phone size={14} /> Phone Number <span className="required-star">*</span>
                    </label>
                    <input
                        id="reg-phone"
                        type="tel"
                        name="phone"
                        className={`form-input ${errors.phone ? 'error' : ''}`}
                        placeholder="10-digit mobile number"
                        value={form.phone}
                        onChange={handleChange}
                        autoComplete="tel"
                        maxLength={15}
                    />
                    {errors.phone && <span className="form-error">⚠ {errors.phone}</span>}
                </div>

                {/* Course / Year (optional) */}
                <div className="form-group">
                    <label className="form-label" htmlFor="reg-course">
                        <BookOpen size={14} /> Course / Year{' '}
                        <span className="required-star">*</span>
                    </label>
                    <input
                        id="reg-course"
                        type="text"
                        name="course"
                        className="form-input"
                        placeholder="e.g. B.Tech CSE, 3rd Year"
                        value={form.course}
                        onChange={handleChange}
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary btn-full btn-lg reg-submit-btn"
                    disabled={loading}
                    id="btn-register-submit"
                >
                    {loading
                        ? <><span className="spinner" /> Registering…</>
                        : <>Complete Registration <ArrowRight size={18} /></>
                    }
                </button>
            </form>
        </div>
    );
}
