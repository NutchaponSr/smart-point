import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

interface Props {
  title: string;
}

export const FormHeader = ({ title }: Props) => {
  const router = useRouter();
  
  return (
    <header className="flex flex-col gap-4 border-b-2 border-border justify-center p-4 md:p-8 h-[82px]">
      <div className="flex min-h-8 items-center justify-between gap-2">
        <h1 className="line-clamp-2 text-2xl hidden! sm:block!">{title}</h1>
        <div className="grid flex-1 grid-cols-2 gap-2 has-[>*:only-child]:grid-cols-1 sm:flex sm:flex-none md:-my-2">
          <Button onClick={() => router.back()} variant="elevated" type="button">
            ยกเลิก
          </Button>
          <Button variant="elevated" className="bg-pink" type="submit">
            บันทึกข้อมูล
          </Button>
        </div>
      </div>
    </header>
  );
}