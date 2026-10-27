import { requireUser } from "@/lib/auth";
import { formOptions } from "@/lib/options";
import { Card, PageHeader } from "@/components/ui";
import { ScheduleForm } from "@/components/schedule-form";
import { createSchedule } from "../actions";

export default async function NewSchedulePage() {
  await requireUser("ADMIN");
  return (
    <>
      <PageHeader title="New schedule" back="/schedules" />
      <Card><ScheduleForm action={createSchedule} options={await formOptions()} submitLabel="Create schedule" /></Card>
    </>
  );
}
