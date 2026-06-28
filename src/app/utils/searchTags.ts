// Este archivo busca dentro del índice de tags sugerencias basadas en el input del usuario.
import { TagInfo } from "../types";

// Función que filtra y devuelve los tags que coinciden con el texto ingresado
export function searchTags(tagsIndex: TagInfo[], query: string): TagInfo[] {
  if (!query.trim()) {
    return []; // Si no hay nada escrito, no mostramos sugerencias
  }

  const lowerQuery = query.toLowerCase();

  // Buscamos en el array de tagsIndex
  return tagsIndex
    .filter((tag) => tag.name.toLowerCase().includes(lowerQuery))
    .sort((a, b) => b.count - a.count) // Opcional: ordenar para mostrar primero los más populares
    .slice(0, 20); // Limitamos a las 20 mejores sugerencias
}
