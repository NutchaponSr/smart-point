import {
  createLoader,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

export const donationAdminFilterSearchParams = {
  q: parseAsString.withDefault(""),
  min: parseAsInteger.withDefault(0),
  max: parseAsInteger.withDefault(0),
  from: parseAsInteger,
  to: parseAsInteger,
  limit: parseAsInteger.withDefault(25),
  page: parseAsInteger.withDefault(0),
};

export const loadDonationAdminFilters = createLoader(
  donationAdminFilterSearchParams,
);
