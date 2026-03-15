public class BatallaPvE extends Batalla {
    private Jugador jugador;
    private Pokemon salvaje;

    public BatallaPvE(Jugador jugador, Pokemon salvaje) {
        super();
        this.jugador = jugador;
        this.salvaje = salvaje;
    }

    @Override
    public void iniciarBatalla() {
         System.out.println("¡Un " + salvaje.getNombre() + " salvaje ha aparecido frente a " + jugador.getNombre() + "!");
         // Aquí iría la lógica del combate contra la máquina...
    }
}
