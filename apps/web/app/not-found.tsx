import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";

const RECOVERY_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Straude" },
  { href: "/contact", label: "Contact" },
  { href: "/llms.txt", label: "Agent instructions" },
  { href: "/sitemap.xml", label: "Sitemap" },
];

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Navbar variant="light" />
      <main id="main-content" className="flex flex-1 items-center px-6 py-32 md:px-8">
        <section className="mx-auto w-full max-w-2xl">
          <p className="font-mono text-sm uppercase text-accent">404 / Off course</p>
          <h1 className="mt-4 text-balance text-4xl font-bold md:text-5xl">
            This page could not be found.
          </h1>
          <p className="mt-5 max-w-xl text-pretty leading-relaxed text-foreground/80">
            The route may have moved or never existed. Return to the starting
            line, browse the public index, or contact Straude if a link brought
            you here unexpectedly.
          </p>
          <nav aria-label="Page recovery" className="mt-8">
            <ul className="flex flex-wrap gap-x-6 gap-y-3 font-mono text-sm">
              {RECOVERY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-accent underline underline-offset-4 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </section>
      </main>
      <Footer />
    </div>
  );
}
