import React, { useEffect, useState } from 'react';

function AdminQuestionsView() {
  const [questions, setQuestions] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch all events
    fetch('/api/admin/events')
      .then(res => res.ok ? res.json() : Promise.reject('Failed to load events'))
      .then(data => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setError('Could not load events.'));
  }, []);

  useEffect(() => {
    setLoading(true);
    let url = '/api/admin/questions';
    if (selectedEvent) url += `?event_id=${selectedEvent}`;
    fetch(url)
      .then(res => res.ok ? res.json() : Promise.reject('Failed to load questions'))
      .then(data => {
        setQuestions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load questions.');
        setLoading(false);
      });
  }, [selectedEvent]);

  return (
    <div className="mt-4">
      <h3>All Questions</h3>
      <div className="mb-3">
        <label htmlFor="eventFilter" className="form-label">Filter by Event:</label>
        <select id="eventFilter" className="form-select" value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
          <option value="">All Events</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>{ev.title || ev.name}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div>Loading questions...</div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <table className="table table-bordered table-sm mt-3">
          <thead>
            <tr>
              <th>Event</th>
              <th>User</th>
              <th>Text</th>
              <th>Status</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {questions.map(q => (
              <tr key={q.id}>
                <td>{q.event_title || q.event_id}</td>
                <td>{q.user_name || q.user_id}</td>
                <td>{q.text}</td>
                <td>{q.status}</td>
                <td>{q.timestamp ? new Date(q.timestamp).toLocaleString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminQuestionsView;
