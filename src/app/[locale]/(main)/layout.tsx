import { AuthGuard } from "@/modules/auth/ui/components/auth-guard";

import { Sidebar } from "./sidebar";

const Layout = (props: LayoutProps<"/[locale]">) => {
  return (
    <AuthGuard>
      <div className="flex h-screen flex-col lg:flex-row">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-y-auto bg-[#f4f4f0]">
          {props.children}
        </main>
      </div>
    </AuthGuard>
  );
}

export default Layout;