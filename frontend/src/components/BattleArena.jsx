import React, { useState, useEffect, useRef } from 'react';

const TYPE_COLORS = {
  Fuego: '#f97316', Agua: '#38bdf8', Planta: '#4ade80', Eléctrico: '#facc15',
  Veneno: '#c084fc', Fantasma: '#a855f7', Roca: '#a8a29e', Tierra: '#d97706',
  Lucha: '#ef4444', Psíquico: '#f472b6', Bicho: '#84cc16', Normal: '#94a3b8',
  Hada: '#ec4899', Hielo: '#67e8f9', Dragón: '#818cf8', Siniestro: '#374151',
  Acero: '#9ca3af', Volador: '#a5b4fc',
};

const DAMAGE_FORMULA = (ataque, defensa) => Math.max(5, Math.floor(ataque - defensa / 2));

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const HealthBar = ({ current, max, color }) => {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const barColor = pct > 50 ? '#4ade80' : pct > 25 ? '#facc15' : '#ef4444';
  return (
    <div className="health-bar-wrapper">
      <div className="health-bar-bg">
        <div
          className="health-bar-fill"
          style={{ width: `${pct}%`, background: barColor, boxShadow: `0 0 8px ${barColor}` }}
        />
      </div>
      <span className="health-bar-text">{Math.max(0, current)}/{max}</span>
    </div>
  );
};

const PokemonFighter = ({ pokemon, hp, hpMax, isShaking, isWinner, side }) => {
  if (!pokemon) return <div className="fighter-placeholder">Selecciona un Pokémon</div>;
  const color = TYPE_COLORS[pokemon.tipo_principal] || '#94a3b8';
  return (
    <div className={`fighter-card ${isShaking ? 'shake' : ''} ${isWinner ? 'winner-glow' : ''} ${side}`}>
      <div className="fighter-type-glow" style={{ background: `radial-gradient(circle, ${color}33, transparent 70%)` }} />
      <div className="fighter-name">{pokemon.nombre}</div>
      <div className="fighter-tipo">
        <span className="tipo-badge-sm" style={{ background: color }}>{pokemon.tipo_principal}</span>
        {pokemon.tipo_secundario && (
          <span className="tipo-badge-sm" style={{ background: TYPE_COLORS[pokemon.tipo_secundario] || '#666' }}>
            {pokemon.tipo_secundario}
          </span>
        )}
      </div>
      <div className="fighter-image-wrapper">
        {isWinner && <div className="victory-stars">⭐⭐⭐</div>}
        <img
          src={pokemon.imagen || `https://img.pokemondb.net/artwork/${pokemon.nombre.toLowerCase()}.jpg`}
          alt={pokemon.nombre}
          className="fighter-image"
          style={{ filter: `drop-shadow(0 0 20px ${color})` }}
        />
      </div>
      <HealthBar current={hp} max={hpMax} />
      <div className="fighter-stats-mini">
        <span>❤️ {hp || '50'}</span>
        <span>⚔️ {pokemon.ataque}</span>
        <span>🛡️ {pokemon.defensa}</span>
        <span>✨ {pokemon.especial_ataque}</span>
        <span>🔰 {pokemon.especial_defensa}</span>
        <span>💨 {pokemon.velocidad}</span>
      </div>
    </div>
  );
};

