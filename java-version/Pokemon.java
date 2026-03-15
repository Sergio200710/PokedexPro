public class Pokemon implements ICombatiente {
    private int id;
    private String nombre;
    private String tipo;
    
    // Asociación 1 a 1 con Estadísticas
    private Estadisticas estadisticas; 

    public Pokemon(int id, String nombre, String tipo, Estadisticas estadisticas) {
        this.id = id;
        this.nombre = nombre;
        this.tipo = tipo;
        this.estadisticas = estadisticas;
    }

    public void atacar() {
        System.out.println(this.nombre + " realiza un ataque básico.");
    }

    // Método proveniente de la interfaz ICombatiente
    @Override
    public void atacar(ICombatiente objetivo) {
        System.out.println(this.nombre + " ataca al objetivo.");
        if (objetivo instanceof Pokemon) {
            // Ejemplo básico de cálculo de daño utilizando las estadísticas
            int danioCausado = this.estadisticas.getAtaque();
            ((Pokemon) objetivo).recibirDanio(danioCausado);
        }
    }

    public void recibirDanio(int cantidad) {
        int hpRestante = this.estadisticas.getHp() - cantidad;
        this.estadisticas.setHp(hpRestante);
        System.out.println(this.nombre + " recibió " + cantidad + " de daño. HP Restante: " + hpRestante);
    }

    public String getNombre() { return nombre; }
    public String getTipo() { return tipo; }
    public int getId() { return id; }
    public Estadisticas getEstadisticas() { return estadisticas; }
}
