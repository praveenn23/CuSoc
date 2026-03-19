import { useState, useRef } from 'react';
import { User, Phone, BookOpen, ArrowRight, ChevronDown, Award, Star, Upload, Trophy, Shield } from 'lucide-react';
import { registerUser } from '../services/api';
import { supabase } from '../supabaseClient';
import './RegistrationForm.css';

const CLUSTERS = [
    'Engineering',
    'Management',
    'Liberal Arts and Humanities',
    'Science'
];

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
    const [form, setForm] = useState({
        name: '', phone: '', cluster: '', department: '',
        achievement_level: '', rank: '', competition_name: '', awards_prize: ''
    });
    const [proof1, setProof1] = useState(null);
    const [proof2, setProof2] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
        setGlobalError('');
    };

    const handleFileChange = (e, setFile, fieldName) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setErrors((prev) => ({ ...prev, [fieldName]: '' }));
        } else {
            setFile(null);
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'Full name is required';
        else if (form.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';

        const phoneDigits = form.phone.replace(/\D/g, '');
        if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
        else if (phoneDigits.length < 10) newErrors.phone = 'Enter a valid 10-digit phone number';

        if (!form.cluster) newErrors.cluster = 'Please select your cluster';
        if (!form.department) newErrors.department = 'Please select your department';
        if (!form.achievement_level.trim()) newErrors.achievement_level = 'Achievement Level is required';
        if (!form.rank.trim()) newErrors.rank = 'Rank is required';
        if (!form.competition_name.trim()) newErrors.competition_name = 'Competition / Award Name is required';
        if (!form.awards_prize.trim()) newErrors.awards_prize = 'Awards / Prize is required';

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
            let proof_1_url = '';
            let proof_2_url = '';

            // Upload Proof 1 if provided
            if (proof1) {
                const fileExt = proof1.name.split('.').pop();
                const fileName = `proof1_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error: uploadError1 } = await supabase.storage.from('proofs').upload(fileName, proof1);
                if (uploadError1) throw new Error('Failed to upload Proof 1: ' + uploadError1.message);
                const { data } = supabase.storage.from('proofs').getPublicUrl(fileName);
                proof_1_url = data.publicUrl;
            }

            // Upload Proof 2 if provided
            if (proof2) {
                const fileExt = proof2.name.split('.').pop();
                const fileName = `proof2_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error: uploadError2 } = await supabase.storage.from('proofs').upload(fileName, proof2);
                if (uploadError2) throw new Error('Failed to upload Proof 2: ' + uploadError2.message);
                const { data } = supabase.storage.from('proofs').getPublicUrl(fileName);
                proof_2_url = data.publicUrl;
            }

            await registerUser({
                name: form.name.trim(),
                email,
                phone: form.phone.replace(/\D/g, ''),
                cluster: form.cluster,
                department: form.department,
                achievement_level: form.achievement_level.trim(),
                rank: form.rank.trim(),
                competition_name: form.competition_name.trim(),
                awards_prize: form.awards_prize.trim(),
                proof_1_url,
                proof_2_url,
                otp,
            });
            onSuccess();
        } catch (err) {
            setGlobalError(err.response?.data?.error || err.message || 'Registration failed. Please try again.');
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

                {/* Cluster Dropdown */}
                <div className="form-group">
                    <label className="form-label" htmlFor="reg-cluster">
                        <Award size={14} /> Cluster <span className="required-star">*</span>
                    </label>
                    <div className="reg-select-wrap">
                        <select
                            id="reg-cluster"
                            name="cluster"
                            className={`form-input reg-select ${errors.cluster ? 'error' : ''} ${form.cluster ? 'selected' : ''}`}
                            value={form.cluster}
                            onChange={handleChange}
                        >
                            <option value="" disabled>— Select your cluster —</option>
                            {CLUSTERS.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="reg-select-chevron" />
                    </div>
                    {errors.cluster && <span className="form-error">⚠ {errors.cluster}</span>}
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

                {/* Achievement Level */}
                <div className="form-group">
                    <label className="form-label" htmlFor="reg-achievement">
                        <Star size={14} /> Achievement Level <span className="required-star">*</span>
                    </label>
                    <input
                        id="reg-achievement"
                        type="text"
                        name="achievement_level"
                        className={`form-input ${errors.achievement_level ? 'error' : ''}`}
                        placeholder="e.g. National, International, State"
                        value={form.achievement_level}
                        onChange={handleChange}
                    />
                    {errors.achievement_level && <span className="form-error">⚠ {errors.achievement_level}</span>}
                </div>

                {/* Rank */}
                <div className="form-group">
                    <label className="form-label" htmlFor="reg-rank">
                        <Trophy size={14} /> Rank <span className="required-star">*</span>
                    </label>
                    <input
                        id="reg-rank"
                        type="text"
                        name="rank"
                        className={`form-input ${errors.rank ? 'error' : ''}`}
                        placeholder="e.g. 1st, 2nd, Runner-up"
                        value={form.rank}
                        onChange={handleChange}
                    />
                    {errors.rank && <span className="form-error">⚠ {errors.rank}</span>}
                </div>

                {/* Competition Name */}
                <div className="form-group">
                    <label className="form-label" htmlFor="reg-competition">
                        <Shield size={14} /> Competition / Award Name <span className="required-star">*</span>
                    </label>
                    <input
                        id="reg-competition"
                        type="text"
                        name="competition_name"
                        className={`form-input ${errors.competition_name ? 'error' : ''}`}
                        placeholder="e.g. SIH 2024, Best Coder"
                        value={form.competition_name}
                        onChange={handleChange}
                    />
                    {errors.competition_name && <span className="form-error">⚠ {errors.competition_name}</span>}
                </div>

                {/* Awards / Prize */}
                <div className="form-group">
                    <label className="form-label" htmlFor="reg-awards">
                        <Award size={14} /> Awards / Prize <span className="required-star">*</span>
                    </label>
                    <input
                        id="reg-awards"
                        type="text"
                        name="awards_prize"
                        className={`form-input ${errors.awards_prize ? 'error' : ''}`}
                        placeholder="e.g. $10,000, Gold Medal"
                        value={form.awards_prize}
                        onChange={handleChange}
                    />
                    {errors.awards_prize && <span className="form-error">⚠ {errors.awards_prize}</span>}
                </div>

                {/* Proof 1 */}
                <div className="form-group">
                    <label className="form-label" htmlFor="reg-proof1">
                        <Upload size={14} /> Proof 1 (Upload PDF) <span className="optional-text">(Optional)</span>
                    </label>
                    <input
                        id="reg-proof1"
                        type="file"
                        accept="application/pdf"
                        className="form-input file-input"
                        onChange={(e) => handleFileChange(e, setProof1, 'proof1')}
                    />
                </div>

                {/* Proof 2 */}
                <div className="form-group">
                    <label className="form-label" htmlFor="reg-proof2">
                        <Upload size={14} /> Proof 2 (Upload JPEG) <span className="optional-text">(Optional)</span>
                    </label>
                    <input
                        id="reg-proof2"
                        type="file"
                        accept="image/jpeg, image/jpg"
                        className="form-input file-input"
                        onChange={(e) => handleFileChange(e, setProof2, 'proof2')}
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

