import { SignupPage } from "@/components/auth/AuthPage";

export const metadata = { title: "Register as a professional | HandyCorp" };

export default function Page({ searchParams }: PageProps<"/professional/signup">) {
  return <SignupPage role="professional" searchParams={searchParams} />;
}
