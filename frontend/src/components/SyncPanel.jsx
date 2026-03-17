import React, { useState, useRef } from 'react';

const SyncPanel = () => {
  const [syncing, setSyncing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [done, setDone] = useState(false);
  const logRef = useRef(null);

  const [progress, setProgress] = useState(0);

  const startSync = () => {
    setSyncing(true);
    setMessages([]);
    setDone(false);
    setProgress(0);

    const es = new EventSource('http://localhost:4412/api/sync-pokemon');

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMessages((prev) => [...prev, data.message || '...']);
      
      // Parsear progreso de mensajes tipo "⚡ 50/1000 Pokémon sincronizados..."
      if (data.message && data.message.includes('/')) {
        const parts = data.message.match(/(\d+)\/(\d+)/);
        if (parts) {
          const current = parseInt(parts[1]);
          const total = parseInt(parts[2]);
          setProgress(Math.round((current / total) * 100));
        }
      }

      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;

      if (data.done) {
        setSyncing(false);
        setDone(true);
        setProgress(100);
        es.close();
      }
    };

    es.onerror = () => {
      setMessages((prev) => [...prev, '❌ Error de conexión']);
      setSyncing(false);
      es.close();
    };
  };

  return (
    <div className="sync-panel">
      <h2 className="section-title">🔄 Sincronizar Pokémon</h2>
      <p className="sync-desc">
        Descarga y guarda todos los Pokémon (1000+) desde la PokéAPI oficial en tu base de datos MySQL.
        Este proceso puede tomar varios minutos.
      </p>

      {!syncing && !done && (
        <button className="btn-sync" onClick={startSync}>
          ⚡ Sincronizar todos los Pokémon
        </button>
      )}

      {syncing && (
        <div className="sync-progress">
          <div className="spinner" />
          <span>Sincronizando... {progress}%</span>
          <div className="sync-bar-container">
            <div className="sync-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {done && (
        <div className="sync-done">
          ✅ ¡Sincronización completada! Recarga la Pokédex para ver todos los Pokémon.
        </div>
      )}

      {messages.length > 0 && (
        <div className="sync-log" ref={logRef}>
          {messages.map((msg, i) => (
            <div key={i} className="sync-log-line">{msg}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SyncPanel;
