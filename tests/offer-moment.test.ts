import { describe, expect, it } from "vitest";
import type { Stage } from "@/generated/prisma/enums";
import { offerMoment } from "@/lib/domain/offers";

const app = (id: string, company: string, stage: Stage) => ({ id, company, stage });

describe("offerMoment", () => {
  it("is null when there is no offer", () => {
    expect(offerMoment([app("a", "Pathao", "APPLIED"), app("b", "Therap", "REJECTED")])).toBeNull();
  });

  it("celebrates one offer and links to it", () => {
    expect(offerMoment([app("a", "Pathao", "OFFER"), app("b", "Therap", "APPLIED")])).toMatchObject(
      {
        title: "You have an offer from Pathao. Congratulations!",
        href: "/applications/a",
      },
    );
  });

  it("names several offers and links to the filtered list", () => {
    const moment = offerMoment([
      app("a", "Pathao", "OFFER"),
      app("b", "Shohoz", "OFFER"),
      app("c", "Chaldal", "OFFER"),
    ]);
    expect(moment).toMatchObject({
      title: "You have 3 offers: Pathao, Shohoz and Chaldal. Congratulations!",
      href: "/applications?stage=OFFER",
    });
  });

  it("puts an accepted job ahead of open offers", () => {
    expect(
      offerMoment([app("a", "Pathao", "OFFER"), app("b", "Brain Station 23", "ACCEPTED")]),
    ).toMatchObject({
      title: "You got the job at Brain Station 23. Congratulations!",
      href: "/applications/b",
    });
  });
});
