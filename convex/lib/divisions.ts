/** Canonical division slugs — keep in sync with src/modules/employee/constants.ts */
export const DIVISION_SLUGS = [
  "SAT",
  "SDS",
  "SBM",
  "ICP1",
  "ICP2",
  "SFT1",
  "SFT2",
  "SFT3",
  "SAA",
] as const;

export type DivisionSlug = (typeof DIVISION_SLUGS)[number];

export const VALID_DIVISION_SLUGS = new Set<string>(DIVISION_SLUGS);

export const BU_RESTRICTED_CATEGORIES = [
  "internal_bu",
  "specials_point",
] as const;

export type BuRestrictedCategory = (typeof BU_RESTRICTED_CATEGORIES)[number];

export function isBuRestrictedCategory(
  category: string,
): category is BuRestrictedCategory {
  return (BU_RESTRICTED_CATEGORIES as readonly string[]).includes(category);
}
