import { AuthGuard } from "@/modules/auth/ui/components/auth-guard";

import { Header } from "./header";

const Layout = (props: LayoutProps<"/[locale]">) => {
  return (
    <AuthGuard>
      <div className="flex-1 flex flex-col lg:h-screen overflow-y-auto">
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="overflow-hidden">
            <div className="bg-[#f4f4f0] min-h-screen">
              {props.children}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

export default Layout;