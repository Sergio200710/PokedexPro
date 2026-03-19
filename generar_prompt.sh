#!/bin/bash

# Este script imprime el prompt para ChatGPT
# Ejecútalo con: bash generar_prompt.sh

clear
echo "================================================================="
echo " COPIA EL TEXTO A CONTINUACIÓN Y PÉGALO EN CHATGPT"
echo "================================================================="
echo ""

cat <<EOF
Hola ChatGPT! Soy Sergio, estudiante de 1º de DAM (Desarrollo de Aplicaciones Multiplataforma). Estoy haciendo una práctica de Bases de Datos con una Pokedex y necesito que me ayudes con el código del backend y algunas queries de SQL.

Tengo un proyecto con Node.js (Express) y MySQL, y el profesor nos ha pedido meter estas cosas que no sé muy bien cómo estructurar:

1. FUNCIONALIDAD POKEDEX (CRUD):
- Capturar: Necesito que cuando el usuario capture un Pokémon, se inserte en una tabla que relacione al 'entrenador' con el 'pokemon'.
- Entrenar: Un botón que haga un UPDATE en la BD para subir nivel o stats. Si llega a nivel 30 (por ejemplo), que el Pokémon evolucione (se cambie el nombre del pokemon por su evolución).
- Liberar: Un borrado (DELETE) para quitarlo del equipo.

2. VISTAS:
- Crea el SQL para una vista que se llame 'vista_top_competitivo'. Tiene que sacar el Top 10 de pokemons sumando todos sus stats base (ataque, defensa, etc).

3. ÍNDICES Y RENDIMIENTO:
- Pásame un script SQL para meter unos 1000 pokemons de golpe (datasets de prueba) para que la tabla pese.
- Hazme una ruta en Express para buscar por nombre y que calcule con 'console.time' cuánto tarda la búsqueda.
- Luego enséñame a crear un índice por el campo 'nombre' y cómo notaríamos la mejora de tiempo.

4. TRANSACCIONES (Intercambio entre entrenadores):
- Esto es lo más difícil. Tengo que hacer un sistema de intercambio. El entrenador 1 pasa un pokemon al 2, y el 2 le pasa otro al 1.
- El código tiene que usar START TRANSACTION, COMMIT y ROLLBACK por si algo falla a mitad (por ejemplo si un pokemon no existe).
- Explícame un poco cómo funciona el 'rollback' para ponerlo en mi PDF de la entrega.

5. BACKUP:
- Solo recuérdame cómo se hace el comando de 'mysqldump' para exportar todo.

¿Podrías darme el código de Express y los comandos de SQL para esto? Intenta que el código no sea super complejo, que se note que soy de primero pero que funcione bien. ¡Muchas gracias!
EOF

echo ""
echo "================================================================="
echo " FIN DEL PROMPT"
echo "================================================================="
