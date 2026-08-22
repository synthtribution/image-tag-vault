"use client";

import { useEffect, useState } from "react";
import TagList from "../components/TagList";
import { TagInfo } from "../types";

export default function TagsPage() {
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const imageUrl = process.env.NEXT_PUBLIC_IMAGE_URL || "http://localhost:3001/imagenes/";
    let apiUrl = "http://localhost:3001";
    try {
      apiUrl = new URL(imageUrl).origin;
    } catch {}

    fetch(`${apiUrl}/api/tags?all=true&type=tag`)
      .then((res) => {
        if (!res.ok) throw new Error("Error loading tags");
        return res.json();
      })
      .then((data) => {
        setTags(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching tags:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando etiquetas...</div>;
  }

  return <TagList tags={tags} filterType="tag" />;
}
