import { useState, useEffect, useCallback } from 'react';
import {
    Users, Ticket, BarChart2, LogOut, Trash2, RefreshCw,
    Search, Edit3, Save, X, ChevronDown, ChevronUp, AlertTriangle,
    CheckCircle, Calendar, MapPin, Clock, AlignLeft, Hash, FileDown,
} from 'lucide-react';
import {
    fetchAdminStats, fetchRegistrations, deleteRegistration,
    fetchAdminEvent, updateAdminEvent,
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
    const [activeTab, setActiveTab] = useState('registrations'); // 'registrations' | 'event'

    const [deleteTarget, setDeleteTarget] = useState(null); // { id, name, email }
    const [deleting, setDeleting] = useState(false);
    const [deleteMsg, setDeleteMsg] = useState('');

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

    // ── Sorting & Filtering ────────────────────────────────────────────────────
    const toggleSort = (key) => {
        if (sortKey === key) setSortAsc(!sortAsc);
        else { setSortKey(key); setSortAsc(true); }
    };

    const filtered = regs
        .filter((r) => {
            const q = search.toLowerCase();
            return (
                r.name.toLowerCase().includes(q) ||
                r.email.toLowerCase().includes(q) ||
                (r.phone || '').includes(q) ||
                (r.course || '').toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            const av = a[sortKey] || '';
            const bv = b[sortKey] || '';
            return sortAsc
                ? av.localeCompare(bv)
                : bv.localeCompare(av);
        });

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

    // ── Export to Excel (dynamic import — xlsx loads only when clicked) ─────────
    const [exporting, setExporting] = useState(false);

    const exportToExcel = async () => {
        if (regs.length === 0 || exporting) return;
        setExporting(true);
        try {
            // Lazily load xlsx only when needed — keeps initial bundle small
            const XLSX = await import('xlsx');

            const rows = filtered.map((r, i) => ({
                '#': i + 1,
                'Name': r.name,
                'Email': r.email,
                'Phone': r.phone,
                'Department': r.course || '—',
                'Registered At': new Date(r.created_at).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: true,
                }),
            }));

            const worksheet = XLSX.utils.json_to_sheet(rows);
            const workbook = XLSX.utils.book_new();

            worksheet['!cols'] = [
                { wch: 4 },   // #
                { wch: 24 },  // Name
                { wch: 34 },  // Email
                { wch: 14 },  // Phone
                { wch: 40 },  // Department
                { wch: 22 },  // Registered At
            ];

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

            const eventName = event?.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'CuSOC';
            const timestamp = new Date().toISOString().slice(0, 10);
            XLSX.writeFile(workbook, `${eventName}_Registrations_${timestamp}.xlsx`);
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            setExporting(false);
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
                    <div className="admin-stats-grid">
                        <StatCard icon={<Users size={22} />} label="Total Registrations" value={stats.totalRegistrations} color="blue" />
                        <StatCard icon={<Ticket size={22} />} label="Total Seats" value={stats.totalSeats} color="green" />
                        <StatCard icon={<BarChart2 size={22} />} label="Booked Seats" value={stats.bookedSeats} color="yellow" />
                        <StatCard icon={<CheckCircle size={22} />} label="Seats Remaining" value={stats.remainingSeats} color={stats.remainingSeats === 0 ? 'red' : 'teal'} />
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
                        <span className="admin-tab-badge">{regs.length}</span>
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
                            <button className="btn btn-secondary btn-sm" onClick={load} id="btn-refresh">
                                <RefreshCw size={14} /> Refresh
                            </button>
                            <button
                                className="btn btn-export btn-sm"
                                onClick={exportToExcel}
                                disabled={regs.length === 0 || exporting}
                                title={regs.length === 0 ? 'No data to export' : `Export ${filtered.length} row(s) to Excel`}
                                id="btn-export-excel"
                            >
                                {exporting
                                    ? <><span className="spinner" /> Exporting…</>
                                    : <><FileDown size={14} /> Export Excel</>}
                            </button>
                        </div>

                        {deleteMsg && (
                            <div className={`admin-alert mb-0 ${deleteMsg.startsWith('✅') ? 'admin-alert-success' : 'admin-alert-error'}`}>
                                {deleteMsg}
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
                                            <th className="admin-th-action">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map((r, i) => (
                                            <tr key={r.id} className="admin-row">
                                                <td className="admin-td-num">{i + 1}</td>
                                                <td className="admin-td-name">
                                                    <div className="admin-avatar">
                                                        {r.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span>{r.name}</span>
                                                </td>
                                                <td className="admin-td-email">{r.email}</td>
                                                <td>{r.phone}</td>
                                                <td>{r.course || <span className="admin-td-empty">—</span>}</td>
                                                <td className="admin-td-date">{formatDate(r.created_at)}</td>
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
                            Showing <strong>{filtered.length}</strong> of <strong>{regs.length}</strong> registrations
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
        </div>
    );
}
