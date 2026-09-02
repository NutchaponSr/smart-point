import { AuthLayout } from "@/modules/auth/ui/layouts/auth-layout";

const Layout = (props: LayoutProps<"/[locale]/auth">) => {
  return <AuthLayout>{props.children}</AuthLayout>;
};

export default Layout;
