import Footer from "@/components/Footer";
import HeroVisual from "@/components/HeroVisual";
import Navbar from "@/components/Navbar";
import SearchBox from "@/components/SearchBox";
import {
  HowItWorks,
  PopularServices,
  ProfessionalCTA,
  Trust,
} from "@/components/Sections";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 md:pb-24 md:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-6">
            <div>
              <h1
                className="hero-rise font-display text-[2.75rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl"
                style={{ animationDelay: "0s" }}
              >
                Find the right professional.
                <br />
                Get the job done.
              </h1>
              <p
                className="hero-rise mt-6 max-w-lg text-lg leading-relaxed text-slate md:text-xl"
                style={{ animationDelay: "0.1s" }}
              >
                From home repairs to personal care, discover trusted local
                professionals ready to help.
              </p>
            </div>
            <div className="lg:pl-6">
              <HeroVisual />
            </div>
          </div>

          <div
            className="hero-rise mt-10 md:mt-14 lg:max-w-4xl"
            style={{ animationDelay: "0.2s" }}
          >
            <SearchBox />
          </div>
        </section>

        <PopularServices />
        <HowItWorks />
        <Trust />
        <ProfessionalCTA />
      </main>
      <Footer />
    </>
  );
}
