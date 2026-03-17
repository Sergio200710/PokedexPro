const express = require('express');
const sqlite3 = require('sqlite3').verbose();
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
const DB_PATH = './pokemon.db';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'TU_GOOGLE_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'TU_GOOGLE_CLIENT_SECRET';
const SESSION_SECRET = process.env.SESSION_SECRET || 'pokedex_super_secret_2026';

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

// ======================= DB HELPER (SQLITE) =======================
function getDb() {
  return new sqlite3.Database(DB_PATH);
}

async function runQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    const cleanQuery = query.trim().toLowerCase();
    if (cleanQuery.startsWith('select')) {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve([rows]);
      });
    } else {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
      });
    }
  });
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
      const db = getDb();
      try {
        const [rows] = await runQuery(db, 'SELECT * FROM usuarios WHERE email = ?', [profile.emails[0].value]);
        let user;
        if (rows.length === 0) {
          const [result] = await runQuery(
            db,
            'INSERT INTO usuarios (nombre, email, foto, fecha_registro, nivel_entrenador, victorias, derrotas) VALUES (?, ?, ?, datetime("now"), 1, 0, 0)',
            [profile.displayName, profile.emails[0].value, profile.photos[0]?.value || '']
          );
          const [newUserRows] = await runQuery(db, 'SELECT * FROM usuarios WHERE id = ?', [result.insertId]);
          user = newUserRows[0];
        } else {
          user = rows[0];
          await runQuery(db, 'UPDATE usuarios SET foto = ? WHERE id = ?', [profile.photos[0]?.value || user.foto, user.id]);
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      } finally {
        db.close();
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const db = getDb();
  try {
    const [rows] = await runQuery(db, 'SELECT * FROM usuarios WHERE id = ?', [id]);
    done(null, rows[0] || null);
  } catch (err) {
    done(err, null);
  } finally {
    db.close();
  }
});

function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'No autenticado' });
}

// ======================= INIT DB TABLES =======================
async function initDB() {
  const db = getDb();
  try {
    const columnsToAdd = [
      { name: 'hp', type: 'INT NOT NULL DEFAULT 45' },
      { name: 'ataque', type: 'INT NOT NULL DEFAULT 50' },
      { name: 'defensa', type: 'INT NOT NULL DEFAULT 50' },
      { name: 'especial_ataque', type: 'INT NOT NULL DEFAULT 50' },
      { name: 'especial_defensa', type: 'INT NOT NULL DEFAULT 50' },
      { name: 'velocidad', type: 'INT NOT NULL DEFAULT 50' },
      { name: 'tipo_principal', type: 'VARCHAR(50) DEFAULT NULL' },
      { name: 'tipo_secundario', type: 'VARCHAR(50) DEFAULT NULL' },
      { name: 'imagen', type: 'VARCHAR(500) DEFAULT NULL' },
      { name: 'is_favorite', type: 'TINYINT(1) DEFAULT 0' }
    ];

    for (const col of columnsToAdd) {
      try { await runQuery(db, `ALTER TABLE pokemon ADD COLUMN ${col.name} ${col.type}`); } catch (e) {}
    }

    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        foto TEXT DEFAULT '',
        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
        nivel_entrenador INTEGER DEFAULT 1,
        victorias INTEGER DEFAULT 0,
        derrotas INTEGER DEFAULT 0,
        insignias TEXT DEFAULT '[]',
        racha_actual INTEGER DEFAULT 0
      )
    `);

    await runQuery(db, `
      CREATE TABLE IF NOT EXISTS batallas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        pokemon1 TEXT NOT NULL,
        pokemon2 TEXT NOT NULL,
        ganador TEXT NOT NULL,
        modo TEXT DEFAULT 'pvp',
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      )
    `);

    console.log('✅ Base de Datos SQLite inicializada');
  } catch (err) {
    console.error('❌ Error inicializando BD:', err.message);
  } finally {
    db.close();
  }
}

// ======================= RUTAS API =======================

app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${FRONTEND_URL}?auth=error` }),
  (req, res) => res.redirect(`${FRONTEND_URL}?auth=success`)
);

app.post('/api/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Error al cerrar sesión' });
    req.session.destroy();
    res.json({ success: true });
  });
});

app.get('/api/auth/status', (req, res) => {
  res.json(req.isAuthenticated() ? { authenticated: true, user: req.user } : { authenticated: false });
});

app.get('/api/types', async (req, res) => {
  const db = getDb();
  try {
    const [rows] = await runQuery(db, 'SELECT DISTINCT tipo_principal FROM pokemon WHERE tipo_principal IS NOT NULL ORDER BY tipo_principal');
    res.json(rows.map(r => r.tipo_principal));
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tipos' });
  } finally {
    db.close();
  }
});

