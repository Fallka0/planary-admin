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

## 3. Packaging: one subscription per organisation, with add-ons

Design one subscription that belongs to the organisation and lifts limits in every app the
organisation has switched on. Do not design a subscription per app. The reasons, so the design
can lean on them:

- Per-app billing multiplies every state we have to design and run: a checkout, a renewal
  date, an invoice and a dunning path for each app, on a platform run by one person.
- The contract already works this way: one `plan` on the organisation, one limits lookup per
  owner, one billing page.
- "One Planary subscription" is the same promise as "one Planary account".

**Planary will add other products that are meant to earn.** A single bundled plan would force
a bad choice when that happens: give the new product to everyone on the plan, or raise the
price for everyone. So the subscription is a **base plan plus add-ons**:

- The **base plan** is the organisation's tier. It sets the limits that every Planary app
  reads (teams, seats, lists, and whatever a later app counts).
- A **paid product** that earns on its own attaches as an add-on line on the same
  subscription: its own price, the same renewal date, the same invoice, the same billing
  contact. Nothing about it is a second subscription.
- A **one-off purchase** stays one-off and is named after the thing it unlocks. The tournament
  pass is the first one.
- Consumer money (Casino chips and cosmetics) is a different wallet and never enters the
  organisation's subscription.

The design must therefore show an invoice and a plan page that can hold **more than one line**
from the start, even though today there is exactly one. Draw the add-on row now, with the
tournament pass in it, so the layout does not have to be reopened later.

## 4. The plans to design

Tier names say **how much**, never **who you are** or **which app**. The old `Verein` named
the audience and `Event` named the app; both go wrong the moment the family grows, which is
the point of section 3. The names are English proper nouns inside German pages: the copy
around them stays German.

| | **Free** | **Plus** | **Pro** |
|---|---|---|---|
| Price | CHF 0 | **CHF 149 a year** | **CHF 390 a year** |
| Billing | nothing to bill | one invoice a year | one invoice a year |
| For | Trying it out, something small and internal | An organisation that runs things all year | An organisation that cannot afford the match day to go wrong |

Beside them, not a tier:

| | **Tournament Pass** |
|---|---|
| Price | **CHF 29**, once, for one tournament |
| For | One LAN, one night, once a year |
| Gives | That one tournament everything a Plus organisation has |

What each one allows:

| | **Free** | **Tournament Pass** | **Plus** | **Pro** |
|---|---|---|---|---|
| Teams | 16 | 128 | 128 | unlimited |
| Tournaments at once | 1 | the one it was bought for | unlimited | unlimited |
| Organiser seats | 2 | 10 | 10 | unlimited |
| Check-in | yes | yes | yes | yes |
| Waiting list | no | yes | yes | yes |
| Own logo and colours | no | yes | yes | yes |
| Export (CSV, results) | no | yes | yes | yes |
| Pay by invoice | no | no | yes | yes |
| Help setting a tournament up | no | no | no | yes |
| Reachable on the match day | no | no | no | yes |
| Answers first | no | no | no | yes |
| Wishlist lists | 3 | 3 | unlimited | unlimited |

**Pro is service, not software held back.** Plus is the whole product. Pro is Planary standing
behind the match day: help setting the tournament up, someone reachable while it runs, and
answers before everyone else's. The scale lifts that cost nothing to grant (teams, seats) ride
along so the tier is not support alone on the page. Nothing is removed from Plus to make room
for it, and nothing is sold that does not exist yet: series across tournaments, rankings, an
API and a custom domain are **not** Pro features and must not appear on the page.

Design the support promise as something keepable by one person, not as "support". Name the
window and the lead time, for example reachable by phone and chat while the tournament runs,
booked at least two weeks ahead. The page must not imply instant help for any number of
simultaneous events.

Why these numbers, so the page can be honest about them:

- **CHF 29 for the pass.** The old 49 sat well above the market for the same thing. 29 is an
  easy yes for one night, and the break-even against Plus lands at about five tournaments a
  year, which is exactly the line between the two audiences. Put that line on the page:
  "Ab fünf Turnieren im Jahr lohnt sich Plus."
- **The pass gives Plus, never Pro.** A club that runs one big event a year would otherwise
  never have a reason to subscribe.
- **CHF 149 a year, billed once.** Not "19 a month billed yearly". A Swiss organisation budgets
  and approves yearly, pays one invoice, and files it. One price, one renewal, one invoice also
  removes proration and mid-term upgrades from the design. It undercuts the European
  competition (about €228 a year) for a club that counts every franc.
- **CHF 390 for Pro**, about two and a half times Plus and still well under the competition's
  circuit tier. It has to be worth the hours the support promise costs.
- **No monthly option.** A club that runs a season does not need one, and monthly would double
  the billing states.
- Check-in is in the free plan on purpose. Nothing that happens on the match day itself should
  be the thing that breaks.

The **Platzhalter chip is gone**: these prices are real.

## 5. Screens to design

Desktop light is the reference. Add dark and phone for the ones marked •.

