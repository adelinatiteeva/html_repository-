import React, { useState } from 'react';

const uid = () => Math.random().toString(36).slice(2, 9);

export default function WordListManager({ lists, selectedListId, onUpdate, onSelectList, onStart }) {
  const [newListName, setNewListName] = useState('');
  const [original, setOriginal] = useState('');
  const [translation, setTranslation] = useState('');

  const selectedList = lists.find((l) => l.id === selectedListId) || lists[0];

  const addList = () => {
    if (!newListName.trim()) return;
    const list = { id: uid(), name: newListName.trim(), words: [] };
    onUpdate([...lists, list]);
    onSelectList(list.id);
    setNewListName('');
  };

  const deleteList = (id) => {
    const next = lists.filter((l) => l.id !== id);
    onUpdate(next.length ? next : [{ id: uid(), name: 'My First List', words: [] }]);
    if (id === selectedListId && next[0]) onSelectList(next[0].id);
  };

  const addWord = () => {
    if (!original.trim() || !translation.trim()) return;
    const next = lists.map((l) =>
      l.id === selectedList.id
        ? {
            ...l,
            words: [...l.words, { id: uid(), original: original.trim(), translation: translation.trim() }],
          }
        : l
    );
    onUpdate(next);
    setOriginal('');
    setTranslation('');
  };

  const removeWord = (wordId) => {
    const next = lists.map((l) =>
      l.id === selectedList.id ? { ...l, words: l.words.filter((w) => w.id !== wordId) } : l
    );
    onUpdate(next);
  };

  return (
    <section className="card">
      <h2>Your Vocabulary Lists</h2>
      <div className="row stack-mobile">
        <input value={newListName} onChange={(e) => setNewListName(e.target.value)} placeholder="New list name" />
        <button onClick={addList}>Create List</button>
      </div>

      <div className="list-tabs">
        {lists.map((l) => (
          <button key={l.id} className={selectedList.id === l.id ? 'active' : ''} onClick={() => onSelectList(l.id)}>
            {l.name}
          </button>
        ))}
      </div>

      <div className="row stack-mobile">
        <input value={original} onChange={(e) => setOriginal(e.target.value)} placeholder="Original word" />
        <input value={translation} onChange={(e) => setTranslation(e.target.value)} placeholder="Translation" />
        <button onClick={addWord}>Add Pair</button>
      </div>

      <ul className="word-list">
        {selectedList.words.map((w) => (
          <li key={w.id}>
            <span>{w.original} → {w.translation}</span>
            <button onClick={() => removeWord(w.id)} className="danger">Delete</button>
          </li>
        ))}
      </ul>

      <div className="row">
        <button onClick={onStart} disabled={!selectedList.words.length}>Start Training</button>
        <button onClick={() => deleteList(selectedList.id)} className="danger ghost">Delete Current List</button>
      </div>
    </section>
  );
}
