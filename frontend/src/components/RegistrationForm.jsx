import { useState } from 'react';
import { User, Phone, BookOpen, ArrowRight, ChevronDown } from 'lucide-react';
import { registerUser } from '../services/api';
import './RegistrationForm.css';

// ── All CU Departments ────────────────────────────────────────────────────────
const DEPARTMENTS = [
    { id: 1, name: 'CDOE' },
    { id: 2, name: 'Pro VC Academic Affairs' },
    { id: 3, name: 'Chemistry' },
    { id: 4, name: 'Mathematics' },
    { id: 5, name: 'Physics' },
    { id: 6, name: 'Bio-Technology' },
    { id: 7, name: 'Bio-Sciences' },
    { id: 8, name: 'Agriculture' },
    { id: 9, name: 'Computer Science & Engineering 2nd Year' },
    { id: 10, name: 'Computer Science & Engineering 3rd Year' },
    { id: 11, name: 'Computer Science & Engineering 4th Year' },
    { id: 12, name: 'Engineering Foundation 1st Year (Batch 5)' },
    { id: 13, name: 'Engineering Foundation 1st Year (Batch 2)' },
    { id: 14, name: 'Engineering Foundation 1st Year (Batch 3)' },
    { id: 15, name: 'Civil Engineering' },
    { id: 16, name: 'Automobile Engineering' },
    { id: 17, name: 'Electronics & Communication Engineering' },
    { id: 18, name: 'Electrical Engineering' },
    { id: 19, name: 'Biotechnology & Food Engineering' },
    { id: 20, name: 'Mechanical Engineering' },
    { id: 21, name: 'Petroleum Engineering' },
    { id: 22, name: 'Chemical Engineering' },
    { id: 23, name: 'Mechatronics Engineering' },
    { id: 24, name: 'Aerospace Engineering' },
    { id: 25, name: 'UIC — BCA' },
    { id: 26, name: 'UIC — MCA' },
    { id: 27, name: 'AIT — CSE' },
    { id: 28, name: 'Engineering Foundation 1st Year (Batch 1)' },
    { id: 29, name: 'Engineering Foundation 1st Year (Batch 4)' },
    { id: 30, name: 'UIPS' },
    { id: 31, name: 'Forensic Science & Toxicology' },
    { id: 32, name: 'Physiotherapy' },
    { id: 33, name: 'Medical Lab Technology' },
    { id: 34, name: 'Optometry' },
    { id: 35, name: 'Nursing' },
    { id: 36, name: 'Nutrition & Dietetics' },
    { id: 37, name: 'UITTR' },
    { id: 38, name: 'UIPES' },
    { id: 39, name: 'Interior Design' },
    { id: 40, name: 'Industrial Design' },
    { id: 41, name: 'Fine Arts' },
    { id: 42, name: 'Fashion & Design' },
    { id: 43, name: 'UILAH' },
    { id: 44, name: 'Architecture' },
    { id: 45, name: 'Animation, VFX & Gaming' },
    { id: 46, name: 'Psychology' },
    { id: 47, name: 'Film Studies' },
    { id: 48, name: 'UIMS' },
    { id: 49, name: 'TTM' },
    { id: 50, name: 'HHM' },
    { id: 51, name: 'Airlines' },
    { id: 52, name: 'BA-LLB' },
    { id: 53, name: 'BBA-LLB' },
    { id: 54, name: 'B.COM-LLB' },
    { id: 55, name: 'LLB-LLM' },
    { id: 56, name: 'Commerce' },
    { id: 57, name: 'BBA' },
    { id: 58, name: 'MBA' },
    { id: 59, name: 'AIT — MBA' },
    { id: 60, name: 'Global School of Finance & Accounting' },
    { id: 61, name: 'Economics' },
    { id: 62, name: 'DCPD' },
    { id: 63, name: 'AIT — CSE (AIML)' },
    { id: 64, name: 'ME — CSE' },
    { id: 65, name: 'English' },
    { id: 66, name: 'BBA APEX' },
    { id: 67, name: 'Animation, VFX & Gaming (UIFVA)' },
    { id: 69, name: 'DSW' },
];

export default function RegistrationForm({ email, otp, onSuccess }) {
    const [form, setForm] = useState({ name: '', phone: '', department: '' });
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

        if (!form.name.trim())
            newErrors.name = 'Full name is required';
        else if (form.name.trim().length < 2)
            newErrors.name = 'Name must be at least 2 characters';

        const phoneDigits = form.phone.replace(/\D/g, '');
        if (!form.phone.trim())
            newErrors.phone = 'Phone number is required';
        else if (phoneDigits.length < 10)
            newErrors.phone = 'Enter a valid 10-digit phone number';

        if (!form.department)
            newErrors.department = 'Please select your department';

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
                course: form.department,   // stored as "course" in the DB
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

                {/* Department Dropdown */}
                <div className="form-group">
                    <label className="form-label" htmlFor="reg-department">
                        <BookOpen size={14} /> Department <span className="required-star">*</span>
                    </label>
                    <div className="reg-select-wrap">
                        <select
                            id="reg-department"
                            name="department"
                            className={`form-input reg-select ${errors.department ? 'error' : ''} ${form.department ? 'selected' : ''}`}
                            value={form.department}
                            onChange={handleChange}
                        >
                            <option value="" disabled>— Select your department —</option>
                            {DEPARTMENTS.map((dept) => (
                                <option key={dept.id} value={dept.name}>
                                    {dept.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="reg-select-chevron" />
                    </div>
                    {errors.department && <span className="form-error">⚠ {errors.department}</span>}
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

