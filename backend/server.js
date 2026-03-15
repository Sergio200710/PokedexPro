const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { createServer } = require('http');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');

const app = express();
const httpServer = createServer(app);

// ======================= CONFIGURACIÓN =======================
const PORT = 4412;
const FRONTEND_URL = 'http://localhost:5173';

// REEMPLAZA CON TUS CREDENCIALES DE GOOGLE CLOUD CONSOLE
// https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'TU_GOOGLE_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'TU_GOOGLE_CLIENT_SECRET';
const SESSION_SECRET = process.env.SESSION_SECRET || 'pokedex_super_secret_2026';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'pokedex_2026',
};

// ======================= SOCKET.IO =======================
const io = new Server(httpServer, {
  cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'], credentials: true },
});

// ======================= MIDDLEWARE =======================
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// ======================= DB HELPER =======================
async function getDb() {
  return mysql.createConnection(dbConfig);
}

// ======================= CACHE POKEAPI =======================
const pokeApiCache = new Map();

async function getPokemonFromApi(nombre) {
  const key = nombre.toLowerCase();
  if (pokeApiCache.has(key)) return pokeApiCache.get(key);
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${key}`);
    if (response.ok) {
      const data = await response.json();
      pokeApiCache.set(key, data);
      return data;
    }
  } catch (err) {
    console.error(`PokeAPI error para ${key}:`, err.message);
  }
  return null;
}

// ======================= TIPO TRADUCCIÓN =======================
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

// ======================= PASSPORT GOOGLE =======================
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `http://localhost:${PORT}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const db = await getDb();
        const [rows] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [profile.emails[0].value]);
        let user;
        if (rows.length === 0) {
          const [result] = await db.execute(
            'INSERT INTO usuarios (nombre, email, foto, fecha_registro, nivel_entrenador, victorias, derrotas) VALUES (?, ?, ?, NOW(), 1, 0, 0)',
            [profile.displayName, profile.emails[0].value, profile.photos[0]?.value || '']
          );
          const [newUser] = await db.execute('SELECT * FROM usuarios WHERE id = ?', [result.insertId]);
          user = newUser[0];
        } else {
          user = rows[0];
          // Actualizar foto si cambió
          await db.execute('UPDATE usuarios SET foto = ? WHERE id = ?', [profile.photos[0]?.value || user.foto, user.id]);
        }
        await db.end();
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const db = await getDb();
    const [rows] = await db.execute('SELECT * FROM usuarios WHERE id = ?', [id]);
    await db.end();
    done(null, rows[0] || null);
  } catch (err) {
    done(err, null);
  }
});

// ======================= MIDDLEWARE AUTH =======================
function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'No autenticado' });
}

// ======================= INIT DB TABLES =======================
async function initDB() {
  let db;
  try {
    db = await getDb();

    // Asegurar que las columnas existen (MySQL < 8.0.19 no soporta ADD COLUMN IF NOT EXISTS)
    const columnsToAdd = [
      { name: 'hp', type: 'INT NOT NULL DEFAULT 45' },
      { name: 'tipo_secundario', type: 'VARCHAR(50) DEFAULT NULL' },
      { name: 'imagen', type: 'VARCHAR(500) DEFAULT NULL' },
      { name: 'is_favorite', type: 'TINYINT(1) DEFAULT 0' }
    ];

    for (const col of columnsToAdd) {
      try {
        await db.execute(`ALTER TABLE pokemon ADD COLUMN ${col.name} ${col.type}`);
      } catch (e) {
        // Ignorar si la columna ya existe
      }
    }

    // Asegurar unique index en nombre para sync
    try {
      await db.execute(`ALTER TABLE pokemon ADD UNIQUE INDEX idx_nombre (nombre)`);
    } catch (e) {
      // Ignorar si ya existe
    }

    // Tabla usuarios
    await db.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        foto VARCHAR(500) DEFAULT '',
        fecha_registro DATETIME DEFAULT NOW(),
        nivel_entrenador INT DEFAULT 1,
        victorias INT DEFAULT 0,
        derrotas INT DEFAULT 0,
        insignias JSON DEFAULT ('[]'),
        racha_actual INT DEFAULT 0
      )
    `);

    // Tabla batallas
    await db.execute(`
      CREATE TABLE IF NOT EXISTS batallas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT DEFAULT NULL,
        pokemon1 VARCHAR(50) NOT NULL,
        pokemon2 VARCHAR(50) NOT NULL,
        ganador VARCHAR(50) NOT NULL,
        modo VARCHAR(20) DEFAULT 'pvp',
        fecha DATETIME DEFAULT NOW(),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `);

    console.log('✅ Tablas de BD inicializadas correctamente');
    await db.end();
  } catch (err) {
    console.error('❌ Error inicializando BD:', err.message);
    if (db) await db.end().catch(() => {});
  }
}

// ======================= RUTAS AUTH =======================

// Iniciar login con Google
app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback de Google
app.get(
  '/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}?auth=error` }),
  (req, res) => {
    res.redirect(`${FRONTEND_URL}?auth=success`);
  }
);

