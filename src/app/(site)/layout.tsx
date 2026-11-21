import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

// Shared chrome for every public page.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
