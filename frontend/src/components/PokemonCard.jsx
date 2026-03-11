import React from 'react';

const PokemonCard = ({ id, name }) => {
  // Extract external API image based on the ID
  // Using official artwork for high quality richer aesthetic
  const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

  return (
    <div className="pokemon-card">
      <span className="pokemon-id">#{String(id).padStart(3, '0')}</span>
      <div className="pokemon-image-container">
        <img src={imageUrl} alt={name} className="pokemon-image" loading="lazy" />
      </div>
      <h3 className="pokemon-name">{name}</h3>
    </div>
  );
};

export default PokemonCard;
