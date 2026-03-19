const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./pokemon.db');

const TIPO_MAP = {
  normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico',
  grass: 'Planta', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno',
  ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
  rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro',
  steel: 'Acero', fairy: 'Hada',
};

function traducirTipo(tipo) {
  return TIPO_MAP[tipo] || tipo;
}

async function sync() {
  console.log('📦 Iniciando sincronización de tipos y estadísticas...');
  
  const getPokemons = () => new Promise((res, rej) => {
    db.all('SELECT id, name FROM pokemon', (err, rows) => err ? rej(err) : res(rows));
  });

  const updatePokemon = (id, data) => new Promise((res, rej) => {
    db.run(`UPDATE pokemon SET 
      tipo_principal = ?, 
      tipo_secundario = ?, 
      hp = ?, 
      ataque = ?, 
      defensa = ?, 
      especial_ataque = ?, 
      especial_defensa = ?, 
      velocidad = ?, 
      imagen = ? 
      WHERE id = ?`, 
      [data.tipo1, data.tipo2, data.hp, data.atk, data.def, data.spa, data.spd, data.spe, data.img, id], 
      (err) => err ? rej(err) : res()
    );
  });

  const rows = await getPokemons();
  
  for (const p of rows) {
    try {
      console.log(`Syncing ${p.name}...`);
      const resp = await fetch(`https://pokeapi.co/api/v2/pokemon/${p.name.toLowerCase()}`);
      if (!resp.ok) continue;
      const json = await resp.json();
      
      const stats = {};
      json.stats.forEach(s => {
        stats[s.stat.name] = s.base_stat;
      });

      const data = {
        tipo1: traducirTipo(json.types[0].type.name),
        tipo2: json.types[1] ? traducirTipo(json.types[1].type.name) : null,
        hp: stats['hp'],
        atk: stats['attack'],
        def: stats['defense'],
        spa: stats['special-attack'],
        spd: stats['special-defense'],
        spe: stats['speed'],
        img: json.sprites.other?.['official-artwork']?.front_default || json.sprites.front_default
      };

      await updatePokemon(p.id, data);
    } catch (e) {
      console.error(`Error syncing ${p.name}:`, e.message);
    }
  }

  console.log('✅ Sincronización completada.');
  db.close();
}

sync();
