"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { ImageData } from "../types";

interface DataContextType {
  images: ImageData[];
  filteredImages: ImageData[];
  setImages: (images: ImageData[]) => void;
  setFilteredImages: (images: ImageData[]) => void;
  fetchImagesPage: (page: number, search?: string) => Promise<void>;
  fetchRandomImages: (count: number, search?: string) => Promise<ImageData[]>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageData[]>([]);

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

  // Función para obtener imágenes aleatorias desde la API (con o sin filtros de tags)
  const fetchRandomImages = useCallback(async (count: number, search?: string): Promise<ImageData[]> => {
    const imageUrl = process.env.NEXT_PUBLIC_IMAGE_URL || "http://localhost:3001/imagenes/";
    let apiUrl = "http://localhost:3001";
    try {
      apiUrl = new URL(imageUrl).origin;
    } catch {}

    try {
      const searchParam = search ? `&tags=${encodeURIComponent(search)}` : '';
      const res = await fetch(`${apiUrl}/api/images?random=${count}${searchParam}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    } catch (err) {
      console.error(`Error fetching random images (count: ${count}, search: ${search}):`, err);
      return [];
    }
  }, []);

  return (
    <DataContext.Provider
      value={{
        images,
        filteredImages,
        setImages,
        setFilteredImages,
        fetchImagesPage,
        fetchRandomImages,
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
