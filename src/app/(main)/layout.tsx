import { AuthGuard } from "@/modules/auth/ui/components/auth-guard";

const Layout = (props: LayoutProps<"/">) => {
  return (
    <AuthGuard>
      {props.children}
    </AuthGuard>
  );
}

export default Layout;