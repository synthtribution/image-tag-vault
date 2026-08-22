"use client"; // Indica que este archivo es de cliente y permite el uso de hooks y efectos de React
import { useEffect, useState, useRef, useMemo, Suspense } from "react"; // Import useRef
import { getIconForType } from "./utils/getIconForType"; // Importamos la función de iconos
import { ImageData, TagInfo } from "./types"; // Importamos los tipos de datos
import { useDataContext } from "./contexts/DataContext";
import { useSearchParams, useRouter } from "next/navigation";
import { parseTagsFromString } from "./utils/parseTags";
import { Masonry } from "masonic";
import ImageModal from "./components/ImageModal";

// El componente principal de la página
function HomePageContent() {
  const { filteredImages, fetchImagesPage } =
    useDataContext(); // Obtenemos el contexto de datos

  const [searchText, setSearchText] = useState(""); // Texto que el usuario escribe
  const [suggestions, setSuggestions] = useState<TagInfo[]>([]); // Sugerencias de autocompletado
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // Tags seleccionados para el filtro
  const [error] = useState<string | null>(null); // Estado para manejar errores
  const [activeSuggestionIndex, setActiveSuggestionIndex] =
    useState<number>(-1);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false);

  const [randomCount, setRandomCount] = useState<number>(0);
  const [randomImages, setRandomImages] = useState<typeof filteredImages>([]);

  const searchParams = useSearchParams();
  const router = useRouter();

  const pageParam = searchParams.get("page") || "1";
  const currentPage = parseInt(pageParam, 10) || 1;

  // Create a ref for the search input div
  const searchInputDivRef = useRef<HTMLDivElement | null>(null);
  const suggestionsDiv = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const suggestionsAbortControllerRef = useRef<AbortController | null>(null);

  // Para asegurar el render en cliente
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  // sincroniza la búsqueda con el input y tags seleccionados si cambia la URL
  useEffect(() => {
    const query = searchParams.get("search") || "";
    setSearchText(query);
    setSelectedTags(parseTagsFromString(query));
  }, [searchParams]);

  useEffect(() => {
    if (suggestionsDiv.current) {
      if (!isInputFocused) {
        suggestionsDiv.current.style.display = "none";
      } else if (suggestions.length > 0) {
        suggestionsDiv.current.style.display = "block";
      }
    }
  }, [isInputFocused, suggestions]);

  // Función que maneja la escritura en el input de búsqueda
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchText(value);

    // Si el input está vacío, reseteamos todo
    if (value.trim() === "") {
      setSelectedTags([]);
      manageSuggestions([]);
      return;
    }

    // Buscamos sugerencias solo del último término escrito
    const terms = parseTagsFromString(value);
    const lastTerm = terms[terms.length - 1]?.trim() || "";
    setSelectedTags(terms); // Actualizamos los tags seleccionados

    if (lastTerm === "") {
      manageSuggestions([]);
      return;
    }

    // Abortar petición anterior si existía
    if (suggestionsAbortControllerRef.current) {
      suggestionsAbortControllerRef.current.abort();
    }

    // Crear un nuevo AbortController
    const controller = new AbortController();
    suggestionsAbortControllerRef.current = controller;

    const imageUrl = process.env.NEXT_PUBLIC_IMAGE_URL || "http://localhost:3001/imagenes/";
    let apiUrl = "http://localhost:3001";
    try {
      apiUrl = new URL(imageUrl).origin;
    } catch {}

    fetch(`${apiUrl}/api/tags?search=${encodeURIComponent(lastTerm)}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error fetching suggestions");
        return res.json();
      })
      .then((results: TagInfo[]) => {
        if (
          results.length === 1 &&
          results[0].name.toLowerCase() === lastTerm.toLowerCase()
        ) {
          manageSuggestions([]); // Si coincide exactamente, ocultamos sugerencias
        } else {
          manageSuggestions(results);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Error fetching autocomplete suggestions:", err);
        }
      });
  }

  // Función para agregar un tag seleccionado desde sugerencias
  function handleSelectSuggestion(suggestion: TagInfo) {
    const terms = parseTagsFromString(searchText); // Obtenemos los términos actuales
    terms[terms.length - 1] = suggestion.name; // Reemplazamos solo el último término escrito

    setSelectedTags(terms); // Actualizamos los tags seleccionados
    setSearchText(terms.join(", ") + ", "); // Actualizamos el input

    manageSuggestions([]); // Limpiamos sugerencias

    // Volvemos a enfocar el input para que el usuario siga escribiendo fluido
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }

  function manageSuggestions(results: TagInfo[]) {
    setSuggestions(results);

    setActiveSuggestionIndex(-1); // Reset al moverse entre sugerencias nuevas

    if (!searchInputDivRef.current || !suggestionsDiv.current) return;

    if (results.length === 0 || !isInputFocused) {
      suggestionsDiv.current.style.display = "none";
      searchInputDivRef.current.classList.add("no-suggestions");
    } else {
      suggestionsDiv.current.style.display = "block";
      searchInputDivRef.current.classList.remove("no-suggestions");
    }
  }

  // Función para aplicar el filtro de imágenes redirigiendo mediante la URL
  function applyFilters(tags?: string[]) {
    const tagsToUse = tags ?? selectedTags;
    console.log("Tags a usar:", tagsToUse);
    
    const tagsStr = tagsToUse.join(", ");
    setRandomImages([]);
    setRandomCount(0);
    manageSuggestions([]);

    // Redirigir a la página 1 con el nuevo término de búsqueda en la URL
    router.push(`/?page=1&search=${encodeURIComponent(tagsStr)}`);
  }

  // Función para manejar el "Enter" en el input (aplica filtros)
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        return nextIndex >= suggestions.length ? 0 : nextIndex;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex((prevIndex) => {
        const nextIndex = prevIndex - 1;
        return nextIndex < 0 ? suggestions.length - 1 : nextIndex;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (
        activeSuggestionIndex >= 0 &&
        activeSuggestionIndex < suggestions.length
      ) {
        handleSelectSuggestion(suggestions[activeSuggestionIndex]);
      } else {
        applyFilters();
      }
    }
  }

  function showRandomImages() {
    const shuffled = [...filteredImages].sort(() => Math.random() - 0.5);
    const count = Math.min(randomCount, shuffled.length);
    const selected = shuffled.slice(0, count);
    setRandomImages(selected);
  }
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

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
    const query = searchParams.get("search") || "";
    fetchImagesPage(currentPage, query);
  }, [currentPage, searchParams, fetchImagesPage]);

  // Manejar navegación con flechas de teclado
  useEffect(() => {
    const handleKeyDown = (e: { key: string }) => {
      const query = searchParams.get("search") || "";
      const queryParam = query ? `&search=${encodeURIComponent(query)}` : "";

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
  }, [currentPage, filteredImages.length, searchParams, router]);
  return (
    <div className="home-page">
      <div className="search-and-random">
        <div className="search-bar">
          <div className="search-input-div" ref={searchInputDivRef}>
            <input
              className="search-input"
              type="text"
              value={searchText}
              ref={inputRef}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => {
                setTimeout(() => {
                  if (!isSelectingSuggestion) {
                    setIsInputFocused(false);
                    manageSuggestions([]); // 👈 También limpiamos sugerencias al salir del input
                  }
                }, 100); // Un pequeño delay para que el click en la sugerencia termine primero
              }}
              placeholder="Escribe tags separados por comas"
            />

            <div
              className="search-icon"
              onClick={() => {
                applyFilters();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>
          <div className="suggestions" ref={suggestionsDiv}>
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.name}
                className={`suggestion-item ${
                  index === activeSuggestionIndex ? "active" : ""
                }`}
                onMouseDown={() => setIsSelectingSuggestion(true)} // <- antes de hacer click
                onClick={() => {
                  handleSelectSuggestion(suggestion);
                  setIsSelectingSuggestion(false); // <- después de seleccionar
                }}
              >
                <span>{getIconForType(suggestion.type)} </span>{" "}
                {/* Muestra el icono */}
                <span>
                  {suggestion.name} <small>({suggestion.count})</small>
                </span>{" "}
                {/* Muestra el nombre del tag */}
              </div>
            ))}
          </div>
        </div>
        <div className="random-count">
          <label>
            Imágenes aleatorias:
            <input
              type="number"
              className="random-input"
              min="0"
              max={filteredImages.length}
              value={randomCount}
              onChange={(e) => setRandomCount(Number(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  showRandomImages();
                }
              }}
              placeholder="Cantidad"
            />
          </label>
        </div>
      </div>
      {error ? <div className="error-message">{error}</div> : <></>}
      {/* Galería con Masonry */}
      {isClient && (
        <div className="masonry-grid">
          <Masonry
            key={`masonry-${masonryKey}`}
            items={currentImages}
            columnGutter={5}
            columnWidth={230}
            overscanBy={2}
            render={renderImage}
          />
        </div>
      )}
      <div className="pagination-controls">
        <button
          onClick={() => {
            const query = searchParams.get("search") || "";
            const queryParam = query ? `&search=${encodeURIComponent(query)}` : "";
            router.push(`/?page=${Math.max(currentPage - 1, 1)}${queryParam}`);
          }}
          disabled={currentPage === 1}
        >
          ⬅ Anterior
        </button>
        <span>Página {currentPage}</span>
        <button
          onClick={() => {
            const query = searchParams.get("search") || "";
            const queryParam = query ? `&search=${encodeURIComponent(query)}` : "";
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

export default function HomePage() {
  return (
    <Suspense fallback={<div className="loading-fallback">Cargando aplicación...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
