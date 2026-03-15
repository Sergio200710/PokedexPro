import React, { useState, useEffect } from 'react';
import PokemonCard from './components/PokemonCard';
import MiniMapFavorites from './components/MiniMapFavorites';
import LoginGoogle from './components/LoginGoogle';
import BattleArena from './components/BattleArena';
import BattleHistory from './components/BattleHistory';
import Leaderboard from './components/Leaderboard';
import PokemonSelector from './components/PokemonSelector';
import MultiPlayerArena from './components/MultiPlayerArena';
import SyncPanel from './components/SyncPanel';
import './App.css';

const TABS = [
  { id: 'pokedex', label: '📖 Pokédex' },
  { id: 'battle', label: '⚔️ Arena' },
  { id: 'multi', label: '🌐 Multi' },
  { id: 'history', label: '📜 Historial' },
  { id: 'leaderboard', label: '🏆 Ranking' },
  { id: 'sync', label: '🔄 Sync' },
];

function App() {
  const [activeTab, setActiveTab] = useState('pokedex');
  const [user, setUser] = useState(null);

  // Pokédex state
  const [pokemons, setPokemons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchNombre, setSearchNombre] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 60;

  // Battle state
  const [pokemon1, setPokemon1] = useState(null);
  const [pokemon2, setPokemon2] = useState(null);
  const [showSelector, setShowSelector] = useState(false);

  const fetchPokemons = (currentPage = 0, tipo = filterTipo, search = searchNombre) => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: PAGE_SIZE,
      offset: currentPage * PAGE_SIZE,
      ...(tipo && { tipo }),
      ...(search && { search }),
    });

    fetch(`http://localhost:4412/api/pokemons?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error('Backend caído o error HTTP.');
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          setError(data.error + ': ' + (data.detail || ''));
        } else {
          const list = data.pokemons || data;
          setPokemons(Array.isArray(list) ? list : []);
          setTotal(data.total || list.length);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError('Error de conexión al backend MySQL.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPokemons(0);
  }, []);

  const handleSearch = () => {
    setPage(0);
    fetchPokemons(0, filterTipo, searchNombre);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchPokemons(newPage, filterTipo, searchNombre);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = async (id, is_favorite) => {
    setPokemons((prev) => prev.map((p) => (p.id === id ? { ...p, is_favorite } : p)));
    await fetch(`http://localhost:4412/api/pokemons/${id}/favorite`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_favorite }),
    });
  };

  const favoritosEnEquipo = pokemons.filter((p) => p.is_favorite);
  const tiposUnicos = [...new Set(pokemons.map((p) => p.tipo_principal))].sort();
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1 className="main-title">Pokédex Ultimate</h1>
        <LoginGoogle onLogin={setUser} onLogout={() => setUser(null)} />
      </header>

      {/* Navigation Tabs */}
      <nav className="main-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* ====== POKÉDEX ====== */}
      {activeTab === 'pokedex' && (
        <div className="tab-content">
          {!loading && !error && favoritosEnEquipo.length > 0 && (
            <MiniMapFavorites favorites={favoritosEnEquipo} />
          )}

          <div className="filters">
            <input
              type="text"
              placeholder="Buscar Pokémon..."
              value={searchNombre}
              onChange={(e) => setSearchNombre(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <select value={filterTipo} onChange={(e) => { setFilterTipo(e.target.value); }}>
              <option value="">Cualquier tipo</option>
              {tiposUnicos.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
            <button className="btn-filter" onClick={handleSearch}>Buscar</button>
          </div>

          <div className="total-count">
            {total > 0 && <span>📊 {total} Pokémon en la base de datos</span>}
          </div>

          {loading ? (
            <div className="loading-screen">
              <div className="pokeball-spinner" />
              <h2>Detectando señal Pokémon...</h2>
            </div>
          ) : error ? (
            <div className="error-box">
              <h2>❌ No hay señal GPS</h2>
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div className="pokemon-grid">
                {pokemons.length > 0 ? (
                  pokemons.map((pokemon) => (
                    <PokemonCard
                      key={pokemon.id}
                      pokemon={pokemon}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))
                ) : (
                  <h3 className="no-results">No se detectaron Pokémon en este área.</h3>
                )}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    disabled={page === 0}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    ◀ Anterior
                  </button>
                  <span className="page-info">
                    Página {page + 1} de {totalPages}
                  </span>
                  <button
                    className="page-btn"
                    disabled={page >= totalPages - 1}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    Siguiente ▶
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ====== BATTLE ARENA ====== */}
      {activeTab === 'battle' && (
        <div className="tab-content battle-arena-tab">
          <div className="battle-setup">
            <div className="setup-selectors">
              <div className="setup-selector-wrapper">
                <div className="setup-label">🔴 Tu Pokémon</div>
                <PokemonSelector
                  label="Selecciona tu Pokémon"
                  selected={pokemon1}
                  onSelect={setPokemon1}
                  excludeId={pokemon2?.id}
                />
              </div>
              <div className="setup-vs">⚔️</div>
              <div className="setup-selector-wrapper">
                <div className="setup-label">🔵 Pokémon rival</div>
                <PokemonSelector
                  label="Selecciona el rival"
                  selected={pokemon2}
                  onSelect={setPokemon2}
                  excludeId={pokemon1?.id}
                />
              </div>
            </div>
          </div>

          <BattleArena
            pokemon1={pokemon1}
            pokemon2={pokemon2}
            userId={user?.id}
            onBattleEnd={() => {}}
          />
        </div>
      )}

      {/* ====== MULTIJUGADOR ====== */}
      {activeTab === 'multi' && (
        <div className="tab-content">
          <MultiPlayerArena user={user} />
        </div>
      )}

      {/* ====== HISTORIAL ====== */}
      {activeTab === 'history' && (
        <div className="tab-content">
          <BattleHistory userId={user?.id} />
        </div>
      )}

      {/* ====== LEADERBOARD ====== */}
      {activeTab === 'leaderboard' && (
        <div className="tab-content">
          <Leaderboard />
        </div>
      )}

      {/* ====== SYNC ====== */}
      {activeTab === 'sync' && (
        <div className="tab-content">
          <SyncPanel />
          {user && (
            <div className="trainer-profile">
              <h3 className="section-title">🎖️ Tu Perfil de Entrenador</h3>
              <div className="profile-card">
                <img src={user.foto} alt={user.nombre} className="profile-avatar" referrerPolicy="no-referrer" />
                <div className="profile-info">
                  <div className="profile-name">{user.nombre}</div>
                  <div className="profile-email">{user.email}</div>
                  <div className="profile-stats">
                    <div className="profile-stat">
                      <div className="stat-value">{user.nivel_entrenador}</div>
                      <div className="stat-label">Nivel</div>
                    </div>
                    <div className="profile-stat">
                      <div className="stat-value">{user.victorias}</div>
                      <div className="stat-label">Victorias</div>
                    </div>
                    <div className="profile-stat">
                      <div className="stat-value">{user.derrotas}</div>
                      <div className="stat-label">Derrotas</div>
                    </div>
                    <div className="profile-stat">
                      <div className="stat-value">{user.racha_actual}/5</div>
                      <div className="stat-label">Racha Liga</div>
                    </div>
                  </div>
                  <div className="profile-insignias">
                    <div className="insignias-title">🏅 Insignias de Liga</div>
                    {(JSON.parse(user.insignias || '[]')).length === 0 ? (
                      <div className="no-insignias">Gana 5 seguidas vs IA para obtener una insignia</div>
                    ) : (
                      <div className="insignias-grid">
                        {JSON.parse(user.insignias || '[]').map((ins, i) => (
                          <div key={i} className="insignia-badge" title={`Liga Nv.${ins.nivel}`}>
                            🏅
                            <div className="insignia-level">Nv.{ins.nivel}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
