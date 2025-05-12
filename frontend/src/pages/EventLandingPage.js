import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function EventLandingPage() {
  const { eventCode } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/session/${eventCode}`)
      .then(res => res.json())
      .then(data => {
        setEvent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [eventCode]);

  if (loading) return <div>Loading event...</div>;
  if (!event) return <div>Event not found.</div>;

  return (
    <div>
      <h1>{event.title}</h1>
      <p>Date: {new Date(event.start_time).toLocaleString()}</p>
      <p>{event.description}</p>
      {/* TODO: Add login/registration UI here */}
      <button>Login / Register</button>
    </div>
  );
}

export default EventLandingPage;
