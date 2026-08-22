"use client";

import React, { useState, useEffect, useRef } from "react";
import { TagInfo } from "../types";
import { parseTagsFromString } from "../utils/parseTags";
import { getIconForType } from "../utils/getIconForType";

interface SearchBarProps {
  initialValue: string;
  onSearch: (tags: string[]) => void;
}

export default function SearchBar({ initialValue, onSearch }: SearchBarProps) {
  const [searchText, setSearchText] = useState(initialValue); // Texto que el usuario escribe
  const [suggestions, setSuggestions] = useState<TagInfo[]>([]); // Sugerencias de autocompletado
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // Tags seleccionados para el filtro
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const [isSelectingSuggestion, setIsSelectingSuggestion] = useState(false);

  const searchInputDivRef = useRef<HTMLDivElement | null>(null);
  const suggestionsDiv = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const suggestionsAbortControllerRef = useRef<AbortController | null>(null);

  // Sincronizar el input si el valor inicial (leído de la URL) cambia desde el exterior
  useEffect(() => {
    setSearchText(initialValue);
    setSelectedTags(parseTagsFromString(initialValue));
  }, [initialValue]);

  // Manejar visibilidad del div de sugerencias
  useEffect(() => {
    if (suggestionsDiv.current) {
      if (!isInputFocused) {
        suggestionsDiv.current.style.display = "none";
      } else if (suggestions.length > 0) {
        suggestionsDiv.current.style.display = "block";
      }
    }
  }, [isInputFocused, suggestions]);

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
    setSelectedTags(terms);

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

    const newTags = [...terms];
    setSelectedTags(newTags);
    setSearchText(newTags.join(", ") + ", "); // Actualizamos el input

    manageSuggestions([]); // Limpiamos sugerencias

    // Volvemos a enfocar el input para que el usuario siga escribiendo fluido
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
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
        onSearch(selectedTags);
      }
    }
  }

  return (
    <div className="search-bar">
      <div className="search-input-div no-suggestions" ref={searchInputDivRef}>
        <input
          className="search-input"
          type="text"
          value={searchText}
          ref={inputRef}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => {
            setTimeout(() => {
              if (!isSelectingSuggestion) {
                setIsInputFocused(false);
                manageSuggestions([]);
              }
            }, 100);
          }}
          placeholder="Escribe tags separados por comas"
        />

        <div
          className="search-icon"
          onClick={() => {
            onSearch(selectedTags);
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
            key={`${suggestion.type}-${suggestion.name}`}
            className={`suggestion-item ${
              index === activeSuggestionIndex ? "active" : ""
            }`}
            onMouseDown={() => setIsSelectingSuggestion(true)}
            onClick={() => {
              handleSelectSuggestion(suggestion);
              setIsSelectingSuggestion(false);
            }}
          >
            <span>{getIconForType(suggestion.type)} </span>{" "}
            <span>
              {suggestion.name} <small>({suggestion.count})</small>
            </span>{" "}
          </div>
        ))}
      </div>
    </div>
  );
}
