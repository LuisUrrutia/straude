import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";

export const metadata: Metadata = {
  title: "About Straude",
  description:
    "Learn how Straude turns aggregate AI coding activity into a privacy-first training log for builders.",
  alternates: { canonical: "/about" },
  openGraph: {
    url: "/about",
    title: "About Straude",
    description:
      "A privacy-first training log for developers who build with coding agents.",
  },
};

export default function AboutPage() {
  return (
    <>
      <Navbar variant="light" />
      <main id="main-content" className="bg-background py-32 text-foreground md:py-40">
        <article className="mx-auto max-w-2xl px-6 md:px-8">
          <p className="font-mono text-sm uppercase text-muted">About Straude</p>
          <h1 className="mt-4 text-balance text-3xl font-bold md:text-4xl">
            A training log for people who build with coding agents.
          </h1>
          <div className="mt-10 space-y-8 text-pretty text-[0.9375rem] leading-relaxed text-foreground/80">
            <section>
              <h2 className="text-balance text-xl font-bold text-foreground">
                Make the work visible
              </h2>
              <p className="mt-3">
                Straude helps developers understand the rhythm, volume, and
                estimated cost of AI-assisted coding. It turns aggregate daily
                activity into a useful training log: token totals, model usage,
                spend, session counts, streaks, public profiles, and community
                leaderboards. The goal is not to reward one giant day. It is to
                make sustained practice legible, so builders can notice their
                pace and keep showing up.
              </p>
            </section>

            <section>
              <h2 className="text-balance text-xl font-bold text-foreground">
                Measure activity, not the work itself
              </h2>
              <p className="mt-3">
                The data boundary is intentionally narrow. Straude does not need
                your prompts, conversations, source code, or file contents. The
                open-source CLI reads supported local usage logs, aggregates
                them into daily totals, and sends only those totals when you
                choose to sync. You can run a dry run first to collect usage
                without submitting it. That architecture lets Straude provide
                accountability and community without becoming a code-analysis
                or employee-monitoring system.
              </p>
            </section>

            <section>
              <h2 className="text-balance text-xl font-bold text-foreground">
                Know what the numbers mean
              </h2>
              <p className="mt-3">
                Straude totals are estimates derived from supported local logs
                and pricing data. They are useful for understanding direction,
                comparing periods, and sharing proof of sustained practice, but
                they are not authoritative provider invoices. Public community
                statistics are also a self-selected sample of people who use and
                successfully sync Straude.
              </p>
            </section>

            <section className="rounded-lg border border-border bg-subtle p-6">
              <h2 className="text-balance text-xl font-bold text-foreground">
                Company
              </h2>
              <p className="mt-3">
                Straude is operated by Pacific Systems, Inc. d/b/a Straude in
                the United States. Product, account, privacy, security, press,
                and partnership questions can be sent to{" "}
                <a
                  className="text-accent underline underline-offset-2 hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  href="mailto:hey@straude.com"
                >
                  hey@straude.com
                </a>
                .
              </p>
            </section>

            <nav aria-label="About Straude resources" className="flex flex-wrap gap-4 font-mono text-sm">
              <Link className="text-accent underline underline-offset-2 hover:no-underline" href="/cli">
                CLI reference
              </Link>
              <Link className="text-accent underline underline-offset-2 hover:no-underline" href="/privacy">
                Privacy policy
              </Link>
              <Link className="text-accent underline underline-offset-2 hover:no-underline" href="/contact">
                Contact
              </Link>
            </nav>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
