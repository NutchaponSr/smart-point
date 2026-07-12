import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface Props {
  value: string;
  placeholder: string;
  className?: {
    container?: string;
    input?: string;
    placeholder?: string;
  };
  onChange: (value: string) => void;
  onBlur?: () => void;
}

export default function ElementEditable({ value, placeholder, className, onChange, onBlur }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className={cn("relative p-6 border-2 border-border rounded-xs bg-background", className?.container)}>
      {!isEditing && !value && (
        <div className={cn("absolute top-6 left-6 text-sm text-muted-foreground pointer-events-none select-none", className?.placeholder)}>
          {placeholder}
        </div>
      )}

      <div 
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        onInput={(e) => onChange(e.currentTarget.textContent ?? "")}
        onFocus={() => setIsEditing(true)}
        onBlur={() => {
          setIsEditing(false);
          onBlur?.();
        }}
        className={cn(
          "w-full min-h-16 outline-none focus:outline-none focus-visible:outline-none leading-relaxed text-sm transition-all duration-200",
          className?.input
        )}
        suppressContentEditableWarning
        contentEditable
      />
    </div>
  );
}