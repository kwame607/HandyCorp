import { LoginPage } from "@/components/auth/AuthPage";

export const metadata = { title: "Sign In | HandyCorp" };

export default function Page({ searchParams }: PageProps<"/login">) {
  return <LoginPage audience="customer" searchParams={searchParams} />;
}
