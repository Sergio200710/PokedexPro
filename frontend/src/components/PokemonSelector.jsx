import React, { useState, useEffect } from 'react';

const TYPE_COLORS = {
  Fuego: '#f97316', Agua: '#38bdf8', Planta: '#4ade80', Eléctrico: '#facc15',
  Veneno: '#c084fc', Fantasma: '#a855f7', Roca: '#a8a29e', Tierra: '#d97706',
  Lucha: '#ef4444', Psíquico: '#f472b6', Bicho: '#84cc16', Normal: '#94a3b8',
  Hada: '#ec4899', Hielo: '#67e8f9', Dragón: '#818cf8', Siniestro: '#374151',
  Acero: '#9ca3af', Volador: '#a5b4fc',
};

const PokemonSelector = ({ label, selected, onSelect, excludeId }) => {
  const [pokemons, setPokemons] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 40;

  useEffect(() => {
    fetch(`http://localhost:4412/api/pokemons?limit=200&offset=0`)
      .then((r) => r.json())
      .then((data) => {
        const list = data.pokemons || data;
        setPokemons(Array.isArray(list) ? list : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = pokemons.filter(
    (p) =>
      p.id !== excludeId &&
      p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="pokemon-selector">
      <div className="selector-label">{label}</div>

      {selected && (
        <div className="selector-selected">
          <img
            src={selected.imagen || ''}
            alt={selected.nombre}
            className="selector-selected-img"
          />
          <div>
            <div className="selector-selected-name">{selected.nombre}</div>
            <div className="selector-selected-stats">
              <span>❤️ {selected.hp}</span>
              <span>⚔️ {selected.ataque}</span>
              <span>🛡️ {selected.defensa}</span>
              <span>✨ {selected.especial_ataque}</span>
              <span>🔰 {selected.especial_defensa}</span>
              <span>💨 {selected.velocidad}</span>
            </div>
          </div>
          <button className="selector-clear" onClick={() => onSelect(null)}>✕</button>
        </div>
      )}

      <input
        className="selector-search"
        type="text"
        placeholder="Buscar Pokémon..."
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
      />

      {loading ? (
        <div className="selector-loading">
          <div className="spinner" />
        </div>
      ) : (
        <>
          <div className="selector-grid">
            {paginated.map((p) => {
              const color = TYPE_COLORS[p.tipo_principal] || '#94a3b8';
              const isSelected = selected?.id === p.id;
              return (
                <div
                  key={p.id}
                  className={`selector-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelect(p)}
                  style={{ borderColor: isSelected ? color : 'transparent' }}
                >
                  <img
                    src={p.imagen || ''}
                    alt={p.nombre}
                    className="selector-img"
                    loading="lazy"
                  />
                  <div className="selector-card-name">{p.nombre}</div>
                  <div
                    className="selector-card-type"
                    style={{ background: color }}
                  >
                    {p.tipo_principal}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="selector-pagination">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="page-btn"
              >
                ◀
              </button>
              <span>{page + 1} / {totalPages}</span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="page-btn"
              >
                ▶
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PokemonSelector;
