import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import PokemonSelector from './PokemonSelector';

const MultiPlayerArena = ({ user }) => {
  const [socket, setSocket] = useState(null);
  const [step, setStep] = useState('lobby'); // lobby | waiting | selecting | battle | ended
  const [salaId, setSalaId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [myPokemon, setMyPokemon] = useState(null);
  const [battleState, setBattleState] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [myTurn, setMyTurn] = useState(false);
  const [resultado, setResultado] = useState(null);
  const logRef = useRef(null);

  useEffect(() => {
    const s = io('http://localhost:4412', { withCredentials: true });
    setSocket(s);

    s.on('sala_creada', ({ salaId: id }) => {
      setSalaId(id);
      setStep('waiting');
      addLog(`✅ Sala creada: ${id}. Esperando rival...`, 'info');
    });

    s.on('sala_lista', ({ jugador1, jugador2 }) => {
      setStep('selecting');
      addLog('🤝 ¡Rival conectado! Ambos deben seleccionar su Pokémon.', 'event');
    });

    s.on('combate_iniciado', ({ jugador1, jugador2, turnoActual }) => {
      setBattleState({ jugador1, jugador2 });
      setMyTurn(turnoActual === s.id);
      setStep('battle');
      addLog('⚔️ ¡COMBATE INICIADO!', 'event');
    });

    s.on('turno_resultado', ({ log, hp1, hp2, atacante, defensor, danio }) => {
      addLog(log, 'damage');
      setBattleState((prev) => prev ? { ...prev, jugador1: { ...prev.jugador1, hp: hp1 }, jugador2: { ...prev.jugador2, hp: hp2 } } : prev);
    });

    s.on('cambio_turno', ({ turnoActual }) => {
      setMyTurn(turnoActual === s.id);
    });

    s.on('combate_terminado', ({ ganador, perdedor }) => {
      setResultado({ ganador, perdedor });
      setStep('ended');
      addLog(`🏆 ¡${ganador} gana la batalla! ${perdedor} fue derrotado.`, 'victory');
    });

    s.on('jugador_abandono', () => {
      addLog('😢 El rival abandonó la sala.', 'error');
      setStep('lobby');
    });

    s.on('error_sala', ({ message }) => {
      addLog(`❌ ${message}`, 'error');
    });

    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [battleLog]);

  const addLog = (msg, type = 'normal') => {
    setBattleLog((prev) => [...prev, { msg, type, id: Date.now() + Math.random() }]);
  };

  const crearSala = () => {
    if (!socket) return;
    socket.emit('crear_sala', { usuario: user, pokemonId: myPokemon?.id });
  };

  const unirSala = () => {
    if (!socket || !joinCode.trim()) return;
    socket.emit('unirse_sala', { salaId: joinCode.toUpperCase(), usuario: user, pokemonId: myPokemon?.id });
    setSalaId(joinCode.toUpperCase());
  };

  const confirmarPokemon = () => {
    if (!myPokemon || !socket) { addLog('Selecciona un Pokémon primero', 'error'); return; }
    socket.emit('pokemon_listo', {
      salaId,
      hp: myPokemon.hp || 50,
      hpMax: myPokemon.hp || 50,
      ataque: myPokemon.ataque || 50,
      defensa: myPokemon.defensa || 50,
      velocidad: myPokemon.velocidad || 50,
      nombre: myPokemon.nombre,
    });
    addLog(`✅ ${myPokemon.nombre} listo para combatir! Esperando rival...`, 'info');
  };

  const atacar = () => {
    if (!myTurn || !socket) return;
    socket.emit('atacar', { salaId });
    setMyTurn(false);
  };

  const volverLobby = () => {
    setStep('lobby');
    setSalaId('');
    setMyPokemon(null);
    setBattleLog([]);
    setBattleState(null);
    setResultado(null);
    setMyTurn(false);
  };

  const logTypeClass = {
    attack1: 'log-attack1', attack2: 'log-attack2', damage: 'log-damage',
    defeat: 'log-defeat', victory: 'log-victory', info: 'log-info',
    event: 'log-event', error: 'log-error', normal: '',
  };

  return (
    <div className="multiplayer-arena">
      <h2 className="section-title">🌐 Multijugador</h2>

      {step === 'lobby' && (
        <div className="multi-lobby">
          <div className="multi-selector">
            <PokemonSelector label="Elige tu Pokémon" selected={myPokemon} onSelect={setMyPokemon} />
          </div>
          <div className="multi-actions">
            <button className="btn-battle pvp" onClick={crearSala} disabled={!myPokemon}>
              🏟️ Crear Sala
            </button>
            <div className="join-row">
              <input
                className="selector-search"
                type="text"
                placeholder="Código de sala..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                maxLength={6}
                style={{ textTransform: 'uppercase' }}
              />
              <button className="btn-battle ai" onClick={unirSala} disabled={!joinCode.trim()}>
                🤝 Unirse
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'waiting' && (
        <div className="multi-waiting">
          <div className="waiting-code">
            <div className="waiting-label">Código de tu sala</div>
            <div className="sala-code">{salaId}</div>
            <div className="waiting-hint">Comparte este código con tu rival</div>
          </div>
          <div className="spinner large" />
          <div>Esperando que el rival se conecte...</div>
        </div>
      )}

      {step === 'selecting' && (
        <div className="multi-selecting">
          <div className="sala-info">🏟️ Sala: <strong>{salaId}</strong></div>
          <PokemonSelector label="Tu Pokémon" selected={myPokemon} onSelect={setMyPokemon} />
          <button className="btn-battle pvp" onClick={confirmarPokemon} disabled={!myPokemon}>
            ✅ Confirmar Pokémon
          </button>
        </div>
      )}

      {(step === 'battle' || step === 'ended') && battleState && (
        <div className="multi-battle">
          <div className="multi-fighters">
            <div className="multi-fighter">
              <div className="fighter-label">TÚ</div>
              <div className="fighter-name">{battleState.jugador1.nombre}</div>
              <div className="multi-hp">❤️ {battleState.jugador1.hp}/{battleState.jugador1.hpMax}</div>
            </div>
            <div className="vs-badge">VS</div>
            <div className="multi-fighter">
              <div className="fighter-label">RIVAL</div>
              <div className="fighter-name">{battleState.jugador2?.nombre}</div>
              <div className="multi-hp">❤️ {battleState.jugador2?.hp}/{battleState.jugador2?.hpMax}</div>
            </div>
          </div>

          {step === 'battle' && (
            <div className="multi-turn-controls">
              {myTurn ? (
                <button className="btn-battle pvp pulse-btn" onClick={atacar}>
                  ⚔️ ¡ATACAR!
                </button>
              ) : (
                <div className="waiting-turn">⏳ Turno del rival...</div>
              )}
            </div>
          )}

          {step === 'ended' && resultado && (
            <div className="battle-result">
              <div className="winner-text">🏆 {resultado.ganador} gana!</div>
              <button className="btn-battle reset" onClick={volverLobby}>🏠 Volver al lobby</button>
            </div>
          )}
        </div>
      )}

      {battleLog.length > 0 && (
        <div className="battle-log" ref={logRef}>
          <div className="battle-log-title">📜 Log Multijugador</div>
          {battleLog.map((entry) => (
            <div key={entry.id} className={`log-entry ${logTypeClass[entry.type] || ''}`}>
              {entry.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiPlayerArena;
