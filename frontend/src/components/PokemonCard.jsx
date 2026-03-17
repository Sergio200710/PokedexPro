import React, { useState, useRef } from 'react';

// Colores base para los badges de los tipos (ampliado con todos los tipos)
const TYPE_COLORS = {
  Fuego: 'linear-gradient(135deg, #f97316, #dc2626)',
  Agua: 'linear-gradient(135deg, #38bdf8, #2563eb)',
  Planta: 'linear-gradient(135deg, #4ade80, #16a34a)',
  Eléctrico: 'linear-gradient(135deg, #facc15, #ca8a04)',
  Veneno: 'linear-gradient(135deg, #c084fc, #9333ea)',
  Fantasma: 'linear-gradient(135deg, #a855f7, #6b21a8)',
  Roca: 'linear-gradient(135deg, #a8a29e, #78716c)',
  Tierra: 'linear-gradient(135deg, #d97706, #92400e)',
  Lucha: 'linear-gradient(135deg, #ef4444, #991b1b)',
  Psíquico: 'linear-gradient(135deg, #f472b6, #db2777)',
  Bicho: 'linear-gradient(135deg, #bef264, #65a30d)',
  Normal: 'linear-gradient(135deg, #cbd5e1, #64748b)',
  Hada: 'linear-gradient(135deg, #fbcfe8, #ec4899)',
  Hielo: 'linear-gradient(135deg, #67e8f9, #06b6d4)',
  Dragón: 'linear-gradient(135deg, #818cf8, #4338ca)',
  Siniestro: 'linear-gradient(135deg, #64748b, #1e293b)',
  Acero: 'linear-gradient(135deg, #94a3b8, #64748b)',
  Volador: 'linear-gradient(135deg, #a5b4fc, #6366f1)',
};

const PokemonCard = ({ pokemon, onToggleFavorite, onClick }) => {
  const [showSparkles, setShowSparkles] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glX: 50, glY: 50, hover: false });
  const cardRef = useRef(null);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (!pokemon.is_favorite) {
      setShowSparkles(true);
      setTimeout(() => setShowSparkles(false), 800);
    }
    await onToggleFavorite(pokemon.id, !pokemon.is_favorite);
  };

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left; 
    const y = e.clientY - rect.top;  
    
    // Calcular rotación 3D extrema
    const rotateY = ((x / rect.width) - 0.5) * 40; 
    const rotateX = ((y / rect.height) - 0.5) * -40;
    
    const glX = (x / rect.width) * 100;
    const glY = (y / rect.height) * 100;

    setTilt({ x: rotateX, y: rotateY, glX, glY, hover: true });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, glX: 50, glY: 50, hover: false });
  };

  const bgStyle = TYPE_COLORS[pokemon.tipo_principal] || TYPE_COLORS['Normal'];
  const bgStyle2 = pokemon.tipo_secundario ? (TYPE_COLORS[pokemon.tipo_secundario] || TYPE_COLORS['Normal']) : null;

  const tiltStyle = {
    transform: tilt.hover 
      ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.08, 1.08, 1.08)` 
      : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: tilt.hover ? 'none' : 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
    cursor: onClick ? 'pointer' : 'default',
    zIndex: tilt.hover ? 20 : 1
  };

  const isShiny = (pokemon.hp || 50) + pokemon.ataque + pokemon.defensa + pokemon.velocidad > 250;

  return (
    <div 
      className={`pokemon-card ${isShiny ? 'shiny' : ''}`}
      onClick={() => onClick && onClick(pokemon)} 
      style={tiltStyle}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      ref={cardRef}
    >
      {isShiny && <div className="shiny-stars">✨ SHINY ✨</div>}
      {tilt.hover && (
        <div 
          className="card-holo-glare" 
          style={{ 
            background: `radial-gradient(circle at ${tilt.glX}% ${tilt.glY}%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 60%)` 
          }}
        />
      )}
      <div className="card-glow" />
      
      <div className="card-id">#{pokemon.id}</div>

      {/* Botón Favorito Tipo Pokemon GO */}
      <div 
        className={`fav-btn ${pokemon.is_favorite ? 'active' : ''}`}
        onClick={handleFavoriteClick}
        title={pokemon.is_favorite ? 'Soltar' : 'Atrapar'}
      >
        <svg viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>

      <div className="pokemon-image-container">
        {showSparkles && <div className="catch-sparkle"></div>}
        {pokemon.imagen ? (
          <img src={pokemon.imagen} alt={pokemon.nombre} className="pokemon-image" loading="lazy" />
        ) : (
          <div className="pokemon-image" style={{ width: 100, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(100,116,139,0.3)', borderRadius:'50%', fontSize: '2rem' }}>
            ?
          </div>
        )}
      </div>

      <h2>{pokemon.nombre}</h2>
      <div className="tipo-badges-row">
        <span className="tipo-badge" style={{ background: bgStyle }}>
          {pokemon.tipo_principal}
        </span>
        {pokemon.tipo_secundario && (
          <span className="tipo-badge" style={{ background: bgStyle2 }}>
            {pokemon.tipo_secundario}
          </span>
        )}
      </div>
      
      <div className="stats">
        <div><strong>❤️ HP:</strong> {pokemon.hp || '—'}</div>
        <div><strong>⚔️ ATK:</strong> {pokemon.ataque}</div>
        <div><strong>🛡️ DEF:</strong> {pokemon.defensa}</div>
        <div><strong>💨 SPD:</strong> {pokemon.velocidad}</div>
      </div>
    </div>
  );
};

export default PokemonCard;
