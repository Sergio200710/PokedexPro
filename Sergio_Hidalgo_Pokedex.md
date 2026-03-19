# Explicación Técnica - Proyecto Pokédex

**Alumno:** Sergio Hidalgo
**Curso:** 1º DAM

---

## 1. Sistema de Inicio de Sesión (Login)
Para hacer la parte de usuarios he hecho algo sencillo y funcional usando lo que hemos visto en clase:
* **Base de Datos:** He añadido una columna nueva en la tabla `usuarios` de la base de datos SQLite para guardar la contraseña. Como es una prueba para clase, se guarda tal cual en texto.
* **Backend:** He creado una ruta (un endpoint) llamada `/api/login` en Node.js. Lo que hace es recoger el email y la contraseña que envía el usuario, hace un `SELECT` en la base de datos y si coinciden, te deja entrar.
* **Frontend:** En la parte de React, creé el componente de login. Si el servidor dice que todo está bien, guardo los datos de sesión en el `localStorage` del navegador. Así el usuario no tiene que volver a iniciar sesión si recarga la página.

## 2. Batallas Automáticas de Pokémon
He programado un sistema para que combatan dos Pokémon elegidos por el usuario:
* **Cómo funciona:** He usado las estadísticas reales de la PokéAPI. La fórmula que se me ocurrió usar es restar la `defensa` (dividida a la mitad) al `ataque` de cada Pokémon para saber el daño que hacen. Siempre hacen como mínimo 1 de daño.
* **El código:** Todo ocurre en el backend (`server.js`) dentro de un bucle `while`. El bucle no para hasta que la vida (`hp`) de uno de los dos Pokémon llegue a 0.
* **Mostrar la batalla:** Cada vez que uno ataca, guardo un mensaje de texto en un array. Luego devuelvo todo ese texto a React para mostrar el resumen en la consola o en un alert, diciendo cómo ha ido el combate paso a paso y quién gana.

## 3. Barras de Estadísticas Visuales (CSS)
En lugar de mostrar el `HP`, `Ataque` y `Defensa` simplemente con texto aburrido, lo he hecho visual creando barras de progreso:
* **Cómo las he hecho:** No usé ninguna librería externa. Simplemente puse un `div` contenedor gris y dentro otro `div` de color que va creciendo.
* **La lógica en React:** He hecho una pequeña operación matemática. Supongamos que el máximo posible son 150 puntos. Pues divido su estadística real entre 150 y lo multiplico por 100. Ese número se lo paso directamente por el `style={{ width }}` desde el HTML para que la barra se pinte del porcentaje exacto.
* **Efectos CSS:** Añadí estilos simples de opacidad, `hover` y escalado (`transform: scale`) cuando pones el ratón sobre los Pokémon, además de una pequeña animación en el botón de "Atrapar" que lo hace girar.

## 4. Registro de Historial
* Quería que hubiese algo más de operaciones con la base de datos, así que creé una tabla `historial` en SQLite.
* He programado un `INSERT` en el servidor que puedo llamar desde cualquier lado. Cada vez que inicias una batalla, se conecta a la base de datos y guarda la acción con la fecha y hora por debajo sin molestar al usuario.
