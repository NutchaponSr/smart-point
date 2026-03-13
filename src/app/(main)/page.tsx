import { Button } from "@/components/ui/button";
import { preloadQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";
import { Client } from "./client";

const Page = async () => {
  const preloadedEmployees = await preloadQuery(api.employee.getMany)

  return (
    <Client preloadedQuery={preloadedEmployees} />
  );
}

export default Page;