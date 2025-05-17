import React from 'react';

// ModeratorQuestionList displays all pending questions for moderation.
// Adds Approve, Delete, Flag, and Merge controls for each question.
function ModeratorQuestionList({ questions, selected, setSelected, onAction, onToggleExcludeFromAI }) {
  if (questions.length === 0) {
    // Show empty state if no pending questions
    return (
      <div>
        <h4>Pending Questions</h4>
        <div>No new questions.</div>
      </div>
    );
  }
  return (
    <div>
      <h4>Pending Questions</h4>
      <ul className="list-group mb-3">
        {questions.map(q => (
          <li key={q.id} className="list-group-item d-flex justify-content-between align-items-center">
            <span>{q.text}</span>
            <div>
              <label className="me-2">
                <input
                  type="checkbox"
                  checked={!!q.exclude_from_ai}
                  onChange={e => onToggleExcludeFromAI && onToggleExcludeFromAI(q.id, e.target.checked)}
                  className="me-1"
                />
                Exclude from AI
              </label>
              <button className="btn btn-success btn-sm me-2" onClick={() => onAction(q.id, 'approve')}>Approve</button>
              <button className="btn btn-danger btn-sm me-2" onClick={() => onAction(q.id, 'delete')}>Delete</button>
              <button className="btn btn-warning btn-sm me-2" onClick={() => onAction(q.id, 'flag')}>Flag</button>
              <input
                type="checkbox"
                aria-label={`select-question-${q.id}`}
                checked={selected.includes(q.id)}
                onChange={e => {
                  if (e.target.checked) setSelected([...selected, q.id]);
                  else setSelected(selected.filter(id => id !== q.id));
                }}
              /> Merge
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ModeratorQuestionList;
