import { Users, FileText } from 'lucide-react';
import './SeatCounter.css';

export default function SeatCounter({ totalSeats, bookedSeats, onRegister }) {
    const remaining = Math.max(0, totalSeats - bookedSeats);
    const percent = totalSeats > 0 ? (bookedSeats / totalSeats) * 100 : 0;
    const isFull = remaining === 0;
    const isAlmostFull = !isFull && percent >= 80;

    let statusClass = 'seat-status-good';
    let statusText = `${remaining} seats left`;
    let barClass = 'bar-good';

    return (
        <div className="seat-counter card" aria-label="Seat availability">
            <div className="seat-counter-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span className="seat-icon"><Users size={20} /></span>
                    <span className="seat-title">Registrations</span>
                </div>
                {/* <span className={`chip ${statusClass}`}>{statusText}</span> */}
            </div>

            <div className="seat-bar-wrap">
                <div
                    className={`seat-bar-fill ${barClass}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                    role="progressbar"
                    aria-valuenow={bookedSeats}
                    aria-valuemin={0}
                    aria-valuemax={totalSeats}
                />
            </div>

            <div className="seat-counter-numbers">
                <span className="seat-num seat-booked">
                    <strong>{bookedSeats}</strong> registered
                </span>
                {/* <span className="seat-num seat-total">
                    {totalSeats} total seats
                </span> */}
            </div>

            <div className="seat-action">
                {!isFull && onRegister && (
                    <button className="btn btn-primary btn-full" onClick={onRegister} id="btn-seat-register">
                        Register Now
                    </button>
                )}
                <a href="https://drive.google.com/file/d/1zCEvEQ3MstfdEraIVn77VF06ogkKN4LY/view?usp=sharing" target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-full" id="btn-download-guidelines">
                    <FileText size={18} /> Download Guidelines
                </a>
                {!isFull && onRegister && isAlmostFull && (
                    <p className="seat-warn-micro">⚡ Hurry! Only {remaining} seats left.</p>
                )}
            </div>

            {isFull && (
                <div className="seat-full-msg">
                    <span>🚫</span> Registrations are closed. All seats are filled.
                </div>
            )}
        </div>
    );
}
