import React, { useEffect, useState } from 'react';
import './PokemonDetailsModal.css';

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

const PokemonDetailsModal = ({ pokemon, onClose, onToggleFavorite }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Artificial Pokedex Voice Setup
    if (!pokemon) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    
    const textToSpeak = `${pokemon.nombre}. Pokémon de tipo ${pokemon.tipo_principal} ${pokemon.tipo_secundario ? 'y ' + pokemon.tipo_secundario : ''}. 
      Estadísticas de combate: Vida ${pokemon.hp || 50}, Ataque ${pokemon.ataque}, Defensa ${pokemon.defensa}, Ataque Especial ${pokemon.especial_ataque}, Defensa Especial ${pokemon.especial_defensa}, Velocidad ${pokemon.velocidad}.`;
      
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'es-ES';
    utterance.pitch = 1.2; // Slightly robotic/digital pitch
    utterance.rate = 1.1;  // Slightly fast
    // volume
    utterance.volume = 0.8;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);

    // Give it a tiny delay to feel natural after opening
    const timer = setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 400);

    return () => {
      clearTimeout(timer);
      window.speechSynthesis.cancel();
    };
  }, [pokemon]);

  if (!pokemon) return null;

  const bgStyle = TYPE_COLORS[pokemon.tipo_principal] || TYPE_COLORS['Normal'];
  const bgStyle2 = pokemon.tipo_secundario ? (TYPE_COLORS[pokemon.tipo_secundario] || TYPE_COLORS['Normal']) : null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      window.speechSynthesis.cancel();
      onClose();
    }
  };

  const handleCloseClick = () => {
    window.speechSynthesis.cancel();
    onClose();
  };

  const handleFav = (e) => {
    e.stopPropagation();
    onToggleFavorite(pokemon.id, !pokemon.is_favorite);
  };

  const maxStat = 200;
  const hpPercent = Math.min(((pokemon.hp || 50) / maxStat) * 100, 100);
  const atkPercent = Math.min((pokemon.ataque / maxStat) * 100, 100);
  const defPercent = Math.min((pokemon.defensa / maxStat) * 100, 100);
  const spaPercent = Math.min((pokemon.especial_ataque / maxStat) * 100, 100);
  const spdDefPercent = Math.min((pokemon.especial_defensa / maxStat) * 100, 100);
  const spdPercent = Math.min((pokemon.velocidad / maxStat) * 100, 100);
  const totalStats = (pokemon.hp || 50) + (pokemon.ataque || 0) + (pokemon.defensa || 0) + 
                     (pokemon.especial_ataque || 0) + (pokemon.especial_defensa || 0) + (pokemon.velocidad || 0);

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="details-modal">
        <button className="btn-close" onClick={handleCloseClick}>&times;</button>
        
        <div className="modal-header" style={{ background: bgStyle }}>
          <div className="modal-id">#{pokemon.id.toString().padStart(3, '0')}</div>
          
          {/* Audio Indicator */}
          {isPlaying && (
             <div className="audio-wave">
               <div className="wave-bar"></div><div className="wave-bar"></div>
               <div className="wave-bar"></div><div className="wave-bar"></div>
             </div>
          )}

          <div 
            className={`fav-btn-modal ${pokemon.is_favorite ? 'active' : ''}`}
            onClick={handleFav}
            title={pokemon.is_favorite ? 'Quitar de Favoritos' : 'Añadir a Favoritos'}
          >
             <svg viewBox="0 0 24 24">
               <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
             </svg>
          </div>
          <div className="modal-image-container">
            <div className="energy-ring"></div>
            <div className="energy-ring reverse"></div>
            <img 
              src={pokemon.imagenAnimada || pokemon.imagen} 
              alt={pokemon.nombre} 
              className="modal-image" 
            />
            <div className="scanline"></div>
          </div>
        </div>

        <div className="modal-body">
          <h2 className="modal-title">{pokemon.nombre}</h2>
          
          <div className="tipo-badges-row-modal">
            <span className="tipo-badge" style={{ background: bgStyle }}>
              {pokemon.tipo_principal}
            </span>
            {pokemon.tipo_secundario && (
              <span className="tipo-badge" style={{ background: bgStyle2 }}>
                {pokemon.tipo_secundario}
              </span>
            )}
          </div>

          <div className="stats-container">
            <h3 className="stats-title">Estadísticas Base</h3>
            
            <div className="stat-row">
              <span className="stat-label">HP</span>
              <span className="stat-val">{pokemon.hp || '50'}</span>
              <div className="stat-bar-bg">
                <div className="stat-bar-fill stat-hp" style={{ width: `${hpPercent}%` }}></div>
              </div>
            </div>
            
            <div className="stat-row">
              <span className="stat-label">Ataque</span>
              <span className="stat-val">{pokemon.ataque}</span>
              <div className="stat-bar-bg">
                <div className="stat-bar-fill stat-atk" style={{ width: `${atkPercent}%` }}></div>
              </div>
            </div>

            <div className="stat-row">
              <span className="stat-label">Defensa</span>
              <span className="stat-val">{pokemon.defensa}</span>
              <div className="stat-bar-bg">
                <div className="stat-bar-fill stat-def" style={{ width: `${defPercent}%` }}></div>
              </div>
            </div>

            <div className="stat-row">
              <span className="stat-label">Esp. Atk</span>
              <span className="stat-val">{pokemon.especial_ataque || '50'}</span>
              <div className="stat-bar-bg">
                <div className="stat-bar-fill stat-spa" style={{ width: `${spaPercent}%` }}></div>
              </div>
            </div>

            <div className="stat-row">
              <span className="stat-label">Esp. Def</span>
              <span className="stat-val">{pokemon.especial_defensa || '50'}</span>
              <div className="stat-bar-bg">
                <div className="stat-bar-fill stat-spd-def" style={{ width: `${spdDefPercent}%` }}></div>
              </div>
            </div>

            <div className="stat-row">
              <span className="stat-label">Velocidad</span>
              <span className="stat-val">{pokemon.velocidad || '50'}</span>
              <div className="stat-bar-bg">
                <div className="stat-bar-fill stat-spd" style={{ width: `${spdPercent}%` }}></div>
              </div>
            </div>

            <div className="stat-total">
               <strong>Total: </strong> {totalStats}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokemonDetailsModal;
