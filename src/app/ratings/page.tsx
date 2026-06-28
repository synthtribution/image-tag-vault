"use client";

import TagList from "../components/TagList";
import { useDataContext } from "../contexts/DataContext";

export default function TagsPage() {
  const { tagsIndex } = useDataContext();

  return <TagList tags={tagsIndex} filterType="rating" />;
}