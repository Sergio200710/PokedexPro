import React, { useEffect, useState } from 'react';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32', '#a855f7', '#38bdf8'];

const Leaderboard = () => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:4412/api/ranking', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setRanking(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="leaderboard-loading">
        <div className="spinner" />
        <span>Cargando ranking...</span>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h2 className="section-title">🏆 Ranking de Entrenadores</h2>

      {ranking.length === 0 ? (
        <div className="leaderboard-empty">
          <div style={{ fontSize: '4rem' }}>🎖️</div>
          <p>Aún no hay entrenadores en el ranking.</p>
          <p>¡Inicia sesión y gana batallas para aparecer aquí!</p>
        </div>
      ) : (
        <div className="leaderboard-list">
          {ranking.map((user, i) => (
            <div
              key={user.id}
              className={`leaderboard-item ${i < 3 ? 'top-three' : ''}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div
                className="leaderboard-rank"
                style={{ color: MEDAL_COLORS[i] || '#94a3b8' }}
              >
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </div>

              <img
                src={user.foto || 'https://via.placeholder.com/40'}
                alt={user.nombre}
                className="leaderboard-avatar"
                referrerPolicy="no-referrer"
              />

              <div className="leaderboard-user-info">
                <div className="leaderboard-name">{user.nombre}</div>
                <div className="leaderboard-badges">
                  {(user.insignias || []).slice(0, 5).map((ins, idx) => (
                    <span key={idx} className="insignia-mini" title={`Liga Nv.${ins.nivel}`}>🏅</span>
                  ))}
                </div>
              </div>

              <div className="leaderboard-stats">
                <span className="stat-level">Nv.{user.nivel_entrenador}</span>
                <span className="stat-wins">⚔️ {user.victorias}W</span>
                <span className="stat-losses">💀 {user.derrotas}L</span>
                <span className="stat-winrate">{user.winrate}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
