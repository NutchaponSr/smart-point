import { getTranslations } from "next-intl/server";

import { SignInView } from "@/modules/auth/ui/views/sign-in-view";
import { AuthScreen } from "@/modules/auth/ui/screens/auth-screen";

const SignInPage = async () => {
  const t = await getTranslations("auth");

  return (
    <AuthScreen title={t("sign-in.title")}>
      <SignInView />
    </AuthScreen>
  );
};

export default SignInPage;
