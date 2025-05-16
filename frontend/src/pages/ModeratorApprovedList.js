import React from 'react';

function ModeratorApprovedList({ questions }) {
  return (
    <div>
      <h4>Approved Questions</h4>
      <ul className="list-group mb-3">
        {questions.map(q => (
          <li key={q.id} className="list-group-item">
            {q.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ModeratorApprovedList;
