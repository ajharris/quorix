import React from 'react';

function ModeratorBanDialog({ userId, banType, banDuration, setBanType, setBanDuration, onCancel, onSubmit, banning }) {
  return (
    <div className="modal show" style={{ display: 'block', background: 'rgba(0,0,0,0.3)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Ban User: {userId}</h5>
            <button type="button" className="btn-close" onClick={onCancel}></button>
          </div>
          <div className="modal-body">
            <div className="mb-2">
              <label className="form-label">Ban Type:</label>
              <select className="form-select" value={banType} onChange={e => setBanType(e.target.value)}>
                <option value="permanent">Permanent</option>
                <option value="temporary">Temporary</option>
              </select>
            </div>
            {banType === 'temporary' && (
              <div className="mb-2">
                <label className="form-label">Duration (hours):</label>
                <input type="number" className="form-control" value={banDuration} onChange={e => setBanDuration(e.target.value)} min="1" />
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onCancel} disabled={banning}>Cancel</button>
            <button className="btn btn-danger" onClick={onSubmit} disabled={banning || (banType === 'temporary' && !banDuration)}>Ban</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModeratorBanDialog;
