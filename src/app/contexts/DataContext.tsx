"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
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

  // Efecto para cargar las imágenes y el índice de tags desde la API del backend
  useEffect(() => {
    const imageUrl = process.env.NEXT_PUBLIC_IMAGE_URL || "http://localhost:3001/imagenes/";
    let apiUrl = "http://localhost:3001";
    try {
      apiUrl = new URL(imageUrl).origin;
    } catch (e) {
      console.warn("Invalid NEXT_PUBLIC_IMAGE_URL, using fallback http://localhost:3001", e);
    }

    // 1. Cargar todas las imágenes
    fetch(`${apiUrl}/api/images`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setImages(data);
        setFilteredImages(data);
      })
      .catch((err) => {
        console.error("Error fetching images from database API:", err);
      });

    // 2. Cargar índice de tags pre-calculado
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

