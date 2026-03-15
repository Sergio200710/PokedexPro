public class Main {
    public static void main(String[] args) {
        System.out.println("--- INICIANDO POKÉMON APP VERSIÓN JAVA ---");

        // 1. Crear algunas Estadísticas
        Estadisticas estPikachu = new Estadisticas(35, 55, 40, 90);
        Estadisticas estBulbasaur = new Estadisticas(45, 49, 49, 45);
        Estadisticas estCharmander = new Estadisticas(39, 52, 43, 65);

        // 2. Crear los Pokémon
        Pokemon pikachu = new Pokemon(25, "Pikachu", "Eléctrico", estPikachu);
        Pokemon bulbasaur = new Pokemon(1, "Bulbasaur", "Planta/Veneno", estBulbasaur);
        Pokemon charmander = new Pokemon(4, "Charmander", "Fuego", estCharmander);

        // 3. Sistema Pokedex
        Pokedex pokedex = new Pokedex();
        System.out.println("\n[Registrando en la Pokedex]");
        pokedex.addPokemon(pikachu);
        pokedex.addPokemon(bulbasaur);
        pokedex.addPokemon(charmander);

        // 4. Crear un Jugador y su equipo
        System.out.println("\n[Creación de Jugador y Equipo]");
        Jugador ash = new Jugador(1, "Ash Ketchum", "ash@pueblopaleta.com");
        Pokemon[] equipoAsh = { pikachu, bulbasaur };
        ash.crearEquipo(equipoAsh);
        
        // 5. Agregar Favoritos
        ash.agregarFavorito(pikachu);

        System.out.println("\n[Creación de Rival]");
        Jugador gary = new Jugador(2, "Gary Oak", "gary@pueblopaleta.com");
        Pokemon[] equipoGary = { charmander };
        gary.crearEquipo(equipoGary);

        // 6. Administrador
        System.out.println("\n[Administración]");
        Administrador admin = new Administrador(99, "Profesor Oak", "oak@lab.com");
        admin.banearUsuario(new Usuario(3, "Team Rocket", "rocket@villanos.com"));

        // 7. Sistema de Batallas
        System.out.println("\n[SISTEMA DE BATALLAS "]");
        
        // Batalla PvE (Jugador vs Entorno)
        BatallaPvE batallaSalvaje = new BatallaPvE(ash, new Pokemon(16, "Pidgey", "Normal/Volador", new Estadisticas(40, 45, 40, 56)));
        batallaSalvaje.iniciarBatalla();

        System.out.println();

        // Batalla PvP (Jugador vs Jugador)
        BatallaPvP batallaLiga = new BatallaPvP(ash, gary);
        batallaLiga.iniciarBatalla();

        System.out.println("\n[Acciones de Combate]");
        pikachu.atacar(charmander);
        charmander.atacar(pikachu);

        System.out.println("\n--- FIN DE LA EJECUCIÓN ---");
    }
}
