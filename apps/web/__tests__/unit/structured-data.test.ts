import { describe, expect, it } from "vitest";
import { organizationJsonLd } from "@/lib/structured-data";

describe("organization structured data", () => {
  it("publishes honest contact and country-level address details", () => {
    expect(organizationJsonLd.contactPoint).toMatchObject({
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "hey@straude.com",
    });
    expect(organizationJsonLd.address).toEqual({
      "@type": "PostalAddress",
      addressCountry: "US",
    });
    expect(organizationJsonLd.legalName).toBe("Pacific Systems, Inc.");
    expect(organizationJsonLd).not.toHaveProperty("telephone");
    expect(organizationJsonLd.address).not.toHaveProperty("streetAddress");
  });
});
