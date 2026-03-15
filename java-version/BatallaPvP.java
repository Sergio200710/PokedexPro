public class BatallaPvP extends Batalla {
    private Jugador jugador1;
    private Jugador jugador2;

    public BatallaPvP(Jugador jugador1, Jugador jugador2) {
        super();
        this.jugador1 = jugador1;
        this.jugador2 = jugador2;
    }

    @Override
    public void iniciarBatalla() {
        System.out.println("¡Inicio de Batalla PvP: " + jugador1.getNombre() + " VS " + jugador2.getNombre() + "!");
        // Aquí iría la lógica algorítmica de los turnos...
    }
}
