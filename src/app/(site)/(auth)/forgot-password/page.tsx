import { AuthCard } from "@/components/auth/fields";
import { ForgotForm } from "@/components/auth/RecoveryForms";

export const metadata = { title: "Forgot your password? | HandyCorp" };

export default function Page() {
  return (
    <AuthCard title="Forgot your password?" intro="Enter your email and we'll send you instructions to reset it.">
      <ForgotForm />
    </AuthCard>
  );
}
