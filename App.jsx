import React, { useEffect, useMemo, useState } from 'react';
import WordListManager from './components/WordListManager.jsx';
import GameScreen from './components/GameScreen.jsx';
import MistakesList from './components/MistakesList.jsx';
import Stats from './components/Stats.jsx';

const STORAGE_KEY = 'vocabMonsterDataV1';

const demoLists = [
  {
    id: 'demo-1',
    name: 'Spanish Basics',
    words: [
      { id: 'w1', original: 'hello', translation: 'hola' },
      { id: 'w2', original: 'thank you', translation: 'gracias' },
      { id: 'w3', original: 'good night', translation: 'buenas noches' },
      { id: 'w4', original: 'water', translation: 'agua' },
    ],
  },
  {
    id: 'demo-2',
    name: 'German Travel',
    words: [
      { id: 'w5', original: 'train station', translation: 'bahnhof' },
      { id: 'w6', original: 'ticket', translation: 'fahrkarte' },
      { id: 'w7', original: 'hotel', translation: 'hotel' },
    ],
  },
];

const initialData = {
  lists: demoLists,
  selectedListId: demoLists[0].id,
  mistakes: {},
  stats: {
    roundsPlayed: 0,
    totalCorrect: 0,
    totalWrong: 0,
    bestScore: 0,
  },
};

export default function App() {
  const [data, setData] = useState(initialData);
  const [mode, setMode] = useState('manage');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.lists?.length) {
        setData({ ...initialData, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load local storage', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const selectedList = useMemo(
    () => data.lists.find((l) => l.id === data.selectedListId) ?? data.lists[0],
    [data.lists, data.selectedListId]
  );

  const mistakesArray = useMemo(
    () =>
      Object.entries(data.mistakes).map(([key, value]) => ({
        key,
        original: value.original,
        translation: value.translation,
        wrongCount: value.wrongCount,
        streak: value.streak,
        improved: value.improved,
      })),
    [data.mistakes]
  );

  const updateMistake = (word, wasCorrect) => {
    const key = `${word.original.toLowerCase()}__${word.translation.toLowerCase()}`;
    setData((prev) => {
      const current = prev.mistakes[key] || {
        original: word.original,
        translation: word.translation,
        wrongCount: 0,
        streak: 0,
        improved: false,
      };

      const next = wasCorrect
        ? {
            ...current,
            streak: current.streak + 1,
            improved: current.streak + 1 >= 3,
          }
        : {
            ...current,
            wrongCount: current.wrongCount + 1,
            streak: 0,
            improved: false,
          };

      return {
        ...prev,
        mistakes: {
          ...prev.mistakes,
          [key]: next,
        },
      };
    });
  };

  const onRoundComplete = ({ score, correct, wrong }) => {
    setData((prev) => ({
      ...prev,
      stats: {
        roundsPlayed: prev.stats.roundsPlayed + 1,
        totalCorrect: prev.stats.totalCorrect + correct,
        totalWrong: prev.stats.totalWrong + wrong,
        bestScore: Math.max(prev.stats.bestScore, score),
      },
    }));
    setMode('manage');
  };

  return (
    <div className="app-shell">
      <header className="top-bar">
        <h1>Monster Vocab Quest</h1>
        <div className="mode-buttons">
          <button onClick={() => setMode('manage')} className={mode === 'manage' ? 'active' : ''}>Lists</button>
          <button onClick={() => setMode('mistakes')} className={mode === 'mistakes' ? 'active' : ''}>Mistakes</button>
        </div>
      </header>

      <Stats stats={data.stats} mistakes={mistakesArray} />

      {mode === 'manage' && (
        <WordListManager
          lists={data.lists}
          selectedListId={data.selectedListId}
          onUpdate={(lists) => setData((prev) => ({ ...prev, lists }))}
          onSelectList={(selectedListId) => setData((prev) => ({ ...prev, selectedListId }))}
          onStart={() => setMode('game')}
        />
      )}

      {mode === 'mistakes' && (
        <MistakesList
          mistakes={mistakesArray}
          onTrainMistakes={() => setMode('mistake-game')}
        />
      )}

      {mode === 'game' && selectedList && (
        <GameScreen
          title={`Training: ${selectedList.name}`}
          words={selectedList.words}
          onFinish={onRoundComplete}
          onWordResult={updateMistake}
        />
      )}

      {mode === 'mistake-game' && mistakesArray.length > 0 && (
        <GameScreen
          title="Training: Mistakes Mode"
          words={mistakesArray.map((m) => ({ original: m.original, translation: m.translation }))}
          onFinish={onRoundComplete}
          onWordResult={updateMistake}
        />
      )}
    </div>
  );
}
