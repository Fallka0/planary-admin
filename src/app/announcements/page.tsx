"use client";

import { useState } from "react";
import { useStaff } from "@/components/Shell";
import { Dialog, useToast } from "@/components/ui";
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
  const toast = useToast();
  const { data } = useAdmin<{ announcements: Sent[] }>("/announcements");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setError(null);
    try {
      const res = await act<{ recipients: number }>("/announcements", { title, body });
      toast(`Sent to ${chips(res.recipients)} players`);
      setTitle("");
      setBody("");
      setConfirm(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "That didn't work.");
      setConfirm(false);
    }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Announcements</h1>
          <p>A message in every active player&apos;s notifications: new games, maintenance windows, events.</p>
        </div>
      </div>
      <div className="split">
        <section className="card">
          <div className="card-head">
            <h2>Sent</h2>
          </div>
          {!data ? (
            <p className="empty">Loading…</p>
          ) : data.announcements.length === 0 ? (
            <p className="empty">Nothing sent yet.</p>
          ) : (
            <ul className="list">
              {data.announcements.map((a) => (
                <li key={a.id} style={{ display: "grid", gap: 4 }}>
                  <strong>{a.title}</strong>
                  <p className="muted">{a.body}</p>
                  <span className="small muted">
                    {a.by} · {dateTime(a.at)} · {chips(a.recipients)} players
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        {staff.can("announce") ? (
          <section className="card">
            <div className="card-head">
              <h2>New announcement</h2>
            </div>
            <form
              className="card-body"
              style={{ display: "grid", gap: 12 }}
              onSubmit={(e) => {
                e.preventDefault();
                setConfirm(true);
              }}
            >
              <label className="field">
                <span>Title</span>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="Roulette is here" />
              </label>
              <label className="field">
                <span>Message</span>
                <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} placeholder="One European wheel for everyone…" />
                <small>{500 - body.length} characters left</small>
              </label>
              <div>
                <button className="btn btn-primary" disabled={!title.trim() || !body.trim()}>
                  Review and send
                </button>
              </div>
              {error ? <p className="form-error">{error}</p> : null}
            </form>
          </section>
        ) : null}
      </div>
      {confirm ? (
        <Dialog
          title="Send to every player?"
          onClose={() => setConfirm(false)}
          footer={
            <>
              <button className="btn" onClick={() => setConfirm(false)}>
                Keep editing
              </button>
              <button className="btn btn-primary" onClick={() => void send()}>
                Send now
              </button>
            </>
          }
        >
          <p className="muted">It lands in every active player&apos;s notifications and can&apos;t be taken back.</p>
          <div className="card card-pad" style={{ boxShadow: "none" }}>
            <strong>{title}</strong>
            <p className="muted">{body}</p>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
