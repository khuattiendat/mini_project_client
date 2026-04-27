import "./RichContent.css";

interface RichContentProps {
  html: string;
  className?: string;
}

export function RichContent({ html, className = "" }: RichContentProps) {
  return (
    <div
      className={`rich-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
