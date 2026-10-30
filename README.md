# Planary Console

The back office for every Planary app at **admin.planary.ch**. Staff only, in English. It grew out of the Casino operator console.

- **Sign-in:** the Planary account (auth.planary.ch, single sign-on).
- **Roles:** Owner, Manager, Support, Viewer. What each role may do per area is the matrix on *Staff and roles* (enforced by planary-org; the Casino API keeps enforcing its own list for the Casino pages). Viewers see everything their role allows, read-only, with a banner saying so.
- **Every change is written to an audit log**: planary-org's for Console areas, the casino API's for Casino actions. *Audit log* shows both.

## Pages

| Section | Path | Data |
|---|---|---|
| Overview | `/` | planary-org `/console/overview` |
| Status, incidents | `/status`, `/status/[id]` | planary-org (health checks every minute, incidents) |
| Customers | `/customers`, `/customers/[id]` | planary-org (organisations, plans, invoices from Stripe, notes) |
| Support | `/support`, `/support/[id]` | planary-org (requests from the customer portal) |
| Tournament | `/tournament` | planary-org (mirror of the Tournament API) |
| Casino | `/casino/*` | the casino API's `/admin` routes, the pages as before |
| Wishlist | `/wishlist` | totals only, through planary-org from the Wishlist API |
| Audit log | `/audit` | planary-org and the casino API |
| Staff and roles | `/staff` | planary-org; role changes are mirrored to the casino API |

The old Casino paths (`/players`, `/games`, …) redirect to `/casino/…`.

## Environment

| Variable | Default | What |
|---|---|---|
| `NEXT_PUBLIC_ORG_API` | `https://org.planary.ch` | planary-org |
| `NEXT_PUBLIC_CASINO_API` | `https://planary-casino-api.planary.workers.dev` | casino API |
| `NEXT_PUBLIC_AUTH_BASE_URL` | `https://auth.planary.ch` | sign-in |
| `NEXT_PUBLIC_CONSOLE_DATA` | unset | `fixtures`: the handoff's sample data, a fixed clock and no sign-in. Local development and screenshot checks only, never in production. Add `?state=down`, `viewer`, `error`, `empty` or `loading` to see the designed states. |

## Local development

```bash
npm install
npm run dev                                   # localhost:3003, against the real services
NEXT_PUBLIC_CONSOLE_DATA=fixtures npm run dev # sample data, no backend needed
```
