import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './TimetablePage.css';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const slots = [1, 2, 3, 4, 5, 6, 7];

function TimetablePage({ user, token }) {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios.get('/api/timetable', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setTimetable(res.data.data))
      .catch(err => setError('Failed to load timetable'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="tt-loading">Loading...</div>;
  if (error) return <div className="tt-error">{error}</div>;

  // Map timetable to a lookup for grid rendering
  const timetableMap = {};
  timetable.forEach(entry => {
    timetableMap[`${entry.dayOfWeek}-${entry.slot}`] = entry;
  });

  return (
    <div className="tt-root">
      <aside className="tt-sidebar">
        <div className="tt-logo">SmartAcademics</div>
        <nav>
          <button type="button" className="tt-nav-btn">Dashboard</button>
          <button type="button" className="tt-nav-btn active">Timetable</button>
          <button type="button" className="tt-nav-btn">Rooms</button>
          <button type="button" className="tt-nav-btn">Teachers</button>
        </nav>
        <div className="tt-profile">Admin</div>
      </aside>
      <main className="tt-main">
        <header className="tt-header">
          <select className="tt-selector"><option>IT</option></select>
          <select className="tt-selector"><option>Semester 6</option></select>
        </header>
        <section className="tt-grid-section">
          <div className="tt-grid">
            <div className="tt-grid-header">
              <div className="tt-grid-corner"></div>
              {days.map(day => <div key={day} className="tt-grid-day">{day.slice(0,3)}</div>)}
            </div>
            {slots.map(slot => (
              <div className="tt-grid-row" key={slot}>
                <div className="tt-grid-slot">{`Slot ${slot}`}</div>
                {days.map(day => {
                  const entry = timetableMap[`${day}-${slot}`];
                  return (
                    <div
                      key={day}
                      className={`tt-grid-cell ${entry ? (entry.type === 'Lab' ? 'lab' : 'lecture') : ''}`}
                    >
                      {entry ? (
                        <div className="tt-entry">
                          <div className="tt-entry-type">{entry.type}</div>
                          <div className="tt-entry-subject">{entry.subject}</div>
                          <div className="tt-entry-teacher">{entry.teacherName || entry.teacher}</div>
                          <div className="tt-entry-room">{entry.room}</div>
                        </div>
                      ) : (
                        <span className="tt-add">+</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default TimetablePage;
