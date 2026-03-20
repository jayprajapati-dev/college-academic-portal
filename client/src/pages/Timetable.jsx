// client/src/pages/Timetable.jsx
import React from 'react';
import { isAdmin, isHOD, isCoordinator, isTeacher, isStudent } from '../utils/role';

const Timetable = ({ user, timetable, onAdd, onEdit, onDelete }) => {
  if (isTeacher(user)) {
    return (
      <div className="tt-teacher-view">
        <h2>My Lectures</h2>
        <div className="tt-grid">
          {timetable.filter(e => e.teacherId === user._id).map(entry => (
            <div key={entry._id} className={`tt-cell teacher-own ${entry.type === 'Lab' ? 'lab' : 'lecture'}`}>
              <div>{entry.subject}</div>
              <div>{entry.room}</div>
              <div>{entry.type}</div>
              <div>Slot {entry.slot}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (isStudent(user)) {
    return (
      <div className="tt-student-view">
        <h2>Timetable</h2>
        <div className="tt-grid">
          {timetable.map(entry => (
            <div key={entry._id} className={`tt-cell ${entry.type === 'Lab' ? 'lab' : 'lecture'}`}>
              <div>{entry.subject}</div>
              <div>{entry.teacherName}</div>
              <div>{entry.room}</div>
              <div>{entry.type}</div>
              <div>Slot {entry.slot}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  // Admin, HOD, Coordinator
  return (
    <div className="tt-admin-view">
      <h2>Timetable</h2>
      <button onClick={onAdd} className="tt-btn">Add Entry</button>
      <div className="tt-grid">
        {timetable.map(entry => (
          <div key={entry._id} className={`tt-cell ${entry.type === 'Lab' ? 'lab' : 'lecture'}`}>
            <div>{entry.subject}</div>
            <div>{entry.teacherName}</div>
            <div>{entry.room}</div>
            <div>{entry.type}</div>
            <div>Slot {entry.slot}</div>
            <button onClick={() => onEdit(entry)} className="tt-btn">Edit</button>
            <button onClick={() => onDelete(entry._id)} className="tt-btn delete">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timetable;
