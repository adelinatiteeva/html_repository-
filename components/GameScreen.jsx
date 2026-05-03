import React, { useEffect, useMemo, useState } from 'react';
import Monster from './Monster.jsx';

const TIME_PER_WORD = 8;

export default function GameScreen({ title, words, onFinish, onWordResult }) {
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_WORD);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [explode, setExplode] = useState(false);

  const currentWord = words[index];
  const progress = useMemo(() => ((TIME_PER_WORD - timeLeft) / TIME_PER_WORD) * 100, [timeLeft]);

  useEffect(() => {
    if (!currentWord) {
      onFinish({ score, correct: correctCount, wrong: wrongCount });
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          processAnswer(false);
          return TIME_PER_WORD;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  });

  const nextWord = () => {
    setAnswer('');
    setTimeLeft(TIME_PER_WORD);
    setIndex((i) => i + 1);
  };

  const processAnswer = (isCorrect) => {
    if (!currentWord) return;
    onWordResult(currentWord, isCorrect);
    if (isCorrect) {
      setScore((s) => s + 1);
      setCorrectCount((c) => c + 1);
      setExplode(true);
      setTimeout(() => setExplode(false), 400);
    } else {
      setScore((s) => s - 1);
      setWrongCount((w) => w + 1);
    }
    nextWord();
  };

  const submit = (e) => {
    e.preventDefault();
    const isCorrect = answer.trim().toLowerCase() === currentWord.translation.toLowerCase();
    processAnswer(isCorrect);
  };

  if (!currentWord) return null;

  return (
    <section className="card game-card">
      <h2>{title}</h2>
      <div className="scoreboard">
        <strong>Score: {score}</strong>
        <span>Time: {timeLeft}s</span>
      </div>

      <Monster progress={progress} />
      {explode && <div className="explosion">💥 Great!</div>}

      <p className="word-prompt">Translate: <b>{currentWord.original}</b></p>
      <form onSubmit={submit} className="row stack-mobile">
        <input
          className="large-input"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type translation..."
          autoFocus
        />
        <button type="submit">Check</button>
      </form>
    </section>
  );
}
