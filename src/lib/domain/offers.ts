import type { Stage } from "@/generated/prisma/enums";

export type OfferMoment = { title: string; body: string; href: string };

type OfferApplication = { id: string; company: string; stage: Stage };

const joinNames = (names: string[]) =>
  names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;

/**
 * The dashboard's lasting celebration: an accepted job first, otherwise the open offers.
 * Null when there is nothing to celebrate, so the banner simply isn't there.
 */
export function offerMoment(applications: readonly OfferApplication[]): OfferMoment | null {
  const accepted = applications.find((app) => app.stage === "ACCEPTED");
  if (accepted) {
    return {
      title: `You got the job at ${accepted.company}. Congratulations!`,
      body: "All that tracking paid off. Wishing you a great first day.",
      href: `/applications/${accepted.id}`,
    };
  }

  const offers = applications.filter((app) => app.stage === "OFFER");
  if (offers.length === 0) return null;
  if (offers.length === 1) {
    return {
      title: `You have an offer from ${offers[0].company}. Congratulations!`,
      body: "Take your time. Compare the salary, the team and what you’ll learn before you decide.",
      href: `/applications/${offers[0].id}`,
    };
  }
  return {
    title: `You have ${offers.length} offers: ${joinNames(offers.map((o) => o.company))}. Congratulations!`,
    body: "A good problem to have. Compare them side by side before you decide.",
    href: "/applications?stage=OFFER",
  };
}
