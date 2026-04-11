import { create } from "zustand";

import type { Id } from "../../../../convex/functions/_generated/dataModel";

type ReviewReward = {
  _id: Id<"reward">;
  image?: string;
  name: string;
};

interface ReviewStore {
  redemptionId: Id<"redemption"> | null;
  reward: ReviewReward | null;
  isOpen: boolean;
  onOpen: (payload: {
    redemptionId: Id<"redemption">;
    reward: ReviewReward;
  }) => void;
  onClose: () => void;
}

export const useReviewStore = create<ReviewStore>((set) => ({
  redemptionId: null,
  reward: null,
  isOpen: false,
  onOpen: ({ redemptionId, reward }) =>
    set({ isOpen: true, redemptionId, reward }),
  onClose: () =>
    set({ isOpen: false, redemptionId: null, reward: null }),
}));