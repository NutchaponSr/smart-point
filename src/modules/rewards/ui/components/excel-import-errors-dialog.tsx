"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ValidationError } from "@/types/excel";

interface Props {
  errors: ValidationError[];
  onClose: () => void;
}

export function ExcelImportErrorsDialog({ errors, onClose }: Props) {
  return (
    <Dialog open={errors.length > 0} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>รายการที่นำเข้าไม่สำเร็จ ({errors.length})</DialogTitle>
        </DialogHeader>
        <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
          {errors.map((err, index) => (
            <li key={`${err.row}-${err.field}-${index}`}>
              แถว {err.row}
              {err.field ? ` (${err.field})` : ""}: {err.message}
              {err.value != null ? ` — ${String(err.value)}` : ""}
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button onClick={onClose}>ปิด</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
