import Papa from "papaparse";
import { ImageData } from "../types";

export async function fetchData(): Promise<ImageData[]> {
  try {
    const indexRes = await fetch("/data/data_index.json");
    if (!indexRes.ok) {
      throw new Error(
        `Failed to fetch data index: ${indexRes.status} ${indexRes.statusText}`
      );
    }
    const files: string[] = await indexRes.json();

    const allImages: ImageData[] = [];
    for (const file of files) {
      if (file === "batch_tags.example.csv") continue;
      const res = await fetch(`/data/${file}`);
      if (!res.ok) {
        console.warn(`Skipped ${file}: ${res.status} ${res.statusText}`);
        continue;
      }

      const csvText = await res.text();
      const parsed = Papa.parse<string[]>(csvText, {
        delimiter: ",",
        skipEmptyLines: true,
      });
      if (parsed.errors.length > 0) {
        throw new Error(
          `CSV Parsing Error: ${parsed.errors.map((e) => e.message).join(", ")}`
        );
      }
      const images: ImageData[] = parsed.data
        .filter((row) => row[0] !== "image") // <--- esto salta la cabecera
        .map((row) => {
          const [image, created_at, ratings, character_tags, tags] = row;
          return {
            image: image || "",
            created_at: created_at || "",
            ratings: parseTags(ratings, true),
            character_tags: parseTags(character_tags),
            tags: parseTags(tags),
          };
        });
      allImages.push(...images);
    }
    const sortedImages = allImages.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    console.log("Parsed images:", sortedImages); // Debugging line to check parsed data
    return sortedImages;
  } catch (error) {
    console.error("Error fetching or parsing data:", error);
    throw error;
  }
}

function parseTags(
  input: string | undefined,
  returnHighest: boolean = false
): string[] {
  if (!input) return [];

  const parts = input.split(";").map((entry) => {
    const [tag, value] = entry.split(":");
    if (value === undefined) {
      return { tag: tag.trim() };
    }

    return {
      tag: tag.trim(),
      value: parseFloat(value),
    };
  });

  if (returnHighest) {
    const validParts = parts.filter((part) => part.value !== undefined);
    if (validParts.length === 0) return [];

    const highest = validParts.reduce((a, b) => (a.value > b.value ? a : b));
    return [highest.tag];
  }

  return parts.map((p) => p.tag);
}
