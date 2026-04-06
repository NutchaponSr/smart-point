import { AuthGuard } from "@/modules/auth/ui/components/auth-guard";

import { Header } from "./header";

const Layout = (props: LayoutProps<"/[locale]">) => {
  return (
    <AuthGuard>
      <div className="flex flex-col h-full overflow-x-hidden">
        <Header />
        <div className="h-full w-full bg-[#f4f4f0]">
          {props.children}
        </div>
      </div>
    </AuthGuard>
  );
}

export default Layout;