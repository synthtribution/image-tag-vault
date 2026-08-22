"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { ImageData } from "./types";
import { useDataContext } from "./contexts/DataContext";
import { useSearchParams, useRouter } from "next/navigation";
import { Masonry } from "masonic";
import ImageModal from "./components/ImageModal";
import SearchBar from "./components/SearchBar";
import RandomSelector from "./components/RandomSelector";

// El componente principal de la página
function HomePageContent() {
  const { filteredImages, fetchImagesPage } = useDataContext();

  const [randomImages, setRandomImages] = useState<typeof filteredImages>([]);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const pageParam = searchParams.get("page") || "1";
  const currentPage = parseInt(pageParam, 10) || 1;
  const searchQuery = searchParams.get("search") || "";

  // Para asegurar el render en cliente
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Función para aplicar el filtro de imágenes redirigiendo mediante la URL
  function applyFilters(tags: string[]) {
    const tagsStr = tags.join(", ");
    setRandomImages([]);

    // Redirigir a la página 1 con el nuevo término de búsqueda en la URL
    router.push(`/?page=1&search=${encodeURIComponent(tagsStr)}`);
  }

  function handleGenerateRandom(count: number) {
    if (count === 0) {
      setRandomImages([]);
      return;
    }
    const shuffled = [...filteredImages].sort(() => Math.random() - 0.5);
    const selectedCount = Math.min(count, shuffled.length);
    const selected = shuffled.slice(0, selectedCount);
    setRandomImages(selected);
  }

  const renderImage = ({ data }: { data: ImageData }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={data.image}
      src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${data.image}`}
      alt="tagged"
      className="masonry-img"
      loading="lazy"
      onClick={() => setSelectedImage(data)}
    />
  );

  const currentImages = randomImages.length > 0 ? randomImages : filteredImages;
  const masonryKey = useMemo(
    () => Math.floor(Math.random() * 1e7),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentPage, randomImages, filteredImages]
  );

  // Cargar las imágenes del servidor cuando cambia la página o el filtro de búsqueda en la URL
  useEffect(() => {
    fetchImagesPage(currentPage, searchQuery);
  }, [currentPage, searchQuery, fetchImagesPage]);

  // Manejar navegación con flechas de teclado
  useEffect(() => {
    const handleKeyDown = (e: { key: string }) => {
      const queryParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";

      if (e.key === "ArrowRight") {
        if (filteredImages.length === 100) {
          router.push(`/?page=${currentPage + 1}${queryParam}`);
        }
      }
      if (e.key === "ArrowLeft") {
        if (currentPage > 1) {
          router.push(`/?page=${currentPage - 1}${queryParam}`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPage, filteredImages.length, searchQuery, router]);

  if (!isClient) return null;

  const queryParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";

  return (
    <div className="home-page">
      <div className="search-and-random">
        <SearchBar initialValue={searchQuery} onSearch={applyFilters} />
        <RandomSelector onGenerate={handleGenerateRandom} />
      </div>

      <div className="masonry-grid">
        {currentImages.length > 0 ? (
          <Masonry
            key={masonryKey}
            items={currentImages}
            columnGutter={5}
            columnWidth={230}
            overscanBy={2}
            render={renderImage}
          />
        ) : (
          <div className="p-8 text-center text-gray-500">
            No se encontraron imágenes.
          </div>
        )}
      </div>

      <div className="pagination-controls">
        <button
          onClick={() => {
            router.push(`/?page=${Math.max(currentPage - 1, 1)}${queryParam}`);
          }}
          disabled={currentPage === 1}
        >
          ⬅ Anterior
        </button>
        <span>Página {currentPage}</span>
        <button
          onClick={() => {
            router.push(`/?page=${currentPage + 1}${queryParam}`);
          }}
          disabled={filteredImages.length < 100}
        >
          Siguiente ➡
        </button>
      </div>

      {selectedImage && (
        <ImageModal
          imageData={selectedImage}
          onClose={() => setSelectedImage(null)}
          onPrev={() => {
            const index = currentImages.findIndex(
              (img) => img.image === selectedImage.image
            );
            if (index > 0) {
              setSelectedImage(currentImages[index - 1]);
            }
          }}
          onNext={() => {
            const index = currentImages.findIndex(
              (img) => img.image === selectedImage.image
            );
            if (index < currentImages.length - 1) {
              setSelectedImage(currentImages[index + 1]);
            }
          }}
        />
      )}
    </div>
  );
}

// Envuelve el contenido en un Suspense para permitir prerenderizado estático de useSearchParams
export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
