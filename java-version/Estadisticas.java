public class Estadisticas {
    private int hp;
    private int ataque;
    private int defensa;
    private int velocidad;

    public Estadisticas(int hp, int ataque, int defensa, int velocidad) {
        this.hp = hp;
        this.ataque = ataque;
        this.defensa = defensa;
        this.velocidad = velocidad;
    }

    // Getters y Setters
    public int getHp() { return hp; }
    public void setHp(int hp) { this.hp = hp; }
    public int getAtaque() { return ataque; }
    public void setAtaque(int ataque) { this.ataque = ataque; }
    public int getDefensa() { return defensa; }
    public void setDefensa(int defensa) { this.defensa = defensa; }
    public int getVelocidad() { return velocidad; }
    public void setVelocidad(int velocidad) { this.velocidad = velocidad; }
}
