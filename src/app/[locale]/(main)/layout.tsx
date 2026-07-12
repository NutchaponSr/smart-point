import { AuthGuard } from "@/modules/auth/ui/components/auth-guard";

import { MobileNavigations } from "./mobile-navigations";
import { Sidebar } from "./sidebar";

const Layout = (props: LayoutProps<"/[locale]">) => {
  return (
    <AuthGuard>
      <div className="min-h-screen md:pl-64">
        <Sidebar />
        <MobileNavigations />
        <div className="pt-14 md:pt-0">{props.children}</div>
      </div>
    </AuthGuard>
  );
};

export default Layout;
