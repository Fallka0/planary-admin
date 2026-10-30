"use client";

import { Inbox } from "@/components/console/Inbox";
import { Gate } from "@/components/console/Shell";

export default function SupportPage() {
  return (
    <Gate areas={["support"]}>
      <Inbox />
    </Gate>
  );
}
