import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";

export const metadata: Metadata = {
  title: "Contact Straude",
  description:
    "Contact Straude for product support, account help, privacy requests, security reports, press, and partnerships.",
  alternates: { canonical: "/contact" },
  openGraph: {
    url: "/contact",
    title: "Contact Straude",
    description:
      "How to reach Straude for product, privacy, security, press, and partnership questions.",
  },
};

export default function ContactPage() {
  return (
    <>
      <Navbar variant="light" />
      <main id="main-content" className="bg-background py-32 text-foreground md:py-40">
        <article className="mx-auto max-w-2xl px-6 md:px-8">
          <p className="font-mono text-sm uppercase text-muted">Contact</p>
          <h1 className="mt-4 text-balance text-3xl font-bold md:text-4xl">
            Talk to Straude.
          </h1>
          <div className="mt-10 space-y-8 text-pretty text-[0.9375rem] leading-relaxed text-foreground/80">
            <section className="rounded-lg border border-border bg-subtle p-6">
              <h2 className="text-balance text-xl font-bold text-foreground">
                Email support
              </h2>
              <p className="mt-3">
                Write to{" "}
                <a
                  className="text-accent underline underline-offset-2 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  href="mailto:hey@straude.com"
                >
                  hey@straude.com
                </a>{" "}
                for product questions, account help, privacy requests, data
                access or deletion requests, security coordination, press
                inquiries, and partnerships. Support is handled asynchronously
                by email.
              </p>
            </section>

            <section>
              <h2 className="text-balance text-xl font-bold text-foreground">
                Help us find the right context
              </h2>
              <p className="mt-3">
                Include the Straude username, public profile URL, CLI version,
                and a short description of what you expected and what happened
                when those details are safe to share. Never email passwords,
                authentication tokens, private prompts, source code, customer
                data, or other secrets. For CLI problems, command output with
                home-directory paths and tokens removed is usually enough to
                begin investigating.
              </p>
            </section>

            <section>
              <h2 className="text-balance text-xl font-bold text-foreground">
                Security reports
              </h2>
              <p className="mt-3">
                Use a clear subject such as “Security report” and provide
                reproducible steps without accessing or sending data that does
                not belong to you. Review the published{" "}
                <a
                  className="text-accent underline underline-offset-2 hover:no-underline"
                  href="/.well-known/security.txt"
                >
                  security policy
                </a>{" "}
                for the current reporting address and disclosure guidance.
              </p>
            </section>

            <section>
              <h2 className="text-balance text-xl font-bold text-foreground">
                Before you write
              </h2>
              <p className="mt-3">
                The CLI reference covers installation, login, syncing, dry runs,
                automatic pushes, and troubleshooting. The privacy policy
                explains the data Straude can and cannot access. Agents can also
                consult the machine-readable instructions and sitemap before
                asking for navigation help.
              </p>
              <nav aria-label="Support resources" className="mt-4 flex flex-wrap gap-4 font-mono text-sm">
                <Link className="text-accent underline underline-offset-2 hover:no-underline" href="/cli">
                  CLI reference
                </Link>
                <Link className="text-accent underline underline-offset-2 hover:no-underline" href="/privacy">
                  Privacy policy
                </Link>
                <a className="text-accent underline underline-offset-2 hover:no-underline" href="/llms.txt">
                  Agent instructions
                </a>
              </nav>
            </section>

            <p>
              Straude is operated by Pacific Systems, Inc. d/b/a Straude in the
              United States.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
