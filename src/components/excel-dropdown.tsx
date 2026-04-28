import { useRef } from "react";
import { GoFileSymlinkFile } from "react-icons/go";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Props {
  onImport?: (file: File) => Promise<void>;
  onExport?: () => void;
}

export const ExcelDropdown = ({
  onImport,
  onExport,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    await onImport?.(file);
    e.target.value = "";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="elevated" size="iconLg">
          <GoFileSymlinkFile className="size-5 stroke-[0.25]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <input 
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls"
          className="sr-only"
          onChange={onFileChange}
        />
        {onImport && (
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              fileInputRef.current?.click();
            }}
          >
            นำเข้า Excel
          </DropdownMenuItem>
        )}
        {onExport && (
          <DropdownMenuItem onSelect={onExport}>
            ดาวน์โหลด Excel
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}