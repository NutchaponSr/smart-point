import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { EmployeeInfoView } from "@/modules/employee/ui/views/employee-info-view";

import { Id } from "../../../../../../../convex/functions/_generated/dataModel";

interface Props {
  params: Promise<{ employeeId: string }>;
}

const Page = async ({ params }: Props) => {
  const { employeeId } = await params;

  prefetch(crpc.employee.getOne.queryOptions({ employeeId: employeeId as Id<"employee"> }));

  return (
    <HydrateClient>
      <EmployeeInfoView employeeId={employeeId as Id<"employee">} />
    </HydrateClient>
  );
}

export default Page;