// Logout
app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Error al cerrar sesión' });
    req.session.destroy();
    res.json({ success: true });
  });
});

// Perfil del usuario autenticado
app.get('/api/user/profile', requireAuth, (req, res) => {
  res.json(req.user);
});

// Verificar si está logueado (para el frontend)
app.get('/api/auth/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ authenticated: true, user: req.user });
  } else {
    res.json({ authenticated: false });
  }
});

// ======================= RUTAS POKÉMON =======================

// Obtener todos los Pokémon con filtros opcionales
app.get('/api/pokemons', async (req, res) => {
  try {
    const { tipo, nivel, search, limit, offset } = req.query;
    let query = 'SELECT * FROM pokemon WHERE 1=1';
    const params = [];

    if (tipo) { query += ' AND tipo_principal = ?'; params.push(tipo); }
    if (nivel) { query += ' AND nivel >= ?'; params.push(Number(nivel)); }
    if (search) { query += ' AND nombre LIKE ?'; params.push(`%${search}%`); }

    const limitNum = parseInt(limit) || 60;
    const offsetNum = parseInt(offset) || 0;
    
    query += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offsetNum);

    const db = await getDb();
    // Usar query() en lugar de execute() para evitar problemas con LIMIT/OFFSET en prepared statements
    const [rows] = await db.query(query, params);

    const countParams = [];
    let countQuery = 'SELECT COUNT(*) as total FROM pokemon WHERE 1=1';
    if (tipo) { countQuery += ' AND tipo_principal = ?'; countParams.push(tipo); }
    if (search) { countQuery += ' AND nombre LIKE ?'; countParams.push(`%${search}%`); }

    const [countRows] = await db.query(countQuery, countParams);
    await db.end();

    const pokemonsConImagenes = await Promise.all(
      rows.map(async (p) => {
        const apiData = await getPokemonFromApi(p.nombre);
        let imagen = p.imagen;
        let imagenAnimada = null;
        if (apiData) {
          imagen = imagen || apiData.sprites?.other?.['official-artwork']?.front_default || apiData.sprites?.front_default;
          imagenAnimada = apiData.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default || apiData.sprites?.front_default;
        }
        return { ...p, imagen, imagenAnimada, is_favorite: Boolean(p.is_favorite) };
      })
    );

    res.json({ pokemons: pokemonsConImagenes, total: countRows[0].total });
  } catch (error) {
    console.error('Error /api/pokemons:', error.message);
    res.status(500).json({ error: 'Error del servidor', detail: error.message });
  }
});

// Marcar/desmarcar como favorito
app.put('/api/pokemons/:id/favorite', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_favorite } = req.body;
    const db = await getDb();
    await db.execute('UPDATE pokemon SET is_favorite = ? WHERE id = ?', [is_favorite ? 1 : 0, id]);
    await db.end();
    res.json({ success: true, is_favorite });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar favorito' });
  }
});

