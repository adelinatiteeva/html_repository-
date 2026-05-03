import React from 'react';

export default function Stats({ stats, mistakes }) {
  return (
    <section className="card stats-grid">
      <div><small>Rounds</small><strong>{stats.roundsPlayed}</strong></div>
      <div><small>Correct</small><strong>{stats.totalCorrect}</strong></div>
      <div><small>Wrong</small><strong>{stats.totalWrong}</strong></div>
      <div><small>Best Score</small><strong>{stats.bestScore}</strong></div>
      <div><small>Mistake Words</small><strong>{mistakes.length}</strong></div>
    </section>
  );
}
