import React from 'react';

const MiniMapFavorites = ({ favorites, onClick }) => {
  return (
    <div className="mini-map-container">
      <div className="mini-map-bg"></div>
      <div className="mini-map-title">🔴 En tu equipo ({favorites.length})</div>
      
      {favorites.length === 0 ? (
        <div className="mini-map-empty">Aún no has atrapado a ningún Pokémon.</div>
      ) : (
        favorites.map((fav, index) => {
          // Generar posiciones aleatorias basadas en el ID para mantener consistencia 
          // (pseudo aleatorio) entre renders.
          const topPosition = 20 + ((fav.id * 17) % 60) + '%';
          const leftPosition = 10 + ((fav.id * 23) % 80) + '%';
          
          // Duración 3D para darle movimiento desincronizado a cada uno
          const floatDelay = ((fav.id % 5) * 0.5) + 's';
          
          return (
            <div 
              key={fav.id} 
              className="floating-pokemon-wrapper"
              style={{ top: topPosition, left: leftPosition, animationDelay: floatDelay }}
              title={fav.nombre}
              onClick={() => onClick && onClick(fav)}
            >
              {/* Priorizar sprite animado, o fallback al artwork oficial de la lista principal */}
              <img 
                src={fav.imagenAnimada || fav.imagen} 
                className="floating-pokemon" 
                alt={fav.nombre} 
                draggable="false"
              />
            </div>
          );
        })
      )}
    </div>
  );
};

export default MiniMapFavorites;
