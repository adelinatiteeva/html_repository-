import React from 'react';

export default function MistakesList({ mistakes, onTrainMistakes }) {
  return (
    <section className="card">
      <h2>Mistakes Training</h2>
      {!mistakes.length ? <p>No mistakes yet. Great job!</p> : null}
      <ul className="word-list">
        {mistakes.map((m) => (
          <li key={m.key}>
            <span>
              {m.original} → {m.translation} | Wrong: {m.wrongCount} | Streak: {m.streak}
            </span>
            {m.improved ? <span className="badge">Improved ✅</span> : <span className="badge soft">Needs work</span>}
          </li>
        ))}
      </ul>
      <button onClick={onTrainMistakes} disabled={!mistakes.length}>Train Mistakes</button>
    </section>
  );
}
