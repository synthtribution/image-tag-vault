"use client";

import { useRouter } from "next/navigation";
import { TagInfo } from "../types";

interface TagListProps {
  tags: TagInfo[];
  filterType: "tag" | "character" | "rating";
}

export default function TagList({ tags, filterType }: TagListProps) {
  const router = useRouter();

  const filteredTags = tags
    .filter((tag) => tag.type === filterType)
    .sort((a, b) => b.count - a.count);

  const handleTagClick = (tagName: string) => {
    router.push(`/?search=${encodeURIComponent(tagName)}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-center capitalize">
        {filterType}s
      </h1>
      <div className="mx-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 ">
        {filteredTags.map((tag) => (
          <button
            key={tag.name}
            onClick={() => handleTagClick(tag.name)}
            className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-sm rounded-md p-2 shadow transition-transform hover:scale-125"
          >
            {`${tag.name.replaceAll("_", " ")} (${tag.count})`}
          </button>
        ))}
      </div>
    </div>
  );
}
