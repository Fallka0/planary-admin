"use client";

import { useState } from "react";
import { Alert, Button, Card, Description, Input, Label, Modal, Skeleton, TextArea, TextField, toast } from "@heroui/react";
import { useStaff } from "@/components/CasinoStaff";
import { Empty } from "@/components/ui";
import { ApiError, useAdmin, useAdminAction } from "@/lib/api";
import { chips, dateTime } from "@/lib/format";

interface Sent {
  id: number;
  by: string;
  at: number;
  title: string;
  body: string;
  recipients: number;
}

export default function AnnouncementsPage() {
  const staff = useStaff();
  const act = useAdminAction();
  const { data } = useAdmin<{ announcements: Sent[] }>("/announcements");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const res = await act<{ recipients: number }>("/announcements", { title, body });
      toast(`Sent to ${chips(res.recipients)} players`, { variant: "success" });
      setTitle("");
      setBody("");
      setConfirm(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "That didn't work.");
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header>
        <h2 className="text-2xl font-bold tracking-tight">Announcements</h2>
        <p className="text-default-500">A message in every active player&apos;s notifications: new games, maintenance windows, events.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <Card.Header>
            <Card.Title>Sent</Card.Title>
          </Card.Header>
          <Card.Content>
            {!data ? (
              <Skeleton className="h-40 rounded-lg" />
            ) : data.announcements.length === 0 ? (
              <Empty>Nothing sent yet.</Empty>
            ) : (
              <ul className="divide-default-200 divide-y">
                {data.announcements.map((a) => (
                  <li key={a.id} className="grid gap-1 py-3">
                    <strong>{a.title}</strong>
                    <p className="text-default-600">{a.body}</p>
                    <span className="text-default-500 text-xs">
                      {a.by} · {dateTime(a.at)} · {chips(a.recipients)} players
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card.Content>
        </Card>

        {staff.can("announce") ? (
          <Card>
            <Card.Header>
              <Card.Title>New announcement</Card.Title>
            </Card.Header>
            <Card.Content className="grid gap-4">
              <TextField value={title} onChange={setTitle} maxLength={80}>
                <Label>Title</Label>
                <Input placeholder="Roulette is here" />
              </TextField>
              <div className="grid gap-1.5">
                <Label>Message</Label>
                <TextArea
                  aria-label="Message"
                  className="min-h-28 w-full"
                  maxLength={500}
                  placeholder="One European wheel for everyone…"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
                <Description>{500 - body.length} characters left</Description>
              </div>
              {error ? (
                <Alert status="danger">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Description>{error}</Alert.Description>
                  </Alert.Content>
                </Alert>
              ) : null}
            </Card.Content>
            <Card.Footer>
              <Button isDisabled={!title.trim() || !body.trim()} onPress={() => setConfirm(true)}>
                Review and send
              </Button>
            </Card.Footer>
          </Card>
        ) : null}
      </div>

      {confirm ? (
        <Modal.Backdrop isOpen onOpenChange={(open: boolean) => !open && setConfirm(false)}>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[440px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Send to every player?</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="grid gap-3">
                <p className="text-default-500">It lands in every active player&apos;s notifications and can&apos;t be taken back.</p>
                <Card variant="transparent" className="border-default-200 border">
                  <Card.Content className="grid gap-1 p-3">
                    <strong>{title}</strong>
                    <p className="text-default-600">{body}</p>
                  </Card.Content>
                </Card>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" onPress={() => setConfirm(false)}>
                  Keep editing
                </Button>
                <Button isPending={busy} onPress={() => void send()}>
                  Send now
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      ) : null}
    </>
  );
}
