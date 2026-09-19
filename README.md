# Planary Casino · Operator console

The back office for Planary Casino at **admin.planary.ch**. Not linked from the casino; only staff get past sign-in.

- Sign-in: the Planary account (auth.planary.ch, single sign-on).
- Data: the `/admin` API of `planary-casino-api`. Every change is written to the audit log.
- Roles: **Owner** (everything, manages staff), **Manager** (players, chips, restrictions, games, economy, announcements, audit log), **Support** (look-ups, notes, mutes, moderation), **Viewer** (read-only).
- The first Owner is the account whose email is `OWNER_EMAIL` in the API's `wrangler.jsonc`; it claims the role on first sign-in.

## Pages

Overview · Games (status, RTP vs expected, live tables) · Transactions (filters, CSV) · Players (search, detail, chip adjustments, suspend/close, chat mute, loss limits, breaks, notes, messages) · Moderation · Announcements · Economy & shop · Staff · Audit log.

## Local development

```bash
npm install
npm run dev   # localhost:3003
```

`.env.local` points at the local auth (8787) and casino API (8788) workers.
