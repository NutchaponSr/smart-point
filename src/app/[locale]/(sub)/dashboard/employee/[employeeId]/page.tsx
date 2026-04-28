import { crpc, HydrateClient, prefetch } from "@/lib/convex/rsc";

import { EmployeeInfoView } from "@/modules/employee/ui/views/employee-info-view";

interface Props {
  params: Promise<{ employeeId: string }>;
}

const Page = async ({ params }: Props) => {
  const { employeeId } = await params;

  prefetch(crpc.employee.getOne.queryOptions({ employeeId: employeeId }));

  return (
    <HydrateClient>
      <EmployeeInfoView employeeId={employeeId} />
    </HydrateClient>
  );
}

export default Page;