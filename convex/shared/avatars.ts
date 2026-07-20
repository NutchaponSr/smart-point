/** Animal avatars served from `/public`. Stored as Better Auth `user.image` paths. */
export const AVATAR_IDS = [
  "bear",
  "buffalo",
  "chick",
  "chicken",
  "cow",
  "crocodile",
  "dog",
  "duck",
  "elephant",
  "frog",
  "giraffe",
  "goat",
  "gorilla",
  "hippo",
  "horse",
  "monkey",
  "moose",
  "narwhal",
  "owl",
  "panda",
  "parrot",
  "penguin",
  "pig",
  "rabbit",
  "rhino",
  "sloth",
  "snake",
  "walrus",
  "whale",
  "zebra",
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

export const DEFAULT_AVATAR_ID: AvatarId = "chick";

export function avatarPath(id: AvatarId): string {
  return `/${id}.png`;
}

export const ALLOWED_AVATAR_PATHS = AVATAR_IDS.map(avatarPath);

export function isAllowedAvatarPath(
  image: string | null | undefined,
): image is string {
  if (image == null || image === "") return false;
  return (ALLOWED_AVATAR_PATHS as readonly string[]).includes(image);
}

export function resolveAvatarSrc(
  image: string | null | undefined,
): string {
  if (isAllowedAvatarPath(image)) return image;
  return avatarPath(DEFAULT_AVATAR_ID);
}
