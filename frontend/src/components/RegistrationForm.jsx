import { useState, useCallback } from 'react';
import { User, ChevronDown, ArrowRight, Upload, X, Check, AlertCircle } from 'lucide-react';
import { registerUser } from '../services/api';
import { supabase } from '../supabaseClient';
import './RegistrationForm.css';

// ── Constants ──────────────────────────────────────────────────────────────────
const CLUSTERS = ['Engineering', 'Management', 'Liberal Arts and Humanities', 'Science'];

const DEPARTMENTS = [
    'CDOE','Pro VC Academic Affairs','Chemistry','Mathematics','Physics','Bio-Technology',
    'Bio-Sciences','Agriculture','Computer Science & Engineering 2nd Year',
    'Computer Science & Engineering 3rd Year','Computer Science & Engineering 4th Year',
    'Engineering Foundation 1st Year (Batch 5)','Engineering Foundation 1st Year (Batch 2)',
    'Engineering Foundation 1st Year (Batch 3)','Civil Engineering','Automobile Engineering',
    'Electronics & Communication Engineering','Electrical Engineering',
    'Biotechnology & Food Engineering','Mechanical Engineering','Petroleum Engineering',
    'Chemical Engineering','Mechatronics Engineering','Aerospace Engineering','UIC — BCA',
    'UIC — MCA','AIT — CSE','Engineering Foundation 1st Year (Batch 1)',
    'Engineering Foundation 1st Year (Batch 4)','UIPS','Forensic Science & Toxicology',
    'Physiotherapy','Medical Lab Technology','Optometry','Nursing','Nutrition & Dietetics',
    'UITTR','UIPES','Interior Design','Industrial Design','Fine Arts','Fashion & Design',
    'UILAH','Architecture','Animation, VFX & Gaming','Psychology','Film Studies','UIMS',
    'TTM','HHM','Airlines','BA-LLB','BBA-LLB','B.COM-LLB','LLB-LLM','Commerce','BBA',
    'MBA','AIT — MBA','Global School of Finance & Accounting','Economics','DCPD',
    'AIT — CSE (AIML)','ME — CSE','English','BBA APEX','Animation, VFX & Gaming (UIFVA)','DSW',
];

const AWARD_CATEGORIES = [
    { id: 'research',        label: 'Research Award',              emoji: '🔬' },
    { id: 'innovation',      label: 'New Innovators',              emoji: '💡' },
    { id: 'entrepreneurship',label: 'Entrepreneurship',            emoji: '🚀' },
    { id: 'competitions',    label: 'Competitions & Hackathons',   emoji: '🏆' },
    { id: 'patents',         label: 'Patents',                     emoji: '📜' },
    { id: 'certifications',  label: 'Certifications / Leadership', emoji: '🎓' },
];

const TYPES = ['Student', 'Mentor', 'Coordinator'];

// ── Blank state factories ──────────────────────────────────────────────────────
const blankResearch = () => ({ project_type: '', funding_letter: null });
const blankInnovation = () => ({ project_title: '', description: '', only_granted: false, patent_grant: null, innovator_cert: null });
const blankEntrepreneurship = () => ({ startup_name: '', reg_status: '', reg_number: '', trl_stage: '', not_incubated: false, reg_cert: null, pitch_deck: null, proof: null });
const blankCompetitions = () => ({ comp_name: '', level: '', rank: '', event_date: '', org_body: '', org_name: '', prize_money: '', participation_count: '', role: '', description: '', website: '', certificate: null, medal_photo: null, hd_photo: null });
const blankPatents = () => ({ patent_title: '', app_number: '', status: 'Granted', grant_date: '', patent_office: '', applicant_role: '', patent_doc: null, filing_receipt: null });
const blankCertifications = () => ({ club_name: '', tenure: '', impact: '', members_converted: '', testimonials: null, achievements: '', awareness_sessions: '', mentored: false, mentor_comp_name: '' });

const CATEGORY_BLANK = {
    research: blankResearch,
    innovation: blankInnovation,
    entrepreneurship: blankEntrepreneurship,
    competitions: blankCompetitions,
    patents: blankPatents,
    certifications: blankCertifications,
};

