interface Props {
  title: string;
  children: React.ReactNode;
}

export const AuthScreen = ({ title, children }: Props) => {
  return (
    <div className="relative mt-0 flex w-full max-w-full flex-col items-center px-0 text-center">
      <h1 className="mb-5 max-w-full text-balance text-xl font-extrabold leading-snug text-[#0b4ea2] sm:mb-8 sm:text-[1.75rem] landscape:max-lg:mb-3 landscape:max-lg:text-lg">
        {title}
      </h1>

      <div className="w-full">{children}</div>
    </div>
  );
};
