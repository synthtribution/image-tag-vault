"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { fetchData } from "../utils/fetchData";
import { buildTagsIndex } from "../utils/buildTagsIndex";
import { ImageData, TagInfo } from "../types";

interface DataContextType {
  images: ImageData[];
  filteredImages: ImageData[];
  tagsIndex: TagInfo[];
  setImages: (images: ImageData[]) => void;
  setFilteredImages: (images: ImageData[]) => void;
  setTagsIndex: (tags: TagInfo[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [tagsIndex, setTagsIndex] = useState<TagInfo[]>([]);

  // Efecto para cargar las imágenes cuando el componente se monta
  useEffect(() => {
    fetchData() // Llamamos a la función para cargar los datos desde el CSV
      .then((data) => {
        setImages(data);
        setFilteredImages(data);
        setTagsIndex(buildTagsIndex(data));
      })
      .catch((err) => {
        console.error("Error fetching images:", err);
      });
  }, []);

  return (
    <DataContext.Provider
      value={{
        images,
        filteredImages,
        tagsIndex,
        setImages,
        setFilteredImages,
        setTagsIndex,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useDataContext debe usarse dentro de un DataProvider");
  }
  return context;
}
