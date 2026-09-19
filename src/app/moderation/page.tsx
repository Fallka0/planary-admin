"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, Skeleton, toast } from "@heroui/react";
import { useStaff } from "@/components/Shell";
import { Avatar, Empty, StatusChip } from "@/components/ui";
import { avatarSrc, type Badge, useAdmin, useAdminAction } from "@/lib/api";
import { chips, date, dateTime } from "@/lib/format";

interface Data {
  avatars: (Badge & { updatedAt: number })[];
  bios: (Badge & { bio: string })[];
  restricted: (Badge & {
    status: string;
    mutedUntil: number | null;
    statusUntil: number | null;
    reason: string | null;
    lossLimit: number | null;
    excludedUntil: number | null;
  })[];
}

export default function ModerationPage() {
  const staff = useStaff();
  const act = useAdminAction();
  const { data } = useAdmin<Data>("/moderation", 30_000);
  const [now] = useState(() => Date.now());

  if (!staff.can("moderate")) return <Empty>Your role doesn&apos;t include moderation.</Empty>;
  if (!data) return <Skeleton className="h-96 rounded-xl" />;

  const remove = (id: string, what: "avatar" | "bio") =>
    void act(`/players/${id}/${what}/remove`).then(
      () => toast(what === "avatar" ? "Picture removed" : "Bio removed", { variant: "success" }),
      (e) => toast(e.message, { variant: "danger" }),
    );

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Moderation</h1>
        <p className="text-default-500">Recent profile pictures and bios, and every account with a restriction.</p>
      </header>

      <Card>
        <Card.Header>
          <Card.Title>Profile pictures</Card.Title>
          <Card.Description>Newest uploads first. Removing one notifies the player.</Card.Description>
        </Card.Header>
        <Card.Content>
          {data.avatars.length === 0 ? (
            <Empty>No pictures uploaded yet.</Empty>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-3">
              {data.avatars.map((a) => (
                <li key={a.id} className="bg-default-100 grid justify-items-center gap-1.5 rounded-xl p-2.5 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarSrc(a.avatar) ?? ""} alt={`${a.name}'s picture`} width={120} height={120} loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
                  <Link href={`/players/${a.id}`} className="truncate text-sm hover:underline">
                    {a.name}
                  </Link>
                  <span className="text-default-500 text-xs">{date(a.updatedAt)}</span>
                  <Button size="sm" variant="danger-soft" onPress={() => remove(a.id, "avatar")}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card.Content>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <Card.Header>
            <Card.Title>Bios</Card.Title>
          </Card.Header>
          <Card.Content>
            {data.bios.length === 0 ? (
              <Empty>No bios yet.</Empty>
            ) : (
              <ul className="divide-default-200 divide-y">
                {data.bios.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 py-2.5">
                    <Avatar player={b} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/players/${b.id}`} className="text-default-500 text-xs hover:underline">
                        {b.name}
                      </Link>
                      <p className="truncate">{b.bio}</p>
                    </div>
                    <Button size="sm" variant="danger-soft" onPress={() => remove(b.id, "bio")}>
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Restricted accounts</Card.Title>
          </Card.Header>
          <Card.Content>
            {data.restricted.length === 0 ? (
              <Empty>No restrictions in place.</Empty>
            ) : (
              <ul className="divide-default-200 divide-y">
                {data.restricted.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 py-2.5">
                    <Link href={`/players/${r.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar player={r} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{r.name}</span>
                        <span className="text-default-500 block truncate text-xs">
                          {[
                            r.reason,
                            r.statusUntil && r.status === "suspended" ? `until ${dateTime(r.statusUntil)}` : null,
                            r.mutedUntil ? `muted until ${date(r.mutedUntil)}` : null,
                            r.lossLimit !== null ? `loss limit ${chips(r.lossLimit)}` : null,
                            r.excludedUntil && r.excludedUntil > now ? `break until ${date(r.excludedUntil)}` : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                    </Link>
                    <StatusChip status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card.Content>
        </Card>
      </div>
    </>
  );
}
