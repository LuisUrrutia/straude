export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Straude",
  url: "https://straude.com",
  description:
    "Strava for Claude Code. Track your AI-assisted coding sessions, share your wins, and compete on the leaderboard.",
};

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Straude",
  legalName: "Pacific Systems, Inc.",
  url: "https://straude.com",
  logo: "https://straude.com/icon.svg",
  description:
    "Strava for Claude Code. Track your AI-assisted coding sessions, share your wins, and compete on the leaderboard.",
  email: "hey@straude.com",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "hey@straude.com",
    url: "https://straude.com/contact",
    availableLanguage: "English",
  },
  address: {
    "@type": "PostalAddress",
    addressCountry: "US",
  },
  sameAs: ["https://github.com/ohong/straude"],
};

export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
