import { Suspense } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

// Shared chrome for every public page.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* The header reads the current path, which pages with dynamic addresses only know at request time. */}
      <Suspense fallback={<div className="h-16 border-b border-ink/10 md:h-20" aria-hidden="true" />}>
        <Navbar />
      </Suspense>
      {children}
      <Footer />
    </>
  );
}
