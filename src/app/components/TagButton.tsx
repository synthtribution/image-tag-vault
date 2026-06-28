interface TagButtonProps {
  name: string;
  count: number;
}

export default function TagButton({ name, count }: TagButtonProps) {
  return (
    <div className="tag-button">
      {name} ({count})
    </div>
  );
}
