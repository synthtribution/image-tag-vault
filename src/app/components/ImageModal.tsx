import React, { useState, useEffect } from "react";
import { ImageData } from "../types";
import { copyImageToClipboard } from "../utils/copyImageToClipboard";

interface ImageModalProps {
  imageData: ImageData;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({
  imageData,
  onClose,
  onPrev,
  onNext,
}) => {
  const [fullData, setFullData] = useState<ImageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Cargar detalles completos de la imagen en segundo plano al abrir el modal o cambiar de ID
  useEffect(() => {
    setFullData(null);
    setLoading(true);

    const imageUrl = process.env.NEXT_PUBLIC_IMAGE_URL || "http://localhost:3001/imagenes/";
    let apiUrl = "http://localhost:3001";
    try {
      apiUrl = new URL(imageUrl).origin;
    } catch (e) {
      console.warn("Invalid NEXT_PUBLIC_IMAGE_URL, using fallback http://localhost:3001", e);
    }

    fetch(`${apiUrl}/api/images/${imageData.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load details");
        return res.json();
      })
      .then((data) => {
        setFullData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading image details:", err);
        setLoading(false);
      });
  }, [imageData.id]);

  const currentData = fullData || imageData;

  return (
    <div
      className="fixed inset-0 bg-gray-800/50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="relative bg-white max-h-[95vh] max-w-[80vw] flex rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Evita cerrar al hacer clic dentro
      >
        <button
          className="absolute top-2 right-2 p-1 bg-white hover:bg-gray-200 rounded-full z-10"
          onClick={onClose}
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <button
          className="w-15 bg-white hover:bg-gray-200 flex items-center justify-center"
          onClick={onPrev}
        >
          <svg
            className="w-8 h-8 text-gray-700"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="overflow-y-auto max-h-[95vh] flex-grow flex flex-col items-center">
          <div className="flex items-center justify-center w-full">
            {/*eslint-disable-next-line @next/next/no-img-element*/}
            <img
              src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${currentData.image}`}
              alt="selected"
              className="max-h-[95vh] w-auto object-contain cursor-pointer"
              onClick={() =>
                copyImageToClipboard(
                  `${process.env.NEXT_PUBLIC_IMAGE_URL}${currentData.image}`
                )
              }
            />
          </div>
          <div className="w-full bg-gray-100 border-t border-gray-300 p-4">
            <h4 className="text-xl font-semibold mb-1 text-center">
              {currentData.image}
            </h4>
            
            <h4 className="text-lg font-semibold mb-1">Tags:</h4>
            <p className="mb-2 text-sm text-gray-700">
              {loading ? "Cargando..." : currentData.tags?.join(", ") || "(Ninguno)"}
            </p>

            <h4 className="text-lg font-semibold mb-1">Characters:</h4>
            <p className="mb-2 text-sm text-gray-700">
              {loading ? "Cargando..." : currentData.character_tags?.join(", ") || "(Ninguno)"}
            </p>

            <h4 className="text-lg font-semibold mb-1">Ratings:</h4>
            <p className="mb-2 text-sm text-gray-700">
              {loading ? "Cargando..." : currentData.ratings?.join(", ") || "(Ninguno)"}
            </p>

            <p className="text-xs text-gray-500">
              Uploaded: {currentData.created_at ? new Date(currentData.created_at).toLocaleString() : "Cargando..."}
            </p>
          </div>
        </div>

        <button
          className="w-15 bg-white hover:bg-gray-200 flex items-center justify-center"
          onClick={onNext}
        >
          <svg
            className="w-8 h-8 text-gray-700"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ImageModal;