// ── File Upload Helper ─────────────────────────────────────────────────────────
async function uploadFile(file, folder) {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const name = `${folder}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage.from('proofs').upload(name, file);
    if (error) throw new Error('Upload failed: ' + error.message);
    return supabase.storage.from('proofs').getPublicUrl(name).data.publicUrl;
}

// ── Reusable Sub-components ────────────────────────────────────────────────────
function Field({ label, error, required, children }) {
    return (
        <div className="rf-field">
            <label className="rf-label">{label}{required && <span className="rf-req">*</span>}</label>
            {children}
            {error && <span className="rf-error"><AlertCircle size={12} />{error}</span>}
        </div>
    );
}

function Select({ value, onChange, options, placeholder, error }) {
    return (
        <div className="rf-select-wrap">
            <select
                className={`form-input rf-select ${value ? 'rf-selected' : ''} ${error ? 'error' : ''}`}
                value={value}
                onChange={onChange}
            >
                <option value="">{placeholder || '— Select —'}</option>
                {options.map(o => (
                    <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
                ))}
            </select>
            <ChevronDown size={15} className="rf-chevron" />
        </div>
    );
}

function FileInput({ id, accept, file, onChange, label, error }) {
    return (
        <div className={`rf-file-box ${error ? 'rf-file-error' : ''}`}>
            <label htmlFor={id} className="rf-file-label">
                <Upload size={15} />
                <span>{file ? file.name : label}</span>
            </label>
            <input id={id} type="file" accept={accept} className="rf-file-input" onChange={onChange} />
            {file && <span className="rf-file-name">✓ {file.name}</span>}
            {error && <span className="rf-error"><AlertCircle size={12} />{error}</span>}
        </div>
    );
}

// ── Category sub-forms ─────────────────────────────────────────────────────────
function ResearchForm({ data, onChange, errors }) {
    return (
        <div className="rf-cat-fields">
            <Field label="Project Type" required error={errors?.project_type}>
                <Select value={data.project_type} onChange={e => onChange('project_type', e.target.value)} error={errors?.project_type}
                    options={['Project Funding','Paper Presentation Award','Research Award','Societal Impact Project','Ongoing Govt/DST/Industry Funded Project']}
                    placeholder="— Select Project Type —"
                />
            </Field>
            <Field label="Funding Approval Letter" required error={errors?.funding_letter}>
                <FileInput id="research-funding" accept="application/pdf,image/*" file={data.funding_letter}
                    onChange={e => onChange('funding_letter', e.target.files[0] || null)}
                    label="Upload Funding Approval Letter (PDF/Image)" error={errors?.funding_letter}
                />
            </Field>
        </div>
    );
}

function InnovationForm({ data, onChange, errors }) {
    return (
        <div className="rf-cat-fields">
            <Field label="Project Title" required error={errors?.project_title}>
                <input className={`form-input ${errors?.project_title ? 'error' : ''}`} value={data.project_title}
                    onChange={e => onChange('project_title', e.target.value)} placeholder="e.g. Smart Water Monitoring System" />
            </Field>
            <Field label="Innovation Description" required error={errors?.description}>
                <textarea className={`form-input rf-textarea ${errors?.description ? 'error' : ''}`} rows={3} value={data.description}
                    onChange={e => onChange('description', e.target.value)} placeholder="Describe your innovation..." />
            </Field>
            <div className="rf-checkbox-row">
                <input type="checkbox" id="only-granted" checked={data.only_granted}
                    onChange={e => onChange('only_granted', e.target.checked)} />
                <label htmlFor="only-granted">Only Granted Patents</label>
            </div>
            <Field label="Patent Grant" required error={errors?.patent_grant}>
                <FileInput id="patent-grant" accept="application/pdf,image/*" file={data.patent_grant}
                    onChange={e => onChange('patent_grant', e.target.files[0] || null)}
                    label="Upload Patent Grant Document" error={errors?.patent_grant} />
            </Field>
            <Field label="Best Innovator Certificate" required error={errors?.innovator_cert}>
                <FileInput id="innovator-cert" accept="application/pdf,image/*" file={data.innovator_cert}
                    onChange={e => onChange('innovator_cert', e.target.files[0] || null)}
                    label="Upload Best Innovator Certificate" error={errors?.innovator_cert} />
            </Field>
        </div>
    );
}

function EntrepreneurshipForm({ data, onChange, errors }) {
    return (
        <div className="rf-cat-fields">
            <div className="rf-two-col">
                <Field label="Startup Name" required error={errors?.startup_name}>
                    <input className={`form-input ${errors?.startup_name ? 'error' : ''}`} value={data.startup_name}
                        onChange={e => onChange('startup_name', e.target.value)} placeholder="Your startup name" />
                </Field>
                <Field label="Registration Status" required error={errors?.reg_status}>
                    <Select value={data.reg_status} onChange={e => onChange('reg_status', e.target.value)} error={errors?.reg_status}
                        options={['Ongoing','LLP','Pvt Ltd','Under Process']} placeholder="— Select Status —" />
                </Field>
            </div>
            <div className="rf-two-col">
                <Field label="Registration Number" required error={errors?.reg_number}>
                    <input className={`form-input ${errors?.reg_number ? 'error' : ''}`} value={data.reg_number}
                        onChange={e => onChange('reg_number', e.target.value)} placeholder="e.g. U72200PB2023PTC1234" />
                </Field>
                <Field label="TRL Stage" required error={errors?.trl_stage}>
                    <Select value={data.trl_stage} onChange={e => onChange('trl_stage', e.target.value)} error={errors?.trl_stage}
                        options={['4','5','6','7'].map(v => ({ value: v, label: `TRL ${v}` }))} placeholder="— Select Stage —" />
                </Field>
            </div>
            <div className="rf-checkbox-row">
                <input type="checkbox" id="not-incubated" checked={data.not_incubated}
                    onChange={e => onChange('not_incubated', e.target.checked)} />
                <label htmlFor="not-incubated">Not Incubated</label>
            </div>
            <div className="rf-two-col">
                <Field label="Registration Certificate" required error={errors?.reg_cert}>
                    <FileInput id="reg-cert" accept="application/pdf,image/*" file={data.reg_cert}
                        onChange={e => onChange('reg_cert', e.target.files[0] || null)}
                        label="Upload Registration Certificate" error={errors?.reg_cert} />
                </Field>
                <Field label="Pitch Deck" required error={errors?.pitch_deck}>
                    <FileInput id="pitch-deck" accept="application/pdf,.ppt,.pptx" file={data.pitch_deck}
                        onChange={e => onChange('pitch_deck', e.target.files[0] || null)}
                        label="Upload Pitch Deck" error={errors?.pitch_deck} />
                </Field>
            </div>
            <Field label="Proof" error={errors?.proof}>
                <FileInput id="startup-proof" accept="application/pdf,image/*" file={data.proof}
                    onChange={e => onChange('proof', e.target.files[0] || null)}
                    label="Upload Additional Proof (optional)" error={errors?.proof} />
            </Field>
        </div>
    );
}

function CompetitionsForm({ data, onChange, errors }) {
    return (
        <div className="rf-cat-fields">
            <div className="rf-two-col">
                <Field label="Competition Name" required error={errors?.comp_name}>
                    <input className={`form-input ${errors?.comp_name ? 'error' : ''}`} value={data.comp_name}
                        onChange={e => onChange('comp_name', e.target.value)} placeholder="e.g. Smart India Hackathon" />
                </Field>
                <Field label="Level" required error={errors?.level}>
                    <Select value={data.level} onChange={e => onChange('level', e.target.value)} error={errors?.level}
                        options={['International','National','State']} placeholder="— Select Level —" />
                </Field>
            </div>
            <div className="rf-two-col">
                <Field label="Rank / Position" required error={errors?.rank}>
                    <input className={`form-input ${errors?.rank ? 'error' : ''}`} value={data.rank}
                        onChange={e => onChange('rank', e.target.value)} placeholder="e.g. 1st, Runner Up" />
                </Field>
                <Field label="Event Date" required error={errors?.event_date}>
                    <input type="date" className={`form-input ${errors?.event_date ? 'error' : ''}`} value={data.event_date}
                        onChange={e => onChange('event_date', e.target.value)} />
                </Field>
            </div>
            <div className="rf-two-col">
                <Field label="Organizing Body" required error={errors?.org_body}>
                    <Select value={data.org_body} onChange={e => onChange('org_body', e.target.value)} error={errors?.org_body}
                        options={['Government','Industry','State']} placeholder="— Select Body —" />
                </Field>
                <Field label="Organization Name" required error={errors?.org_name}>
                    <input className={`form-input ${errors?.org_name ? 'error' : ''}`} value={data.org_name}
                        onChange={e => onChange('org_name', e.target.value)} placeholder="e.g. Ministry of Education" />
                </Field>
            </div>
            <div className="rf-two-col">
                <Field label="Prize Money (₹)" error={errors?.prize_money}>
                    <input type="number" className={`form-input ${errors?.prize_money ? 'error' : ''}`} value={data.prize_money}
                        onChange={e => onChange('prize_money', e.target.value)} placeholder="0" min="0" />
                </Field>
                <Field label="Participation Count" error={errors?.participation_count}>
                    <input type="number" className={`form-input ${errors?.participation_count ? 'error' : ''}`} value={data.participation_count}
                        onChange={e => onChange('participation_count', e.target.value)} placeholder="e.g. 150" min="1" />
                </Field>
            </div>
            <div className="rf-two-col">
                <Field label="Role" required error={errors?.role}>
                    <Select value={data.role} onChange={e => onChange('role', e.target.value)} error={errors?.role}
                        options={['Team Leader','Member']} placeholder="— Select Role —" />
                </Field>
                <Field label="Competition Website" error={errors?.website}>
                    <input type="url" className={`form-input ${errors?.website ? 'error' : ''}`} value={data.website}
                        onChange={e => onChange('website', e.target.value)} placeholder="https://..." />
                </Field>
            </div>
            <Field label="Description (max 100 words)" error={errors?.description}>
                <textarea className={`form-input rf-textarea ${errors?.description ? 'error' : ''}`} rows={3} value={data.description}
                    onChange={e => onChange('description', e.target.value)} placeholder="Brief description of your achievement..." />
            </Field>
            <div className="rf-two-col">
                <Field label="Certificate" required error={errors?.certificate}>
                    <FileInput id="comp-cert" accept="application/pdf,image/*" file={data.certificate}
                        onChange={e => onChange('certificate', e.target.files[0] || null)}
                        label="Upload Certificate" error={errors?.certificate} />
                </Field>
                <Field label="Medal / Award Photo" error={errors?.medal_photo}>
                    <FileInput id="comp-medal" accept="image/*" file={data.medal_photo}
                        onChange={e => onChange('medal_photo', e.target.files[0] || null)}
                        label="Upload Medal Photo" error={errors?.medal_photo} />
                </Field>
            </div>
            <Field label="HD Photo" error={errors?.hd_photo}>
                <FileInput id="comp-hd" accept="image/*" file={data.hd_photo}
                    onChange={e => onChange('hd_photo', e.target.files[0] || null)}
                    label="Upload HD Photo" error={errors?.hd_photo} />
            </Field>
        </div>
    );
}

function PatentsForm({ data, onChange, errors }) {
    return (
        <div className="rf-cat-fields">
            <div className="rf-two-col">
                <Field label="Patent Title" required error={errors?.patent_title}>
                    <input className={`form-input ${errors?.patent_title ? 'error' : ''}`} value={data.patent_title}
                        onChange={e => onChange('patent_title', e.target.value)} placeholder="e.g. Smart Energy Grid System" />
                </Field>
                <Field label="Application Number" required error={errors?.app_number}>
                    <input className={`form-input ${errors?.app_number ? 'error' : ''}`} value={data.app_number}
                        onChange={e => onChange('app_number', e.target.value)} placeholder="e.g. 202311012345" />
                </Field>
            </div>
            <div className="rf-two-col">
                <Field label="Status" required error={errors?.status}>
                    <Select value={data.status} onChange={e => onChange('status', e.target.value)} error={errors?.status}
                        options={['Granted']} placeholder="— Select Status —" />
                </Field>
                <Field label="Grant Date" required error={errors?.grant_date}>
                    <input type="date" className={`form-input ${errors?.grant_date ? 'error' : ''}`} value={data.grant_date}
                        onChange={e => onChange('grant_date', e.target.value)} />
                </Field>
            </div>
            <div className="rf-two-col">
                <Field label="Patent Office" required error={errors?.patent_office}>
                    <Select value={data.patent_office} onChange={e => onChange('patent_office', e.target.value)} error={errors?.patent_office}
                        options={['Indian','US','International']} placeholder="— Select Office —" />
                </Field>
                <Field label="Applicant Role" required error={errors?.applicant_role}>
                    <Select value={data.applicant_role} onChange={e => onChange('applicant_role', e.target.value)} error={errors?.applicant_role}
                        options={['Sole','Co-applicant']} placeholder="— Select Role —" />
                </Field>
            </div>
            <div className="rf-two-col">
                <Field label="Patent Document" required error={errors?.patent_doc}>
                    <FileInput id="patent-doc" accept="application/pdf,image/*" file={data.patent_doc}
                        onChange={e => onChange('patent_doc', e.target.files[0] || null)}
                        label="Upload Patent Document" error={errors?.patent_doc} />
                </Field>
                <Field label="Filing Receipt" required error={errors?.filing_receipt}>
                    <FileInput id="filing-receipt" accept="application/pdf,image/*" file={data.filing_receipt}
                        onChange={e => onChange('filing_receipt', e.target.files[0] || null)}
                        label="Upload Filing Receipt" error={errors?.filing_receipt} />
                </Field>
            </div>
        </div>
    );
}

function CertificationsForm({ data, onChange, errors }) {
    return (
        <div className="rf-cat-fields">
            <div className="rf-two-col">
                <Field label="Club Name / Coordinator Dept." required error={errors?.club_name}>
                    <input className={`form-input ${errors?.club_name ? 'error' : ''}`} value={data.club_name}
                        onChange={e => onChange('club_name', e.target.value)} placeholder="e.g. IEEE Student Branch" />
                </Field>
                <Field label="Tenure" required error={errors?.tenure}>
                    <input className={`form-input ${errors?.tenure ? 'error' : ''}`} value={data.tenure}
                        onChange={e => onChange('tenure', e.target.value)} placeholder="e.g. 2023-2024" />
                </Field>
            </div>
            <Field label="Leadership Impact" required error={errors?.impact}>
                <textarea className={`form-input rf-textarea ${errors?.impact ? 'error' : ''}`} rows={3} value={data.impact}
                    onChange={e => onChange('impact', e.target.value)} placeholder="Describe your leadership impact..." />
            </Field>
            <div className="rf-two-col">
                <Field label="Members Converted to Core" error={errors?.members_converted}>
                    <input type="number" className={`form-input ${errors?.members_converted ? 'error' : ''}`} value={data.members_converted}
                        onChange={e => onChange('members_converted', e.target.value)} placeholder="0" min="0" />
                </Field>
                <Field label="Awareness Sessions Conducted" error={errors?.awareness_sessions}>
                    <input type="number" className={`form-input ${errors?.awareness_sessions ? 'error' : ''}`} value={data.awareness_sessions}
                        onChange={e => onChange('awareness_sessions', e.target.value)} placeholder="0" min="0" />
                </Field>
            </div>
            <Field label="Achievements During Tenure" error={errors?.achievements}>
                <input className={`form-input ${errors?.achievements ? 'error' : ''}`} value={data.achievements}
                    onChange={e => onChange('achievements', e.target.value)} placeholder="Key achievements..." />
            </Field>
            <Field label="Testimonials Proof (20 members)" error={errors?.testimonials}>
                <FileInput id="testimonials" accept="application/pdf,image/*,.zip" file={data.testimonials}
                    onChange={e => onChange('testimonials', e.target.files[0] || null)}
                    label="Upload Testimonials Proof" error={errors?.testimonials} />
            </Field>
            <div className="rf-checkbox-row">
                <input type="checkbox" id="mentored" checked={data.mentored}
                    onChange={e => onChange('mentored', e.target.checked)} />
                <label htmlFor="mentored">Mentored Students for Competitions</label>
            </div>
            {data.mentored && (
                <Field label="Competition Name (Mentored For)" error={errors?.mentor_comp_name}>
                    <input className={`form-input ${errors?.mentor_comp_name ? 'error' : ''}`} value={data.mentor_comp_name}
                        onChange={e => onChange('mentor_comp_name', e.target.value)} placeholder="e.g. Smart India Hackathon" />
                </Field>
            )}
        </div>
    );
}

const CATEGORY_FORMS = {
    research: ResearchForm,
    innovation: InnovationForm,
    entrepreneurship: EntrepreneurshipForm,
    competitions: CompetitionsForm,
    patents: PatentsForm,
    certifications: CertificationsForm,
};

// ── Validation helpers ─────────────────────────────────────────────────────────
function validateCommon(common) {
    const e = {};
    if (!common.name.trim()) e.name = 'Full name is required';
    if (!common.uid.trim()) e.uid = 'UID / EID is required';
    if (!common.cluster) e.cluster = 'Please select your cluster';
    if (!common.department) e.department = 'Please select your department';
    if (!common.type) e.type = 'Please select your type';
    if (common.selectedCats.length === 0) e.selectedCats = 'Please select at least one award category';
    return e;
}

function validateCategory(id, data) {
    const e = {};
    if (id === 'research') {
        if (!data.project_type) e.project_type = 'Project type is required';
        if (!data.funding_letter) e.funding_letter = 'Funding Approval Letter is required';
    }
    if (id === 'innovation') {
        if (!data.project_title.trim()) e.project_title = 'Project title is required';
        if (!data.description.trim()) e.description = 'Description is required';
        if (!data.patent_grant) e.patent_grant = 'Patent Grant document is required';
        if (!data.innovator_cert) e.innovator_cert = 'Innovator Certificate is required';
    }
    if (id === 'entrepreneurship') {
        if (!data.startup_name.trim()) e.startup_name = 'Startup name is required';
        if (!data.reg_status) e.reg_status = 'Registration status is required';
        if (!data.reg_number.trim()) e.reg_number = 'Registration number is required';
        if (!data.trl_stage) e.trl_stage = 'TRL stage is required';
        if (!data.reg_cert) e.reg_cert = 'Registration Certificate is required';
        if (!data.pitch_deck) e.pitch_deck = 'Pitch Deck is required';
    }
    if (id === 'competitions') {
        if (!data.comp_name.trim()) e.comp_name = 'Competition name is required';
        if (!data.level) e.level = 'Level is required';
        if (!data.rank.trim()) e.rank = 'Rank is required';
        if (!data.event_date) e.event_date = 'Event date is required';
        if (!data.org_body) e.org_body = 'Organizing body is required';
        if (!data.org_name.trim()) e.org_name = 'Organization name is required';
        if (!data.role) e.role = 'Role is required';
        if (!data.certificate) e.certificate = 'Certificate upload is required';
    }
    if (id === 'patents') {
        if (!data.patent_title.trim()) e.patent_title = 'Patent title is required';
        if (!data.app_number.trim()) e.app_number = 'Application number is required';
        if (!data.grant_date) e.grant_date = 'Grant date is required';
        if (!data.patent_office) e.patent_office = 'Patent office is required';
        if (!data.applicant_role) e.applicant_role = 'Applicant role is required';
        if (!data.patent_doc) e.patent_doc = 'Patent document is required';
        if (!data.filing_receipt) e.filing_receipt = 'Filing receipt is required';
    }
    if (id === 'certifications') {
        if (!data.club_name.trim()) e.club_name = 'Club name is required';
        if (!data.tenure.trim()) e.tenure = 'Tenure is required';
        if (!data.impact.trim()) e.impact = 'Leadership impact is required';
    }
    return e;
}

// ── Upload category files and strip File objects from data ─────────────────────
async function processCategoryData(id, data) {
    const d = { ...data };
    const fileFields = {
        research: ['funding_letter'],
        innovation: ['patent_grant', 'innovator_cert'],
        entrepreneurship: ['reg_cert', 'pitch_deck', 'proof'],
        competitions: ['certificate', 'medal_photo', 'hd_photo'],
        patents: ['patent_doc', 'filing_receipt'],
        certifications: ['testimonials'],
    };
    for (const field of (fileFields[id] || [])) {
        if (d[field] instanceof File) {
            d[field] = await uploadFile(d[field], `${id}_${field}`);
        }
    }
    return d;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function RegistrationForm({ email, otp, onSuccess }) {
    const [common, setCommon] = useState({ name: '', uid: '', cluster: '', department: '', type: '', selectedCats: [] });
    const [catData, setCatData] = useState({});
    const [commonErrors, setCommonErrors] = useState({});
    const [catErrors, setCatErrors] = useState({});
    const [globalError, setGlobalError] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');

    // ── Common field handler ───────────────────────────────────────────────────
    const handleCommon = useCallback((field, value) => {
        setCommon(p => ({ ...p, [field]: value }));
        setCommonErrors(p => ({ ...p, [field]: '' }));
        setGlobalError('');
    }, []);

    // ── Category toggle ───────────────────────────────────────────────────────
    const toggleCategory = useCallback((id) => {
        setCommon(p => {
            const already = p.selectedCats.includes(id);
            const next = already ? p.selectedCats.filter(c => c !== id) : [...p.selectedCats, id];
            if (!already) {
                setCatData(cd => ({ ...cd, [id]: CATEGORY_BLANK[id]() }));
            }
            return { ...p, selectedCats: next };
        });
        setCommonErrors(p => ({ ...p, selectedCats: '' }));
    }, []);

    // ── Category field handler ────────────────────────────────────────────────
    const handleCatField = useCallback((catId, field, value) => {
        setCatData(p => ({ ...p, [catId]: { ...(p[catId] || {}), [field]: value } }));
        setCatErrors(p => ({ ...p, [catId]: { ...(p[catId] || {}), [field]: '' } }));
        setGlobalError('');
    }, []);

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setGlobalError('');

        // Validate common
        const cErrs = validateCommon(common);
        if (Object.keys(cErrs).length > 0) {
            setCommonErrors(cErrs);
            document.querySelector('.rf-common-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        // Validate each selected category
        const allCatErrors = {};
        let hasError = false;
        for (const catId of common.selectedCats) {
            const errs = validateCategory(catId, catData[catId] || {});
            if (Object.keys(errs).length > 0) {
                allCatErrors[catId] = errs;
                hasError = true;
            }
        }
        if (hasError) {
            setCatErrors(allCatErrors);
            return;
        }

        setLoading(true);
        try {
            // Upload files and build categories array
            const categories = [];
            for (const catId of common.selectedCats) {
                setUploadProgress(`Uploading files for ${AWARD_CATEGORIES.find(c => c.id === catId)?.label}…`);
                const processed = await processCategoryData(catId, catData[catId] || {});
                categories.push({ type: catId, data: processed });
            }
            setUploadProgress('Submitting registration…');

            await registerUser({
                name: common.name.trim(),
                email,
                uid: common.uid.trim(),
                cluster: common.cluster,
                department: common.department,
                type: common.type,
                categories,
                otp,
            });
            onSuccess();
        } catch (err) {
            setGlobalError(err.response?.data?.error || err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
            setUploadProgress('');
        }
    };

    const totalSteps = common.selectedCats.length + 1; // common + per-cat

    return (
        <div className="rf-wrap">
            {/* Verified email badge */}
            <div className="rf-email-badge">
                <Check size={14} /> Verified: <strong>{email}</strong>
            </div>

            {globalError && (
                <div className="rf-global-error" role="alert">
                    <AlertCircle size={16} /> {globalError}
                </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

                {/* ── STEP 1: Common Fields ── */}
                <div className="rf-section rf-common-section">
                    <div className="rf-section-header">
                        <div className="rf-step-badge">Step 1</div>
                        <h3 className="rf-section-title">Basic Information</h3>
                        <p className="rf-section-sub">Required for all applicants</p>
                    </div>

                    <div className="rf-two-col">
                        <Field label="Full Name" required error={commonErrors.name}>
                            <input className={`form-input ${commonErrors.name ? 'error' : ''}`} value={common.name}
                                onChange={e => handleCommon('name', e.target.value)} placeholder="e.g. Praveen Kumar" autoFocus />
                        </Field>
                        <Field label="UID / EID" required error={commonErrors.uid}>
                            <input className={`form-input ${commonErrors.uid ? 'error' : ''}`} value={common.uid}
                                onChange={e => handleCommon('uid', e.target.value)} placeholder="e.g. 23BCE1234" />
                        </Field>
                    </div>

                    <div className="rf-two-col">
                        <Field label="Cluster" required error={commonErrors.cluster}>
                            <Select value={common.cluster} onChange={e => handleCommon('cluster', e.target.value)}
                                error={commonErrors.cluster} options={CLUSTERS} placeholder="— Select Cluster —" />
                        </Field>
                        <Field label="Department" required error={commonErrors.department}>
                            <Select value={common.department} onChange={e => handleCommon('department', e.target.value)}
                                error={commonErrors.department} options={DEPARTMENTS} placeholder="— Select Department —" />
                        </Field>
                    </div>

                    <Field label="Type" required error={commonErrors.type}>
                        <div className="rf-type-btns">
                            {TYPES.map(t => (
                                <button key={t} type="button"
                                    className={`rf-type-btn ${common.type === t ? 'rf-type-active' : ''}`}
                                    onClick={() => handleCommon('type', t)}>
                                    {t}
                                </button>
                            ))}
                        </div>
                        {commonErrors.type && <span className="rf-error"><AlertCircle size={12} />{commonErrors.type}</span>}
                    </Field>
                </div>

                {/* ── STEP 2: Category Selection ── */}
                <div className="rf-section">
                    <div className="rf-section-header">
                        <div className="rf-step-badge">Step 2</div>
                        <h3 className="rf-section-title">Award Categories</h3>
                        <p className="rf-section-sub">Select one or more categories you are applying for</p>
                    </div>

                    <div className="rf-cat-grid">
                        {AWARD_CATEGORIES.map(cat => {
                            const selected = common.selectedCats.includes(cat.id);
                            return (
                                <button key={cat.id} type="button"
                                    className={`rf-cat-card ${selected ? 'rf-cat-selected' : ''}`}
                                    onClick={() => toggleCategory(cat.id)}>
                                    <div className="rf-cat-emoji">{cat.emoji}</div>
                                    <div className="rf-cat-label">{cat.label}</div>
                                    <div className={`rf-cat-check ${selected ? 'rf-cat-check-on' : ''}`}>
                                        {selected ? <Check size={12} /> : '+'}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    {commonErrors.selectedCats && (
                        <span className="rf-error rf-cat-error"><AlertCircle size={12} />{commonErrors.selectedCats}</span>
                    )}
                </div>

                {/* ── STEP 3+: Per-Category Forms ── */}
                {common.selectedCats.map((catId, idx) => {
                    const cat = AWARD_CATEGORIES.find(c => c.id === catId);
                    const CatForm = CATEGORY_FORMS[catId];
                    const data = catData[catId] || CATEGORY_BLANK[catId]();
                    const errors = catErrors[catId] || {};
                    const hasCatErrors = Object.keys(errors).length > 0;

                    return (
                        <div key={catId} className={`rf-section rf-cat-section ${hasCatErrors ? 'rf-cat-section-error' : ''}`}>
                            <div className="rf-section-header">
                                <div className="rf-step-badge">Step {idx + 3}</div>
                                <h3 className="rf-section-title">
                                    {cat.emoji} {cat.label}
                                </h3>
                                <button type="button" className="rf-remove-cat" onClick={() => toggleCategory(catId)}
                                    title="Remove this category">
                                    <X size={14} />
                                </button>
                            </div>
                            <CatForm data={data}
                                onChange={(field, value) => handleCatField(catId, field, value)}
                                errors={errors} />
                        </div>
                    );
                })}

                {/* ── Submit ── */}
                <div className="rf-submit-wrap">
                    {common.selectedCats.length > 0 && (
                        <div className="rf-summary-pills">
                            {common.selectedCats.map(catId => {
                                const cat = AWARD_CATEGORIES.find(c => c.id === catId);
                                return (
                                    <span key={catId} className="rf-summary-pill">
                                        {cat.emoji} {cat.label}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                    {uploadProgress && (
                        <div className="rf-upload-progress">
                            <span className="spinner spinner-blue" /> {uploadProgress}
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary btn-full btn-lg rf-submit-btn" disabled={loading} id="btn-register-submit">
                        {loading
                            ? <><span className="spinner" /> Processing…</>
                            : <>Submit Application <ArrowRight size={18} /></>
                        }
                    </button>
                    <p className="rf-footnote">
                        Submitting {common.selectedCats.length > 0 ? `${common.selectedCats.length} categor${common.selectedCats.length === 1 ? 'y' : 'ies'}` : 'no categories selected'}
                    </p>
                </div>
            </form>
        </div>
    );
}
