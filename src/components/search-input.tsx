import { GoSearch } from "react-icons/go";
import { BsFillXCircleFill } from "react-icons/bs";

interface Props {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

export const SearchInput = ({ value, placeholder, onChange }: Props) => {
  return (
    <div className="min-w-0 grow">
      <div className="relative flex-1">
        <div className="inline-flex items-center w-full gap-2 relative py-0 px-4 h-12 min-h-12 border-2 border-border rounded-xs bg-background text-foreground focus-within:outline-2 focus-within:outline-purple focus-within:outline-offset-0 [&>.icon]:text-primary">
          <GoSearch className="size-5 shrink-0 stroke-[0.3]" />
          <input 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="font-[inherit] py-3 px-4 text-base leading-snug text-foreground border border-border rounded block w-full placeholder:text-muted-foreground focus:outline-2 focus:outline-purple focus:outline-offset-0 disabled:cursor-not-allowed disabled:opacity-30 border-none flex-1 bg-transparent shadow-none outline-none -mx-4 max-w-none cursor-text!"
          />
          <div 
            role="button" 
            data-show={!!value}
            className="items-center justify-center gap-0 size-6 rounded-full text-sm font-medium whitespace-nowrap leading-[1.2] text-tertiary shrink-0 grow-0 -me-1 hover:bg-muted data-[show=true]:inline-flex hidden"
            onClick={(e) => {
              e.stopPropagation();

              onChange("");
            }}
          >
            <BsFillXCircleFill className="size-4 block text-icon-tertiary shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}