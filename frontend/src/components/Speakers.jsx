import { Linkedin } from 'lucide-react';
import prathameshImg from '../assets/guest/PRat.jpg';
import rudrakshImg from '../assets/guest/Rudraks.jpg';
import jasjeetImg from '../assets/guest/Jasjeet.jpg';
import aruImg from '../assets/guest/Aru.jpg';
import './Speakers.css';

// ── Static speaker data ──────────────────────────────────────────────────────
const SPEAKERS = [
    {
        id: 1,
        name: 'Prathamesh Ghatole',
        role: 'SDE - AI , Gekko',
        bio: 'Expert in designing and developing AI system in production with a strong expirience in Data Engineering.',
        avatar: prathameshImg,
        initials: 'PG',
        color: '#1a73e8',
        linkedin: 'https://www.linkedin.com/in/prathamesh-ghatole/',
    },
    {
        id: 2,
        name: 'Rudraksh Kapre',
        role: 'AI Engineer, ZS Associate',
        bio: 'A multi-year GSoC contributor and AI engineer specializing in large-scale agentic systems.',
        avatar: rudrakshImg,
        initials: 'RK',
        color: '#34a853',
        linkedin: 'https://www.linkedin.com/in/rudrakshkarpe/',
    },
    {
        id: 3,
        name: 'Jasjeet Singh',
        role: 'Android Engineer, Ultrahuman',
        bio: 'A skilled Android engineer and GSoC alumnus with strong expertise in building high-performance.',
        avatar: jasjeetImg,
        initials: 'JS',
        color: '#ea4335',
        linkedin: 'https://www.linkedin.com/in/jasjeet-singh-1a725a22b/',
    },
    {
        id: 4,
        name: 'Aru Sharma',
        role: 'AI Engineer, Deskree',
        bio: 'A highly accomplished AI and Open-Source engineer with GSoC and Summer of Bitcoin, expertise in building real-world.',
        avatar: aruImg,
        initials: 'AS',
        color: '#fbbc04',
        linkedin: 'https://www.linkedin.com/in/sharma-aru/',
    },
];

export default function Speakers() {
    return (
        <section className="speakers-section section" id="speakers" aria-labelledby="speakers-heading">
            <div className="container">
                <div className="section-header">
                    {/* <div className="chip chip-blue" style={{ marginBottom: 12 }}>🎤 Speakers</div> */}
                    <h2 className="section-title" id="speakers-heading">Meet the Speakers</h2>
                    <p className="section-subtitle">
                        Learn from industry experts and Googlers who are shaping the future of technology
                    </p>
                </div>

                <div className="speakers-grid">
                    {SPEAKERS.map((speaker) => (
                        <article className="speaker-card card" key={speaker.id}>
                            <div className="speaker-avatar" style={{ background: speaker.color }}>
                                {speaker.avatar
                                    ? <img src={speaker.avatar} alt={speaker.name} />
                                    : <span>{speaker.initials}</span>
                                }
                            </div>
                            <div className="speaker-info">
                                <h3 className="speaker-name">{speaker.name}</h3>
                                <p className="speaker-role">{speaker.role}</p>
                                <p className="speaker-bio">{speaker.bio}</p>
                                <div className="speaker-links">
                                    {speaker.linkedin && (
                                        <a href={speaker.linkedin} target="_blank" rel="noopener noreferrer"
                                            className="speaker-link" aria-label={`${speaker.name} on LinkedIn`}>
                                            <Linkedin size={16} />
                                        </a>
                                    )}
                                    {speaker.twitter && (
                                        <a href={speaker.twitter} target="_blank" rel="noopener noreferrer"
                                            className="speaker-link" aria-label={`${speaker.name} on Twitter`}>
                                            <Twitter size={16} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