// Obtener un Pokémon por nombre o id
app.get('/api/pokemons/:nombre', async (req, res) => {
  try {
    const db = await getDb();
    const param = req.params.nombre;
    const isId = !isNaN(param);
    const [rows] = isId
      ? await db.execute('SELECT * FROM pokemon WHERE id = ?', [param])
      : await db.execute('SELECT * FROM pokemon WHERE LOWER(nombre) = LOWER(?)', [param]);
    await db.end();

    if (rows.length === 0) return res.status(404).json({ message: 'Pokémon no encontrado' });

    const pokemon = rows[0];
    const apiData = await getPokemonFromApi(pokemon.nombre);
    if (apiData) {
      pokemon.imagen = pokemon.imagen || apiData.sprites?.other?.['official-artwork']?.front_default;
      pokemon.imagenAnimada = apiData.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default;
    }
    pokemon.is_favorite = Boolean(pokemon.is_favorite);
    res.json(pokemon);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ======================= SYNC POKÉMON (1000+) =======================
app.get('/api/sync-pokemon', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const sendProgress = (msg) => {
    res.write(`data: ${JSON.stringify({ message: msg })}\n\n`);
  };

  try {
    sendProgress('🔄 Conectando con PokéAPI...');
    const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=2000');
    const data = await response.json();
    const pokemonList = data.results;

    sendProgress(`📋 ${pokemonList.length} Pokémon encontrados. Sincronizando...`);

    const db = await getDb();
    let synced = 0;
    let errors = 0;

    for (let i = 0; i < pokemonList.length; i++) {
      const { name } = pokemonList[i];
      try {
        const pData = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`).then((r) => r.json());

        const nombre = name.charAt(0).toUpperCase() + name.slice(1);
        const tipo_principal = traducirTipo(pData.types[0]?.type?.name || 'normal');
        const tipo_secundario = pData.types[1] ? traducirTipo(pData.types[1].type.name) : null;
        const nivel = Math.floor(Math.random() * 50) + 10;
        const statsMap = {};
        pData.stats.forEach((s) => { statsMap[s.stat.name] = s.base_stat; });
        const ataque = statsMap['attack'] || 50;
        const defensa = statsMap['defense'] || 50;
        const velocidad = statsMap['speed'] || 50;
        const hp = statsMap['hp'] || 50;
        const imagen = pData.sprites?.other?.['official-artwork']?.front_default || pData.sprites?.front_default || '';

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
          sendProgress(`⚡ ${synced}/${pokemonList.length} Pokémon sincronizados...`);
        }
      } catch (err) {
        errors++;
        console.error(`Error sync ${name}:`, err.message);
      }

      // Rate limiting suave
      if (i % 10 === 0) await new Promise((r) => setTimeout(r, 50));
    }

    await db.end();
    sendProgress(`✅ Sincronización completada: ${synced} Pokémon guardados, ${errors} errores.`);
    res.write(`data: ${JSON.stringify({ done: true, synced, errors })}\n\n`);
  } catch (err) {
    sendProgress(`❌ Error: ${err.message}`);
    res.write(`data: ${JSON.stringify({ done: true, error: err.message })}\n\n`);
  } finally {
    res.end();
  }
});

// ======================= RUTAS BATALLAS =======================

// Guardar batalla
app.post('/api/battles', async (req, res) => {
  try {
    const { usuario_id, pokemon1, pokemon2, ganador, modo } = req.body;
    const db = await getDb();

    await db.execute(
      'INSERT INTO batallas (usuario_id, pokemon1, pokemon2, ganador, modo) VALUES (?, ?, ?, ?, ?)',
      [usuario_id || null, pokemon1, pokemon2, ganador, modo || 'pvp']
    );

    // Actualizar stats del usuario si está autenticado
    if (usuario_id) {
      const esVictoria = ganador === pokemon1;
      if (esVictoria) {
        await db.execute(`
          UPDATE usuarios SET 
            victorias = victorias + 1,
            racha_actual = racha_actual + 1
          WHERE id = ?
        `, [usuario_id]);

        // Verificar si completó la liga (5 victorias seguidas)
        const [u] = await db.execute('SELECT racha_actual, nivel_entrenador, insignias FROM usuarios WHERE id = ?', [usuario_id]);
        if (u[0] && u[0].racha_actual >= 5) {
          const insigniasActuales = JSON.parse(u[0].insignias || '[]');
          const nuevaInsignia = { nivel: u[0].nivel_entrenador, fecha: new Date().toISOString() };
          insigniasActuales.push(nuevaInsignia);
          await db.execute(
            'UPDATE usuarios SET nivel_entrenador = nivel_entrenador + 1, racha_actual = 0, insignias = ? WHERE id = ?',
            [JSON.stringify(insigniasActuales), usuario_id]
          );
        }
      } else {
        await db.execute('UPDATE usuarios SET derrotas = derrotas + 1, racha_actual = 0 WHERE id = ?', [usuario_id]);
      }
    }

    await db.end();
    res.json({ success: true });
  } catch (error) {
    console.error('Error guardando batalla:', error.message);
    res.status(500).json({ error: 'Error guardando batalla' });
  }
});

// Historial de batallas de un usuario
app.get('/api/battles', async (req, res) => {
  try {
    const { usuario_id, limit = 20 } = req.query;
    const db = await getDb();

    let rows;
    if (usuario_id) {
      [rows] = await db.execute(
        'SELECT * FROM batallas WHERE usuario_id = ? ORDER BY fecha DESC LIMIT ?',
        [usuario_id, Number(limit)]
      );
    } else {
      [rows] = await db.execute('SELECT * FROM batallas ORDER BY fecha DESC LIMIT ?', [Number(limit)]);
    }

    await db.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo historial' });
  }
});

// ======================= RANKING =======================
app.get('/api/ranking', async (req, res) => {
  try {
    const db = await getDb();
    const [rows] = await db.execute(`
      SELECT id, nombre, foto, nivel_entrenador, victorias, derrotas, insignias,
             ROUND(victorias / GREATEST(victorias + derrotas, 1) * 100, 1) as winrate
      FROM usuarios
      ORDER BY victorias DESC, nivel_entrenador DESC
      LIMIT 50
    `);
    await db.end();
    res.json(rows.map((u) => ({ ...u, insignias: JSON.parse(u.insignias || '[]') })));
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo ranking' });
  }
});

// ======================= SOCKET.IO MULTIJUGADOR =======================
const salas = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Socket conectado: ${socket.id}`);

  // Crear sala
  socket.on('crear_sala', ({ usuario, pokemonId }) => {
    const salaId = Math.random().toString(36).substring(2, 8).toUpperCase();
    salas.set(salaId, {
      id: salaId,
      jugador1: { socketId: socket.id, usuario, pokemonId, hp: null, hpMax: null },
      jugador2: null,
      turno: null,
      estado: 'esperando',
    });
    socket.join(salaId);
    socket.emit('sala_creada', { salaId });
    console.log(`🏟️ Sala ${salaId} creada por ${usuario?.nombre || 'Anónimo'}`);
  });

  // Unirse a sala
  socket.on('unirse_sala', ({ salaId, usuario, pokemonId }) => {
    const sala = salas.get(salaId);
    if (!sala) {
      socket.emit('error_sala', { message: 'Sala no encontrada' });
      return;
    }
    if (sala.estado !== 'esperando') {
      socket.emit('error_sala', { message: 'Sala llena o en progreso' });
      return;
    }

    sala.jugador2 = { socketId: socket.id, usuario, pokemonId, hp: null, hpMax: null };
    sala.estado = 'seleccionando';
    socket.join(salaId);

    io.to(salaId).emit('sala_lista', {
      salaId,
      jugador1: sala.jugador1,
      jugador2: sala.jugador2,
    });
    console.log(`🤝 ${usuario?.nombre || 'Anónimo'} se unió a sala ${salaId}`);
  });

  // Pokémon seleccionado listo para combate
  socket.on('pokemon_listo', ({ salaId, hp, hpMax, ataque, defensa, velocidad, nombre }) => {
    const sala = salas.get(salaId);
    if (!sala) return;

    if (sala.jugador1.socketId === socket.id) {
      Object.assign(sala.jugador1, { hp, hpMax, ataque, defensa, velocidad, nombre });
    } else if (sala.jugador2?.socketId === socket.id) {
      Object.assign(sala.jugador2, { hp, hpMax, ataque, defensa, velocidad, nombre });
    }

    const ambosListos = sala.jugador1.hp !== null && sala.jugador2?.hp !== null;
    if (ambosListos && sala.estado === 'seleccionando') {
      sala.estado = 'combate';
      // Quien ataca primero: mayor velocidad
      sala.turno = sala.jugador1.velocidad >= sala.jugador2.velocidad
        ? sala.jugador1.socketId
        : sala.jugador2.socketId;

      io.to(salaId).emit('combate_iniciado', {
        jugador1: sala.jugador1,
        jugador2: sala.jugador2,
        turnoActual: sala.turno,
      });
    }
  });

  // Ataque en sala multijugador
  socket.on('atacar', ({ salaId }) => {
    const sala = salas.get(salaId);
    if (!sala || sala.estado !== 'combate') return;
    if (sala.turno !== socket.id) return;

    const atacante = sala.jugador1.socketId === socket.id ? sala.jugador1 : sala.jugador2;
    const defensor = sala.jugador1.socketId === socket.id ? sala.jugador2 : sala.jugador1;

    const danio = Math.max(5, atacante.ataque - Math.floor(defensor.defensa / 2));
    defensor.hp = Math.max(0, defensor.hp - danio);

    const logMsg = `${atacante.nombre} atacó → ${defensor.nombre} recibió ${danio} daño`;
    io.to(salaId).emit('turno_resultado', {
      atacante: atacante.nombre,
      defensor: defensor.nombre,
      danio,
      hp1: sala.jugador1.hp,
      hp2: sala.jugador2.hp,
      log: logMsg,
    });

    if (defensor.hp <= 0) {
      sala.estado = 'terminado';
      io.to(salaId).emit('combate_terminado', {
        ganador: atacante.nombre,
        perdedor: defensor.nombre,
      });
      salas.delete(salaId);
    } else {
      // Cambiar turno
      sala.turno = defensor.socketId;
      io.to(salaId).emit('cambio_turno', { turnoActual: sala.turno });
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket desconectado: ${socket.id}`);
    // Notificar abandono en salas activas
    salas.forEach((sala, id) => {
      if (sala.jugador1?.socketId === socket.id || sala.jugador2?.socketId === socket.id) {
        io.to(id).emit('jugador_abandono');
        salas.delete(id);
      }
    });
  });
});

// ======================= INICIO =======================
initDB().then(() => {
  httpServer.listen(PORT, () => console.log(`🚀 PokéDex Backend en puerto ${PORT}`));
});
