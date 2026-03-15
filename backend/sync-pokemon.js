const mysql = require('mysql2/promise');
const nodeFetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuración - Debe coincidir con server.js
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'pokedex_2026',
};

const TIPO_MAP = {
  normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico', grass: 'Planta',
  ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno', ground: 'Tierra', flying: 'Volador',
  psychic: 'Psíquico', bug: 'Bicho', rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón',
  dark: 'Siniestro', steel: 'Acero', fairy: 'Hada'
};

function traducirTipo(tipo) {
  return TIPO_MAP[tipo] || (tipo.charAt(0).toUpperCase() + tipo.slice(1));
}

async function sync() {
  console.log('🚀 Iniciando sincronización masiva de la Pokédex...');
  let db;
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a MySQL establecida.');

    const response = await nodeFetch('https://pokeapi.co/api/v2/pokemon?limit=2000');
    const data = await response.json();
    const pokemonList = data.results;

    console.log(`📋 Se encontraron ${pokemonList.length} Pokémon. Procesando...`);

    let synced = 0;
    let errors = 0;

    for (let i = 0; i < pokemonList.length; i++) {
      const { name, url } = pokemonList[i];
      try {
        const pResponse = await nodeFetch(url);
        const pData = await pResponse.json();

        const nombre = name.charAt(0).toUpperCase() + name.slice(1);
        const tipo_principal = traducirTipo(pData.types[0]?.type?.name || 'normal');
        const tipo_secundario = pData.types[1] ? traducirTipo(pData.types[1].type.name) : null;
        const nivel = Math.floor(Math.random() * 50) + 10;
        
        const statsMap = {};
        pData.stats.forEach(s => { statsMap[s.stat.name] = s.base_stat; });
        
        const ataque = statsMap['attack'] || 50;
        const defensa = statsMap['defense'] || 50;
        const velocidad = statsMap['speed'] || 50;
        const hp = statsMap['hp'] || 50;
        const imagen = pData.sprites.other['official-artwork'].front_default || pData.sprites.front_default || '';

        await db.execute(
          `INSERT INTO pokemon (nombre, tipo_principal, tipo_secundario, nivel, ataque, defensa, velocidad, hp, imagen)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           tipo_principal=VALUES(tipo_principal), tipo_secundario=VALUES(tipo_secundario),
           nivel=VALUES(nivel), ataque=VALUES(ataque), defensa=VALUES(defensa),
           velocidad=VALUES(velocidad), hp=VALUES(hp), imagen=VALUES(imagen)`,
          [nombre, tipo_principal, tipo_secundario, nivel, ataque, defensa, velocidad, hp, imagen]
        );

        synced++;
        if (synced % 50 === 0) {
          process.stdout.write(`⚡ ${synced}/${pokemonList.length} sincronizados...\r`);
        }
      } catch (err) {
        errors++;
        console.error(`\n❌ Error en ${name}:`, err.message);
      }
    }

    console.log(`\n\n✅ ¡Sincronización terminada!`);
    console.log(`✨ Pokémon sincronizados: ${synced}`);
    console.log(`⚠️ Errores encontrados: ${errors}`);

  } catch (err) {
    console.error('❌ Error fatal:', err.message);
  } finally {
    if (db) await db.end();
  }
}

sync();
