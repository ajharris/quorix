import React, { useEffect, useRef, useState } from 'react';

// EventChat: Real-time chat window for attendees, tied to user and event
function EventChat({ user, eventId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);
  const intervalRef = useRef();
  const bottomRef = useRef();

  // Fetch messages (poll every 3s)
  useEffect(() => {
    if (!eventId) return;
    const fetchMessages = () => {
      fetch(`/api/chat/${eventId}`)
        .then(res => res.ok ? res.json() : Promise.reject('Failed to load messages'))
        .then(data => {
          setMessages(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => {
          setError('Could not load chat messages.');
          setLoading(false);
        });
    };
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(intervalRef.current);
  }, [eventId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current && typeof bottomRef.current.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Post a new message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setPosting(true);
    setError('');
    try {
      const res = await fetch(`/api/chat/${eventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, text: input.trim() })
      });
      if (!res.ok) throw new Error('api');
      setInput('');
      // Optimistically refresh
      fetch(`/api/chat/${eventId}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setMessages(Array.isArray(data) ? data : []));
    } catch {
      setError('Failed to send message.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="event-chat border rounded p-3 bg-light mb-4" style={{ maxWidth: 600 }}>
      <h5>Event Chat</h5>
      <div style={{ maxHeight: 250, overflowY: 'auto', background: '#fff', border: '1px solid #eee', borderRadius: 4, padding: 8, marginBottom: 8 }}>
        {loading ? <div>Loading chat...</div> :
          error ? <div className="text-danger">{error}</div> :
          messages.length === 0 ? <div className="text-muted">No messages yet.</div> :
          messages.map(msg => (
            <div key={msg.id} style={{ marginBottom: 6 }}>
              <strong>{msg.user_id === user.id ? 'You' : `User ${msg.user_id}`}:</strong> {msg.text}
              <div style={{ fontSize: 11, color: '#888' }}>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ''}</div>
            </div>
          ))
        }
        <div ref={bottomRef} />
      </div>
      <form className="d-flex" onSubmit={handleSend}>
        <input
          type="text"
          className="form-control me-2"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={posting}
          maxLength={1000}
        />
        <button className="btn btn-primary" type="submit" disabled={posting || !input.trim()}>Send</button>
      </form>
      {error && <div className="text-danger small mt-2">{error}</div>}
    </div>
  );
}

export default EventChat;
