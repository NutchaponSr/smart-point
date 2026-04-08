import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface Props {
  value: string;
  placeholder: string;
  className?: string;
  onChange: (value: string) => void;
}

export default function ElementEditable({ value, placeholder, className, onChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="relative p-6 border-2 border-border rounded-xs bg-background">
      {!isEditing && !value && (
        <div className="absolute top-6 left-6 text-sm text-muted-foreground pointer-events-none select-none">
          {placeholder}
        </div>
      )}

      <div 
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        onInput={(e) => onChange(e.currentTarget.textContent)}
        onFocus={() => setIsEditing(true)}
        onBlur={() => setIsEditing(false)}
        className={cn(
          "w-full min-h-16 outline-none focus:outline-none focus-visible:outline-none leading-relaxed text-sm transition-all duration-200",
          className
        )}
        suppressContentEditableWarning
        contentEditable
      />
    </div>
  );
}