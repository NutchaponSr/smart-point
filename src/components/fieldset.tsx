interface Props {
  label?: string;
  children: React.ReactNode;
  errorMessage?: string;
  image?: React.ReactNode;
}

export const FieldSet = ({ label, children, errorMessage, image }: Props) => {
  return (
    <fieldset className="flex flex-col border-none gap-2 w-full">
      <legend className="relative mb-2 flex w-full items-center justify-between text-base leading-snug font-bold [&_a]:font-normal">
        <label className="inline-flex cursor-pointer gap-2 font-normal has-disabled:cursor-not-allowed has-disabled:opacity-30 items-center">
          {label}
          {image}
        </label>
      </legend>
      {children}
      <small className="text-destructive text-sm">
        {errorMessage}
      </small>
    </fieldset>
  )
}