interface Props {
  title: string;
  children: React.ReactNode;
}

export const AuthScreen = ({ title, children }: Props) => {
  return (
    <div className="squished-content-x flex flex-col grow shrink basis-0">
      <header className="flex flex-col gap-4 border-b-2 md:p-8 p-8 sm:p-16">
        <h1 className="text-[40px] leading-[1.2]">{title}</h1>
      </header>

      <main className="p-8 sm:p-16">
        {children}
      </main>
    </div>
  );
}