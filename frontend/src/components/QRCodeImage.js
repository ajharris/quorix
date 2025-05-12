import React from 'react';

function QRCodeImage({ sessionId }) {
  if (!sessionId) return null;
  const qrUrl = `/session_qr/${sessionId}`;
  return (
    <div>
      <img src={qrUrl} alt="Event QR Code" style={{ width: 200, height: 200 }} />
      <p>Scan to join this event</p>
    </div>
  );
}

export default QRCodeImage;