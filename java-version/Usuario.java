import java.util.ArrayList;
import java.util.List;

public class Usuario {
    protected int id;
    protected String nombre;
    protected String email;
    
    // Relación de 1 a muchos (*) hacia Pokémon (Favoritos)
    protected List<Pokemon> favoritos; 

    public Usuario(int id, String nombre, String email) {
        this.id = id;
        this.nombre = nombre;
        this.email = email;
        this.favoritos = new ArrayList<>();
    }

    public void agregarFavorito(Pokemon pokemon) {
        if (pokemon != null && !favoritos.contains(pokemon)) {
            this.favoritos.add(pokemon);
            System.out.println("Se ha añadido a " + pokemon.getNombre() + " a los favoritos de " + this.nombre);
        }
    }

    public String getNombre() { return nombre; }
}
