public class Administrador extends Usuario {
    
    public Administrador(int id, String nombre, String email) {
        super(id, nombre, email);
    }

    public void banearUsuario(Usuario usuario) {
        System.out.println("CRÍTICO: El administrador " + this.nombre + " ha baneado al usuario " + usuario.getNombre());
    }
}
