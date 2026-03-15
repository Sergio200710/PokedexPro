import React, { useEffect, useState } from 'react';

const BattleHistory = ({ userId }) => {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = userId
      ? `http://localhost:4412/api/battles?usuario_id=${userId}&limit=30`
      : 'http://localhost:4412/api/battles?limit=30';

    fetch(url, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setBattles(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const modoIcon = (modo) => {
    if (modo === 'ai') return '🤖';
    if (modo === 'multi') return '🌐';
    return '⚔️';
  };

  if (loading) {
    return (
      <div className="history-loading">
        <div className="spinner" />
        <span>Cargando historial...</span>
      </div>
    );
  }

  return (
    <div className="battle-history">
      <h2 className="section-title">📜 Historial de Batallas</h2>
      {battles.length === 0 ? (
        <div className="history-empty">
          <div className="history-empty-icon">🎮</div>
          <p>Aún no hay batallas registradas.</p>
          <p>¡Ve a la Arena y empieza a luchar!</p>
        </div>
      ) : (
        <div className="history-list">
          {battles.map((b) => (
            <div key={b.id} className="history-item">
              <div className="history-modo">{modoIcon(b.modo)}</div>
              <div className="history-pokemon pokemon1">{b.pokemon1}</div>
              <div className="history-vs">VS</div>
              <div className="history-pokemon pokemon2">{b.pokemon2}</div>
              <div className="history-winner">
                🏆 <strong>{b.ganador}</strong>
              </div>
              <div className="history-date">{formatDate(b.fecha)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BattleHistory;
