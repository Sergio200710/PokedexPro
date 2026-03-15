# Diagramas Mermaid - Pokemon App

---

## DIAGRAMA DE CASOS DE USO 1: Sistema General

Copia y pega esto en mermaid.live:

```
graph LR
    subgraph Sistema["Pokedex Interactiva Avanzada"]
        CU1[Ver lista de Pokemon]
        CU2[Buscar Pokemon]
        CU3[Filtrar por tipo]
        CU4[Ver detalle de Pokemon]
        CU5[Marcar favorito]
        CU6[Sincronizar desde PokeAPI]
        CU7[Iniciar sesion con Google]
        CU8[Cerrar sesion]
        CU9[Ver perfil de usuario]
        CU10[Batalla PvE]
        CU11[Batalla Multijugador]
        CU12[Ver historial de batallas]
        CU13[Ver ranking]
    end

    Usuario((Usuario))
    Visitante((Visitante))
    Google((Google OAuth))
    PokeAPI((PokeAPI))

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
    Usuario --> CU7
    Usuario --> CU8
    Usuario --> CU9
    Usuario --> CU10
    Usuario --> CU11
    Usuario --> CU12
    Usuario --> CU13

    CU7 --> Google
    CU6 --> PokeAPI
```

---

## DIAGRAMA DE CASOS DE USO 2: Sistema de Batallas

Copia y pega esto en mermaid.live:

```
graph LR
    subgraph Batallas["Sistema de Batallas Pokemon"]
        CU1[Seleccionar Pokemon]
        CU2[Iniciar Batalla PvE]
        CU3[Atacar en turno]
        CU4[Recibir resultado]
        CU5[Guardar batalla en BD]
        CU6[Crear sala multijugador]
        CU7[Unirse a sala]
        CU8[Combate en tiempo real]
        CU9[Ver historial batallas]
        CU10[Subir nivel entrenador]
        CU11[Ganar insignia]
    end

    Jugador((Jugador))
    CPU((CPU - IA))
    Oponente((Oponente Online))
    BD((MySQL BD))

    Jugador --> CU1
    Jugador --> CU2
    Jugador --> CU3
    Jugador --> CU4
    Jugador --> CU6
    Jugador --> CU7
    Jugador --> CU8
    Jugador --> CU9

    CU2 --> CPU
    CU8 --> Oponente
    CU5 --> BD
    CU4 --> CU5
    CU10 --> CU11
    CU5 --> CU10
```

---

## DIAGRAMA DE CASOS DE USO 3: Gestion de Pokemon y Datos

Copia y pega esto en mermaid.live:

```
graph LR
    subgraph GestionPokemon["Gestion de Pokemon y Datos"]
        CU1[Consultar lista Pokemon]
        CU2[Buscar por nombre]
        CU3[Filtrar por tipo]
        CU4[Filtrar por nivel]
        CU5[Ver detalle Pokemon]
        CU6[Marcar como favorito]
        CU7[Desmarcar favorito]
        CU8[Sincronizar 2000 Pokemon]
        CU9[Ver progreso sincronizacion]
    end

    Usuario((Usuario))
    Admin((Administrador))
    PokeAPI((PokeAPI externa))
    MySQL((Base de datos MySQL))

    Usuario --> CU1
    Usuario --> CU2
    Usuario --> CU3
    Usuario --> CU4
    Usuario --> CU5
    Usuario --> CU6
    Usuario --> CU7

    Admin --> CU8
    Admin --> CU9
    Admin --> CU1

    CU8 --> PokeAPI
    CU1 --> MySQL
    CU5 --> MySQL
    CU6 --> MySQL
    CU8 --> MySQL
```

---

## DIAGRAMA DE SECUENCIA 1: Autenticacion con Google OAuth

Copia y pega esto en mermaid.live:

