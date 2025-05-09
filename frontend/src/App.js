import React, { useEffect, useState } from 'react';

function App() {
  const [message, setMessage] = useState(''); // Initialize state

  useEffect(() => {
    fetch('/api/ping')
      .then(response => response.json())
      .then(data => {
        console.log(data); // This shows: { message: "Pong!" }
        setMessage(data.message); // Store it in React state
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <div>
      <h1>React Frontend</h1>
      <p>Backend says: {message}</p> {/* Should now show: Pong! */}
    </div>
  );
}

export default App;
