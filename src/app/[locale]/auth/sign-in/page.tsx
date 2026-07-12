import { SignInView } from "@/modules/auth/ui/views/sign-in-view";
import { AuthScreen } from "@/modules/auth/ui/screens/auth-screen";

const SignInPage = () => {
  return (
    <AuthScreen title="เข้าสู่ระบบ">
      <SignInView />
    </AuthScreen>
  );
}

export default SignInPage;