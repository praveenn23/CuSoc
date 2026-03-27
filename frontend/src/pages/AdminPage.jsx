import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Users, Ticket, BarChart2, LogOut, Trash2, RefreshCw,
    Search, Edit3, Save, X, ChevronDown, ChevronUp, AlertTriangle,
    CheckCircle, Calendar, MapPin, Clock, AlignLeft, Hash, Mail,
    ScanLine, UserCheck, UserPlus, Building2, Link, Palette,
} from 'lucide-react';
import {
    fetchAdminStats, fetchRegistrations, deleteRegistration,
    fetchAdminEvent, updateAdminEvent, sendTicketEmails, markAttendance,
    updateEvaluation,
} from '../services/adminApi';
import './AdminPage.css';

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
                    This will send a <strong>formal ticket confirmation email</strong> to all{' '}
                    <strong>{totalCount} registered participants</strong>.
                    Each email includes their unique ticket number, event venue, timings, and instructions.
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
                    ⚠️ Participants who are already emailed will receive another copy. Confirm only once.
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
function ViewDetailsModal({ registration, onCancel, onUpdateStatus }) {
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
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Mail size={13}/> {registration.email}</span> &bull; 
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Hash size={13}/> {registration.uid}</span>
                        </div>
                        <div style={{ color: '#5f6368', fontSize: 14, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Building2 size={13}/> {registration.department} {registration.cluster ? `(${registration.cluster})` : ''}
                        </div>
                        <div style={{ color: '#5f6368', fontSize: 14, marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ fontWeight: 600 }}>Evaluation:</div>
                            <select 
                                className={`admin-select-sm evaluation-select`}
                                value={registration.evaluation_status || 'Pending'}
                                onChange={(e) => onUpdateStatus(registration.id, e.target.value)}
                                style={{
                                    fontSize: '13px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid #dadce0',
                                    background: registration.evaluation_status === 'Approved' ? '#e6f4ea' : registration.evaluation_status === 'Rejected' ? '#fce8e6' : '#fff',
                                    color: registration.evaluation_status === 'Approved' ? '#137333' : registration.evaluation_status === 'Rejected' ? '#c5221f' : '#202124',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value="Pending">🕒 Pending Review</option>
                                <option value="Approved">✅ Approved</option>
                                <option value="Rejected">❌ Rejected</option>
                            </select>
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
                                    <div style={{ background: '#f1f3f4', padding: '12px 16px', fontWeight: 600, borderBottom: '1px solid #e8eaed', textTransform: 'capitalize', color: '#202124' }}>
                                        {cat.type}
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

    // ── Attendance Scanner State ───────────────────────────────────────────────
    const [ticketInput, setTicketInput] = useState('');
    const [attendFilter, setAttendFilter] = useState('all');
    const [scanLoading, setScanLoading] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scanLog, setScanLog] = useState([]);
    const ticketInputRef = useRef(null);

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
            // Update regs in-place so presentCount (and all badges) update instantly
            setRegs((prev) => prev.map((r) =>
                r.id.slice(-4).toUpperCase() === code
                    ? { ...r, attended_at: new Date().toISOString() }
                    : r
            ));
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

    const filtered = regs
        .filter((r) => {
            const q = search.toLowerCase();
            const textMatch = (
                r.name.toLowerCase().includes(q) ||
                r.email.toLowerCase().includes(q) ||
                (r.uid || '').toLowerCase().includes(q) ||
                (r.department || '').toLowerCase().includes(q) ||
                (r.cluster || '').toLowerCase().includes(q)
            );
            const attendMatch =
                attendFilter === 'all' ? true :
                    attendFilter === 'present' ? !!r.attended_at :
                        !r.attended_at;
            return textMatch && attendMatch;
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
    useEffect(() => { setPage(1); }, [search, attendFilter, sortKey, sortAsc]);

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

    // ── Sort icon helper ───────────────────────────────────────────────────────
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
                        <Users size={16} /> Registrations
                        <span className="admin-tab-badge">{stats.totalRegistrations}</span>
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
                        className={`admin-tab ${activeTab === 'event' ? 'active' : ''}`}
                        onClick={() => setActiveTab('event')}
                        id="tab-event"
                    >
                        <Edit3 size={16} /> Edit Event
                    </button>
                </div>

                {/* ── REGISTRATIONS TAB ── */}
                {activeTab === 'registrations' && (
                    <div className="admin-card card">
                        {/* Toolbar */}
                        <div className="admin-table-toolbar">
                            <div className="admin-search-wrap">
                                <Search size={16} className="admin-search-icon" />
                                <input
                                    type="search"
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
                            {/* Attendance filter pills — counts from stats API (authoritative DB) */}
                            <div className="attend-filter-pills">
                                <button
                                    className={`attend-pill ${attendFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setAttendFilter('all')}
                                    id="filter-all"
                                >All ({stats?.totalRegistrations ?? regs.length})</button>
                                <button
                                    className={`attend-pill attend-pill-present ${attendFilter === 'present' ? 'active' : ''}`}
                                    onClick={() => setAttendFilter('present')}
                                    id="filter-present"
                                >✅ Present ({displayAttendedCount})</button>
                                <button
                                    className={`attend-pill attend-pill-absent ${attendFilter === 'absent' ? 'active' : ''}`}
                                    onClick={() => setAttendFilter('absent')}
                                    id="filter-absent"
                                >⬜ Absent ({(stats?.totalRegistrations ?? regs.length) - displayAttendedCount})</button>
                            </div>
                            <button
                                className="btn btn-sm"
                                style={{ background: '#1a73e8', color: 'white', border: 'none', gap: 6 }}
                                onClick={() => setShowSendTicketsModal(true)}
                                disabled={regs.length === 0}
                                id="btn-send-tickets"
                                title={regs.length === 0 ? 'No registrations to send tickets to' : `Send tickets to ${stats?.totalRegistrations ?? regs.length} participants`}
                            >
                                <Mail size={14} /> Send All Tickets
                            </button>
                            <button className="btn btn-secondary btn-sm" onClick={load} id="btn-refresh">
                                <RefreshCw size={14} /> Refresh
                            </button>
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
                                            <th onClick={() => toggleSort('email')} className="sortable">
                                                Email <SortIcon col="email" />
                                            </th>
                                            <th onClick={() => toggleSort('uid')} className="sortable">
                                                UID / EID <SortIcon col="uid" />
                                            </th>
                                            <th>Department & Cluster</th>
                                            <th>Categories Applied</th>
                                            <th onClick={() => toggleSort('created_at')} className="sortable">
                                                Registered At <SortIcon col="created_at" />
                                            </th>
                                            <th>Ticket Sent</th>
                                            <th>Evaluation</th>
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
                                                <td className="admin-td-email">{r.email}</td>
                                                <td>{r.uid || <span className="text-muted">—</span>}</td>
                                                <td>
                                                    {r.department || <span className="admin-td-empty">—</span>}
                                                    {r.cluster && <><br /><small className="text-muted">{r.cluster}</small></>}
                                                </td>
                                                <td>
                                                    {Array.isArray(r.categories) && r.categories.length > 0 ? (
                                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '180px' }}>
                                                            {r.categories.map((cat, idx) => (
                                                                <span key={idx} style={{
                                                                    padding: '2px 6px', background: '#f1f3f4', color: '#3c4043',
                                                                    border: '1px solid #dadce0', borderRadius: '4px', fontSize: '11px', whiteSpace: 'nowrap'
                                                                }}>
                                                                    {(cat.type || '').charAt(0).toUpperCase() + (cat.type || '').slice(1)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">—</span>
                                                    )}
                                                </td>
                                                <td className="admin-td-date">{formatDate(r.created_at)}</td>
                                                <td>
                                                    {r.ticket_sent_at ? (
                                                        <span className="text-success" title={formatDate(r.ticket_sent_at)}>✅ Yes</span>
                                                    ) : (
                                                        <span className="text-muted">❌ No</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <select 
                                                        className={`admin-select-sm evaluation-select evaluation-status-${(r.evaluation_status || 'Pending').toLowerCase()}`}
                                                        value={r.evaluation_status || 'Pending'}
                                                        onChange={(e) => handleEvaluationUpdate(r.id, e.target.value)}
                                                        style={{
                                                            fontSize: '12px',
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            border: '1px solid #dadce0',
                                                            background: r.evaluation_status === 'Approved' ? '#e6f4ea' : r.evaluation_status === 'Rejected' ? '#fce8e6' : '#fff',
                                                            color: r.evaluation_status === 'Approved' ? '#137333' : r.evaluation_status === 'Rejected' ? '#c5221f' : '#202124',
                                                            fontWeight: 600,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <option value="Pending">🕒 Pending</option>
                                                        <option value="Approved">✅ Approved</option>
                                                        <option value="Rejected">❌ Rejected</option>
                                                    </select>
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
                                                        <button
                                                            className="btn btn-danger btn-sm admin-delete-btn"
                                                            onClick={() => setDeleteTarget({ id: r.id, name: r.name, email: r.email })}
                                                            title={`Delete ${r.name}`}
                                                            id={`btn-delete-${r.id}`}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
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
                                {filtered.length !== regs.length && <span> (filtered from {regs.length})</span>}
                                {displayAttendedCount > 0 && (
                                    <span style={{ marginLeft: 8, color: '#137333', fontWeight: 600 }}>
                                        &bull; {displayAttendedCount} present
                                    </span>
                                )}
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
                />
            )}

            {showSendTicketsModal && (
                <SendTicketsModal
                    totalCount={regs.length}
                    onConfirm={handleSendTickets}
                    onCancel={() => !sendingTickets && setShowSendTicketsModal(false)}
                    loading={sendingTickets}
                />
            )}
        </div>
    );
}
