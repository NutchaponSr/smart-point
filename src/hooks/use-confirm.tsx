"use client";

import { JSX, useState } from "react";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const useConfirm = ({
  title,
}: {
  title?: string;
}): [() => JSX.Element, () => Promise<unknown>] => {
  const [promise, setPromise] = useState<{ resolve: (value: boolean) => void } | null>(null);

  const confirmStart = () => new Promise((resolve) => {
    setPromise({ resolve });
  });

  const handleClose = () => {
    setPromise(null);
  }

  const handleConfirm = () => {
    promise?.resolve(true);
    handleClose();
  }

  const handleCancel = () => {
    promise?.resolve(false);
    handleClose();
  }

  const ConfirmationDialog = () => (
    <Dialog open={promise !== null} modal={false}>
      <DialogContent showCloseButton={false}>
        <DialogHeader className="flex flex-col relative gap-2 items-center w-full">
          <DialogTitle>
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col w-full space-y-1.5">
          <Button variant="destructive" onClick={handleConfirm}>
            ยืนยัน
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            ยกเลิก
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return [ConfirmationDialog, confirmStart];
}