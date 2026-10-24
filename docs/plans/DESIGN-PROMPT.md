# Design prompt · Planary plans and pricing (v1)

Paste this into the design canvas. It describes what to design, what is already decided,
and what is still open. Everything in section 2 is verified against the code in
`Fallka0/planary-admin` (`src/lib/org-contract.ts` is the canonical API contract; the portal
keeps a copy).

---

## 1. What this is

Planary is a small Swiss platform with one account across several apps: **Tournament**
(brackets, teams, check-in, live match days), **Wishlist** (gift lists, privacy first) and
**Casino** (play money, consumer fun). Organisations, mostly Vereine, esports clubs, schools
and one-off LAN organisers, work in the **portal**; Planary staff work in the **Console**.

We sell to the organisation. We are designing three things:

1. The public **pricing page** on planary.ch.
2. The portal's **plan and billing** surfaces: current plan, upgrade, checkout, invoices,
   payment method, renewal, overdue.
3. The **plan model** itself: what each plan includes and where a free organisation meets a
   limit inside the product.

Language: the portal and planary.ch are **German** (Swiss German spelling: ss, never ß).
The Console is English. No em dashes, no exclamation marks, no emoji in visible copy.

## 2. What exists today (verified in the contract)

- `PlanId = 'gratis' | 'event' | 'verein'`. One plan per organisation.
- `Plan` carries `price` (Rappen), `period: 'forever' | 'tournament' | 'month_yearly'`,
  `placeholder: boolean` ("Platzhalter" chip, shown until prices are real), `limits`
  (Tournament) and `wishlist` (`maxLists`).
- `PlanLimits`: `maxTeams`, `maxRunning` (null = unlimited), `maxOrganisers`, `branding`,
  `checkIn`, `waitingList`, `export`, `matchDaySupport`, `invoice`.
- Portal API: `GET /portal/orgs/:id/billing` returns `{ plans, current, invoices,
  paymentMethod, contact, renewsAt }`; `POST /portal/orgs/:id/checkout` takes
  `{ plan: 'event' | 'verein', tournamentId?, payBy?: 'card' | 'invoice' }` and returns a
  URL; `POST /portal/orgs/:id/billing-portal` opens the provider's portal (Stripe).
- `Invoice` has `status: draft | open | paid | void | uncollectible`, `overdueDays`,
  `pdfUrl`, `payUrl`. `PaymentMethod.kind: 'card' | 'twint' | 'invoice'`.
- Billing states the Console already shows per customer: `paid | overdue | free |
  card_expires`.
- Limits are served to the apps by `GET /internal/limits` → `LimitsResponse` with
  `source: 'organisation' | 'event_pass' | 'person'`. The one-off pass is already modelled.
- Support requests have topics `billing` and `plan`, so a pricing question becomes a request
  in the Console inbox.
- Current placeholder prices: CHF 49 per tournament, CHF 19 a month billed yearly.
  **These are replaced, see section 4.**

## 3. Packaging decision: one plan for the organisation, not one per app

Design one subscription that belongs to the organisation and lifts limits in every app the
organisation has switched on. Do not design per-app subscriptions. The reasons, so the design
can lean on them:

- Only Tournament carries real willingness to pay. Wishlist is a quiet companion and Casino is
  play money with no organisation behind it. Per-app billing would ship one real product and
  two dead ones.
- Per-app billing multiplies every state we have to design and run: three checkouts, three
  renewal dates, three invoices, three dunning paths, for a platform run by one person.
- The contract already works this way: one `plan` on the organisation, one limits lookup per
  owner, one billing page.
- "One Planary subscription" is the same promise as "one Planary account". A new app later
  joins the plan instead of asking for a new purchase decision.

Next to the subscription keep the **one-off Event pass**: it is already in the contract
(`event_pass`), and it is the shape this market has settled on (Toornament sells a €19 Boost
for a single tournament beside a monthly Community plan).

## 4. The plans to design

Three choices on the page. Ids stay `gratis` / `event` / `verein` so nothing in the API moves.

| | **Gratis** | **Event** | **Verein** |
|---|---|---|---|
| Price | CHF 0 | **CHF 29**, once, for one tournament | **CHF 149 a year**, one invoice |
| For | Trying it out, a small internal tournament | One LAN, one night, once a year | A club that runs a season |
| Teams | 16 | 128 | 128 |
| Tournaments at once | 1 | the one it was bought for | unlimited |
| Organiser seats | 2 | 10 | 10 |
| Check-in | yes | yes | yes |
| Waiting list | no | yes | yes |
| Own logo and colours | no | yes | yes |
| Export (CSV, results) | no | yes | yes |
| Match-day support | no | no | yes |
| Pay by invoice | no | no | yes |
| Wishlist lists | 3 | 3 | unlimited |

Why these numbers, so the page can be honest about them:

