// Este archivo devuelve un ícono apropiado basado en el tipo de tag.

import { TagInfo } from "../types";

export function getIconForType(type: TagInfo["type"]): string {
  switch (type) {
    case "tag":
      return "🏷️"; // Etiqueta
    case "character":
      return "👤"; // Personaje
    case "rating":
      return "⭐"; // Rating
    default:
      return "❓"; // Caso de error
  }
}
