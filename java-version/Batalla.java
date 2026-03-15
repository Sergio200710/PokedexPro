public abstract class Batalla {
    // Relación de agregación dictada por el rombo vacío del UML
    protected HistorialBatalla historialBatalla;

    public Batalla() {
        this.historialBatalla = new HistorialBatalla();
    }

    // Método abstracto a implementar por los hijos
    public abstract void iniciarBatalla();
}