**Pricing page, planary.ch**
- `PL-Pricing` • three plan cards and the pass beside them, the comparison table, the
  five-tournament line, the FAQ
  (Was passiert nach dem Turnier, Kann ich wechseln, Zahlung auf Rechnung, Kündigung).
- `PL-Pricing-Compare` the full limits table on its own, for people who scroll.

**Portal, plan and billing**
- `PL-Plan-Free` • the plan page of a free organisation: what it has, what it is missing,
  both ways up (pass and Plus) side by side.
- `PL-Plan-Paid` the same page once subscribed: plan, renewal date, payment method, invoices,
  the add-on line, the quiet way out. Pro is this page plus the support block, which names
  the window, the lead time and how to reach us.
- `PL-Plan-Pass` an organisation on Free whose pass covers one named tournament, and what
  happens to that tournament's data when the pass is spent.
- `PL-Checkout` • choosing card or invoice, the price broken out, what is charged today.
- `PL-Checkout-Pass` the same with the tournament picker (the pass needs a `tournamentId`).
- `PL-Done` the moment after paying: what is unlocked now, where to go next.
- `PL-Invoices` the invoice list with `paid`, `open`, `overdue` rows, PDF and pay links. One
  invoice must be able to carry the plan and an add-on line.
- `PL-Overdue` • the state the Console calls `overdue`: the banner, what still works, what
  stops, how to pay. Design this as calm, not punitive.
- `PL-Card-Expires` the softer sibling: the card expires before the renewal.
- `PL-Cancel` downgrade to Free: what is kept, what is lost, when it takes effect.

**The limit moments in Tournament**
- `PL-Limit-Teams` • the 17th team on Free.
- `PL-Limit-Running` a second tournament while one is live on Free.
- `PL-Limit-Feature` a paid feature in the editor (own logo, waiting list, export).

Each limit moment must say what the limit is, what it costs to lift it, and let the organiser
lift it without losing what they were doing.

## 6. Rules

- The Planary look: ink surfaces, Unbounded for display, Manrope for text, the tokens already
  in use in the Console and on planary.ch.
- Prices as "CHF 29", "CHF 149" and "CHF 390", never "149.00" on the cards. Amounts in the money shapes
  stay Rappen in the API.
- Nothing is sold with a countdown, a fake discount, or a plan whose price is hidden.
- Every state needs a loading and an error twin in the portal; the portal talks to one API and
  it does fall over.
- Say what a limit is before someone meets it, not only when they hit it.

## 7. Questions, with what to build

| # | Question | Default |
|---|---|---|
| 1 | A solo organiser has no organisation, but checkout is organisation-scoped. | **Settled:** checkout creates the organisation inline, in one step, named by the buyer. Invoices and the billing contact need it. |
| 2 | What happens to a finished tournament when its Tournament Pass is spent. | It keeps everything it had, forever, read-only beyond the plan's limits. A pass is never retroactively removed. |
| 3 | Do Plus and Pro renew automatically. | Yes, with a reminder 30 days ahead, and cancelling is one click in the portal, not an email to support. |
| 4 | TWINT, which `PaymentMethod.kind` already allows. | Design the card and invoice paths. Leave room for a third button, do not draw it yet. |
| 5 | Does the pass stack, two passes for two tournaments at once. | Yes, one pass per tournament, no limit on how many. |
| 6 | Wishlist at 3 lists on Free. | Yes, but it is never mentioned on the pricing cards. It belongs in the comparison table only. |
| 7 | Do the plan ids move now. | **Settled, not yet.** Design with the names in section 4; the ids stay `gratis` / `event` / `verein` until the screens are real, then move in one go. See section 8. |

## 8. What moves in code after the design lands

Not part of the design, written down so it is not forgotten.

**The rename, worth doing before launch and painful after it.** In this repo the plan ids
appear in five files only: `src/lib/org-contract.ts`, `src/lib/fmt.ts` (`PLAN_NAME`),
`src/app/customers/page.tsx` (the filter), `src/app/customers/[id]/page.tsx` (`PRICE` and the
plan select) and `src/lib/org-fixtures.ts`. The weight is on the other side: planary-org, the
portal, and the values already stored on organisations.

- `PlanId = 'free' | 'plus' | 'pro'`. Three tiers, and the display names stop differing from
  the ids. Until that lands, `gratis` is shown as Free and `verein` as Plus, and Pro has no id
  yet, so Pro cannot be sold before the rename does land.
- `event` leaves `PlanId` entirely. A pass is not a tier an organisation sits on, it is an
  entitlement on one tournament, which is what `LimitsResponse.source: 'event_pass'` already
  says. `POST /portal/orgs/:id/checkout` splits accordingly: a plan body and a pass body.
- The subscription gains add-on lines (section 3), so `Invoice` keeps its single amount but the
  billing response needs the lines that make it up.
- `Plan.period` gains a `year` case and `month_yearly` goes away. `placeholder` drops out of
  the contract and the chip with it.
- The `PRICE` map and the fixtures' `revenueYear` values (228 and 98 today) follow the new
  numbers.