app.get('/api/pokemons', async (req, res) => {
  const db = getDb();
  try {
    const { tipo, search, limit, offset } = req.query;
    let query = 'SELECT * FROM pokemon WHERE 1=1';
    const params = [];

    if (tipo) { query += ' AND tipo_principal = ?'; params.push(tipo); }
    if (search) { query += ' AND name LIKE ?'; params.push(`%${search}%`); }

    const limitNum = parseInt(limit) || 60;
    const offsetNum = parseInt(offset) || 0;
    query += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offsetNum);

    const [rows] = await runQuery(db, query, params);
    
    let countQuery = 'SELECT COUNT(*) as total FROM pokemon WHERE 1=1';
    const countParams = [];
    if (tipo) { countQuery += ' AND tipo_principal = ?'; countParams.push(tipo); }
    if (search) { countQuery += ' AND name LIKE ?'; countParams.push(`%${search}%`); }
    const [countRows] = await runQuery(db, countQuery, countParams);

    const pokemonsConImagenes = await Promise.all(
      rows.map(async (p) => {
        const apiData = await getPokemonFromApi(p.name);
        let imagen = p.imagen;
        let imagenAnimada = null;
        let tipo_principal = p.tipo_principal || 'N/A';
        let tipo_secundario = p.tipo_secundario;
        
        const stats = {
          hp: p.hp || 50,
          ataque: p.ataque || 50,
          defensa: p.defensa || 50,
          especial_ataque: p.especial_ataque || 50,
          especial_defensa: p.especial_defensa || 50,
          velocidad: p.velocidad || 50
        };

        if (apiData) {
          imagen = imagen || apiData.sprites?.other?.['official-artwork']?.front_default || apiData.sprites?.front_default;
          imagenAnimada = apiData.sprites?.versions?.['generation-v']?.['black-white']?.animated?.front_default || apiData.sprites?.front_default;
          tipo_principal = traducirTipo(apiData.types[0]?.type?.name || 'normal');
          tipo_secundario = apiData.types[1] ? traducirTipo(apiData.types[1].type.name) : null;
          
          // Mapear estadísticas de la PokeAPI
          apiData.stats.forEach(s => {
            const val = s.base_stat;
            switch(s.stat.name) {
              case 'hp': stats.hp = val; break;
              case 'attack': stats.ataque = val; break;
              case 'defense': stats.defensa = val; break;
              case 'special-attack': stats.especial_ataque = val; break;
              case 'special-defense': stats.especial_defensa = val; break;
              case 'speed': stats.velocidad = val; break;
            }
          });
        }
        return { 
          ...p, 
          ...stats,
          nombre: p.name, 
          tipo_principal, 
          tipo_secundario,
          imagen, 
          imagenAnimada, 
          is_favorite: Boolean(p.is_favorite) 
        };
      })
    );

    res.json({ pokemons: pokemonsConImagenes, total: countRows[0].total });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor', detail: error.message });
  } finally {
    db.close();
  }
});

app.put('/api/pokemons/:id/favorite', async (req, res) => {
  const db = getDb();
  try {
    const { id } = req.params;
    const { is_favorite } = req.body;
    await runQuery(db, 'UPDATE pokemon SET is_favorite = ? WHERE id = ?', [is_favorite ? 1 : 0, id]);
    res.json({ success: true, is_favorite });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar favorito' });
  } finally {
    db.close();
  }
});

app.post('/api/battles', async (req, res) => {
  const db = getDb();
  try {
    const { usuario_id, pokemon1, pokemon2, ganador, modo } = req.body;
    await runQuery(db,
      'INSERT INTO batallas (usuario_id, pokemon1, pokemon2, ganador, modo) VALUES (?, ?, ?, ?, ?)',
      [usuario_id || null, pokemon1, pokemon2, ganador, modo || 'pvp']
    );
    if (usuario_id) {
      const esVictoria = ganador === pokemon1;
      if (esVictoria) {
        await runQuery(db, 'UPDATE usuarios SET victorias = victorias + 1, racha_actual = racha_actual + 1 WHERE id = ?', [usuario_id]);
        const [uRows] = await runQuery(db, 'SELECT racha_actual, nivel_entrenador, insignias FROM usuarios WHERE id = ?', [usuario_id]);
        const user = uRows[0];
        if (user && user.racha_actual >= 5) {
          const insignias = JSON.parse(user.insignias || '[]');
          insignias.push({ nivel: user.nivel_entrenador, fecha: new Date().toISOString() });
          await runQuery(db, 'UPDATE usuarios SET nivel_entrenador = nivel_entrenador + 1, racha_actual = 0, insignias = ? WHERE id = ?', [JSON.stringify(insignias), usuario_id]);
        }
      } else {
        await runQuery(db, 'UPDATE usuarios SET derrotas = derrotas + 1, racha_actual = 0 WHERE id = ?', [usuario_id]);
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error guardando batalla' });
  } finally {
    db.close();
  }
});

// Iniciamos el servidor después de preparar la base de datos
initDB().then(() => {
  httpServer.listen(PORT, () => console.log(`🚀 PokéDex Backend (SQLite) en puerto ${PORT}`));
});
