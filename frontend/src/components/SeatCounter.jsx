import { Users } from 'lucide-react';
import './SeatCounter.css';

export default function SeatCounter({ totalSeats, bookedSeats }) {
    const remaining = Math.max(0, totalSeats - bookedSeats);
    const percent = totalSeats > 0 ? (bookedSeats / totalSeats) * 100 : 0;
    const isFull = remaining === 0;
    const isAlmostFull = !isFull && percent >= 80;

    let statusClass = 'seat-status-good';
    let statusText = `${remaining} seats left`;
    let barClass = 'bar-good';

    if (isFull) {
        statusClass = 'seat-status-full';
        statusText = 'Event Full';
        barClass = 'bar-full';
    } else if (isAlmostFull) {
        statusClass = 'seat-status-warn';
        barClass = 'bar-warn';
    }

    return (
        <div className="seat-counter card" aria-label="Seat availability">
            <div className="seat-counter-header">
                <span className="seat-icon"><Users size={20} /></span>
                <span className="seat-title">Available Seats</span>
                <span className={`chip ${statusClass}`}>{statusText}</span>
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
                <span className="seat-num seat-total">
                    {totalSeats} total seats
                </span>
            </div>

            {isFull && (
                <div className="seat-full-msg">
                    <span>🚫</span> Registrations are closed. All seats are filled.
                </div>
            )}
            {isAlmostFull && (
                <div className="seat-warn-msg">
                    <span>⚡</span> Hurry! Only {remaining} seats remaining.
                </div>
            )}
        </div>
    );
}
