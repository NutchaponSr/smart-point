import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { CheckoutView } from "@/modules/cart/ui/views/checkout-view";

const Page = () => {
  prefetch(crpc.cart.getCart.queryOptions());
  prefetch(crpc.reward.getMany.queryOptions());

  return (
    <HydrateClient>
      <CheckoutView />
    </HydrateClient>
  );
}

export default Page;