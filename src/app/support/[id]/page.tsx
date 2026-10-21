"use client";

import { use } from "react";
import { Inbox } from "@/components/console/Inbox";
import { Gate } from "@/components/console/Shell";

export default function SupportRequestPage({ params }: PageProps<"/support/[id]">) {
  const { id } = use(params);
  return (
    <Gate areas={["support"]}>
      <Inbox selected={id} />
    </Gate>
  );
}
