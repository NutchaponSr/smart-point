import { Button } from "@/components/ui/button";

interface Props {
  activeValue?: string | null;
  values: readonly string[];
  onChange: (value: string) => void;
}

export const Sort = ({ activeValue, values, onChange }: Props) => {
  return (
    <div className="flex items-center gap-2">
      {values.map((value, index) => (
        <Button
          variant={value === activeValue ? "primary" : "secondary"}
          size="smRounded"
          key={index}
          className="capitalize"
          onClick={() => {
            onChange(value);
          }}
        >
          {value}
        </Button>
      ))}
    </div>
  );
};
