import java.util.ArrayList;
import java.util.List;

public class Pokedex {
    // Agregación de 1 a muchos (*) Pokémon
    private List<Pokemon> listaPokemones;

    public Pokedex() {
        this.listaPokemones = new ArrayList<>();
    }

    public void addPokemon(Pokemon pokemon) {
        if (pokemon != null) {
            listaPokemones.add(pokemon);
            System.out.println("Registrado en la Pokédex: " + pokemon.getNombre());
        }
    }

    public Pokemon buscarPorNombre(String nombre) {
        for (Pokemon p : listaPokemones) {
            if (p.getNombre().equalsIgnoreCase(nombre)) {
                return p;
            }
        }
        return null; // Si no lo encuentra
    }
}
