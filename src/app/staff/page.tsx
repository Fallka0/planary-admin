"use client";

import { useState } from "react";
import { Alert, Button, Card, Description, Label, ListBox, Modal, Radio, RadioGroup, SearchField, Select, Skeleton, Table, toast } from "@heroui/react";
import { useStaff } from "@/components/Shell";
import { Avatar, StatusChip, Who } from "@/components/ui";
import { ApiError, type Badge, type Role, useAdmin, useAdminAction } from "@/lib/api";
import { date } from "@/lib/format";

interface Member extends Badge {
  email: string;
  role: Role;
  since: number;
}

const ROLES: { role: Role; label: string; can: string }[] = [
  { role: "owner", label: "Owner", can: "Everything, including staff." },
  { role: "manager", label: "Manager", can: "Players, chips, restrictions, games, economy, announcements, audit log." },
  { role: "support", label: "Support", can: "Look up players, notes, mutes and moderation. No chip changes." },
  { role: "viewer", label: "Viewer", can: "Read-only: figures, players and transactions." },
];

function AddDialog({ onClose }: { onClose: () => void }) {
  const act = useAdminAction();
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Badge | null>(null);
  const [role, setRole] = useState<Role>("support");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { data } = useAdmin<{ players: Badge[] }>(q.trim().length >= 2 && !picked ? `/players?q=${encodeURIComponent(q.trim())}` : null);

  async function add() {
    if (!picked) return;
    setBusy(true);
    setError(null);
    try {
      await act("/staff", { userId: picked.id, role });
      toast(`${picked.name} added as ${role}`, { variant: "success" });
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "That didn't work.");
      setBusy(false);
    }
  }

  return (
    <Modal.Backdrop isOpen onOpenChange={(open: boolean) => !open && onClose()}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-[460px]">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Add staff</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="grid gap-4">
            <p className="text-default-500 text-sm">
              Staff sign in to admin.planary.ch with their own Planary account. They need to have opened the casino once.
            </p>
            {picked ? (
              <div className="flex items-center justify-between gap-3">
                <Who player={picked} sub={picked.id} />
                <Button size="sm" variant="secondary" onPress={() => setPicked(null)}>
                  Change
                </Button>
              </div>
            ) : (
              <>
                <SearchField value={q} onChange={setQ}>
                  <Label>Player</Label>
                  <SearchField.Group>
                    <SearchField.SearchIcon />
                    <SearchField.Input placeholder="Search by name" />
                    <SearchField.ClearButton />
                  </SearchField.Group>
                </SearchField>
                {data?.players.length ? (
                  <ul className="grid gap-0.5">
                    {data.players.slice(0, 6).map((p) => (
                      <li key={p.id}>
                        <button className="hover:bg-default-100 flex w-full items-center gap-2 rounded-lg p-2 text-left" onClick={() => setPicked(p)}>
                          <Avatar player={p} size="sm" /> {p.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}

            <RadioGroup value={role} variant="secondary" onChange={(value: string) => setRole(value as Role)}>
              <Label>Role</Label>
              {ROLES.map((r) => (
                <Radio key={r.role} value={r.role}>
                  <Radio.Content>
                    <Radio.Control>
                      <Radio.Indicator />
                    </Radio.Control>
                    {r.label}
                  </Radio.Content>
                  <Description>{r.can}</Description>
                </Radio>
              ))}
            </RadioGroup>

            {error ? (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description>{error}</Alert.Description>
                </Alert.Content>
              </Alert>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="tertiary" onPress={onClose}>
              Cancel
            </Button>
            <Button isDisabled={!picked} isPending={busy} onPress={() => void add()}>
              Add
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

export default function StaffPage() {
  const me = useStaff();
  const act = useAdminAction();
  const { data } = useAdmin<{ staff: Member[] }>("/staff");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);

  const change = (id: string, role: string) =>
    act("/staff", { userId: id, role }).then(
      () => toast("Role changed", { variant: "success" }),
      (e) => toast(e.message, { variant: "danger" }),
    );

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
          <p className="text-default-500">Who can use this console, and what each role allows.</p>
        </div>
        {me.can("staff") ? <Button onPress={() => setAdding(true)}>Add staff</Button> : null}
      </header>

      {!data ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Staff" className="min-w-[640px]">
              <Table.Header>
                <Table.Column isRowHeader>Person</Table.Column>
                <Table.Column>Role</Table.Column>
                <Table.Column>Since</Table.Column>
                <Table.Column>{""}</Table.Column>
              </Table.Header>
              <Table.Body>
                {data.staff.map((m) => (
                  <Table.Row key={m.id}>
                    <Table.Cell>
                      <Who player={m} sub={m.email || "Hasn't signed in yet"} />
                    </Table.Cell>
                    <Table.Cell>
                      {me.can("staff") && m.id !== me.id ? (
                        <Select className="w-36" value={m.role} onChange={(value) => void change(m.id, String(value))}>
                          <Label className="sr-only">Role of {m.name}</Label>
                          <Select.Trigger>
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          <Select.Popover>
                            <ListBox>
                              {ROLES.map((r) => (
                                <ListBox.Item key={r.role} id={r.role} textValue={r.label}>
                                  {r.label}
                                  <ListBox.ItemIndicator />
                                </ListBox.Item>
                              ))}
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      ) : (
                        <StatusChip status={m.role} />
                      )}
                    </Table.Cell>
                    <Table.Cell className="text-default-500">{date(m.since)}</Table.Cell>
                    <Table.Cell>
                      {me.can("staff") && m.id !== me.id ? (
                        <Button size="sm" variant="danger-soft" onPress={() => setRemoving(m)}>
                          Remove
                        </Button>
                      ) : m.id === me.id ? (
                        <span className="text-default-500 text-sm">You</span>
                      ) : null}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}

      <Card>
        <Card.Header>
          <Card.Title>Roles</Card.Title>
        </Card.Header>
        <Card.Content>
          <ul className="divide-default-200 divide-y">
            {ROLES.map((r) => (
              <li key={r.role} className="flex items-center gap-3 py-2.5">
                <StatusChip status={r.role} />
                <span className="text-default-600">{r.can}</span>
              </li>
            ))}
          </ul>
        </Card.Content>
      </Card>

      {adding ? <AddDialog onClose={() => setAdding(false)} /> : null}
      {removing ? (
        <Modal.Backdrop isOpen onOpenChange={(open: boolean) => !open && setRemoving(null)}>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[400px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Remove {removing.name}?</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-default-500">They lose access to this console straight away. Their player account is not affected.</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={() => setRemoving(null)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onPress={() =>
                    void act(`/staff/${removing.id}/remove`).then(
                      () => (toast("Removed from staff", { variant: "success" }), setRemoving(null)),
                      (e) => (toast(e.message, { variant: "danger" }), setRemoving(null)),
                    )
                  }
                >
                  Remove access
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      ) : null}
    </>
  );
}
