import { AuthCard } from "@/components/auth/fields";
import { ResetForm } from "@/components/auth/RecoveryForms";

export const metadata = { title: "Choose a new password | HandyCorp" };

export default function Page() {
  return (
    <AuthCard title="Choose a new password" intro="Use the link from your email to get here, then set a new password.">
      <ResetForm />
    </AuthCard>
  );
}
