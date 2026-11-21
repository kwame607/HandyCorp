import { LoginPage } from "@/components/auth/AuthPage";

export const metadata = { title: "Professional sign in | HandyCorp" };

export default function Page({ searchParams }: PageProps<"/professional/login">) {
  return <LoginPage audience="professional" searchParams={searchParams} />;
}
