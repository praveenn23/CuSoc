import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Users, Ticket, BarChart2, LogOut, Trash2, RefreshCw,
    Search, Edit3, Save, X, ChevronDown, ChevronUp, AlertTriangle,
    CheckCircle, Calendar, MapPin, Clock, AlignLeft, Hash, Mail,
    ScanLine, UserCheck,
} from 'lucide-react';
import {
    fetchAdminStats, fetchRegistrations, deleteRegistration,
    fetchAdminEvent, updateAdminEvent, sendTicketEmails, markAttendance,
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

// ── Event Editor ──────────────────────────────────────────────────────────────
function EventEditor({ event, onSaved }) {
    const [form, setForm] = useState({ ...event });
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Keep form in sync when event prop changes
    useEffect(() => { setForm({ ...event }); }, [event]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setError(''); setSuccess('');
    };

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
            });
            setSuccess('Event updated successfully!');
            onSaved(data.event);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update event.');
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

                {/* Description */}
                <div className="form-group event-editor-full">
                    <label className="form-label" htmlFor="ev-desc">
                        <AlignLeft size={14} /> Description
                    </label>
                    <textarea id="ev-desc" name="description"
                        className="form-input event-editor-textarea"
                        value={form.description || ''} onChange={handleChange}
                        placeholder="Event description" rows={4} />
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

            <button type="submit" className="btn btn-primary" disabled={saving} id="btn-save-event">
                {saving ? <><span className="spinner" /> Saving…</> : <><Save size={16} /> Save Changes</>}
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
                (r.phone || '').includes(q) ||
                (r.course || '').toLowerCase().includes(q)
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
                            <span style={{ color: '#ea4335' }}>C</span><span style={{ color: '#fbbc04' }}>u</span>
                            <span style={{ color: '#34a853' }}>S</span><span style={{ color: '#ea4335' }}>O</span>
                            <span style={{ color: '#fbbc04' }}>C</span>
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
                <div className="admin-topbar-inner container">
                    <div className="admin-topbar-brand">
                        <div className="admin-logo-box">
                            <span style={{ color: '#ea4335' }}>C</span>
                            <span style={{ color: '#fbbc04' }}>u</span>
                            <span style={{ color: '#34a853' }}>S</span>
                            <span style={{ color: '#ea4335' }}>O</span>
                            <span style={{ color: '#fbbc04' }}>C</span>
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

            <main className="admin-body container">
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
                                    placeholder="Search by name, email, phone, course…"
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
                                            <th>Phone</th>
                                            <th>Course / Year</th>
                                            <th onClick={() => toggleSort('created_at')} className="sortable">
                                                Registered At <SortIcon col="created_at" />
                                            </th>
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
                                                <td>{r.phone}</td>
                                                <td>{r.course || <span className="admin-td-empty">—</span>}</td>
                                                <td className="admin-td-date">{formatDate(r.created_at)}</td>
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
                                                    <button
                                                        className="btn btn-danger btn-sm admin-delete-btn"
                                                        onClick={() => setDeleteTarget({ id: r.id, name: r.name, email: r.email })}
                                                        title={`Delete ${r.name}`}
                                                        id={`btn-delete-${r.id}`}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
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
                                                {scanResult.data?.email} &bull; {scanResult.data?.course || 'N/A'}
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
                                                {scanResult.data?.email} &bull; {scanResult.data?.course || 'N/A'}
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
