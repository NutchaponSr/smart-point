interface Props {
  children: React.ReactNode;
}

export const AuthLayout = ({ children }: Props) => {
  return (
    <div className="flex grow shrink basis-0 h-full">
      {children}
      <div className="relative hidden w-[40vw] lg:block border-l-2 bg-pink-300" />
    </div>
  );
}