```
sequenceDiagram
    actor U as Usuario
    participant F as Frontend :5173
    participant B as Backend :4412
    participant G as Google OAuth
    participant DB as MySQL pokedex_2026

    U->>F: Clic en Iniciar sesion
    F->>B: GET /api/auth/google
    B->>G: Redirect a Google Login
    G->>U: Muestra formulario login
    U->>G: Ingresa credenciales
    G->>B: GET /api/auth/google/callback con token

    B->>DB: SELECT * FROM usuarios WHERE email = ?

    alt Usuario nuevo
        DB-->>B: No encontrado
        B->>DB: INSERT INTO usuarios (nombre, email, foto)
        DB-->>B: Usuario creado con ID
    else Usuario existente
        DB-->>B: Datos del usuario
        B->>DB: UPDATE usuarios SET foto = ?
        DB-->>B: OK
    end

    B->>B: Crear sesion express-session
    B->>F: Redirect a Frontend con auth=success
    F->>B: GET /api/auth/status
    B-->>F: authenticated true con datos usuario
    F->>U: Muestra perfil del usuario
```

---

## DIAGRAMA DE SECUENCIA 2: Consultar y Filtrar Pokemon

Copia y pega esto en mermaid.live:

```
sequenceDiagram
    actor U as Usuario
    participant F as Frontend React
    participant B as Backend Express
    participant DB as MySQL
    participant API as PokeAPI

    U->>F: Abre la app o aplica filtros
    F->>B: GET /api/pokemons?tipo=Fuego&search=char&limit=60

    B->>DB: SELECT * FROM pokemon WHERE tipo_principal=? AND nombre LIKE ?
    DB-->>B: 3 resultados encontrados

    B->>DB: SELECT COUNT(*) FROM pokemon WHERE filtros
    DB-->>B: total = 3

    loop Para cada Pokemon del resultado
        B->>B: Verificar cache de PokeAPI
        alt Existe en cache
            B->>B: Usar datos cacheados
        else No existe en cache
            B->>API: GET /api/v2/pokemon/charmander
            API-->>B: JSON con sprites y datos
            B->>B: Guardar en cache Map
        end
        B->>B: Asignar imagen y imagenAnimada
    end

    B-->>F: JSON con pokemons array y total
    F->>U: Renderiza tarjetas de Pokemon
```

---

## DIAGRAMA DE SECUENCIA 3: Batalla Multijugador con Socket.IO

Copia y pega esto en mermaid.live:

```
sequenceDiagram
    actor J1 as Jugador 1
    actor J2 as Jugador 2
    participant F1 as Frontend J1
    participant F2 as Frontend J2
    participant S as Socket.IO Server :4412
    participant DB as MySQL

    J1->>F1: Clic en Crear Sala
    F1->>S: emit crear_sala con usuario y pokemonId
    S->>S: Genera codigo sala ej A3F2K1
    S-->>F1: emit sala_creada con salaId

    J1-->>J2: Comparte codigo de sala

    J2->>F2: Introduce codigo A3F2K1
    F2->>S: emit unirse_sala con salaId y usuario
    S->>S: Asignar jugador2 a la sala
    S-->>F1: emit sala_lista con ambos jugadores
    S-->>F2: emit sala_lista con ambos jugadores

    J1->>F1: Selecciona Pokemon y confirma
    F1->>S: emit pokemon_listo con stats hp ataque defensa velocidad
    J2->>F2: Selecciona Pokemon y confirma
    F2->>S: emit pokemon_listo con stats

    S->>S: Ambos listos y determina turno por velocidad
    S-->>F1: emit combate_iniciado
    S-->>F2: emit combate_iniciado

    loop Turnos de combate
        J1->>F1: Clic en Atacar
        F1->>S: emit atacar con salaId
        S->>S: Calcular danio y reducir HP
        S-->>F1: emit turno_resultado con danio y HPs
        S-->>F2: emit turno_resultado con danio y HPs

        alt HP defensor menor o igual a 0
            S-->>F1: emit combate_terminado con ganador
            S-->>F2: emit combate_terminado con ganador
            S->>S: Eliminar sala
        else HP mayor que 0
            S-->>F1: emit cambio_turno
            S-->>F2: emit cambio_turno
            J2->>F2: Clic en Atacar
            F2->>S: emit atacar con salaId
            S->>S: Calcular danio y reducir HP
            S-->>F1: emit turno_resultado
            S-->>F2: emit turno_resultado
        end
    end

    S->>DB: INSERT INTO batallas con resultado
    DB-->>S: OK
```