const BattleArena = ({ pokemon1, pokemon2, userId, onBattleEnd }) => {
  const [hp1, setHp1] = useState(null);
  const [hp2, setHp2] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [battling, setBattling] = useState(false);
  const [winner, setWinner] = useState(null);
  const [shaking1, setShaking1] = useState(false);
  const [shaking2, setShaking2] = useState(false);
  const [vsAI, setVsAI] = useState(false);
  const [aiPokemon, setAiPokemon] = useState(null);
  const [actionText, setActionText] = useState('');
  const logRef = useRef(null);

  useEffect(() => {
    if (pokemon1) setHp1(pokemon1.hp || 50);
    if (pokemon2) setHp2(pokemon2.hp || 50);
  }, [pokemon1, pokemon2]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [battleLog]);

  const addLog = (msg, type = 'normal') => {
    setBattleLog((prev) => [...prev, { msg, type, id: Date.now() + Math.random() }]);
  };

  const triggerActionOverlay = (text) => {
    setActionText(text);
    setTimeout(() => setActionText(''), 600);
  };

  const resetBattle = () => {
    if (pokemon1) setHp1(pokemon1.hp || 50);
    const p2 = vsAI ? aiPokemon : pokemon2;
    if (p2) setHp2(p2.hp || 50);
    setBattleLog([]);
    setWinner(null);
    setBattling(false);
    setActionText('');
  };

  const fetchRandomPokemon = async () => {
    try {
      const res = await fetch('http://localhost:4412/api/pokemons?limit=100&offset=0');
      const data = await res.json();
      const list = data.pokemons || data;
      return list[Math.floor(Math.random() * list.length)];
    } catch {
      return null;
    }
  };

  const startBattle = async (isAI = false) => {
    if (!pokemon1) { addLog('⚠️ Selecciona tu Pokémon primero', 'error'); return; }

    let p2 = pokemon2;
    if (isAI) {
      const rand = await fetchRandomPokemon();
      if (!rand) { addLog('❌ No se pudo obtener Pokémon de la IA', 'error'); return; }
      setAiPokemon(rand);
      setVsAI(true);
      p2 = rand;
      setHp2(rand.hp || 50);
      addLog(`🤖 La IA elige a ${rand.nombre}!`, 'ai');
    }

    if (!p2) { addLog('⚠️ Selecciona el Pokémon rival', 'error'); return; }

    setHp1(pokemon1.hp || 50);
    const p2hp = p2.hp || 50;
    setHp2(p2hp);
    setBattleLog([]);
    setWinner(null);
    setBattling(true);

    await delay(300);
    addLog(`⚔️ ¡Comienza el combate! ${pokemon1.nombre} vs ${p2.nombre}!`, 'event');
    await delay(600);

    let currentHp1 = pokemon1.hp || 50;
    let currentHp2 = p2hp;

    const p1First = (pokemon1.velocidad || 50) >= (p2.velocidad || 50);
    addLog(
      p1First
        ? `💨 ${pokemon1.nombre} es más rápido y ataca primero!`
        : `💨 ${p2.nombre} es más rápido y ataca primero!`,
      'info'
    );

    let turno = p1First ? 1 : 2;
    let continuar = true;
    let turnoCount = 0;
    const ACTION_TEXTS = ['¡ZAS!', '¡BOOM!', '¡POW!', '¡CRASH!', '¡CRÍTICO!'];

    while (continuar && turnoCount < 50) {
      turnoCount++;
      await delay(900);

      if (turno === 1) {
        const dmg = DAMAGE_FORMULA(pokemon1.ataque || 50, p2.defensa || 50);
        currentHp2 = Math.max(0, currentHp2 - dmg);
        setHp2(currentHp2);
        setShaking2(true);
        triggerActionOverlay(ACTION_TEXTS[Math.floor(Math.random() * ACTION_TEXTS.length)]);
        setTimeout(() => setShaking2(false), 500);
        addLog(`⚔️ ${pokemon1.nombre} atacó a ${p2.nombre}!`, 'attack1');
        await delay(300);
        addLog(`💥 ${p2.nombre} recibió ${dmg} de daño`, 'damage');
        if (currentHp2 <= 0) {
          await delay(600);
          addLog(`💀 ¡${p2.nombre} ha sido derrotado!`, 'defeat');
          await delay(400);
          addLog(`🏆 ¡${pokemon1.nombre} gana la batalla!`, 'victory');
          setWinner(pokemon1.nombre);
          if (isAI) addLog('🤖 La IA ha sido vencida!', 'ai');
          await saveBattle(pokemon1.nombre, p2.nombre, pokemon1.nombre, isAI ? 'ai' : 'pvp');
          continuar = false;
        }
        turno = 2;
      } else {
        if (isAI) addLog(`🤖 La IA envía a ${p2.nombre} a atacar...`, 'ai');
        const dmg = DAMAGE_FORMULA(p2.ataque || 50, pokemon1.defensa || 50);
        currentHp1 = Math.max(0, currentHp1 - dmg);
        setHp1(currentHp1);
        setShaking1(true);
        triggerActionOverlay(ACTION_TEXTS[Math.floor(Math.random() * ACTION_TEXTS.length)]);
        setTimeout(() => setShaking1(false), 500);
        addLog(`⚔️ ${p2.nombre} atacó a ${pokemon1.nombre}!`, 'attack2');
        await delay(300);
        addLog(`💥 ${pokemon1.nombre} recibió ${dmg} de daño`, 'damage');
        if (currentHp1 <= 0) {
          await delay(600);
          addLog(`💀 ¡${pokemon1.nombre} ha sido derrotado!`, 'defeat');
          await delay(400);
          addLog(`🏆 ¡${p2.nombre} gana la batalla!`, 'victory');
          setWinner(p2.nombre);
          await saveBattle(pokemon1.nombre, p2.nombre, p2.nombre, isAI ? 'ai' : 'pvp');
          continuar = false;
        }
        turno = 1;
      }
    }
    setBattling(false);
  };

  const saveBattle = async (p1, p2, ganador, modo) => {
    try {
      await fetch('http://localhost:4412/api/battles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ usuario_id: userId || null, pokemon1: p1, pokemon2: p2, ganador, modo }),
      });
      onBattleEnd?.({ ganador, pokemon1: p1, pokemon2: p2 });
    } catch (err) {
      console.error('Error guardando batalla:', err);
    }
  };

  const p2Display = vsAI && aiPokemon ? aiPokemon : pokemon2;

  const logTypeClass = {
    attack1: 'log-attack1', attack2: 'log-attack2', damage: 'log-damage',
    defeat: 'log-defeat', victory: 'log-victory', ai: 'log-ai', info: 'log-info',
    event: 'log-event', error: 'log-error', normal: '',
  };

  return (
    <div className="battle-arena">
      {/* CAPA DE PARTÍCULAS WOW */}
      <div className="particle-container">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 6 + 2}px`,
            height: `${Math.random() * 6 + 2}px`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${Math.random() * 2 + 3}s`
          }} />
        ))}
      </div>

      {actionText && <div className="battle-action-overlay">{actionText}</div>}

      <div className="battle-title">⚔️ Arena de Combate</div>

      <div className="fighters-row">
        <PokemonFighter
          pokemon={pokemon1}
          hp={hp1}
          hpMax={pokemon1?.hp || 50}
          isShaking={shaking1}
          isWinner={winner === pokemon1?.nombre}
          side="left"
        />

        <div className="vs-badge">VS</div>

        <PokemonFighter
          pokemon={p2Display}
          hp={hp2}
          hpMax={p2Display?.hp || 50}
          isShaking={shaking2}
          isWinner={winner === p2Display?.nombre}
          side="right"
        />
      </div>

      <div className="battle-controls">
        {!battling && !winner && (
          <>
            <button className="btn-battle pvp" onClick={() => startBattle(false)} disabled={!pokemon1 || !pokemon2}>
              ⚔️ Luchar (PvP)
            </button>
            <button className="btn-battle ai" onClick={() => startBattle(true)} disabled={!pokemon1}>
              🤖 Luchar vs IA
            </button>
          </>
        )}
        {battling && (
          <div className="battle-in-progress">
            <div className="spinner" />
            <span>Combate en progreso...</span>
          </div>
        )}
        {winner && (
          <div className="battle-result">
            <div className="winner-text">🏆 ¡{winner} es el ganador!</div>
            <button className="btn-battle reset" onClick={resetBattle}>🔄 Reto revanche</button>
          </div>
        )}
      </div>

      <div className="battle-log" ref={logRef}>
        <div className="battle-log-title">📜 Registro del Combate</div>
        {battleLog.length === 0 && (
          <div className="log-empty">El combate aún no ha comenzado...</div>
        )}
        {battleLog.map((entry) => (
          <div key={entry.id} className={`log-entry ${logTypeClass[entry.type] || ''}`}>
            {entry.msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BattleArena;
