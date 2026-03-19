# ⚡ Pokédex App

<div align="center">
  <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" width="150" alt="Pikachu">
</div>

Proyecto final para el curso de 1º de DAM. Consiste en una aplicación Full Stack real que actúa como una Pokédex interactiva para Entrenadores Pokémon, con capacidad para buscar, registrar, simular batallas y llevar un historial de todas tus acciones.

---

## 🛠️ Tecnologías Usadas
- **Frontend:** React.js, HTML5, CSS3 (Glassmorphism UI)
- **Backend:** Node.js con Express
- **Base de Datos:** SQLite (ligera y persistente)
- **Datos externos:** Conexión con *PokeAPI*

---

## 🌟 Funcionalidades Principales

Nuestra App no es solo un gestor básico, incluye características avanzadas:
1. **Inicio de sesión (Login):** Autenticación en base de datos almacenando la sesión en local.
2. **Sistema CRUD Completo:** Creación y gestión de datos Pokémon.
3. **Pokemon Tracker (Favoritos):** Funcionalidad interactiva estilo *Pokémon GO* para añadir a tus favoritos.
4. **Arena de Entrenamiento (Batallas 🤖):** Sistema automatizado matemático donde los Pokémon pelean por turnos según sus estadísticas.
5. **Historial de Entrenador:** La base de datos guarda automáticamente cada victoria, captura y entrenamiento.

---

## 📂 Organización de Carpetas
```text
pokedex/
 ├─ backend/        # Servidor Node, lógica y base de datos (pokemon.db)
 ├─ frontend/       # Pantallas, componentes en React y assets
 ├─ java-version/   # (Opcional) Código portado a Java
 ├─ docs/           # Documentos técnicos, PDFs y enunciado
 └─ README.md       # Este archivo
```

---

## 🚀 Cómo Ejecutar el Proyecto

Para probar este código en tu propio ordenador, abre dos ventanas de terminal:

**1. Levantar el Servidor (Backend)**
```bash
cd backend
npm install
node server.js
```
*(Se creará automáticamente el archivo `pokemon.db` en el puerto 4412).*

**2. Levantar la Aplicación (Frontend)**
```bash
cd frontend
npm install
npm run dev
```
*(La aplicación se abrirá en `http://localhost:5173` o el puerto que te indique Vite).*

---
> Proyecto desarrollado por **Sergio**. Creado y mantenido como Portfolio y proyecto educativo.
