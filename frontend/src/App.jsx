import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import PokemonCard from './components/PokemonCard';
import './index.css';

function App() {
  const [pokemon, setPokemon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch from backend
    const fetchData = async () => {
      try {
        setLoading(true);
        // Using our backend url which filters pokemon
        const response = await fetch(`http://localhost:3001/api/pokemon?search=${searchTerm}`);
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setPokemon(data);
      } catch (error) {
        console.error("Error fetching pokemon:", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search slightly to prevent too many requests
    const timeoutId = setTimeout(() => {
        fetchData();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div className="app-container">
      <div className="header">
        <h1>PokéDex Pro</h1>
        <p>Explore the complete Pokémon Library</p>
      </div>

      <SearchBar onSearch={setSearchTerm} />

      {loading ? (
        <div className="loading">Detecting Pokémon...</div>
      ) : (
        <div className="pokemon-grid">
          {pokemon.length > 0 ? (
            pokemon.map((p) => (
              <PokemonCard key={p.id} id={p.id} name={p.name} />
            ))
          ) : (
            <div className="no-results">
              No Pokémon found matching "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
