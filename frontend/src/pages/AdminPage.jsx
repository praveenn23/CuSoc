import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Users, Ticket, BarChart2, LogOut, Trash2, RefreshCw,
    Search, Edit3, Save, X, ChevronDown, ChevronUp, AlertTriangle,
    CheckCircle, Calendar, MapPin, Clock, AlignLeft, Hash, Mail, Download,
    ScanLine, UserCheck, UserPlus, Building2, Link, Palette, Database, PlusCircle,
} from 'lucide-react';
import {
    fetchAdminStats, fetchRegistrations, deleteRegistration,
    fetchAdminEvent, updateAdminEvent, sendTicketEmails, markAttendance,
    updateEvaluation, updateAward, sendTestTicket, addAwardee,
} from '../services/adminApi';
import './AdminPage.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
    return (
        <div className={`admin-stat-card card admin-stat-${color}`}>
            <div className="admin-stat-icon">{icon}</div>
            <div>
                <div className="admin-stat-value">{value}</div>
                <div className="admin-stat-label">{label}</div>
            </div>
        </div>
    );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function ConfirmModal({ name, email, onConfirm, onCancel, loading }) {
    return (
        <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true">
            <div className="modal-box admin-confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="admin-confirm-icon">
                    <AlertTriangle size={32} />
                </div>
                <h3>Delete Registration?</h3>
                <p>
                    You are about to remove <strong>{name}</strong> ({email}) from the event.
                    Their seat will be freed up. This cannot be undone.
                </p>
                <div className="admin-confirm-actions">
                    <button className="btn btn-secondary" onClick={onCancel} disabled={loading} id="btn-cancel-delete">
                        Cancel
                    </button>
                    <button className="btn btn-danger" onClick={onConfirm} disabled={loading} id="btn-confirm-delete">
                        {loading ? <><span className="spinner" /> Deleting…</> : <><Trash2 size={15} /> Delete</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Send Tickets Confirm Modal ─────────────────────────────────────────────
function SendTicketsModal({ totalCount, onConfirm, onCancel, loading }) {
    return (
        <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true">
            <div className="modal-box admin-confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="admin-confirm-icon" style={{ background: '#e8f0fe', color: '#1a73e8' }}>
                    <Mail size={32} />
                </div>
                <h3>Send Ticket Emails?</h3>
                <p>
                    This will send a <strong>formal ticket confirmation email</strong> to the selected pool of{' '}
                    <strong>{totalCount} approved participants</strong>.
                    Each email includes their unique ticket number, event venue, timings, and instructions.
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
                    ✅ The system will automatically skip participants who have already received a ticket. You can safely trigger this multiple times.
                </p>
                <div className="admin-confirm-actions">
                    <button className="btn btn-secondary" onClick={onCancel} disabled={loading} id="btn-cancel-send-tickets">
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={onConfirm}
                        disabled={loading}
                        id="btn-confirm-send-tickets"
                        style={{ background: '#1a73e8', borderColor: '#1a73e8' }}
                    >
                        {loading
                            ? <><span className="spinner" /> Sending…</>
                            : <><Mail size={15} /> Send {totalCount} Tickets</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── View Details Modal ──
function ViewDetailsModal({ registration, onCancel, onUpdateStatus, onUpdateCategoryStatus }) {
    if (!registration) return null;

    return (
        <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true" style={{ padding: '20px' }}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 750, width: '100%', maxHeight: 'calc(100vh - 40px)', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                {/* Header (sticky) */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
                    <h3 style={{ margin: 0, fontSize: 18, color: '#202124' }}>Registration Details</h3>
                    <button className="btn btn-secondary btn-sm" onClick={onCancel} style={{ padding: '6px', borderRadius: '50%' }}><X size={16} /></button>
                </div>

                {/* Scrollable Body */}
                <div style={{ padding: '24px', overflowY: 'auto' }}>
                    <div style={{ padding: '16px', background: '#f8f9fa', borderRadius: 12, marginBottom: 24, border: '1px solid #e8eaed' }}>
                        <div style={{ fontWeight: 600, fontSize: 18, color: '#202124' }}>{registration.name}</div>
                        <div style={{ color: '#5f6368', fontSize: 14, marginTop: 8, display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={13} /> {registration.email}</span> &bull;
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Hash size={13} /> {registration.uid}</span>
                        </div>
                        <div style={{ color: '#5f6368', fontSize: 14, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Building2 size={13} /> {registration.department} {registration.cluster ? `(${registration.cluster})` : ''}
                        </div>
                        <div style={{ color: '#5f6368', fontSize: 14, marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ fontWeight: 600 }}>Evaluation Mode:</div>
                            <span style={{ fontSize: 13, background: '#f1f3f4', padding: '4px 8px', borderRadius: 6, border: '1px solid #dadce0', color: '#5f6368' }}>Per-Category Enabled</span>
                        </div>
                    </div>

                    <h4 style={{ margin: '0 0 16px 0', paddingBottom: 8, fontSize: 16, color: '#202124', fontWeight: 600 }}>Applied Categories</h4>

                    {(!registration.categories || registration.categories.length === 0) ? (
                        <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: 8, textAlign: 'center', color: '#5f6368', border: '1px dashed #dadce0' }}>
                            No specific category data submitted.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {registration.categories.map((cat, i) => (
                                <div key={i} style={{ border: '1px solid #e8eaed', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                                    <div style={{ background: '#f1f3f4', padding: '12px 16px', fontWeight: 600, borderBottom: '1px solid #e8eaed', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#202124' }}>
                                        <span style={{ textTransform: 'capitalize' }}>{cat.type}</span>
                                        <select
                                            className={`admin-select-sm evaluation-select`}
                                            value={cat.status || registration.evaluation_status || 'Pending'}
                                            onChange={(e) => onUpdateCategoryStatus(registration.id, i, e.target.value)}
                                            style={{
                                                fontSize: '13px',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                border: '1px solid #dadce0',
                                                background: cat.status === 'Approved' ? '#e6f4ea' : cat.status === 'Rejected' ? '#fce8e6' : '#fff',
                                                color: cat.status === 'Approved' ? '#137333' : cat.status === 'Rejected' ? '#c5221f' : '#202124',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                outline: 'none'
                                            }}
                                        >
                                            <option value="Pending">🕒 Pending</option>
                                            <option value="Approved">✅ Approved</option>
                                            <option value="Rejected">❌ Rejected</option>
                                        </select>
                                    </div>
                                    <div style={{ padding: '20px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px 20px' }}>
                                        {Object.entries(cat.data || {}).map(([key, val]) => {
                                            // Format key nicely, e.g. "comp_name" -> "Comp Name"
                                            const niceKey = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                            const isUrl = typeof val === 'string' && val.startsWith('http');
                                            return (
                                                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    <span style={{ fontSize: 12, color: '#5f6368', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{niceKey}</span>
                                                    {isUrl ? (
                                                        <a href={val} target="_blank" rel="noopener noreferrer" style={{ color: '#1a73e8', textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 500, background: '#e8f0fe', padding: '8px 12px', borderRadius: 6, width: 'fit-content', border: '1px solid #d2e3fc' }}>
                                                            <Link size={14} /> View Document
                                                        </a>
                                                    ) : (
                                                        <span style={{ fontSize: 15, color: '#202124', wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                                                            {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : (val || '-')}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Add Awardee Modal ────────────────────────────────────────────────────────
const AWARDEE_CLUSTERS = ['Engineering', 'Management', 'Liberal Arts and Humanities', 'Science'];
const AWARDEE_DEPARTMENTS = [
    'Chemistry', 'Mathematics', 'Physics', 'Bio-Technology', 'Bio-Sciences', 'Agriculture',
    'Computer Science & Engineering 2nd Year', 'Computer Science & Engineering 3rd Year',
    'Computer Science & Engineering 4th Year', 'Engineering Foundation 1st Year (Batch 1)',
    'Engineering Foundation 1st Year (Batch 2)', 'Engineering Foundation 1st Year (Batch 3)',
    'Engineering Foundation 1st Year (Batch 4)', 'Engineering Foundation 1st Year (Batch 5)',
    'Civil Engineering', 'Automobile Engineering', 'Electronics & Communication Engineering',
    'Electrical Engineering', 'Biotechnology & Food Engineering', 'Mechanical Engineering',
    'Petroleum Engineering', 'Chemical Engineering', 'Mechatronics Engineering',
    'Aerospace Engineering', 'UIC — BCA', 'UIC — MCA', 'AIT — CSE', 'UIPS',
    'Forensic Science & Toxicology', 'Physiotherapy', 'Medical Lab Technology', 'Optometry',
    'Nursing', 'Nutrition & Dietetics', 'UITTR', 'UIPES', 'Interior Design', 'Industrial Design',
    'Fine Arts', 'Fashion & Design', 'UILAH', 'Architecture', 'Animation, VFX & Gaming',
    'Psychology', 'Film Studies', 'UIMS', 'TTM', 'HHM', 'Airlines', 'BA-LLB', 'BBA-LLB',
    'B.COM-LLB', 'LLB-LLM', 'Commerce', 'BBA', 'MBA', 'AIT — MBA',
    'Global School of Finance & Accounting', 'Economics', 'AIT — CSE (AIML)', 'ME — CSE',
    'English', 'BBA APEX', 'Animation, VFX & Gaming (UIFVA)',
];
const AWARDEE_CATEGORIES = [
    { id: 'research', label: 'Research/Grant Projects', emoji: '🔬' },
    { id: 'innovation', label: 'Global Professional Certification', emoji: '🎖️' },
    { id: 'entrepreneurship', label: 'Innovation & Entrepreneurship', emoji: '🚀' },
    { id: 'competitions', label: 'Competitions & Hackathons', emoji: '🏆' },
    { id: 'patents', label: 'Innovation & Patents', emoji: '📜' },
    { id: 'leadership', label: 'Leadership', emoji: '🎓' },
    { id: 'other', label: 'Other Govt Exams & Awards', emoji: '✨' },
];

const BLANK_CAT_DATA = {
    research: () => ({ project_type: '', research_name: '', level: '', fund_amount: '', org_name: '', mentored_by: false, faculty_name: '', faculty_ecode: '' }),
    innovation: () => ({ cert_title: '', description: '', mentored_by: false, faculty_name: '', faculty_ecode: '' }),
    entrepreneurship: () => ({ startup_name: '', reg_status: '', reg_number: '', trl_stage: '', mentored_by: false, faculty_name: '', faculty_ecode: '' }),
    competitions: () => ({ comp_name: '', level: '', rank: '', event_date: '', org_body: '', org_name: '', prize_money: '', participation_count: '', role: '', website: '', description: '', goodies_details: '', mentored_by: false, faculty_name: '', faculty_ecode: '' }),
    patents: () => ({ patent_title: '', app_number: '', status: 'Granted', grant_date: '', patent_office: '', applicant_role: '', mentored_by: false, faculty_name: '', faculty_ecode: '' }),
    leadership: () => ({ club_name: '', position: '', tenure: '2024-26', members_converted: '', awareness_sessions: '', achievements: '', mentored: false, mentored_team_name: '', mentored_comp_name: '', mentored_by: false, faculty_name: '', faculty_ecode: '' }),
    other: () => ({ category_type: '', award_name: '', society: '', mentored_by: false, faculty_name: '', faculty_ecode: '' }),
};

function AddAwardeeModal({ onClose, onAdded }) {
    const [step, setStep] = useState('basic'); // 'basic' | 'categories' | 'confirm'
    const [common, setCommon] = useState({ name: '', email: '', uid: '', cluster: '', department: '' });
    const [selectedCats, setSelectedCats] = useState([]);
    const [catData, setCatData] = useState({});
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');

    const setField = (field, val) => {
        setCommon(p => ({ ...p, [field]: val }));
        setErrors(p => ({ ...p, [field]: '' }));
    };

    const toggleCat = (id) => {
        setSelectedCats(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
        if (!catData[id]) setCatData(p => ({ ...p, [id]: BLANK_CAT_DATA[id]() }));
        setErrors(p => ({ ...p, selectedCats: '' }));
    };

    const setCatField = (catId, field, val) => {
        setCatData(p => ({ ...p, [catId]: { ...(p[catId] || {}), [field]: val } }));
    };

    const validateBasic = () => {
        const e = {};
        if (!common.name.trim()) e.name = 'Required';
        if (!common.email.trim()) e.email = 'Required';
        if (!common.uid.trim()) e.uid = 'Required';
        if (!common.cluster) e.cluster = 'Required';
        if (!common.department) e.department = 'Required';
        if (selectedCats.length === 0) e.selectedCats = 'Select at least one category';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        setSaveError('');
        setSaving(true);
        try {
            const categories = selectedCats.map(catId => ({
                type: catId,
                status: 'Approved',
                data: { ...(catData[catId] || {}) },
            }));
            const payload = {
                name: common.name.trim(),
                email: common.email.trim(),
                uid: common.uid.trim(),
                cluster: common.cluster,
                department: common.department,
                evaluation_status: 'Approved',
                categories,
            };
            const { data } = await addAwardee(payload);
            onAdded(data.registration, data.seatAction);
            onClose();
        } catch (err) {
            setSaveError(err.response?.data?.error || err.message || 'Failed to add awardee.');
        } finally {
            setSaving(false);
        }
    };

    const inputCls = (field) => `form-input${errors[field] ? ' error' : ''}`;
    const selCls = (field) => `form-input${errors[field] ? ' error' : ''}`;

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" style={{ padding: '20px', alignItems: 'flex-start', paddingTop: 40 }}>
            <div className="modal-box" onClick={e => e.stopPropagation()} style={{
                maxWidth: 680, width: '100%', maxHeight: 'calc(100vh - 80px)',
                display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden',
                borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.18)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px', background: 'linear-gradient(135deg, #1a73e8 0%, #0f52ba 100%)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 18, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <PlusCircle size={20} /> Add Awardee
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                            Manually add a participant — they will be pre-approved and appear in both All & Approved tabs.
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#fff' }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>

                    {/* ── Basic Info ── */}
                    <div style={{ marginBottom: 28 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#1a73e8', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ background: '#1a73e8', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>1</span>
                            Participant Info
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
                            <div className="form-group">
                                <label className="form-label">Full Name *</label>
                                <input className={inputCls('name')} value={common.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. Harshvardhan Rao" />
                                {errors.name && <span style={{ color: '#c5221f', fontSize: 12 }}>{errors.name}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email *</label>
                                <input className={inputCls('email')} type="email" value={common.email} onChange={e => setField('email', e.target.value)} placeholder="e.g. student@cuchd.in" />
                                {errors.email && <span style={{ color: '#c5221f', fontSize: 12 }}>{errors.email}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">UID / EID *</label>
                                <input className={inputCls('uid')} value={common.uid} onChange={e => setField('uid', e.target.value)} placeholder="e.g. 23BCE1234" />
                                {errors.uid && <span style={{ color: '#c5221f', fontSize: 12 }}>{errors.uid}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Cluster *</label>
                                <select className={selCls('cluster')} value={common.cluster} onChange={e => setField('cluster', e.target.value)}>
                                    <option value="">— Select Cluster —</option>
                                    {AWARDEE_CLUSTERS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                {errors.cluster && <span style={{ color: '#c5221f', fontSize: 12 }}>{errors.cluster}</span>}
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Department *</label>
                                <select className={selCls('department')} value={common.department} onChange={e => setField('department', e.target.value)}>
                                    <option value="">— Select Department —</option>
                                    {AWARDEE_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                {errors.department && <span style={{ color: '#c5221f', fontSize: 12 }}>{errors.department}</span>}
                            </div>
                        </div>
                    </div>

                    {/* ── Category Selection ── */}
                    <div style={{ marginBottom: 28 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#1a73e8', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ background: '#1a73e8', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>2</span>
                            Award Categories
                            {errors.selectedCats && <span style={{ color: '#c5221f', fontSize: 12, fontWeight: 400 }}>— {errors.selectedCats}</span>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                            {AWARDEE_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => toggleCat(cat.id)}
                                    style={{
                                        padding: '10px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                                        border: selectedCats.includes(cat.id) ? '2px solid #1a73e8' : '2px solid #e8eaed',
                                        background: selectedCats.includes(cat.id) ? '#e8f0fe' : '#fafafa',
                                        color: selectedCats.includes(cat.id) ? '#1a73e8' : '#3c4043',
                                        fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <span style={{ fontSize: 18 }}>{cat.emoji}</span>
                                    <span>{cat.label}</span>
                                    {selectedCats.includes(cat.id) && <CheckCircle size={14} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Per-Category Fields ── */}
                    {selectedCats.length > 0 && (
                        <div style={{ marginBottom: 28 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#1a73e8', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ background: '#1a73e8', color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>3</span>
                                Category Details
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {selectedCats.map(catId => {
                                    const cat = AWARDEE_CATEGORIES.find(c => c.id === catId);
                                    const d = catData[catId] || {};
                                    const upd = (f, v) => setCatField(catId, f, v);
                                    return (
                                        <div key={catId} style={{ border: '1.5px solid #e8eaed', borderRadius: 12, overflow: 'hidden' }}>
                                            <div style={{ background: '#f1f3f4', padding: '10px 16px', fontWeight: 700, fontSize: 14, color: '#202124', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #e8eaed' }}>
                                                <span>{cat?.emoji}</span> {cat?.label}
                                                <span style={{ marginLeft: 'auto', background: '#e6f4ea', color: '#137333', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>✅ Pre-Approved</span>
                                            </div>
                                            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                                                {/* Research */}
                                                {catId === 'research' && (<>
                                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                        <label className="form-label">Project Type *</label>
                                                        <select className="form-input" value={d.project_type || ''} onChange={e => upd('project_type', e.target.value)}>
                                                            <option value="">— Select —</option>
                                                            {['Project Funding','Paper Presentation Award','Research/Grant Project','Societal Impact Project','Ongoing Govt/DST/Industry Funded Project'].map(o => <option key={o} value={o}>{o}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Research Name *</label>
                                                        <input className="form-input" value={d.research_name || ''} onChange={e => upd('research_name', e.target.value)} placeholder="Title of research" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Level *</label>
                                                        <select className="form-input" value={d.level || ''} onChange={e => upd('level', e.target.value)}>
                                                            <option value="">— Select —</option>
                                                            {['National','International','College','State','Industry'].map(o => <option key={o} value={o}>{o}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Fund Amount (₹)</label>
                                                        <input className="form-input" type="number" value={d.fund_amount || ''} onChange={e => upd('fund_amount', e.target.value)} placeholder="0" min="0" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Organization Name *</label>
                                                        <input className="form-input" value={d.org_name || ''} onChange={e => upd('org_name', e.target.value)} placeholder="e.g. DST, IEEE" />
                                                    </div>
                                                </>)}
                                                {/* Innovation */}
                                                {catId === 'innovation' && (<>
                                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                        <label className="form-label">Certification Title *</label>
                                                        <input className="form-input" value={d.cert_title || ''} onChange={e => upd('cert_title', e.target.value)} placeholder="e.g. AWS Certified Solutions Architect" />
                                                    </div>
                                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                        <label className="form-label">Certification Description</label>
                                                        <textarea className="form-input" rows={3} value={d.description || ''} onChange={e => upd('description', e.target.value)} placeholder="Brief significance of this certification..." style={{ resize: 'vertical' }} />
                                                    </div>
                                                </>)}
                                                {/* Entrepreneurship */}
                                                {catId === 'entrepreneurship' && (<>
                                                    <div className="form-group">
                                                        <label className="form-label">Startup Name *</label>
                                                        <input className="form-input" value={d.startup_name || ''} onChange={e => upd('startup_name', e.target.value)} placeholder="Your startup name" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Registration Status</label>
                                                        <select className="form-input" value={d.reg_status || ''} onChange={e => upd('reg_status', e.target.value)}>
                                                            <option value="">— Select —</option>
                                                            {['Ongoing','LLP','Pvt Ltd','Under Process'].map(o => <option key={o} value={o}>{o}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Registration Number</label>
                                                        <input className="form-input" value={d.reg_number || ''} onChange={e => upd('reg_number', e.target.value)} placeholder="e.g. U72200PB2023PTC1234" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">TRL Stage</label>
                                                        <select className="form-input" value={d.trl_stage || ''} onChange={e => upd('trl_stage', e.target.value)}>
                                                            <option value="">— Select —</option>
                                                            {['4','5','6','7'].map(v => <option key={v} value={v}>TRL {v}</option>)}
                                                        </select>
                                                    </div>
                                                </>)}
                                                {/* Competitions */}
                                                {catId === 'competitions' && (<>
                                                    <div className="form-group">
                                                        <label className="form-label">Competition Name *</label>
                                                        <input className="form-input" value={d.comp_name || ''} onChange={e => upd('comp_name', e.target.value)} placeholder="e.g. Smart India Hackathon" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Level</label>
                                                        <select className="form-input" value={d.level || ''} onChange={e => upd('level', e.target.value)}>
                                                            <option value="">— Select —</option>
                                                            {['International','National','State'].map(o => <option key={o} value={o}>{o}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Rank / Position</label>
                                                        <input className="form-input" value={d.rank || ''} onChange={e => upd('rank', e.target.value)} placeholder="e.g. 1st, Runner Up" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Event Date</label>
                                                        <input className="form-input" type="date" value={d.event_date || ''} onChange={e => upd('event_date', e.target.value)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Organizing Body</label>
                                                        <select className="form-input" value={d.org_body || ''} onChange={e => upd('org_body', e.target.value)}>
                                                            <option value="">— Select —</option>
                                                            {['Government','Industry','State'].map(o => <option key={o} value={o}>{o}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Organization Name</label>
                                                        <input className="form-input" value={d.org_name || ''} onChange={e => upd('org_name', e.target.value)} placeholder="e.g. Ministry of Education" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Prize Money (₹)</label>
                                                        <input className="form-input" type="number" value={d.prize_money || ''} onChange={e => upd('prize_money', e.target.value)} placeholder="0" min="0" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Participation Count</label>
                                                        <input className="form-input" type="number" value={d.participation_count || ''} onChange={e => upd('participation_count', e.target.value)} placeholder="e.g. 150" min="1" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Role</label>
                                                        <select className="form-input" value={d.role || ''} onChange={e => upd('role', e.target.value)}>
                                                            <option value="">— Select —</option>
                                                            {['Team Leader','Member'].map(o => <option key={o} value={o}>{o}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Competition Website</label>
                                                        <input className="form-input" type="url" value={d.website || ''} onChange={e => upd('website', e.target.value)} placeholder="https://..." />
                                                    </div>
                                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                        <label className="form-label">Description</label>
                                                        <textarea className="form-input" rows={2} value={d.description || ''} onChange={e => upd('description', e.target.value)} placeholder="Brief description of your achievement..." style={{ resize: 'vertical' }} />
                                                    </div>
                                                </>)}
                                                {/* Patents */}
                                                {catId === 'patents' && (<>
                                                    <div className="form-group">
                                                        <label className="form-label">Patent Title *</label>
                                                        <input className="form-input" value={d.patent_title || ''} onChange={e => upd('patent_title', e.target.value)} placeholder="e.g. Smart Energy Grid System" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Application Number</label>
                                                        <input className="form-input" value={d.app_number || ''} onChange={e => upd('app_number', e.target.value)} placeholder="e.g. 202311012345" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Status</label>
                                                        <select className="form-input" value={d.status || 'Granted'} onChange={e => upd('status', e.target.value)}>
                                                            <option value="Granted">Granted</option>
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Grant Date</label>
                                                        <input className="form-input" type="date" value={d.grant_date || ''} onChange={e => upd('grant_date', e.target.value)} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Patent Office</label>
                                                        <select className="form-input" value={d.patent_office || ''} onChange={e => upd('patent_office', e.target.value)}>
                                                            <option value="">— Select —</option>
                                                            {['Indian','US','International'].map(o => <option key={o} value={o}>{o}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Applicant Role</label>
                                                        <select className="form-input" value={d.applicant_role || ''} onChange={e => upd('applicant_role', e.target.value)}>
                                                            <option value="">— Select —</option>
                                                            {['Sole','Co-applicant'].map(o => <option key={o} value={o}>{o}</option>)}
                                                        </select>
                                                    </div>
                                                </>)}
                                                {/* Leadership */}
                                                {catId === 'leadership' && (<>
                                                    <div className="form-group">
                                                        <label className="form-label">Club Name *</label>
                                                        <input className="form-input" value={d.club_name || ''} onChange={e => upd('club_name', e.target.value)} placeholder="e.g. ASTRONOMY CLUB" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Position</label>
                                                        <select className="form-input" value={d.position || ''} onChange={e => upd('position', e.target.value)}>
                                                            <option value="">— Select —</option>
                                                            {['Secretary','Jt. Secretary'].map(o => <option key={o} value={o}>{o}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Tenure</label>
                                                        <input className="form-input" value={d.tenure || '2024-26'} readOnly style={{ background: 'var(--bg)', cursor: 'not-allowed', color: 'var(--text-secondary)' }} />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Members Converted to Core</label>
                                                        <input className="form-input" type="number" value={d.members_converted || ''} onChange={e => upd('members_converted', e.target.value)} placeholder="0" min="0" />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">Awareness Sessions</label>
                                                        <input className="form-input" type="number" value={d.awareness_sessions || ''} onChange={e => upd('awareness_sessions', e.target.value)} placeholder="0" min="0" />
                                                    </div>
                                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                        <label className="form-label">Achievements During Tenure</label>
                                                        <input className="form-input" value={d.achievements || ''} onChange={e => upd('achievements', e.target.value)} placeholder="Key achievements..." />
                                                    </div>
                                                </>)}
                                                {/* Other */}
                                                {catId === 'other' && (<>
                                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                        <label className="form-label">Option Type *</label>
                                                        <select className="form-input" value={d.category_type || ''} onChange={e => upd('category_type', e.target.value)}>
                                                            <option value="">— Select —</option>
                                                            {['Government exam','Professional society award'].map(o => <option key={o} value={o}>{o}</option>)}
                                                        </select>
                                                    </div>
                                                    {d.category_type === 'Professional society award' && (
                                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                            <label className="form-label">Professional Society Name *</label>
                                                            <input className="form-input" value={d.society || ''} onChange={e => upd('society', e.target.value)} placeholder="e.g. ACM STUDENT CHAPTER" />
                                                        </div>
                                                    )}
                                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                        <label className="form-label">{d.category_type === 'Government exam' ? 'Name of Exam' : 'Name of Award'} *</label>
                                                        <input className="form-input" value={d.award_name || ''} onChange={e => upd('award_name', e.target.value)} placeholder={d.category_type === 'Government exam' ? 'e.g. GATE 2024' : 'e.g. Outstanding Student Award'} />
                                                    </div>
                                                </>)}
                                                {/* Mentored by Faculty (all categories) */}
                                                <div style={{ gridColumn: '1 / -1', borderTop: '1.5px dashed #e8eaed', paddingTop: 12 }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                                                        <input type="checkbox" checked={!!d.mentored_by} onChange={e => upd('mentored_by', e.target.checked)} />
                                                        Mentored by Faculty
                                                    </label>
                                                    {d.mentored_by && (
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px', marginTop: 10 }}>
                                                            <div className="form-group">
                                                                <label className="form-label">Faculty Name *</label>
                                                                <input className="form-input" value={d.faculty_name || ''} onChange={e => upd('faculty_name', e.target.value)} placeholder="e.g. Dr. Ankita Sharma" />
                                                            </div>
                                                            <div className="form-group">
                                                                <label className="form-label">Faculty E-Code *</label>
                                                                <input className="form-input" value={d.faculty_ecode || ''} onChange={e => upd('faculty_ecode', e.target.value)} placeholder="e.g. E12345" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Notice ── */}
                    <div style={{ background: '#e8f0fe', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                        <CheckCircle size={16} style={{ color: '#1a73e8', flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 13, color: '#1a73e8', fontWeight: 500 }}>
                            This awardee will be added with <strong>Approved</strong> status and will instantly show in both the <strong>All</strong> and <strong>Approved</strong> tabs. No file uploads are required for manually added awardees.
                        </span>
                    </div>

                    {saveError && (
                        <div className="admin-alert admin-alert-error" style={{ marginTop: 12 }}>
                            <AlertTriangle size={15} /> {saveError}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid #e8eaed', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
                    <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
                    <button
                        className="btn btn-primary"
                        style={{ background: '#1a73e8', borderColor: '#1a73e8', gap: 8 }}
                        disabled={saving}
                        onClick={() => { if (validateBasic()) handleSubmit(); }}
                        id="btn-confirm-add-awardee"
                    >
                        {saving ? <><span className="spinner" /> Adding…</> : <><PlusCircle size={15} /> Add Awardee</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Blank speaker / partner / section templates ──────────────────────────────
const BLANK_SPEAKER = { id: Date.now(), name: '', role: '', bio: '', linkedin: '', color: '#1a73e8', initials: '' };
const BLANK_PARTNER = { id: Date.now(), name: '', logo_url: '' };
const BLANK_SECTION = { id: Date.now(), title: '', column: 1, type: 'bullets', items: [''], text: '' };

// ── Event Editor ──────────────────────────────────────────────────────────────
function EventEditor({ event, onSaved }) {
    const [form, setForm] = useState({ ...event });
    const [aboutText, setAboutText] = useState(event.about_text || '');
    const [sections, setSections] = useState(Array.isArray(event.event_sections) ? event.event_sections : []);
    const [speakers, setSpeakers] = useState(Array.isArray(event.speakers) ? event.speakers : []);
    const [partners, setPartners] = useState(Array.isArray(event.partners) ? event.partners : []);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Ref to track when a save was just performed so we skip the re-sync
    // that would otherwise overwrite local state with the (already correct)
    // server response freshly returned from handleSave.
    const justSavedRef = useRef(false);

    // Keep form in sync when the event prop changes externally (e.g. initial
    // load, or parent refreshes data).  Skip the re-sync immediately after a
    // save — local state is already up-to-date from the save payload.
    useEffect(() => {
        if (justSavedRef.current) {
            justSavedRef.current = false;
            return;
        }
        setForm({ ...event });
        setAboutText(event.about_text || '');
        setSections(Array.isArray(event.event_sections) ? event.event_sections : []);
        setSpeakers(Array.isArray(event.speakers) ? event.speakers : []);
        setPartners(Array.isArray(event.partners) ? event.partners : []);
    }, [event]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setError(''); setSuccess('');
    };

    // ── Content Section helpers ───────────────────────────────────────────────
    const addSection = () => setSections((prev) => [...prev, { ...BLANK_SECTION, id: Date.now() }]);
    const removeSection = (sIdx) => setSections((prev) => prev.filter((_, i) => i !== sIdx));
    const updateSectionTitle = (sIdx, val) =>
        setSections((prev) => prev.map((s, i) => i === sIdx ? { ...s, title: val } : s));
    const updateSectionColumn = (sIdx, val) =>
        setSections((prev) => prev.map((s, i) => i === sIdx ? { ...s, column: Number(val) } : s));
    // Switch content type; preserve existing data in the other field
    const updateSectionType = (sIdx, val) =>
        setSections((prev) => prev.map((s, i) =>
            i === sIdx ? { ...s, type: val, items: s.items?.length ? s.items : [''], text: s.text ?? '' } : s));
    const updateSectionText = (sIdx, val) =>
        setSections((prev) => prev.map((s, i) => i === sIdx ? { ...s, text: val } : s));
    const addItem = (sIdx) =>
        setSections((prev) => prev.map((s, i) => i === sIdx ? { ...s, items: [...s.items, ''] } : s));
    const removeItem = (sIdx, iIdx) =>
        setSections((prev) => prev.map((s, i) => i === sIdx
            ? { ...s, items: s.items.filter((_, j) => j !== iIdx) } : s));
    const updateItem = (sIdx, iIdx, val) =>
        setSections((prev) => prev.map((s, i) => i === sIdx
            ? { ...s, items: s.items.map((it, j) => j === iIdx ? val : it) } : s));

    // ── Speaker helpers ────────────────────────────────────────────────────────
    const addSpeaker = () => setSpeakers((prev) => [...prev, { ...BLANK_SPEAKER, id: Date.now() }]);
    const removeSpeaker = (idx) => setSpeakers((prev) => prev.filter((_, i) => i !== idx));
    const updateSpeaker = (idx, field, value) =>
        setSpeakers((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

    // ── Partner helpers ────────────────────────────────────────────────────────
    const addPartner = () => setPartners((prev) => [...prev, { ...BLANK_PARTNER, id: Date.now() }]);
    const removePartner = (idx) => setPartners((prev) => prev.filter((_, i) => i !== idx));
    const updatePartner = (idx, field, value) =>
        setPartners((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));

    const handleSave = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');

        if (!form.title || !form.date || !form.venue || !form.total_seats) {
            return setError('Title, Date, Venue, and Total Seats are required.');
        }
        if (parseInt(form.total_seats) < 1) {
            return setError('Total seats must be at least 1.');
        }

        setSaving(true);
        try {
            const { data } = await updateAdminEvent({
                title: form.title,
                description: form.description,
                date: form.date,
                time: form.time,
                venue: form.venue,
                total_seats: parseInt(form.total_seats),
                about_text: aboutText,
                event_sections: sections,
                speakers,
                partners,
            });

            if (!data?.event) {
                throw new Error('Server did not return the updated event.');
            }

            // Mark that we just saved so the useEffect sync is skipped once —
            // local state already reflects what was saved.
            justSavedRef.current = true;

            onSaved(data.event);
            setSuccess('Event updated successfully!');
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to update event.');
        } finally {
            setSaving(false);
        }
    };

    // Convert ISO date to datetime-local input value
    const toDatetimeLocal = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    return (
        <form className="event-editor" onSubmit={handleSave} noValidate>
            {success && (
                <div className="admin-alert admin-alert-success">
                    <CheckCircle size={16} /> {success}
                </div>
            )}
            {error && (
                <div className="admin-alert admin-alert-error">
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {/* ── Core Event Fields ── */}
            <div className="event-editor-section-label">📋 Core Event Details</div>
            <div className="event-editor-grid">
                {/* Title */}
                <div className="form-group event-editor-full">
                    <label className="form-label" htmlFor="ev-title">
                        <AlignLeft size={14} /> Event Title *
                    </label>
                    <input id="ev-title" name="title" type="text"
                        className="form-input" value={form.title || ''} onChange={handleChange}
                        placeholder="Event title" />
                </div>

                {/* Date */}
                <div className="form-group">
                    <label className="form-label" htmlFor="ev-date">
                        <Calendar size={14} /> Date & Time *
                    </label>
                    <input id="ev-date" name="date" type="datetime-local"
                        className="form-input" value={toDatetimeLocal(form.date)} onChange={handleChange} />
                </div>

                {/* Time label */}
                <div className="form-group">
                    <label className="form-label" htmlFor="ev-time">
                        <Clock size={14} /> Display Time (e.g. 9:30 AM – 4:30 PM)
                    </label>
                    <input id="ev-time" name="time" type="text"
                        className="form-input" value={form.time || ''} onChange={handleChange}
                        placeholder="09:30 AM – 04:30 PM IST" />
                </div>

                {/* Venue */}
                <div className="form-group event-editor-full">
                    <label className="form-label" htmlFor="ev-venue">
                        <MapPin size={14} /> Venue *
                    </label>
                    <input id="ev-venue" name="venue" type="text"
                        className="form-input" value={form.venue || ''} onChange={handleChange}
                        placeholder="Venue / Location" />
                </div>

                {/* Total Seats */}
                <div className="form-group">
                    <label className="form-label" htmlFor="ev-seats">
                        <Hash size={14} /> Total Seats *
                    </label>
                    <input id="ev-seats" name="total_seats" type="number"
                        min="1" className="form-input" value={form.total_seats || ''}
                        onChange={handleChange} placeholder="e.g. 300" />
                </div>

                {/* Booked seats (read-only info) */}
                <div className="form-group">
                    <label className="form-label">
                        <Users size={14} /> Already Registered (read-only)
                    </label>
                    <input type="number" className="form-input" value={form.booked_seats ?? 0} readOnly
                        style={{ background: 'var(--bg)', cursor: 'not-allowed', color: 'var(--text-secondary)' }} />
                </div>
            </div>

            {/* ── About the Event ── */}
            <div className="event-editor-section">
                <div className="event-editor-section-label">📝 About the Event</div>
                <div className="form-group" style={{ marginTop: 8 }}>
                    <label className="form-label" htmlFor="ev-about">
                        Intro paragraph shown in the "About the Event" card on the public page
                    </label>
                    <textarea
                        id="ev-about"
                        className="form-input event-editor-textarea"
                        value={aboutText}
                        onChange={(e) => { setAboutText(e.target.value); setError(''); setSuccess(''); }}
                        placeholder="Write a compelling introduction to the event..."
                        rows={5}
                    />
                </div>
            </div>

            {/* ── Content Sections (What You'll Learn, Who Should Attend, etc.) ── */}
            <div className="event-editor-section">
                <div className="event-editor-section-header">
                    <div className="event-editor-section-label">📊 Content Sections ({sections.length})</div>
                    <button type="button" className="btn btn-sm btn-secondary" onClick={addSection} id="btn-add-section">
                        <AlignLeft size={14} /> Add Section
                    </button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>
                    These appear in the 3-column grid: e.g. "What You'll Learn", "Who Should Attend?", "GSoC Insights", "Key Outcomes"
                </p>
                {sections.length === 0 && (
                    <div className="event-editor-empty">No content sections yet. Click "Add Section" to create one.</div>
                )}
                <div className="event-section-cards">
                    {sections.map((sec, sIdx) => (
                        <div key={sec.id ?? sIdx} className="event-section-card">
                            <div className="event-section-card-header">
                                <span className="event-section-card-title">{sec.title || `Section ${sIdx + 1}`}</span>
                                <button type="button" className="btn btn-danger btn-sm"
                                    onClick={() => removeSection(sIdx)}
                                    id={`btn-remove-section-${sIdx}`} title="Remove section">
                                    <Trash2 size={13} />
                                </button>
                            </div>
                            {/* Section Title + Column picker */}
                            <div className="event-editor-grid" style={{ marginTop: 10 }}>
                                <div className="form-group">
                                    <label className="form-label">Section Title</label>
                                    <input className="form-input" value={sec.title}
                                        placeholder="e.g. What You'll Learn"
                                        onChange={(e) => updateSectionTitle(sIdx, e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Display Column</label>
                                    <select className="form-input"
                                        value={sec.column ?? ''}
                                        onChange={(e) => updateSectionColumn(sIdx, e.target.value)}
                                        id={`sec-col-${sIdx}`}>
                                        <option value="">Auto (balanced)</option>
                                        <option value="1">Column 1 (left)</option>
                                        <option value="2">Column 2 (middle)</option>
                                        <option value="3">Column 3 (right)</option>
                                    </select>
                                </div>
                            </div>
                            {/* ── Content type toggle + editor ── */}
                            <div className="form-group" style={{ marginTop: 10 }}>
                                <label className="form-label">Content Type</label>
                                <div className="section-type-toggle">
                                    <button
                                        type="button"
                                        className={`section-type-btn${(sec.type ?? 'bullets') === 'bullets' ? ' active' : ''}`}
                                        onClick={() => updateSectionType(sIdx, 'bullets')}
                                        id={`sec-type-bullets-${sIdx}`}>
                                        ✅ Bullet Points
                                    </button>
                                    <button
                                        type="button"
                                        className={`section-type-btn${(sec.type ?? 'bullets') === 'paragraph' ? ' active' : ''}`}
                                        onClick={() => updateSectionType(sIdx, 'paragraph')}
                                        id={`sec-type-para-${sIdx}`}>
                                        📝 Paragraph
                                    </button>
                                </div>
                            </div>

                            {/* ── Bullets editor ── */}
                            {(sec.type ?? 'bullets') === 'bullets' && (
                                <div className="form-group" style={{ marginTop: 6 }}>
                                    <label className="form-label">Bullet Points</label>
                                    <div className="section-items-list">
                                        {(sec.items ?? ['']).map((item, iIdx) => (
                                            <div key={iIdx} className="section-item-row">
                                                <span className="section-item-bullet">•</span>
                                                <input
                                                    className="form-input section-item-input"
                                                    value={item}
                                                    placeholder={`Point ${iIdx + 1}`}
                                                    onChange={(e) => updateItem(sIdx, iIdx, e.target.value)}
                                                />
                                                <button type="button"
                                                    className="btn btn-danger btn-sm section-item-remove"
                                                    onClick={() => removeItem(sIdx, iIdx)}
                                                    title="Remove bullet"
                                                    disabled={(sec.items ?? ['']).length <= 1}>
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button"
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => addItem(sIdx)}
                                        id={`btn-add-item-${sIdx}`}
                                        style={{ marginTop: 8 }}>
                                        + Add Point
                                    </button>
                                </div>
                            )}

                            {/* ── Paragraph editor ── */}
                            {(sec.type ?? 'bullets') === 'paragraph' && (
                                <div className="form-group" style={{ marginTop: 6 }}>
                                    <label className="form-label">Paragraph Text</label>
                                    <textarea
                                        className="form-input event-editor-textarea"
                                        value={sec.text ?? ''}
                                        rows={5}
                                        placeholder="Write the section content here..."
                                        onChange={(e) => updateSectionText(sIdx, e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Speakers Section ── */}
            <div className="event-editor-section">
                <div className="event-editor-section-header">
                    <div className="event-editor-section-label">🎤 Speakers ({speakers.length})</div>
                    <button type="button" className="btn btn-sm btn-secondary" onClick={addSpeaker} id="btn-add-speaker">
                        <UserPlus size={14} /> Add Speaker
                    </button>
                </div>
                {speakers.length === 0 && (
                    <div className="event-editor-empty">No speakers added yet. Click "Add Speaker" to get started.</div>
                )}
                <div className="event-section-cards">
                    {speakers.map((sp, idx) => (
                        <div key={sp.id ?? idx} className="event-section-card">
                            <div className="event-section-card-header">
                                {/* Avatar preview: photo > initials */}
                                <div className="speaker-initials-preview" style={{ background: sp.color || '#1a73e8', overflow: 'hidden', padding: 0 }}>
                                    {sp.photo_url
                                        ? <img src={sp.photo_url} alt={sp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => { e.target.style.display = 'none'; }} />
                                        : (sp.initials || sp.name?.charAt(0)?.toUpperCase() || '?')
                                    }
                                </div>
                                <span className="event-section-card-title">{sp.name || `Speaker ${idx + 1}`}</span>
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeSpeaker(idx)}
                                    id={`btn-remove-speaker-${idx}`} title="Remove speaker">
                                    <Trash2 size={13} />
                                </button>
                            </div>
                            <div className="event-editor-grid" style={{ marginTop: 12 }}>
                                <div className="form-group">
                                    <label className="form-label">Full Name *</label>
                                    <input className="form-input" value={sp.name} placeholder="e.g. Prathamesh Ghatole"
                                        onChange={(e) => updateSpeaker(idx, 'name', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Initials (avatar fallback)</label>
                                    <input className="form-input" value={sp.initials} placeholder="e.g. PG" maxLength={3}
                                        onChange={(e) => updateSpeaker(idx, 'initials', e.target.value.toUpperCase())} />
                                </div>
                                <div className="form-group event-editor-full">
                                    <label className="form-label">Role / Title</label>
                                    <input className="form-input" value={sp.role} placeholder="e.g. SDE - AI, Gekko"
                                        onChange={(e) => updateSpeaker(idx, 'role', e.target.value)} />
                                </div>
                                <div className="form-group event-editor-full">
                                    <label className="form-label">Bio</label>
                                    <textarea className="form-input" value={sp.bio} rows={2}
                                        placeholder="Short biography..."
                                        onChange={(e) => updateSpeaker(idx, 'bio', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><Link size={13} /> LinkedIn URL</label>
                                    <input className="form-input" value={sp.linkedin || ''} placeholder="https://linkedin.com/in/..."
                                        onChange={(e) => updateSpeaker(idx, 'linkedin', e.target.value)} />
                                </div>
                                {/* ── Photo URL + live preview ── */}
                                <div className="form-group event-editor-full">
                                    <label className="form-label"><Link size={13} /> Photo URL <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(replaces initials on public page)</span></label>
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <div className="speaker-photo-preview" style={{ background: sp.color || '#1a73e8' }}>
                                            {sp.photo_url
                                                ? <img src={sp.photo_url} alt="preview"
                                                    onError={(e) => { e.target.style.display = 'none'; }} />
                                                : <span>{sp.initials || sp.name?.charAt(0)?.toUpperCase() || '?'}</span>
                                            }
                                        </div>
                                        <input className="form-input" value={sp.photo_url || ''}
                                            placeholder="https://example.com/photo.jpg"
                                            style={{ flex: 1 }}
                                            onChange={(e) => updateSpeaker(idx, 'photo_url', e.target.value)} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><Palette size={13} /> Avatar Accent Color <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(used as background when no photo)</span></label>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <input type="color" value={sp.color || '#1a73e8'}
                                            onChange={(e) => updateSpeaker(idx, 'color', e.target.value)}
                                            style={{ width: 44, height: 36, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                                        <input className="form-input" value={sp.color}
                                            placeholder="#1a73e8"
                                            onChange={(e) => updateSpeaker(idx, 'color', e.target.value)}
                                            style={{ flex: 1, fontFamily: 'monospace' }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Community Partners Section ── */}
            <div className="event-editor-section">
                <div className="event-editor-section-header">
                    <div className="event-editor-section-label">🤝 Community Partners ({partners.length})</div>
                    <button type="button" className="btn btn-sm btn-secondary" onClick={addPartner} id="btn-add-partner">
                        <Building2 size={14} /> Add Partner
                    </button>
                </div>
                {partners.length === 0 && (
                    <div className="event-editor-empty">No community partners added yet. Click "Add Partner" to get started.</div>
                )}
                <div className="event-section-cards">
                    {partners.map((pt, idx) => (
                        <div key={pt.id ?? idx} className="event-section-card event-section-card-sm">
                            <div className="event-section-card-header">
                                <span className="event-section-card-title">{pt.name || `Partner ${idx + 1}`}</span>
                                <button type="button" className="btn btn-danger btn-sm" onClick={() => removePartner(idx)}
                                    id={`btn-remove-partner-${idx}`} title="Remove partner">
                                    <Trash2 size={13} />
                                </button>
                            </div>
                            <div className="event-editor-grid" style={{ marginTop: 10 }}>
                                <div className="form-group">
                                    <label className="form-label">Organization Name *</label>
                                    <input className="form-input" value={pt.name} placeholder="e.g. GDG Chandigarh"
                                        onChange={(e) => updatePartner(idx, 'name', e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label"><Link size={13} /> Logo URL</label>
                                    <input className="form-input" value={pt.logo_url} placeholder="https://... (image URL)"
                                        onChange={(e) => updatePartner(idx, 'logo_url', e.target.value)} />
                                </div>
                            </div>
                            {pt.logo_url && (
                                <div style={{ marginTop: 8 }}>
                                    <img src={pt.logo_url} alt={pt.name}
                                        style={{ maxHeight: 48, maxWidth: 120, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--border)', padding: 4, background: '#fff' }}
                                        onError={(e) => { e.target.style.display = 'none'; }} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving} id="btn-save-event" style={{ marginTop: 8 }}>
                {saving ? <><span className="spinner" /> Saving…</> : <><Save size={16} /> Save All Changes</>}
            </button>
        </form>
    );
}

// ── Main AdminPage ────────────────────────────────────────────────────────────
export default function AdminPage({ onLogout }) {
    const [stats, setStats] = useState(null);
    const [regs, setRegs] = useState([]);
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState('created_at');
    const [sortAsc, setSortAsc] = useState(false);
    const [activeTab, setActiveTab] = useState('registrations');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    const [deleteTarget, setDeleteTarget] = useState(null); // { id, name, email }
    const [deleting, setDeleting] = useState(false);
    const [deleteMsg, setDeleteMsg] = useState('');

    const [viewTarget, setViewTarget] = useState(null); // the full registration object to view

    const [showSendTicketsModal, setShowSendTicketsModal] = useState(false);
    const [sendingTickets, setSendingTickets] = useState(false);
    const [ticketMsg, setTicketMsg] = useState('');
    const [showAddAwardeeModal, setShowAddAwardeeModal] = useState(false);

    // ── Attendance Scanner State ───────────────────────────────────────────────
    const [ticketInput, setTicketInput] = useState('');
    const [attendFilter, setAttendFilter] = useState('all');
    const [clusterFilter, setClusterFilter] = useState('all');
    const [deptFilter, setDeptFilter] = useState('all');
    const [catFilter, setCatFilter] = useState('all');
    const [awardFilter, setAwardFilter] = useState('all');
    const [mentorView, setMentorView] = useState('all'); // 'all' or 'unique'
    const [scanLoading, setScanLoading] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scanLog, setScanLog] = useState([]);
    const ticketInputRef = useRef(null);

    // Derive unique lists for the dropdowns from the actual data
    const uniqueClusters = [...new Set(regs.map(r => r.cluster).filter(Boolean))].sort();
    const uniqueDepts = [...new Set(regs.map(r => r.department).filter(Boolean))].sort();
    const allCategories = [
        { id: 'research', label: 'Research', icon: '🔬' },
        { id: 'innovation', label: 'Global Certification', icon: '🎖️' },
        { id: 'entrepreneurship', label: 'Entrepreneurship', icon: '🚀' },
        { id: 'competitions', label: 'Competitions', icon: '🏆' },
        { id: 'patents', label: 'Patents', icon: '📄' },
        { id: 'leadership', label: 'Leadership', icon: '👥' },
        { id: 'other', label: 'Exams & Awards', icon: '🏅' },
    ];
    // Maps each category type to the primary name field in cat.data
    const CAT_NAME_FIELD = {
        research: 'research_name',
        innovation: 'cert_title',
        entrepreneurship: 'startup_name',
        competitions: 'comp_name',
        patents: 'patent_title',
        leadership: 'club_name',
        other: 'award_name',
    };

    const load = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const [sRes, rRes, eRes] = await Promise.all([
                fetchAdminStats(),
                fetchRegistrations(),
                fetchAdminEvent(),
            ]);
            setStats(sRes.data.stats);
            setRegs(rRes.data.registrations);
            setEvent(eRes.data.event);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load admin data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Focus ticket input when switching to attendance tab
    useEffect(() => {
        if (activeTab === 'attendance' && ticketInputRef.current) {
            ticketInputRef.current.focus();
        }
    }, [activeTab]);

    // ── Handle ticket scan submission ──────────────────────────────────────────
    const handleScan = async (e) => {
        e.preventDefault();
        const code = ticketInput.trim().toUpperCase();
        if (!code || code.length !== 4) {
            setScanResult({ type: 'error', message: 'Please enter exactly 4 characters.' });
            return;
        }
        setScanLoading(true);
        setScanResult(null);
        try {
            const { data } = await markAttendance(code);
            setScanResult({ type: 'success', data: data.registration, message: data.message });
            setScanLog((prev) => [{ type: 'success', code, name: data.registration.name, time: new Date() }, ...prev.slice(0, 19)]);
            // Update regs in-place so row badges + attendance filter update instantly
            setRegs((prev) => prev.map((r) =>
                r.id.slice(-4).toUpperCase() === code
                    ? { ...r, attended_at: new Date().toISOString() }
                    : r
            ));
            // Also bump the attended counter in the stats bar
            setStats((prev) => prev ? { ...prev, attendedCount: (prev.attendedCount || 0) + 1 } : prev);
        } catch (err) {
            const res = err.response?.data;
            if (res?.alreadyPresent) {
                setScanResult({ type: 'already', data: res.registration, message: res.error });
                setScanLog((prev) => [{ type: 'already', code, name: res.registration?.name, time: new Date() }, ...prev.slice(0, 19)]);
            } else {
                setScanResult({ type: 'error', message: res?.error || 'Scan failed. Try again.' });
                setScanLog((prev) => [{ type: 'error', code, time: new Date() }, ...prev.slice(0, 19)]);
            }
        } finally {
            setScanLoading(false);
            setTicketInput('');
            if (ticketInputRef.current) ticketInputRef.current.focus();
        }
    };


    // ── Sorting & Filtering ────────────────────────────────────────────────────
    const toggleSort = (key) => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else { setSortKey(key); setSortAsc(true); }
    };

    const approvedRegs = regs.filter(r => {
        const glob = (r.evaluation_status || '').trim().toUpperCase();
        const hasApprovedCat = Array.isArray(r.categories) && r.categories.some(c => (c.status || '').trim().toUpperCase() === 'APPROVED');
        return glob === 'APPROVED' || hasApprovedCat;
    });

    const totalApprovedEntries = approvedRegs.length;

    const baseRegs = activeTab === 'approved' ? approvedRegs : regs;

    // Extract faculty mentors from approved categories
    const facultyMentors = [];
    const uniqueMentorCodes = new Set();
    
    // Always use 'regs' (all registrations) but filter by 'Approved' status inside
    // to ensure the count doesn't change when flipping between All/Approved tabs
    regs.forEach(r => {
        if (Array.isArray(r.categories)) {
            r.categories.forEach(cat => {
                const effectiveStatus = cat.status || r.evaluation_status || 'Pending';
                if (effectiveStatus === 'Approved' && cat.data && cat.data.mentored_by) {
                    const field = CAT_NAME_FIELD[cat.type];
                    const projectTitle = field && cat.data ? cat.data[field] : '—';
                    
                    facultyMentors.push({
                        id: `${r.id}-${cat.type}`,
                        regId: r.id, 
                        facultyName: cat.data.faculty_name,
                        facultyEcode: cat.data.faculty_ecode,
                        studentName: r.name,
                        projectTitle: projectTitle,
                        category: (cat.type || '').charAt(0).toUpperCase() + (cat.type || '').slice(1),
                        categoryRaw: cat.type,
                        categoryIndex: r.categories.findIndex(c => c === cat),
                        award: cat.award,
                        facultyAward: cat.faculty_award
                    });
                    if (cat.data.faculty_ecode) uniqueMentorCodes.add(cat.data.faculty_ecode.trim().toUpperCase());
                }
            });
        }
    });

    const uniqueMentorsMap = {};
    facultyMentors.forEach(m => {
        const key = (m.facultyEcode || m.facultyName || 'N/A').trim().toUpperCase();
        if (!uniqueMentorsMap[key]) {
            uniqueMentorsMap[key] = {
                facultyName: m.facultyName,
                facultyEcode: m.facultyEcode,
                mentorships: []
            };
        }
        uniqueMentorsMap[key].mentorships.push(m);
    });
    const uniqueMentorsList = Object.values(uniqueMentorsMap);

    const filtered = baseRegs
        .filter((r) => {
            const q = search.toLowerCase();
            const textMatch = (
                (r.name || '').toLowerCase().includes(q) ||
                (r.email || '').toLowerCase().includes(q) ||
                (r.uid || '').toLowerCase().includes(q) ||
                (r.department || '').toLowerCase().includes(q) ||
                (r.cluster || '').toLowerCase().includes(q) ||
                (Array.isArray(r.categories) && r.categories.some(cat => {
                    const field = CAT_NAME_FIELD[cat.type];
                    const val = field && cat.data ? cat.data[field] : '';
                    return (val || '').toLowerCase().includes(q);
                }))
            );
            const attendMatch =
                attendFilter === 'all' ? true :
                    attendFilter === 'present' ? !!r.attended_at :
                        !r.attended_at;

            const clusterMatch = clusterFilter === 'all' ? true : r.cluster === clusterFilter;
            const deptMatch = deptFilter === 'all' ? true : r.department === deptFilter;
            const catMatch = catFilter === 'all'
                ? (activeTab === 'approved'
                    ? Array.isArray(r.categories) && r.categories.some(c => c.status === 'Approved')
                    : true)
                : catFilter === 'misc'
                    ? (Array.isArray(r.categories) && r.categories.some(c =>
                        !allCategories.some(ac => ac.id === c.type) &&
                        (activeTab === 'approved' ? c.status === 'Approved' : true)
                    ))
                    : (Array.isArray(r.categories) && r.categories.some(c =>
                        c.type === catFilter &&
                        (activeTab === 'approved' ? c.status === 'Approved' : true)
                    ));

            const awardMatch = activeTab !== 'approved' || awardFilter === 'all' ? true :
                (Array.isArray(r.categories) && r.categories.some(c =>
                    c.status === 'Approved' &&
                    (awardFilter === 'none' ? !c.award : c.award === awardFilter)
                ));

            return textMatch && attendMatch && clusterMatch && deptMatch && catMatch && awardMatch;
        })
        .sort((a, b) => {
            const av = a[sortKey] || '';
            const bv = b[sortKey] || '';
            return sortAsc
                ? av.localeCompare(bv)
                : bv.localeCompare(av);
        });

    const presentCount = regs.filter((r) => r.attended_at).length;
    const absentCount = regs.length - presentCount;
    // Use the higher of: live presentCount (from loaded regs) OR authoritative DB count from stats API.
    // This stays correct even when regs is limited by Supabase's row cap before backend redeploy.
    const displayAttendedCount = Math.max(presentCount, stats?.attendedCount ?? 0);

    // ── Pagination ─────────────────────────────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

    // Reset to page 1 whenever search / filter / sort changes
    useEffect(() => { setPage(1); }, [search, attendFilter, clusterFilter, deptFilter, catFilter, awardFilter, sortKey, sortAsc]);

    // ── Delete ─────────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteRegistration(deleteTarget.id);
            setRegs((prev) => prev.filter((r) => r.id !== deleteTarget.id));
            setStats((prev) => prev ? {
                ...prev,
                bookedSeats: Math.max(0, prev.bookedSeats - 1),
                remainingSeats: prev.remainingSeats + 1,
                totalRegistrations: Math.max(0, prev.totalRegistrations - 1),
            } : prev);
            setDeleteMsg(`✅ ${deleteTarget.name}'s registration was deleted.`);
            setTimeout(() => setDeleteMsg(''), 4000);
        } catch (err) {
            setDeleteMsg(`⚠ ${err.response?.data?.error || 'Delete failed'}`);
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        onLogout();
    };

    const handleSendTickets = async () => {
        setSendingTickets(true);
        try {
            const { data } = await sendTicketEmails();
            setTicketMsg(`✅ ${data.message}`);
            // Mark ticket_sent_at on all approved rows in local state instantly
            const now = new Date().toISOString();
            setRegs((prev) => prev.map((r) => {
                const isApproved = (r.evaluation_status || '').toUpperCase() === 'APPROVED' ||
                    (Array.isArray(r.categories) && r.categories.some(c => c.status === 'Approved'));
                return isApproved && !r.ticket_sent_at ? { ...r, ticket_sent_at: now } : r;
            }));
        } catch (err) {
            setTicketMsg(`⚠ ${err.response?.data?.error || 'Failed to send ticket emails.'}`);
        } finally {
            setSendingTickets(false);
            setShowSendTicketsModal(false);
            setTimeout(() => setTicketMsg(''), 6000);
        }
    };

    const handleEvaluationUpdate = async (regId, status) => {
        try {
            const { data } = await updateEvaluation(regId, status, '');
            if (data.success) {
                // Update local state instantly
                setRegs((prev) => prev.map((r) =>
                    r.id === regId ? { ...r, evaluation_status: status } : r
                ));
                // Update view modal if open for this reg
                setViewTarget((prev) => prev && prev.id === regId ? { ...prev, evaluation_status: status } : prev);
            }
        } catch (err) {
            console.error('Failed to update evaluation:', err);
            alert('Failed to update evaluation status');
        }
    };

    const handleCategoryEvaluationUpdate = async (regId, categoryIndex, status) => {
        try {
            const { data } = await updateEvaluation(regId, status, '', categoryIndex);
            if (data.success) {
                const updateReg = (r) => {
                    if (r.id !== regId) return r;
                    const newCats = [...r.categories];
                    newCats[categoryIndex] = { ...newCats[categoryIndex], status };
                    return { ...r, categories: newCats };
                };
                setRegs((prev) => prev.map(updateReg));
                setViewTarget((prev) => prev ? updateReg(prev) : prev);
            }
        } catch (err) {
            console.error('Failed to update category evaluation:', err);
            alert('Failed to update category evaluation status');
        }
    };

    const handleCategoryAwardUpdate = async (regId, categoryIndex, award) => {
        try {
            const { data } = await updateAward(regId, award, categoryIndex);
            if (data.success) {
                const updateReg = (r) => {
                    if (r.id !== regId) return r;
                    const newCats = [...r.categories];
                    newCats[categoryIndex] = { ...newCats[categoryIndex], award };
                    return { ...r, categories: newCats };
                };
                setRegs((prev) => prev.map(updateReg));
                setViewTarget((prev) => prev ? updateReg(prev) : prev);
            }
        } catch (err) {
            console.error('Failed to update award:', err);
            alert('Failed to update award selection');
        }
    };

    const handleFacultyAwardUpdate = async (regId, categoryIndex, award) => {
        try {
            const { data } = await updateAward(regId, award, categoryIndex, true);
            if (data.success) {
                const updateReg = (r) => {
                    if (r.id !== regId) return r;
                    const newCats = [...r.categories];
                    newCats[categoryIndex] = { ...newCats[categoryIndex], faculty_award: award };
                    return { ...r, categories: newCats };
                };
                setRegs((prev) => prev.map(updateReg));
                setViewTarget((prev) => prev ? updateReg(prev) : prev);
            }
        } catch (err) {
            console.error('Failed to update faculty award:', err);
            alert('Failed to update faculty award selection');
        }
    };

    const exportToCSV = (data, filename, customHeaders = null) => {
        const standardHeaders = [
            'Name', 'Email', 'UID/EID', 'Department', 'Cluster',
            'Category Type', 'Category Status', 'Category Details',
            ...(activeTab === 'approved' ? ['Type of Project', 'Prize Money (₹)', 'Title / Name', 'Society Name'] : []),
            'Registered At', 'Ticket Sent', 'Overall Status', 'Award / Grant Type', 'Attendance'
        ];
        const headers = customHeaders || standardHeaders;

        const rows = [];
        data.forEach(r => {
            // Handle Faculty Mentors specifically
            if (customHeaders && customHeaders.includes('Faculty Name')) {
                rows.push([
                    `"${(r.facultyName || '').replace(/"/g, '""')}"`,
                    `"${(r.facultyEcode || '—').replace(/"/g, '""')}"`,
                    `"${(r.studentName || '').replace(/"/g, '""')}"`,
                    `"${(r.category || '').replace(/"/g, '""')}"`,
                    `"${(r.facultyAward || '—').replace(/\+/g, ' + ').replace(/\b\w/g, l => l.toUpperCase()).replace(/"/g, '""')}"`
                ].join(','));
                return;
            }

            if (Array.isArray(r.categories) && r.categories.length > 0) {
                // Filter categories based on current tab/filter for accuracy
                const targetCats = r.categories.filter(cat => {
                    const catMatch = catFilter === 'all' ? true :
                        catFilter === 'misc' ? !allCategories.some(ac => ac.id === cat.type) :
                        cat.type === catFilter;
                    const approvedMatch = activeTab === 'approved' ? cat.status === 'Approved' : true;
                    return catMatch && approvedMatch;
                });

                if (targetCats.length === 0 && (catFilter !== 'all' || activeTab === 'approved')) return;

                (targetCats.length > 0 ? targetCats : [null]).forEach(cat => {
                    const detailsStr = cat ? Object.entries(cat.data || {})
                        .map(([k, v]) => {
                            const niceK = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                            return `${niceK}: ${v}`;
                        }).join('; ') : '—';

                    const awardVal = cat ? (cat.award || '—')
                        .replace(/\+/g, ' + ')
                        .replace(/\b\w/g, l => l.toUpperCase()) : '—';
                        
                    const prizeMoneyVal = cat && cat.data && cat.data.prize_money ? cat.data.prize_money : '—';
                    const projectTypeVal = cat && cat.data && cat.data.project_type ? cat.data.project_type : '—';
                    const titleNameVal = cat && cat.data ? (cat.data.cert_title || cat.data.award_name || '—') : '—';
                    const societyNameVal = cat && cat.data && cat.data.society ? cat.data.society : '—';

                    const baseRow = [
                        `"${(r.name || '').replace(/"/g, '""')}"`,
                        `"${(r.email || '').replace(/"/g, '""')}"`,
                        `"${(r.uid || '').replace(/"/g, '""')}"`,
                        `"${(r.department || '').replace(/"/g, '""')}"`,
                        `"${(r.cluster || '').replace(/"/g, '""')}"`,
                        `"${cat ? (cat.type || '').charAt(0).toUpperCase() + (cat.type || '').slice(1) : '—'}"`,
                        `"${cat ? (cat.status || 'Pending').replace(/"/g, '""') : '—'}"`,
                        `"${detailsStr.replace(/"/g, '""')}"`
                    ];

                    if (activeTab === 'approved') {
                        baseRow.push(`"${String(projectTypeVal).replace(/"/g, '""')}"`);
                        baseRow.push(`"${String(prizeMoneyVal).replace(/"/g, '""')}"`);
                        baseRow.push(`"${String(titleNameVal).replace(/"/g, '""')}"`);
                        baseRow.push(`"${String(societyNameVal).replace(/"/g, '""')}"`);
                    }

                    baseRow.push(
                        `"${new Date(r.created_at).toLocaleString()}"`,
                        `"${r.ticket_sent_at ? 'Yes' : 'No'}"`,
                        `"${(r.evaluation_status || 'Pending').replace(/"/g, '""')}"`,
                        `"${awardVal.replace(/"/g, '""')}"`,
                        `"${r.attended_at ? 'Present' : 'Absent'}"`
                    );

                    rows.push(baseRow.join(','));
                });
            } else if (activeTab !== 'approved' && catFilter === 'all') {
                rows.push([
                    `"${(r.name || '').replace(/"/g, '""')}"`,
                    `"${(r.email || '').replace(/"/g, '""')}"`,
                    `"${(r.uid || '').replace(/"/g, '""')}"`,
                    `"${(r.department || '').replace(/"/g, '""')}"`,
                    `"${(r.cluster || '').replace(/"/g, '""')}"`,
                    '"—"', '"—"', '"—"',
                    `"${new Date(r.created_at).toLocaleString()}"`,
                    `"${r.ticket_sent_at ? 'Yes' : 'No'}"`,
                    `"${(r.evaluation_status || 'Pending').replace(/"/g, '""')}"`,
                    '"None"',
                    `"${r.attended_at ? 'Present' : 'Absent'}"`
                ].join(','));
            }
        });

        const csvString = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${filename.replace('.csv', '')}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportCSV = () => exportToCSV(filtered, 'Filtered_Participants');
    const handleExportAllCSV = () => exportToCSV(regs, 'All_Participants');

    // ── Sort icon helper ───────────────────────────────────────────────────────
    const handleSendTestTicket = async () => {
        const email = prompt("Enter email address for test ticket:", "praveen.n@cuchd.in");
        if (!email) return;
        
        try {
            setSendingTickets(true);
            const { data } = await sendTestTicket(email);
            if (data.success) {
                alert(`Success: ${data.message}`);
            }
        } catch (err) {
            console.error('Test ticket error:', err);
            alert(err.response?.data?.error || 'Failed to send test ticket');
        } finally {
            setSendingTickets(false);
        }
    };

    const handleAwardeeAdded = (newReg, seatAction) => {
        // Prepend the new record so it appears at top in both All and Approved tabs
        setRegs(prev => [newReg, ...prev]);
        setStats(prev => {
            if (!prev) return prev;
            if (seatAction === 'expanded') {
                // House was full — backend grew totalSeats, so remainingSeats stays the same
                return {
                    ...prev,
                    totalRegistrations: prev.totalRegistrations + 1,
                    totalSeats:  prev.totalSeats + 1,
                    bookedSeats: prev.bookedSeats + 1,
                    // remainingSeats unchanged
                };
            } else {
                // Seats were available — just consume one
                return {
                    ...prev,
                    totalRegistrations: prev.totalRegistrations + 1,
                    bookedSeats:    prev.bookedSeats + 1,
                    remainingSeats: Math.max(0, prev.remainingSeats - 1),
                };
            }
        });
        setDeleteMsg(`✅ Awardee "${newReg.name}" added and approved successfully!`);
        setTimeout(() => setDeleteMsg(''), 5000);
    };

    const SortIcon = ({ col }) => sortKey === col
        ? (sortAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />)
        : <ChevronDown size={14} style={{ opacity: .3 }} />;

    const formatDate = (iso) =>
        new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });

    if (loading) {
        return (
            <div className="admin-page">
                <div className="admin-topbar">
                    <div className="admin-topbar-brand">
                        <span className="admin-logo-text">
                            <span style={{ color: '#292b2e' }}>O</span><span style={{ color: '#ea4335' }}>A</span>
                            <span style={{ color: '#ea4335' }}>A</span>
                        </span>
                        <span className="admin-topbar-label">Admin Panel</span>
                    </div>
                </div>
                <div className="admin-loading">
                    <div className="spinner spinner-blue" style={{ width: 36, height: 36 }} />
                    <p>Loading dashboard…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            {/* ── Top Bar ── */}
            <header className="admin-topbar">
                <div className="gdg-strip" />
                <div className="admin-topbar-inner admin-container">
                    <div className="admin-topbar-brand">
                        <div className="admin-logo-box">
                            <span style={{ color: '#292b2e' }}>O</span>
                            <span style={{ color: '#ea4335' }}>A</span>
                            <span style={{ color: '#ea4335' }}>A</span>
                        </div>
                        <div>
                            <div className="admin-topbar-title">Admin Panel</div>
                            <div className="admin-topbar-sub">Event Management Dashboard</div>
                        </div>
                    </div>
                    <div className="admin-topbar-actions">
                        <a href="/" className="btn btn-secondary btn-sm" id="link-view-event">
                            View Event ↗
                        </a>
                        <button className="btn btn-sm admin-logout-btn" onClick={handleLogout} id="btn-logout">
                            <LogOut size={14} /> Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="admin-body admin-container">
                {error && (
                    <div className="admin-alert admin-alert-error" style={{ marginBottom: 24 }}>
                        <AlertTriangle size={16} /> {error}
                        <button className="btn btn-sm btn-secondary" onClick={load} id="btn-retry-load">
                            <RefreshCw size={13} /> Retry
                        </button>
                    </div>
                )}

                {/* ── Stats ── */}
                {stats && (
                    <div className="admin-stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                        <StatCard icon={<Users size={22} />} label="Total Registrations" value={stats.totalRegistrations} color="blue" />
                        <StatCard icon={<Ticket size={22} />} label="Total Seats" value={stats.totalSeats} color="green" />
                        <StatCard icon={<BarChart2 size={22} />} label="Booked Seats" value={stats.bookedSeats} color="yellow" />
                        <StatCard icon={<CheckCircle size={22} />} label="Seats Remaining" value={stats.remainingSeats} color={stats.remainingSeats === 0 ? 'red' : 'teal'} />
                        {/* Use max of: live presentCount (updated on scan) vs DB attendedCount (loaded on mount) */}
                        <StatCard icon={<UserCheck size={22} />} label="Attended" value={Math.max(presentCount, stats.attendedCount ?? 0)} color="green" />
                    </div>
                )}

                {/* ── Tabs ── */}
                <div className="admin-tabs">
                    <button
                        className={`admin-tab ${activeTab === 'registrations' ? 'active' : ''}`}
                        onClick={() => setActiveTab('registrations')}
                        id="tab-registrations"
                    >
                        <Users size={16} /> All ({stats.totalRegistrations})
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'approved' ? 'active' : ''}`}
                        onClick={() => setActiveTab('approved')}
                        id="tab-approved"
                    >
                        <CheckCircle size={16} /> Approved ({totalApprovedEntries})
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'attendance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('attendance')}
                        id="tab-attendance"
                    >
                        <ScanLine size={16} /> Take Attendance
                        {displayAttendedCount > 0 && (
                            <span className="admin-tab-badge" style={{ background: '#34a853' }}>{displayAttendedCount}</span>
                        )}
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'mentors' ? 'active' : ''}`}
                        onClick={() => setActiveTab('mentors')}
                        id="tab-mentors"
                    >
                        <UserPlus size={16} /> Faculty Mentors ({uniqueMentorCodes.size})
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                        id="tab-analytics"
                    >
                        <BarChart2 size={16} /> Insights
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'event' ? 'active' : ''}`}
                        onClick={() => setActiveTab('event')}
                        id="tab-event"
                    >
                        <Edit3 size={16} /> Edit Event
                    </button>
                </div>

                {/* ── REGISTRATIONS & APPROVED TAB ── */}
                {(activeTab === 'registrations' || activeTab === 'approved') && (
                    <div className="admin-card card">
                        {/* Toolbar */}
                        <div className="admin-table-toolbar">
                            <div className="admin-search-wrap">
                                <Search size={16} className="admin-search-icon" />
                                <input
                                    type="text"
                                    className="admin-search-input"
                                    placeholder="Search by name, email, phone, department, cluster…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    id="admin-search"
                                />
                                {search && (
                                    <button className="admin-search-clear" onClick={() => setSearch('')}>
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            <div className="admin-filters-grid">
                                <select
                                    className="admin-select-sm"
                                    value={deptFilter}
                                    onChange={(e) => setDeptFilter(e.target.value)}
                                    id="filter-dept"
                                >
                                    <option value="all">All Departments ({baseRegs.length})</option>
                                    {uniqueDepts.map(d => {
                                        const count = baseRegs.filter(r => r.department === d).length;
                                        return <option key={d} value={d}>{d} ({count})</option>;
                                    })}
                                </select>

                                <select
                                    className="admin-select-sm"
                                    value={clusterFilter}
                                    onChange={(e) => setClusterFilter(e.target.value)}
                                    id="filter-cluster"
                                >
                                    <option value="all">All Clusters ({baseRegs.length})</option>
                                    {uniqueClusters.map(c => {
                                        const count = baseRegs.filter(r => r.cluster === c).length;
                                        return <option key={c} value={c}>{c} ({count})</option>;
                                    })}
                                </select>

                                <select
                                    className="admin-select-sm"
                                    value={catFilter}
                                    onChange={(e) => setCatFilter(e.target.value)}
                                    id="filter-category"
                                >
                                    <option value="all">All Categories ({baseRegs.reduce((sum, r) => sum + (Array.isArray(r.categories) ? r.categories.filter(cat => activeTab === 'approved' ? ((cat.status || '').trim().toUpperCase() === 'APPROVED' || (r.evaluation_status || '').trim().toUpperCase() === 'APPROVED') : true).length : 0), 0)})</option>
                                    {allCategories.map(c => {
                                        const count = baseRegs.reduce((sum, r) => sum + (Array.isArray(r.categories) ? r.categories.filter(cat => (cat.type || '').toLowerCase() === c.id.toLowerCase() && (activeTab === 'approved' ? ((cat.status || '').trim().toUpperCase() === 'APPROVED' || (r.evaluation_status || '').trim().toUpperCase() === 'APPROVED') : true)).length : 0), 0);
                                        return count > 0 ? <option key={c.id} value={c.id}>{c.label} ({count})</option> : null;
                                    })}
                                    {(() => {
                                        const catIds = allCategories.map(c => c.id);
                                        const miscCount = baseRegs.reduce((sum, r) => sum + (Array.isArray(r.categories) ? r.categories.filter(cat => !catIds.includes(cat.type) && (activeTab === 'approved' ? ((cat.status || '').trim().toUpperCase() === 'APPROVED' || (r.evaluation_status || '').trim().toUpperCase() === 'APPROVED') : true)).length : 0), 0);
                                        return miscCount > 0 ? <option value="misc">Miscellaneous ({miscCount})</option> : null;
                                    })()}
                                </select>
                            </div>

                            {/* Award filter — Approved tab only */}
                            {activeTab === 'approved' && (
                                <div className="admin-filters-grid" style={{ marginTop: 8 }}>
                                    <select
                                        className="admin-select-sm"
                                        value={awardFilter}
                                        onChange={(e) => setAwardFilter(e.target.value)}
                                        id="filter-award"
                                        style={{ minWidth: 200 }}
                                    >
                                        <option value="all">All Awards ({baseRegs.reduce((sum, r) => sum + (Array.isArray(r.categories) ? r.categories.filter(c => ((c.status || '').trim().toUpperCase() === 'APPROVED' || (r.evaluation_status || '').trim().toUpperCase() === 'APPROVED')).length : 0), 0)})</option>
                                        <option value="momento">Getting Momento ({baseRegs.reduce((sum, r) => sum + (Array.isArray(r.categories) ? r.categories.filter(c => ((c.status || '').trim().toUpperCase() === 'APPROVED' || (r.evaluation_status || '').trim().toUpperCase() === 'APPROVED') && c.award?.includes('momento')).length : 0), 0)})</option>
                                        <option value="certificate">Getting Certificate ({baseRegs.reduce((sum, r) => sum + (Array.isArray(r.categories) ? r.categories.filter(c => ((c.status || '').trim().toUpperCase() === 'APPROVED' || (r.evaluation_status || '').trim().toUpperCase() === 'APPROVED') && c.award?.includes('certificate')).length : 0), 0)})</option>
                                        <option value="none">Award Not Yet Assigned ({baseRegs.reduce((sum, r) => sum + (Array.isArray(r.categories) ? r.categories.filter(c => ((c.status || '').trim().toUpperCase() === 'APPROVED' || (r.evaluation_status || '').trim().toUpperCase() === 'APPROVED') && !c.award).length : 0), 0)})</option>
                                    </select>
                                </div>
                            )}

                            <div className="attend-filter-pills">
                                <button
                                    className={`attend-pill ${attendFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setAttendFilter('all')}
                                    id="filter-all"
                                >All ({baseRegs.length})</button>
                                <button
                                    className={`attend-pill attend-pill-present ${attendFilter === 'present' ? 'active' : ''}`}
                                    onClick={() => setAttendFilter('present')}
                                    id="filter-present"
                                >✅ Present ({baseRegs.filter(r => r.attended_at).length})</button>
                                <button
                                    className={`attend-pill attend-pill-absent ${attendFilter === 'absent' ? 'active' : ''}`}
                                    onClick={() => setAttendFilter('absent')}
                                    id="filter-absent"
                                >⬜ Absent ({baseRegs.filter(r => !r.attended_at).length})</button>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button
                                    className="btn btn-sm"
                                    style={{ background: '#0f9d58', color: 'white', border: 'none', gap: 6 }}
                                    onClick={handleExportCSV}
                                    disabled={filtered.length === 0}
                                    id="btn-export-csv"
                                    title={filtered.length === 0 ? 'No data to export' : `Export ${filtered.length} visible rows to Excel (CSV)`}
                                >
                                    <Download size={14} /> Export Filtered
                                </button>
                                <button
                                    className="btn btn-sm"
                                    style={{ background: '#34a853', color: 'white', border: 'none', gap: 6 }}
                                    onClick={handleExportAllCSV}
                                    disabled={regs.length === 0}
                                    id="btn-export-all"
                                    title={regs.length === 0 ? 'No registrations to export' : `Export all ${regs.length} registrations to Excel (CSV)`}
                                >
                                    <Database size={14} /> Export All
                                </button>
                                {activeTab === 'approved' && (
                                    <>
                                        <button
                                            className="btn btn-sm"
                                            style={{ background: '#1a73e8', color: 'white', border: 'none', gap: 6 }}
                                            onClick={() => setShowSendTicketsModal(true)}
                                            disabled={baseRegs.length === 0}
                                            id="btn-send-tickets"
                                            title={baseRegs.length === 0 ? 'No approved registrations to send tickets to' : `Send tickets to ${baseRegs.length} approved participants`}
                                        >
                                            <Mail size={14} /> Send Tickets
                                        </button>
                                    </>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <button
                                    className="btn btn-sm"
                                    style={{ background: '#1a73e8', color: 'white', border: 'none', gap: 6, fontWeight: 700 }}
                                    onClick={() => setShowAddAwardeeModal(true)}
                                    id="btn-add-awardee"
                                    title="Manually add an awardee with Approved status"
                                >
                                    <PlusCircle size={14} /> Add Awardee
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={load} id="btn-refresh">
                                    <RefreshCw size={14} /> Refresh
                                </button>
                            </div>
                        </div>

                        {(deleteMsg || ticketMsg) && (
                            <div className={`admin-alert mb-0 ${(deleteMsg || ticketMsg).startsWith('✅') ? 'admin-alert-success' : 'admin-alert-error'
                                }`}>
                                {deleteMsg || ticketMsg}
                            </div>
                        )}

                        {/* Table */}
                        {filtered.length === 0 ? (
                            <div className="admin-empty">
                                <Users size={40} />
                                <p>{search ? 'No registrations match your search.' : 'No registrations yet.'}</p>
                            </div>
                        ) : (
                            <div className="admin-table-wrap">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th className="admin-th-num">#</th>
                                            <th onClick={() => toggleSort('name')} className="sortable">
                                                Name <SortIcon col="name" />
                                            </th>
                                            {activeTab !== 'approved' && (
                                                <th onClick={() => toggleSort('email')} className="sortable">
                                                    Email <SortIcon col="email" />
                                                </th>
                                            )}
                                            <th onClick={() => toggleSort('uid')} className="sortable">
                                                {activeTab === 'approved' ? 'UID / Email' : 'UID / EID'} <SortIcon col="uid" />
                                            </th>
                                            <th>Department & Cluster</th>
                                            <th>{activeTab === 'approved' ? 'Approved Categories' : 'Categories Applied'}</th>
                                            <th>Title / Name</th>
                                            {activeTab !== 'approved' && (
                                                <th onClick={() => toggleSort('created_at')} className="sortable">
                                                    Registered At <SortIcon col="created_at" />
                                                </th>
                                            )}
                                            <th>Ticket Sent</th>
                                            {activeTab !== 'approved' && <th>Evaluation</th>}
                                            <th>Award / Grant</th>
                                            <th>Attendance</th>
                                            <th className="admin-th-action">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginated.map((r, i) => (
                                            <tr key={r.id} className={`admin-row ${r.attended_at ? 'admin-row-present' : ''}`}>
                                                <td className="admin-td-num">{(safePage - 1) * pageSize + i + 1}</td>
                                                <td className="admin-td-name">
                                                    <div className={`admin-avatar ${r.attended_at ? 'admin-avatar-present' : ''}`}>
                                                        {r.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span>{r.name}</span>
                                                </td>
                                                {activeTab !== 'approved' && (
                                                    <td className="admin-td-email">{r.email}</td>
                                                )}
                                                <td>
                                                    {r.uid || <span className="text-muted">—</span>}
                                                    {activeTab === 'approved' && (
                                                        <div style={{ fontSize: '11px', color: '#5f6368', marginTop: '2px' }}>{r.email}</div>
                                                    )}
                                                </td>
                                                <td>
                                                    {r.department || <span className="admin-td-empty">—</span>}
                                                    {r.cluster && <><br /><small className="text-muted">{r.cluster}</small></>}
                                                </td>
                                                <td>
                                                    {Array.isArray(r.categories) && r.categories.length > 0 ? (
                                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '180px' }}>
                                                            {r.categories
                                                                .filter(cat => {
                                                                    const catFilterMatch =
                                                                        catFilter === 'all' ? true :
                                                                        catFilter === 'misc' ? !allCategories.some(ac => ac.id === cat.type) :
                                                                        cat.type === catFilter;
                                                                    const approvedMatch = activeTab === 'approved' ? cat.status === 'Approved' : true;
                                                                    return catFilterMatch && approvedMatch;
                                                                })
                                                                .map((cat, idx) => (
                                                                <span key={idx} style={{
                                                                    padding: '2px 6px',
                                                                    background: activeTab === 'approved' ? '#e6f4ea' : '#f1f3f4',
                                                                    color: activeTab === 'approved' ? '#137333' : '#3c4043',
                                                                    border: `1px solid ${activeTab === 'approved' ? '#ceead6' : '#dadce0'}`,
                                                                    borderRadius: '4px', fontSize: '11px', whiteSpace: 'nowrap', fontWeight: activeTab === 'approved' ? 600 : 400
                                                                }}>
                                                                    {(cat.type || '').charAt(0).toUpperCase() + (cat.type || '').slice(1)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">—</span>
                                                    )}
                                                </td>
                                                {/* Title / Name column */}
                                                <td style={{ maxWidth: 200 }}>
                                                    {Array.isArray(r.categories) && r.categories.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                                            {r.categories
                                                                .filter(cat => {
                                                                    const catFilterMatch =
                                                                        catFilter === 'all' ? true :
                                                                        catFilter === 'misc' ? !allCategories.some(ac => ac.id === cat.type) :
                                                                        cat.type === catFilter;
                                                                    const approvedMatch = activeTab === 'approved' ? cat.status === 'Approved' : true;
                                                                    return catFilterMatch && approvedMatch;
                                                                })
                                                                .map((cat, idx) => {
                                                                    const nameField = CAT_NAME_FIELD[cat.type];
                                                                    const nameVal = nameField && cat.data ? cat.data[nameField] : null;
                                                                    return nameVal ? (
                                                                        <span key={idx} title={nameVal} style={{
                                                                            fontSize: '12px', color: '#202124',
                                                                            display: 'block', whiteSpace: 'nowrap',
                                                                            overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200
                                                                        }}>{nameVal}</span>
                                                                    ) : <span key={idx} className="text-muted" style={{ fontSize: '12px' }}>—</span>;
                                                                })
                                                            }
                                                        </div>
                                                    ) : <span className="text-muted">—</span>}
                                                </td>
                                                {activeTab !== 'approved' && (
                                                    <td className="admin-td-date">{formatDate(r.created_at)}</td>
                                                )}
                                                <td>
                                                    {r.ticket_sent_at ? (
                                                        <span className="text-success" title={formatDate(r.ticket_sent_at)}>✅ Yes</span>
                                                    ) : (
                                                        <span className="text-muted">❌ No</span>
                                                    )}
                                                </td>
                                                {activeTab !== 'approved' && (
                                                    <td>
                                                        {Array.isArray(r.categories) && r.categories
                                                            .map((cat, idx) => ({ cat, idx }))
                                                            .filter(({ cat }) =>
                                                                catFilter === 'all' ? true :
                                                                catFilter === 'misc' ? !allCategories.some(ac => ac.id === cat.type) :
                                                                cat.type === catFilter
                                                            )
                                                            .map(({ cat, idx }) => (
                                                            <div key={idx} style={{ marginBottom: '6px' }}>
                                                                <div style={{ fontSize: '11px', color: '#5f6368', marginBottom: '2px', textTransform: 'capitalize' }}>
                                                                    {cat.type}
                                                                </div>
                                                                <select
                                                                    className={`admin-select-sm evaluation-select evaluation-status-${(cat.status || r.evaluation_status || 'Pending').toLowerCase()}`}
                                                                    value={cat.status || r.evaluation_status || 'Pending'}
                                                                    onChange={(e) => handleCategoryEvaluationUpdate(r.id, idx, e.target.value)}
                                                                    style={{
                                                                        fontSize: '11px',
                                                                        padding: '4px 6px',
                                                                        borderRadius: '4px',
                                                                        border: '1px solid #dadce0',
                                                                        background: cat.status === 'Approved' ? '#e6f4ea' : cat.status === 'Rejected' ? '#fce8e6' : '#fff',
                                                                        color: cat.status === 'Approved' ? '#137333' : cat.status === 'Rejected' ? '#c5221f' : '#202124',
                                                                        fontWeight: 600,
                                                                        cursor: 'pointer',
                                                                        width: '100%'
                                                                    }}
                                                                >
                                                                    <option value="Pending">🕒 Pending</option>
                                                                    <option value="Approved">✅ Approved</option>
                                                                    <option value="Rejected">❌ Rejected</option>
                                                                </select>
                                                            </div>
                                                        ))}
                                                    </td>
                                                )}
                                                <td>
                                                    {Array.isArray(r.categories) && r.categories
                                                        .map((cat, idx) => ({ cat, idx }))
                                                        .filter(({ cat }) => {
                                                            const catFilterMatch =
                                                                catFilter === 'all' ? true :
                                                                catFilter === 'misc' ? !allCategories.some(ac => ac.id === cat.type) :
                                                                cat.type === catFilter;
                                                            const approvedMatch = activeTab === 'approved' ? cat.status === 'Approved' : true;
                                                            return catFilterMatch && approvedMatch;
                                                        })
                                                        .map(({ cat, idx }) => (
                                                        <div key={idx} style={{ marginBottom: '6px' }}>
                                                            <div style={{ fontSize: '11px', color: '#5f6368', marginBottom: '2px', textTransform: 'capitalize' }}>
                                                                {cat.type}
                                                            </div>
                                                            <select
                                                                className="admin-select-sm"
                                                                value={cat.award || ''}
                                                                onChange={(e) => handleCategoryAwardUpdate(r.id, idx, e.target.value)}
                                                                style={{
                                                                    fontSize: '11px',
                                                                    padding: '4px 6px',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid #dadce0',
                                                                    background: cat.award ? '#f8f9fa' : '#fff',
                                                                    cursor: 'pointer',
                                                                    width: '100.2%'
                                                                }}
                                                            >
                                                                <option value="">— Select Award —</option>
                                                                <option value="certificate">Certificate</option>
                                                                <option value="momento">Momento</option>
                                                                {/* <option value="medal">Medal</option> */}
                                                                {/* <option value="badge">Badge</option>
                                                                <option value="trophy">Trophy</option>
                                                                <option value="momento+certificate">Momento + Certificate</option>
                                                                <option value="medal+certificate">Medal + Certificate</option>
                                                                <option value="badge+certificate">Badge + Certificate</option>
                                                                <option value="trophy+certificate">Trophy + Certificate</option> */}
                                                            </select>
                                                        </div>
                                                    ))}
                                                </td>
                                                <td>
                                                    {r.attended_at ? (
                                                        <div className="attend-badge attend-badge-present">
                                                            <span>✅ Present</span>
                                                            <span className="attend-badge-time">
                                                                {new Date(r.attended_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="attend-badge attend-badge-absent">⬜ Absent</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => setViewTarget(r)}
                                                            title={`View details for ${r.name}`}
                                                            style={{ padding: '0 8px' }}
                                                        >
                                                            <AlignLeft size={14} /> View
                                                        </button>
                                                        {activeTab !== 'approved' && (
                                                            <button
                                                                className="btn btn-danger btn-sm admin-delete-btn"
                                                                onClick={() => setDeleteTarget({ id: r.id, name: r.name, email: r.email })}
                                                                title={`Delete ${r.name}`}
                                                                id={`btn-delete-${r.id}`}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="admin-table-footer">
                            <div className="pagination-info">
                                Showing <strong>{(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong>
                                {filtered.length !== baseRegs.length && <span> (filtered from {baseRegs.length})</span>}
                            </div>

                            {/* Pagination controls */}
                            {totalPages > 1 && (
                                <div className="pagination-controls">
                                    <button
                                        className="pg-btn"
                                        onClick={() => setPage(1)}
                                        disabled={safePage === 1}
                                        title="First page"
                                    >&laquo;</button>
                                    <button
                                        className="pg-btn"
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        disabled={safePage === 1}
                                    >&lsaquo; Prev</button>

                                    {/* Page number pills */}
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
                                        .reduce((acc, p, idx, arr) => {
                                            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                                            acc.push(p);
                                            return acc;
                                        }, [])
                                        .map((p, idx) =>
                                            p === '...' ? (
                                                <span key={`ellipsis-${idx}`} className="pg-ellipsis">&hellip;</span>
                                            ) : (
                                                <button
                                                    key={p}
                                                    className={`pg-btn pg-num ${safePage === p ? 'active' : ''}`}
                                                    onClick={() => setPage(p)}
                                                >{p}</button>
                                            )
                                        )
                                    }

                                    <button
                                        className="pg-btn"
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={safePage === totalPages}
                                    >Next &rsaquo;</button>
                                    <button
                                        className="pg-btn"
                                        onClick={() => setPage(totalPages)}
                                        disabled={safePage === totalPages}
                                        title="Last page"
                                    >&raquo;</button>
                                </div>
                            )}

                            {/* Per-page selector */}
                            <div className="pagination-size">
                                <label htmlFor="page-size-select">Rows:</label>
                                <select
                                    id="page-size-select"
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                                >
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── FACULTY MENTORS TAB ── */}
                {activeTab === 'mentors' && (
                    <div className="admin-card card">
                        <div className="admin-card-header" style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2><UserPlus size={18} /> Faculty Mentors List</h2>
                                    <p>Showing <strong>{facultyMentors.length}</strong> mentorship entries from <strong>{uniqueMentorCodes.size}</strong> unique faculty members.</p>
                                </div>
                                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <div className="admin-view-toggle">
                                        <button 
                                            className={`toggle-btn ${mentorView === 'all' ? 'active' : ''}`}
                                            onClick={() => setMentorView('all')}
                                        >
                                            Detailed
                                        </button>
                                        <button 
                                            className={`toggle-btn ${mentorView === 'unique' ? 'active' : ''}`}
                                            onClick={() => setMentorView('unique')}
                                        >
                                            Unique Summary
                                        </button>
                                    </div>
                                    <button className="btn btn-secondary btn-sm" onClick={() => {
                                        if (mentorView === 'unique') {
                                            const doc = new jsPDF('landscape');
                                            doc.setFontSize(18);
                                            doc.text('Faculty Mentors Recognition Summary', 14, 20);
                                            
                                            doc.setFontSize(10);
                                            doc.setTextColor(100);
                                            const summaryText = `Total Unique Mentors: ${uniqueMentorsList.length} | Total Student Projects Mentored: ${facultyMentors.length}`;
                                            doc.text(summaryText, 14, 28);
                                            doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 34);

                                            const tableColumn = ["#", "Faculty Name", "E-Code", "Students Mentored", "Categories", "Projects & Students"];
                                            const tableRows = [];

                                            uniqueMentorsList.forEach((u, idx) => {
                                                const categories = [...new Set(u.mentorships.map(m => m.category))].join(', ');
                                                const projects = u.mentorships.map(m => `${m.studentName}: ${m.projectTitle}`).join('\n');
                                                tableRows.push([
                                                    idx + 1,
                                                    u.facultyName || 'N/A',
                                                    u.facultyEcode || 'N/A',
                                                    u.mentorships.length.toString(),
                                                    categories,
                                                    projects
                                                ]);
                                            });

                                            autoTable(doc, {
                                                startY: 42,
                                                head: [tableColumn],
                                                body: tableRows,
                                                theme: 'grid',
                                                headStyles: { fillColor: [26, 115, 232], textColor: [255, 255, 255], fontStyle: 'bold' },
                                                alternateRowStyles: { fillColor: [248, 249, 250] },
                                                styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak', valign: 'middle' },
                                                columnStyles: {
                                                    0: { cellWidth: 10, halign: 'center' },
                                                    1: { cellWidth: 40, fontStyle: 'bold' },
                                                    2: { cellWidth: 25 },
                                                    3: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
                                                    4: { cellWidth: 40 },
                                                    5: { cellWidth: 'auto' }
                                                }
                                            });

                                            doc.save(`Faculty_Mentor_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
                                        } else {
                                            const dataToExport = facultyMentors.map(m => ({
                                                'Faculty Name': m.facultyName,
                                                'Faculty E-Code': m.facultyEcode,
                                                'Project Title': m.projectTitle,
                                                'Student Name': m.studentName,
                                                'Category': m.category
                                            }));
                                            exportToCSV(dataToExport, `faculty_mentors_list_${new Date().toLocaleDateString()}.csv`);
                                        }
                                    }}>
                                        <Download size={14} /> Export {mentorView === 'all' ? 'List' : 'Summary as PDF'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="admin-table-wrap">
                            {mentorView === 'all' ? (
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th className="admin-td-num">#</th>
                                            <th>Faculty Name</th>
                                            <th>Faculty E-Code</th>
                                            <th style={{ minWidth: 200 }}>Title / Name</th>
                                            <th>Nominated By (Student)</th>
                                            <th>Nominated Category</th>
                                            <th>Award / Grant</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {facultyMentors.length > 0 ? (
                                            facultyMentors.map((m, idx) => (
                                                <tr key={m.id} className="admin-row">
                                                    <td className="admin-td-num">{idx + 1}</td>
                                                    <td style={{ fontWeight: 600, color: '#202124' }}>{m.facultyName}</td>
                                                    <td><span className="badge badge-secondary" style={{ background: '#f1f3f4', color: '#5f6368', border: '1px solid #dadce0' }}>{m.facultyEcode}</span></td>
                                                    <td style={{ fontSize: '12px', color: '#5f6368', maxWidth: 250 }}>{m.projectTitle}</td>
                                                    <td className="admin-td-name">{m.studentName}</td>
                                                    <td>
                                                        <span style={{ 
                                                            padding: '2px 8px', background: '#e8f0fe', color: '#1967d2', 
                                                            borderRadius: '12px', fontSize: '11px', fontWeight: 600
                                                        }}>
                                                            {m.category}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <select
                                                            className="admin-select-sm"
                                                            value={m.facultyAward || ''}
                                                            onChange={(e) => handleFacultyAwardUpdate(m.regId, m.categoryIndex, e.target.value)}
                                                            style={{
                                                                fontSize: '11px',
                                                                padding: '4px 6px',
                                                                borderRadius: '4px',
                                                                border: '1px solid #dadce0',
                                                                background: m.facultyAward ? '#fffbf2' : '#fff',
                                                                cursor: 'pointer',
                                                                width: '100%'
                                                            }}
                                                        >
                                                            <option value="">— Select Faculty Award —</option>
                                                            <option value="certificate">Certificate</option>
                                                            <option value="momento">Momento</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: '#5f6368' }}>
                                                    <div style={{ marginBottom: 12 }}><AlertTriangle size={32} style={{ opacity: 0.3 }} /></div>
                                                    No faculty mentors found in approved nominations.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th className="admin-td-num">#</th>
                                            <th>Faculty Name</th>
                                            <th>Faculty E-Code</th>
                                            <th>Total Students</th>
                                            <th>Mentored Categories</th>
                                            <th style={{ minWidth: 300 }}>Projects / Student Names</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {uniqueMentorsList.length > 0 ? (
                                            uniqueMentorsList.map((m, idx) => (
                                                <tr key={m.facultyEcode} className="admin-row">
                                                    <td className="admin-td-num">{idx + 1}</td>
                                                    <td style={{ fontWeight: 600, color: '#202124' }}>{m.facultyName}</td>
                                                    <td><span className="badge badge-secondary" style={{ background: '#f1f3f4', color: '#5f6368', border: '1px solid #dadce0' }}>{m.facultyEcode}</span></td>
                                                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{m.mentorships.length}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                                            {[...new Set(m.mentorships.map(x => x.category))].map(cat => (
                                                                <span key={cat} style={{ 
                                                                    padding: '2px 6px', background: '#f1f3f4', color: '#5f6368', 
                                                                    borderRadius: '8px', fontSize: '10px', fontWeight: 600
                                                                }}>
                                                                    {cat}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '11px', lineHeight: '1.4', color: '#5f6368' }}>
                                                            {m.mentorships.map((ms, i) => (
                                                                <div key={i} style={{ marginBottom: 4, borderBottom: i < m.mentorships.length -1 ? '1px solid #f1f3f4' : 'none', paddingBottom: 2 }}>
                                                                    <strong>{ms.studentName}:</strong> {ms.projectTitle}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" style={{ textAlign: 'center', padding: '40px 0', color: '#5f6368' }}>
                                                    <div style={{ marginBottom: 12 }}><AlertTriangle size={32} style={{ opacity: 0.3 }} /></div>
                                                    No faculty mentors found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {/* ── ATTENDANCE TAB ── */}
                {activeTab === 'attendance' && (
                    <div className="admin-card card attendance-panel">
                        <div className="admin-card-header">
                            <h2><ScanLine size={18} /> Take Attendance</h2>
                            <p>Enter the 4-digit ticket code (e.g. <strong>A1B2</strong>) printed on each student's ticket email. The system will mark them present instantly.</p>
                        </div>

                        {/* Scanner Form */}
                        <form className="attendance-scanner" onSubmit={handleScan}>
                            <div className="attendance-input-wrap">
                                <div className="attendance-input-prefix">EVT-</div>
                                <input
                                    ref={ticketInputRef}
                                    type="text"
                                    className="attendance-input"
                                    placeholder="A1B2"
                                    value={ticketInput}
                                    onChange={(e) => setTicketInput(e.target.value.toUpperCase().slice(0, 4))}
                                    maxLength={4}
                                    autoComplete="off"
                                    spellCheck={false}
                                    id="attendance-ticket-input"
                                    disabled={scanLoading}
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn attendance-scan-btn"
                                disabled={scanLoading || ticketInput.trim().length !== 4}
                                id="btn-mark-attendance"
                            >
                                {scanLoading
                                    ? <><span className="spinner" /> Checking…</>
                                    : <><UserCheck size={18} /> Mark Present</>}
                            </button>
                        </form>

                        {/* Scan Result */}
                        {scanResult && (
                            <div className={`scan-result scan-result-${scanResult.type}`}>
                                {scanResult.type === 'success' && (
                                    <>
                                        <div className="scan-result-icon">✅</div>
                                        <div className="scan-result-body">
                                            <div className="scan-result-title">Marked Present!</div>
                                            <div className="scan-result-name">{scanResult.data?.name}</div>
                                            <div className="scan-result-meta">
                                                {scanResult.data?.email} &bull; {scanResult.data?.department || 'N/A'} ({scanResult.data?.cluster || 'N/A'})
                                            </div>
                                            <div className="scan-result-code">{scanResult.data?.ticketCode}</div>
                                        </div>
                                    </>
                                )}
                                {scanResult.type === 'already' && (
                                    <>
                                        <div className="scan-result-icon">⚠️</div>
                                        <div className="scan-result-body">
                                            <div className="scan-result-title">Already Present!</div>
                                            <div className="scan-result-name">{scanResult.data?.name}</div>
                                            <div className="scan-result-meta">
                                                {scanResult.data?.email} &bull; {scanResult.data?.department || 'N/A'} ({scanResult.data?.cluster || 'N/A'})
                                            </div>
                                            <div className="scan-result-code">{scanResult.data?.ticketCode} — duplicate scan</div>
                                        </div>
                                    </>
                                )}
                                {scanResult.type === 'error' && (
                                    <>
                                        <div className="scan-result-icon">❌</div>
                                        <div className="scan-result-body">
                                            <div className="scan-result-title">Not Found</div>
                                            <div className="scan-result-meta">{scanResult.message}</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Recent scan log */}
                        {scanLog.length > 0 && (
                            <div className="scan-log">
                                <div className="scan-log-header">Recent Scans</div>
                                {scanLog.map((entry, i) => (
                                    <div key={i} className={`scan-log-row scan-log-${entry.type}`}>
                                        <span className="scan-log-icon">
                                            {entry.type === 'success' ? '✅' : entry.type === 'already' ? '⚠️' : '❌'}
                                        </span>
                                        <span className="scan-log-code">EVT-{entry.code}</span>
                                        <span className="scan-log-name">{entry.name || '—'}</span>
                                        <span className="scan-log-time">
                                            {entry.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {scanLog.length === 0 && (
                            <div className="attendance-empty">
                                <ScanLine size={40} style={{ opacity: 0.25 }} />
                                <p>No scans yet. Enter a ticket code above to begin.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── ANALYTICS TAB ── */}
                {activeTab === 'analytics' && (
                    <div className="admin-card card">
                        <div style={{ padding: '24px' }}>
                            <div className="analytics-summary-title">
                                <BarChart2 size={16} /> Category Application Insights
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                {[
                                    { title: "Total Received", isApproved: false },
                                    { title: "Approved Only", isApproved: true }
                                ].map(({ title, isApproved }) => {
                                    let filteredRegs = regs;
                                    if (isApproved) {
                                        filteredRegs = regs.filter(r => {
                                            const glob = (r.evaluation_status || '').trim().toUpperCase();
                                            const hasApprovedCat = Array.isArray(r.categories) && r.categories.some(c => (c.status || '').trim().toUpperCase() === 'APPROVED');
                                            return glob === 'APPROVED' || hasApprovedCat;
                                        });
                                    }

                                    const allCategoryEntries = filteredRegs.flatMap(r => {
                                        if (!Array.isArray(r.categories)) return [];
                                        if (!isApproved) return r.categories;
                                        return r.categories.filter(c => 
                                            (c.status || '').trim().toUpperCase() === 'APPROVED' || 
                                            (r.evaluation_status || '').trim().toUpperCase() === 'APPROVED'
                                        );
                                    });
                                    const totalCategoryApplications = allCategoryEntries.length;

                                    const categoryStats = allCategories.map(cat => ({
                                        ...cat,
                                        count: allCategoryEntries.filter(c => (c.type || '').toLowerCase() === cat.id.toLowerCase()).length
                                    }));

                                    const knownCount = categoryStats.reduce((s, c) => s + c.count, 0);
                                    const othersCount = totalCategoryApplications - knownCount;

                                    return (
                                        <div key={title}>
                                            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#3c4043', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}> 
                                                {isApproved ? <CheckCircle size={16} color="#1a73e8" /> : null} {title}
                                            </h3>
                                            <div className="category-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                                                <div className="category-stat-card total-apps-card" style={{ cursor: 'default', background: isApproved ? '#1967d2' : undefined, borderColor: isApproved ? '#aecbfa' : undefined }}>
                                                    <div className="category-stat-header">
                                                        <div className="category-stat-icon-wrap" style={{ background: isApproved ? '#d2e3fc' : undefined }}>📊</div>
                                                        <div className="category-stat-value" style={{ color: isApproved ? '#e8f0fe' : undefined }}>{totalCategoryApplications}</div>
                                                    </div>
                                                    <div className="category-stat-label">Total {isApproved ? 'Approved' : 'Nominations'}</div>
                                                    <div className="category-stat-subtext">Sum of {isApproved ? 'approved' : 'all'} entries</div>
                                                </div>

                                                {categoryStats.map(cat => (
                                                    <div key={cat.id} className="category-stat-card">
                                                        <div className="category-stat-header">
                                                            <div className="category-stat-icon-wrap">{cat.icon}</div>
                                                            <div className="category-stat-value">{cat.count}</div>
                                                        </div>
                                                        <div className="category-stat-label">{cat.label}</div>
                                                        <div className="category-stat-subtext">{isApproved ? 'Approved' : 'Registrations'}</div>
                                                    </div>
                                                ))}

                                                {othersCount > 0 && (
                                                    <div
                                                        className="category-stat-card"
                                                        style={{
                                                            opacity: 1,
                                                            border: '1.5px dashed #f29900',
                                                            background: '#fffbf2',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => {
                                                            setActiveTab(isApproved ? 'approved' : 'registrations');
                                                            setCatFilter('misc');
                                                            // Small delay to allow tab to switch
                                                            setTimeout(() => {
                                                                document.getElementById('filter-category')?.scrollIntoView({ behavior: 'smooth' });
                                                            }, 100);
                                                        }}
                                                        title={`Click to view these ${isApproved ? 'approved ' : ''}entries`}
                                                    >
                                                        <div className="category-stat-header">
                                                            <div className="category-stat-icon-wrap" style={{ background: '#fef3e2' }}>❓</div>
                                                            <div className="category-stat-value" style={{ color: '#ea8600' }}>{othersCount}</div>
                                                        </div>
                                                        <div className="category-stat-label">Misc / Other</div>
                                                        <div className="category-stat-subtext">Find uncategorized</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="admin-table-toolbar" style={{ borderBottom: '1px solid #e8eaed', paddingBottom: 16, paddingLeft: 0, paddingRight: 0, marginTop: 40 }}>
                                <h2 style={{ fontSize: 18, margin: 0, fontWeight: 600, color: '#202124', display: 'flex', alignItems: 'center' }}>
                                    <BarChart2 size={20} style={{ marginRight: 8 }} /> Cluster Cross-Tabulation
                                </h2>
                            </div>
                            <p style={{ color: '#5f6368', fontSize: 14, margin: '16px 0 24px 0' }}>Detailed breakdown of category registrations across different student clusters.</p>

                            {(() => {
                                const catIds = allCategories.map(c => c.id);
                                const clustersToShow = uniqueClusters.length > 0 ? uniqueClusters : ['N/A'];
                                const tableData = clustersToShow.map(cluster => {
                                    const cRegs = regs.filter(r => (r.cluster || 'N/A') === cluster);
                                    const row = { Cluster: cluster };
                                    catIds.forEach(catId => {
                                        const count = cRegs.filter(r => Array.isArray(r.categories) && r.categories.some(c => c.type === catId)).length;
                                        row[catId] = count;
                                    });
                                    row.TotalParticipants = cRegs.length;
                                    return row;
                                });

                                const grandTotal = { Cluster: 'Grand Total', TotalParticipants: regs.length };
                                catIds.forEach(catId => {
                                    grandTotal[catId] = regs.filter(r => Array.isArray(r.categories) && r.categories.some(c => c.type === catId)).length;
                                });

                                return (
                                    <div className="admin-table-wrap">
                                        <table className="admin-table">
                                            <thead style={{ background: '#f8f9fa' }}>
                                                <tr>
                                                    <th style={{ width: 250 }}>Cluster Name</th>
                                                    {allCategories.map(c => <th key={c.id} style={{ textAlign: 'center' }}>{c.label}</th>)}
                                                    <th style={{ textAlign: 'center', borderLeft: '2px solid #e8eaed', fontWeight: 700, minWidth: 120 }}>Total Persons</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {tableData.map(row => (
                                                    <tr key={row.Cluster} className="admin-row">
                                                        <td style={{ fontWeight: 600, color: '#3c4043' }}>{row.Cluster}</td>
                                                        {catIds.map(c => (
                                                            <td key={c} style={{ textAlign: 'center', color: row[c] > 0 ? '#1a73e8' : '#bdc1c6', fontWeight: row[c] > 0 ? 600 : 400 }}>
                                                                {row[c] > 0 ? row[c] : '-'}
                                                            </td>
                                                        ))}
                                                        <td style={{ textAlign: 'center', borderLeft: '2px solid #e8eaed', fontWeight: 600, color: '#3c4043' }}>{row.TotalParticipants}</td>
                                                    </tr>
                                                ))}
                                                <tr style={{ background: '#e8f0fe', borderTop: '2px solid #1a73e8' }}>
                                                    <td style={{ fontWeight: 700, color: '#1a73e8', padding: '16px' }}>Grand Total</td>
                                                    {catIds.map(c => (
                                                        <td key={c} style={{ textAlign: 'center', fontWeight: 700, color: '#1a73e8' }}>{grandTotal[c]}</td>
                                                    ))}
                                                    <td style={{ textAlign: 'center', borderLeft: '2px solid #1a73e8', fontWeight: 800, color: '#1a73e8', fontSize: 16 }}>{grandTotal.TotalParticipants}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* ── EVENT EDITOR TAB ── */}
                {activeTab === 'event' && event && (
                    <div className="admin-card card">
                        <div className="admin-card-header">
                            <h2><Edit3 size={18} /> Edit Event Details</h2>
                            <p>Changes are saved directly to the database and reflected on the public page instantly.</p>
                        </div>
                        <EventEditor event={event} onSaved={(updated) => setEvent(updated)} />
                    </div>
                )}
            </main>

            {/* ── Delete Confirmation Modal ── */}
            {deleteTarget && (
                <ConfirmModal
                    name={deleteTarget.name}
                    email={deleteTarget.email}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                    loading={deleting}
                />
            )}

            {viewTarget && (
                <ViewDetailsModal
                    registration={viewTarget}
                    onCancel={() => setViewTarget(null)}
                    onUpdateStatus={handleEvaluationUpdate}
                    onUpdateCategoryStatus={handleCategoryEvaluationUpdate}
                />
            )}

            {showSendTicketsModal && (
                <SendTicketsModal
                    totalCount={approvedRegs.length}
                    onConfirm={handleSendTickets}
                    onCancel={() => !sendingTickets && setShowSendTicketsModal(false)}
                    loading={sendingTickets}
                />
            )}

            {showAddAwardeeModal && (
                <AddAwardeeModal
                    onClose={() => setShowAddAwardeeModal(false)}
                    onAdded={handleAwardeeAdded}
                />
            )}
        </div>
    );
}
