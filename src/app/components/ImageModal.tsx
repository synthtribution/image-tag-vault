import React from "react";
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
              src={`${process.env.NEXT_PUBLIC_IMAGE_URL}${imageData.image}`}
              alt="selected"
              className="max-h-[95vh] w-auto object-contain cursor-pointer"
              onClick={() =>
                copyImageToClipboard(
                  `${process.env.NEXT_PUBLIC_IMAGE_URL}${imageData.image}`
                )
              }
            />
          </div>
          <div className="w-full bg-gray-100 border-t border-gray-300 p-4">
            <h4 className="text-xl font-semibold mb-1 text-center">
              {imageData.image}
            </h4>
            <h4 className="text-lg font-semibold mb-1">Tags:</h4>
            <p className="mb-2 text-sm text-gray-700">
              {imageData.tags.join(", ")}
            </p>

            <h4 className="text-lg font-semibold mb-1">Characters:</h4>
            <p className="mb-2 text-sm text-gray-700">
              {imageData.character_tags.join(", ")}
            </p>

            <h4 className="text-lg font-semibold mb-1">Ratings:</h4>
            <p className="mb-2 text-sm text-gray-700">
              {imageData.ratings.join(", ")}
            </p>

            <p className="text-xs text-gray-500">
              Uploaded: {new Date(imageData.created_at).toLocaleString()}
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
