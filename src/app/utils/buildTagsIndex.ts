// Este archivo genera un array de todos los tags únicos del dataset de imágenes
// con la cantidad de veces que aparece cada uno y el tipo de tag que es.

import { TagInfo, ImageData } from "../types";

// Función que recibe todas las imágenes y construye el índice de tags
export function buildTagsIndex(images: ImageData[]): TagInfo[] {
  const tagMap: Map<string, TagInfo> = new Map();
  const characterMap: Map<string, TagInfo> = new Map();
  const ratingMap: Map<string, TagInfo> = new Map();

  images.forEach((img) => {
    // Procesamos character_tags
    img.character_tags.forEach((char) => {
      const existing = characterMap.get(char);
      if (existing) {
        existing.count++;
      } else {
        characterMap.set(char, { name: char, count: 1, type: "character" });
      }
    });

    // Procesamos tags normales
    img.tags.forEach((tag) => {
      if (characterMap.has(tag.replaceAll(" ", "_").replaceAll("\\", ""))) {
        return;
      }
      const existing = tagMap.get(tag);
      if (existing) {
        existing.count++;
      } else {
        tagMap.set(tag, { name: tag, count: 1, type: "tag" });
      }
    });

    // Procesamos ratings
    img.ratings.forEach((rating) => {
      const existing = ratingMap.get(rating);
      if (existing) {
        existing.count++;
      } else {
        ratingMap.set(rating, { name: rating, count: 1, type: "rating" });
      }
    });
  });

  // Convertimos los Map a un array
  return [
    ...Array.from(characterMap.values()),
    ...Array.from(tagMap.values()),
    ...Array.from(ratingMap.values()),
  ];
}
