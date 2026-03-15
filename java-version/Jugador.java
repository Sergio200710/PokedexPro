public class Jugador extends Usuario {
    // Array de Pokémon
    private Pokemon[] equipo;

    public Jugador(int id, String nombre, String email) {
        super(id, nombre, email);
    }

    public void crearEquipo(Pokemon[] equipo) {
        this.equipo = equipo;
        System.out.println(this.nombre + " ha creado un equipo con " + equipo.length + " Pokémon.");
    }

    public Pokemon[] getEquipo() { return equipo; }
}
