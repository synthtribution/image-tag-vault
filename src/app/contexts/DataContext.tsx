"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { ImageData, TagInfo } from "../types";

interface DataContextType {
  images: ImageData[];
  filteredImages: ImageData[];
  tagsIndex: TagInfo[];
  setImages: (images: ImageData[]) => void;
  setFilteredImages: (images: ImageData[]) => void;
  setTagsIndex: (tags: TagInfo[]) => void;
  fetchImagesPage: (page: number, search?: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);
  const [tagsIndex, setTagsIndex] = useState<TagInfo[]>([]);

  // Función para cargar una página específica de imágenes filtradas o completas desde la API
  const fetchImagesPage = useCallback(async (page: number, search?: string) => {
    const imageUrl = process.env.NEXT_PUBLIC_IMAGE_URL || "http://localhost:3001/imagenes/";
    let apiUrl = "http://localhost:3001";
    try {
      apiUrl = new URL(imageUrl).origin;
    } catch (e) {
      console.warn("Invalid NEXT_PUBLIC_IMAGE_URL, using fallback http://localhost:3001", e);
    }

    try {
      const searchParam = search ? `&tags=${encodeURIComponent(search)}` : '';
      const res = await fetch(`${apiUrl}/api/images?page=${page}${searchParam}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setImages(data);
      setFilteredImages(data);
    } catch (err) {
      console.error(`Error fetching page ${page} (search: ${search}) from database API:`, err);
    }
  }, []);

  // Cargar el índice global de tags para el autocompletado en el cliente
  useEffect(() => {
    const imageUrl = process.env.NEXT_PUBLIC_IMAGE_URL || "http://localhost:3001/imagenes/";
    let apiUrl = "http://localhost:3001";
    try {
      apiUrl = new URL(imageUrl).origin;
    } catch (e) {
      console.warn("Invalid NEXT_PUBLIC_IMAGE_URL, using fallback http://localhost:3001", e);
    }

    fetch(`${apiUrl}/api/tags`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setTagsIndex(data);
      })
      .catch((err) => {
        console.error("Error fetching tags index from database API:", err);
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
        fetchImagesPage,
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