- **CHF 29 for the pass.** The old 49 sat well above the market for the same thing. 29 is an
  easy yes for one night, and the break-even against Verein lands at about five tournaments a
  year, which is exactly the line between the two audiences. Put that line on the page:
  "Ab fünf Turnieren im Jahr lohnt sich Verein."
- **CHF 149 a year, billed once.** Not "19 a month billed yearly". A Swiss Verein budgets and
  approves yearly, pays one invoice, and files it. One price, one renewal, one invoice also
  removes proration and mid-term upgrades from the design. It undercuts the European
  competition (about €228 a year) for a club that counts every franc.
- **No monthly option.** A club that runs a season does not need one, and monthly would double
  the billing states.
- Anything bigger than a club (federations, schools with many organisers, a paid circuit) gets
  a quiet line at the bottom of the page, not a fourth card: "Grössere Organisation? Schreib
  uns." It opens a support request with topic `plan`.
- Check-in is in the free plan on purpose. Nothing that happens on the match day itself should
  be the thing that breaks.

The **Platzhalter chip is gone**: these prices are real. Remove that treatment everywhere.

## 5. Screens to design

Desktop light is the reference. Add dark and phone for the ones marked •.

**Pricing page, planary.ch**
- `PL-Pricing` • three cards, the comparison table, the five-tournament line, the FAQ
  (Was passiert nach dem Turnier, Kann ich wechseln, Zahlung auf Rechnung, Kündigung).
- `PL-Pricing-Compare` the full limits table on its own, for people who scroll.

**Portal, plan and billing**
- `PL-Plan-Gratis` • the plan page of a free organisation: what it has, what it is missing,
  both upgrade paths side by side.
- `PL-Plan-Verein` the same page once subscribed: plan, renewal date, payment method,
  invoices, the quiet way out.
- `PL-Plan-Event` an organisation whose pass covers one named tournament, and what happens to
  that tournament's data when the pass is spent.
- `PL-Checkout` • choosing card or invoice, the price broken out, what is charged today.
- `PL-Checkout-Event` the same with the tournament picker (the pass needs a `tournamentId`).
- `PL-Done` the moment after paying: what is unlocked now, where to go next.
- `PL-Invoices` the invoice list with `paid`, `open`, `overdue` rows, PDF and pay links.
- `PL-Overdue` • the state the Console calls `overdue`: the banner, what still works, what
  stops, how to pay. Design this as calm, not punitive.
- `PL-Card-Expires` the softer sibling: the card expires before the renewal.
- `PL-Cancel` downgrade to Gratis: what is kept, what is lost, when it takes effect.

**The limit moments in Tournament**
- `PL-Limit-Teams` • the 17th team on a free plan.
- `PL-Limit-Running` a second tournament while one is live on a free plan.
- `PL-Limit-Feature` a paid feature in the editor (own logo, waiting list, export).

Each limit moment must say what the limit is, what it costs to lift it, and let the organiser
lift it without losing what they were doing.

## 6. Rules

- The Planary look: ink surfaces, Unbounded for display, Manrope for text, the tokens already
  in use in the Console and on planary.ch.
- Prices as "CHF 29" and "CHF 149", never "29.00" on the cards. Amounts in the money shapes
  stay Rappen in the API.
- Nothing is sold with a countdown, a fake discount, or a plan whose price is hidden.
- Every state needs a loading and an error twin in the portal; the portal talks to one API and
  it does fall over.
- Say what a limit is before someone meets it, not only when they hit it.

## 7. Open questions, build the default

| # | Question | Default |
|---|---|---|
| 1 | A solo organiser has no organisation, but checkout is organisation-scoped. | Buying anything creates the organisation first, in one step inside checkout. Invoices and the billing contact need it. |
| 2 | What happens to a finished tournament when its Event pass is spent. | It keeps everything it had, forever, read-only beyond the plan's limits. A pass is never retroactively removed. |
| 3 | Does Verein renew automatically. | Yes, with a reminder 30 days ahead, and cancelling is one click in the portal, not an email to support. |
| 4 | TWINT, which `PaymentMethod.kind` already allows. | Design the card and invoice paths. Leave room for a third button, do not draw it yet. |
| 5 | Does the pass stack, two passes for two tournaments at once. | Yes, one pass per tournament, no limit on how many. |
| 6 | Wishlist at 3 lists on the free plan. | Yes, but it is never mentioned on the pricing cards. It belongs in the comparison table only. |

## 8. What moves in code after the design lands

Not part of the design, written down so it is not forgotten: `Plan.period` gains a `year`
case and `month_yearly` goes away, `placeholder` drops out of the contract and the chip with
it, the `PRICE` map in `src/app/customers/[id]/page.tsx`, the Console fixtures' `revenueYear`
values (228 and 98 today) and `src/lib/org-fixtures.ts` all follow the new numbers.
