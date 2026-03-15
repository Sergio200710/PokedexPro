# Diagramas UML - Pokédex Interactiva Avanzada 2026

## 1. Diagrama de Casos de Uso

```mermaid
graph LR
    subgraph Sistema["🎮 Pokédex Interactiva Avanzada"]
        CU1["Ver lista de Pokémon"]
        CU2["Buscar Pokémon"]
        CU3["Filtrar por tipo"]
        CU4["Ver detalle de Pokémon"]
        CU5["Marcar/Desmarcar favorito"]
        CU6["Sincronizar Pokémon desde PokéAPI"]
        CU7["Iniciar sesión con Google"]
        CU8["Cerrar sesión"]
        CU9["Ver perfil de usuario"]
        CU10["Batalla PvE"]
        CU11["Batalla Multijugador"]
        CU12["Ver historial de batallas"]
        CU13["Ver ranking de jugadores"]
        CU14["Crear sala multijugador"]
        CU15["Unirse a sala multijugador"]
        CU16["Seleccionar Pokémon para batalla"]
    end

    Usuario(("👤 Usuario"))
    Visitante(("👁️ Visitante"))
    Google(("🔐 Google OAuth"))
    PokeAPI(("🌐 PokéAPI"))

    Visitante --> CU1
    Visitante --> CU2
    Visitante --> CU3
    Visitante --> CU4
    Visitante --> CU6

    Usuario --> CU1
    Usuario --> CU2
    Usuario --> CU3
    Usuario --> CU4
    Usuario --> CU5
    Usuario --> CU6
    Usuario --> CU7
    Usuario --> CU8
    Usuario --> CU9
    Usuario --> CU10
    Usuario --> CU11
    Usuario --> CU12
    Usuario --> CU13
    Usuario --> CU14
    Usuario --> CU15
    Usuario --> CU16

    CU7 --> Google
    CU6 --> PokeAPI
```

---

## 2. Diagrama de Secuencia - Autenticación con Google

```mermaid
sequenceDiagram
    actor U as 👤 Usuario
    participant F as 🖥️ Frontend (5173)
    participant B as ⚙️ Backend (4412)
    participant G as 🔐 Google OAuth
    participant DB as 🗄️ MySQL (pokedex_2026)

    U->>F: Clic en "Iniciar sesión con Google"
    F->>B: GET /api/auth/google
    B->>G: Redirige a Google Login
    G->>U: Muestra formulario de login
    U->>G: Ingresa credenciales
    G->>B: Callback con token (GET /api/auth/google/callback)
    B->>DB: SELECT * FROM usuarios WHERE email = ?
    alt Usuario nuevo
        DB-->>B: No encontrado
        B->>DB: INSERT INTO usuarios (nombre, email, foto...)
        DB-->>B: Usuario creado (ID)
    else Usuario existente
        DB-->>B: Datos del usuario
        B->>DB: UPDATE usuarios SET foto = ?
    end
    B->>B: Crear sesión (express-session)
    B->>F: Redirect a Frontend (?auth=success)
    F->>B: GET /api/auth/status
    B-->>F: {authenticated: true, user: {...}}
    F->>U: Muestra perfil del usuario
```

---

## 3. Diagrama de Secuencia - Consultar Pokémon

```mermaid
sequenceDiagram
    actor U as 👤 Usuario
    participant F as 🖥️ Frontend
    participant B as ⚙️ Backend
    participant DB as 🗄️ MySQL
    participant API as 🌐 PokéAPI

    U->>F: Abre la aplicación / Aplica filtros
    F->>B: GET /api/pokemons?tipo=Fuego&search=char&limit=60&offset=0
    B->>DB: SELECT * FROM pokemon WHERE tipo_principal = ? AND nombre LIKE ?
    DB-->>B: Resultados (ej: 3 Pokémon)
    B->>DB: SELECT COUNT(*) FROM pokemon WHERE ...
    DB-->>B: Total: 3

    loop Para cada Pokémon
        B->>B: Verificar caché PokéAPI
        alt En caché
            B->>B: Usar datos cacheados
        else No en caché
            B->>API: GET /api/v2/pokemon/{nombre}
            API-->>B: Datos completos + sprites
            B->>B: Guardar en caché
        end
        B->>B: Agregar imagen + imagenAnimada
    end

    B-->>F: {pokemons: [...], total: 3}
    F->>U: Renderiza tarjetas de Pokémon
```

---

## 4. Diagrama de Secuencia - Batalla PvE

```mermaid
sequenceDiagram
    actor U as 👤 Usuario
    participant F as 🖥️ Frontend (BattleArena)
    participant B as ⚙️ Backend
    participant DB as 🗄️ MySQL

    U->>F: Selecciona "Batalla PvE"
    F->>B: GET /api/pokemons?limit=100
    B->>DB: SELECT * FROM pokemon LIMIT 100
    DB-->>B: Lista de Pokémon
    B-->>F: {pokemons: [...]}
    F->>U: Muestra selector de Pokémon

    U->>F: Selecciona su Pokémon
    F->>F: Genera oponente aleatorio (CPU)
    F->>F: Calcula stats de ambos

    loop Turnos de combate
        U->>F: Clic en "Atacar"
        F->>F: Calcular daño = max(5, ataque - defensa/2)
        F->>F: Reducir HP del defensor
        F->>U: Mostrar animación + resultado del turno
        alt HP del defensor <= 0
            F->>F: Combate terminado
        else HP > 0
            F->>F: Cambiar turno (CPU ataca automáticamente)
            F->>F: Calcular daño CPU
            F->>U: Mostrar ataque CPU
        end
    end

    F->>B: POST /api/battles {pokemon1, pokemon2, ganador, modo: "pvp"}
    B->>DB: INSERT INTO batallas (...)
    alt Usuario autenticado
        B->>DB: UPDATE usuarios SET victorias/derrotas...
        B->>DB: SELECT racha_actual FROM usuarios
        alt Racha >= 5
            B->>DB: UPDATE usuarios SET nivel_entrenador + 1, nueva insignia
        end
    end
    DB-->>B: OK
    B-->>F: {success: true}
    F->>U: Muestra resultado final
```

