import { SignupPage } from "@/components/auth/AuthPage";

export const metadata = { title: "Create your account | HandyCorp" };

export default function Page({ searchParams }: PageProps<"/signup">) {
  return <SignupPage role="customer" searchParams={searchParams} />;
}