---

## 5. Diagrama de Secuencia - Batalla Multijugador (Socket.IO)

```mermaid
sequenceDiagram
    actor J1 as 👤 Jugador 1
    actor J2 as 👤 Jugador 2
    participant F1 as 🖥️ Frontend J1
    participant F2 as 🖥️ Frontend J2
    participant S as ⚡ Socket.IO Server (4412)

    J1->>F1: Clic "Crear Sala"
    F1->>S: emit("crear_sala", {usuario, pokemonId})
    S->>S: Genera salaId (ej: "A3F2K1")
    S-->>F1: emit("sala_creada", {salaId: "A3F2K1"})
    F1->>J1: Muestra código de sala: A3F2K1

    J1-->>J2: Comparte código de sala

    J2->>F2: Introduce código "A3F2K1"
    F2->>S: emit("unirse_sala", {salaId, usuario, pokemonId})
    S->>S: Asignar jugador2 a la sala
    S-->>F1: emit("sala_lista", {jugador1, jugador2})
    S-->>F2: emit("sala_lista", {jugador1, jugador2})

    J1->>F1: Selecciona Pokémon
    F1->>S: emit("pokemon_listo", {salaId, hp, ataque, defensa, velocidad, nombre})
    J2->>F2: Selecciona Pokémon
    F2->>S: emit("pokemon_listo", {salaId, hp, ataque, defensa, velocidad, nombre})

    S->>S: Ambos listos - Determinar turno por velocidad
    S-->>F1: emit("combate_iniciado", {jugador1, jugador2, turnoActual})
    S-->>F2: emit("combate_iniciado", {jugador1, jugador2, turnoActual})

    loop Turnos de combate
        J1->>F1: Clic "Atacar"
        F1->>S: emit("atacar", {salaId})
        S->>S: Calcular daño, reducir HP
        S-->>F1: emit("turno_resultado", {danio, hp1, hp2, log})
        S-->>F2: emit("turno_resultado", {danio, hp1, hp2, log})
        S-->>F1: emit("cambio_turno", {turnoActual: J2})
        S-->>F2: emit("cambio_turno", {turnoActual: J2})

        J2->>F2: Clic "Atacar"
        F2->>S: emit("atacar", {salaId})
        S->>S: Calcular daño, reducir HP
        S-->>F1: emit("turno_resultado", {danio, hp1, hp2, log})
        S-->>F2: emit("turno_resultado", {danio, hp1, hp2, log})
    end

    S->>S: HP de un Pokémon <= 0
    S-->>F1: emit("combate_terminado", {ganador, perdedor})
    S-->>F2: emit("combate_terminado", {ganador, perdedor})
    S->>S: Eliminar sala
```

---

## 6. Diagrama de Secuencia - Sincronización de Pokémon

```mermaid
sequenceDiagram
    actor U as 👤 Usuario
    participant F as 🖥️ Frontend (SyncPanel)
    participant B as ⚙️ Backend (SSE)
    participant API as 🌐 PokéAPI
    participant DB as 🗄️ MySQL

    U->>F: Clic "Sincronizar Pokémon"
    F->>B: GET /api/sync-pokemon (EventSource/SSE)
    B-->>F: SSE: "Conectando con PokéAPI..."

    B->>API: GET /api/v2/pokemon?limit=2000
    API-->>B: Lista de 2000+ Pokémon
    B-->>F: SSE: "2000 Pokémon encontrados. Sincronizando..."

    loop Para cada Pokémon (1 a 2000)
        B->>API: GET /api/v2/pokemon/{name}
        API-->>B: Datos completos (tipos, stats, sprites)
        B->>B: Traducir tipos (fire→Fuego, water→Agua...)
        B->>DB: INSERT INTO pokemon (...) ON DUPLICATE KEY UPDATE
        Note over B: Cada 50 Pokémon envía progreso
        B-->>F: SSE: "⚡ 50/2000 sincronizados..."
        Note over B: Rate limit: pausa 50ms cada 10
    end

    B-->>F: SSE: "✅ Completado: 2000 guardados, 0 errores"
    B-->>F: SSE: {done: true, synced: 2000, errors: 0}
    F->>U: Muestra resultado final
```

---

## 7. Diagrama de Secuencia - Marcar Favorito

```mermaid
sequenceDiagram
    actor U as 👤 Usuario
    participant F as 🖥️ Frontend
    participant B as ⚙️ Backend
    participant DB as 🗄️ MySQL

    U->>F: Clic en ⭐ de un Pokémon
    F->>B: PUT /api/pokemons/25/favorite {is_favorite: true}
    B->>DB: UPDATE pokemon SET is_favorite = 1 WHERE id = 25
    DB-->>B: OK (1 fila actualizada)
    B-->>F: {success: true, is_favorite: true}
    F->>F: Actualizar estado local
    F->>U: Animación de estrella + partículas
```

---

> **📝 Nota:** Para visualizar estos diagramas puedes:
> - Abrir este archivo `.md` en **VS Code** con la extensión "Markdown Preview Mermaid Support"
> - Pegarlo en [mermaid.live](https://mermaid.live)
> - Usar cualquier visor de Markdown que soporte Mermaid
