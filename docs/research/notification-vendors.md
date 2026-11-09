# Which notification vendors fit Cadence?

Research for [#8](https://github.com/agawish/cohort-005-project/issues/8), part of map [#7](https://github.com/agawish/cohort-005-project/issues/7). Gathered 2026-11-09 from vendor docs, pricing pages and SDK source. Prices and limits change, so re-check the pricing pages before signing up.

App context: React Router v7 (framework mode) on Node, SQLite/Drizzle, four recipient roles (Student, Instructor, Platform Admin, Team Admin), DevUI user switching in development.

## Summary

| | Knock | Novu (Cloud) | Courier | MagicBell | SuprSend |
| --- | --- | --- | --- | --- | --- |
| Free tier | 10,000 messages/mo, no hard cap | 10,000 workflow runs/mo, hard cap (HTTP 402) | 10,000 sends/mo | 1,000 deliveries/mo, 1 project | 10,000 notifications/mo, no hard cap |
| First paid step | Starter $250/mo (50k, then $0.005/msg) | Pro from $30/mo (30k, then $1.20/1k runs) | Business $0.005/send, pay as you go | Startup $249/mo (50k, then $0.0025) | Essentials $100/mo (50k, then $2/1k) |
| Billing unit | 1 user × 1 channel | 1 workflow × 1 subscriber, any number of channels | 1 recipient, any number of channels | 1 user × 1 channel | 1 user × 1 channel |
| Prebuilt React feed | Yes: bell, popover, full-page feed | Yes: `<Inbox />` with bell, list, preferences | Yes: inbox, popup menu, toast, preferences | Yes: floating inbox, inbox, preferences | Yes (not verified in depth) |
| Headless hooks | Yes | Yes | Yes (`useCourier`) | No hooks documented in `@magicbell/react` | Not verified |
| Styling | `--rnf-*` CSS vars, replace CSS, `renderItem` | `appearance` prop: theme, variables, per-element classes (Tailwind ok) | Theme objects per component | CSS vars and class overrides | Not verified |
| Real-time | WebSocket | Real-time sync (socket URL configured) | WebSocket, opt-in via `listenForUpdates()` | WebSocket | Not verified |
| Prebuilt preferences UI | No React component. Hosted page or `usePreferences` hook | Yes, in `<Inbox />` | Yes, `<CourierPreferences />` | Yes, `UserPreferences` | Preferences only on Business ($250/mo) |
| Client auth | Public key + user id; signed RS256 JWT in enhanced security mode | `subscriberId`; HMAC hash in production | Server-minted JWT, always | Server-minted HS256 JWT, always | Not verified |
| Node SDK | `@knocklabs/node` | `@novu/api` | `@trycourier/courier` (Node 20+) | `magicbell-js` | Not covered |

SuprSend is included as an extra candidate on pricing only; its SDKs and inbox were not researched in depth.

## Per-axis findings

### 1. Free tier and paid pricing

- **Knock**: Free $0, up to 10,000 messages; Starter $250/mo with 50,000 messages then $0.005 each; Enterprise custom. Unlimited stored profiles, channels and environments on every plan. Knock does not hard-cap the free plan. If you go over without a billing method, the team contacts you. Free plan shows Knock branding. ([pricing](https://knock.app/pricing))
  - A message is "a single message delivered to a single user on a single channel". In-app plus email for one user is two messages. Steps skipped by preferences don't count. ([plans and usage](https://docs.knock.app/manage-your-account/knock-plans))
- **Novu**: Free $0, 10,000 workflow runs, 20 workflows, 2 environments, 3 team members, 24h activity retention. Pro from $30/mo (30,000+ runs, $1.20 per extra 1k). Team from $250/mo. Self-hosting is listed under Enterprise. ([pricing](https://novu.co/pricing))
  - Free stops new runs at 10,000 and rejects triggers with HTTP 402 until the period resets. One run is one workflow for one subscriber, however many channels it uses. All environments count toward the same total. ([billing](https://docs.novu.co/platform/account/billing))
- **Courier**: Developer free with 10,000 sends/month; Business $0.005 per send, pay as you go; Enterprise custom. No channel add-on fees. ([pricing](https://www.courier.com/pricing))
  - A send is one unit per recipient, not per channel. Test sends and sends blocked by preferences are still billable. ([environments and keys](https://courier.com/docs/platform/workspaces/environments-api-keys))
- **MagicBell**: Builder $0 with 1,000 deliveries/month and 1 project; Startup $249/mo with 50,000 deliveries, $0.0025 per extra and $99 per extra project. No trial is mentioned. ([pricing](https://www.magicbell.com/pricing))
  - Deliveries are counted per channel: "all receive it in_app, but only 50 receive an email; we count that as 150 deliveries." (pricing FAQ)
- **SuprSend**: Free 10,000 notifications (each channel counts); Essentials $100/mo; Business $250/mo. User preferences are listed only from Business up. ([pricing](https://www.suprsend.com/pricing))

### 2. In-app feed: prebuilt vs headless, styling

- **Knock** `@knocklabs/react`: `NotificationIconButton` (bell with unread/unseen badge), `NotificationFeedPopover`, `NotificationFeed`. Headless via `useKnockClient`, `useNotifications`, `useNotificationStore`. Styling via `--rnf-` CSS variables, replacing the stylesheet (`rnf-` classes), `colorMode`, and `renderItem` to replace a cell. ([React overview](https://docs.knock.app/in-app-ui/react/overview), [feed](https://docs.knock.app/in-app-ui/react/feed), [custom UI](https://docs.knock.app/in-app-ui/react/custom-notifications-ui))
- **Novu** `@novu/react` (React 18+, 19 supported): `<Inbox />` built from Bell, Notifications and Preferences sub-components. Hooks are available for a fully custom UI. Styling uses the `appearance` prop with `baseTheme`, `variables`, `elements` (style object or class names, Tailwind works), `icons`, and `animations`. Some elements take callbacks such as `bellIcon` receiving `unreadCount`. ([Inbox overview](https://docs.novu.co/platform/inbox/overview), [styling](https://docs.novu.co/platform/inbox/configuration/styling))
- **Courier** `@trycourier/courier-react` (React 18+): `<CourierInbox />`, `<CourierInboxPopupMenu />`, `<CourierToast />`, `<CourierPreferences />`. The `useCourier()` hook exposes `auth`, `inbox`, `toast`, `preferences`. Each component has a theme object. Components render client-side only. ([React SDK](https://www.courier.com/docs/sdk-libraries/courier-react-web))
- **MagicBell** `@magicbell/react`: `FloatingInbox` (bell plus panel, custom `ButtonComponent`), `Inbox`, `UserPreferences`, `ToastContainer`, `WebPushButton`. The page documents components only, no hooks. Styling via per-component CSS files, class overrides and `--magicbell-*` variables. ([React library](https://www.magicbell.com/docs/libraries/react))

React Router note (inference, not from vendor docs): every SDK is a browser component that holds a socket, so in framework mode it should render client-only (for example behind a hydration check or in a `clientLoader`-driven island). None of the vendors document React Router v7 specifically.

### 3. Live updates (options, no recommendation)

All four vendors push over a WebSocket. Cadence could use them in three ways:

1. **Vendor socket, live.** The bell badge and feed update without a reload. Knock opens the socket by default and can auto-disconnect inactive tabs (`auto_manage_socket_connection`) ([feed](https://docs.knock.app/in-app-ui/react/feed), [API overview](https://docs.knock.app/in-app-ui/api-overview)). Courier needs an explicit `inbox.listenForUpdates()`; without it the inbox loads once ([React SDK](https://www.courier.com/docs/sdk-libraries/courier-react-web)). Novu's Inbox syncs in real time and takes a `socketUrl` for the EU region ([production prep](https://docs.novu.co/platform/inbox/prepare-for-production)). MagicBell's `Realtime` client listens over WebSocket and reconnects on its own ([magicbell-js](https://www.magicbell.com/docs/libraries/magicbell-js)).
2. **On next load.** Fetch the feed when the page or popover opens and skip the socket. Courier supports this directly (don't call `listenForUpdates`). For the others, use the headless feed API and don't subscribe. This was not verified per SDK.
3. **Polling.** None of the docs read here describe a polling mode. It would mean refetching the feed API on an interval through the headless clients.

Trade-off: live updates cost one long-lived connection per open tab and need client-only rendering. "On next load" is simpler but a Student won't see a refund decision until they navigate.

### 4. Other channels from the same workflow

All four let one workflow fan out to in-app, email, push, SMS and chat. In every case you bring your own downstream provider (Postmark, SES, FCM/APNs, Twilio), billed separately by that provider ([Knock pricing](https://knock.app/pricing), [Courier pricing](https://www.courier.com/pricing), [MagicBell channels](https://www.magicbell.com/docs/channels)).

The vendor cost of adding email depends on the billing unit:

- **Knock, MagicBell, SuprSend**: per channel. In-app plus email roughly doubles usage.
- **Novu**: per workflow run. Extra channels add no vendor cost.
- **Courier**: per recipient via the Send API, so extra channels are free if you send to a `user_id`. Listing each channel as a separate `to` entry bills once per entry, and Journeys count one per Send node.

### 5. User preferences and muting

- **Knock**: preferences by `workflows`, `categories`, `channel_types` and `channels`. There is no prebuilt React preferences component. You either link to a hosted preference page (signed URL, default set only) or build one with the `usePreferences` hook from `@knocklabs/react-core`. ([preferences](https://docs.knock.app/preferences/overview); hook in [knocklabs/javascript](https://github.com/knocklabs/javascript/tree/main/packages/react-core/src/modules/preferences))
- **Novu**: per-workflow and per-channel preferences built into `<Inbox />`. Workflows marked "critical" cannot be disabled and are hidden from the preferences UI. ([Inbox preferences](https://docs.novu.co/platform/inbox/configuration/preferences), [concepts](https://docs.novu.co/platform/concepts/preferences))
- **Courier**: subscription topics with `OPTED_IN`, `OPTED_OUT` or `REQUIRED` defaults, tenant-level defaults, and optional per-topic channel choice. Prebuilt `<CourierPreferences />` plus a hosted page. ([preferences](https://www.courier.com/docs/platform/preferences/preferences-overview))
- **MagicBell**: `UserPreferences` component toggles channels per category. ([React library](https://www.magicbell.com/docs/libraries/react))
- **SuprSend**: preferences only on Business ($250/mo). ([pricing](https://www.suprsend.com/pricing))

### 6. Node server SDK: triggering and recipients

- **Knock**:
  ```ts
  import Knock from "@knocklabs/node";
  const knock = new Knock(); // reads KNOCK_API_KEY
  await knock.workflows.trigger("refund-requested", {
    recipients: ["user_123"], data: { courseId: "c1" },
  });
  ```
  Recipients are your own user ids, which can be identified inline at trigger time. `actor` and `tenant` are optional. ([knock-node README](https://github.com/knocklabs/knock-node), [trigger API](https://docs.knock.app/api-reference/workflows/trigger))
- **Novu**:
  ```ts
  import { Novu } from "@novu/api";
  const novu = new Novu({ secretKey: process.env.NOVU_SECRET_KEY });
  await novu.trigger({ workflowId: "refund-requested",
    to: { subscriberId: "user_123", email: "a@b.com", firstName: "A" },
    payload: { courseId: "c1" } });
  ```
  The subscriber is your user id and its details can be passed inline. ([TypeScript SDK](https://docs.novu.co/platform/sdks/server/typescript))
- **Courier**:
  ```ts
  import Courier from "@trycourier/courier";
  const courier = new Courier(); // reads COURIER_API_KEY
  await courier.send.message({ message: {
    to: { user_id: "user_123" }, template: "<template id>", data: { courseId: "c1" } } });
  ```
  Create the profile before sending to a `user_id`, or address by email. Requires Node 20+. ([Node SDK](https://www.courier.com/docs/sdk-libraries/node))
- **MagicBell**: `magicbell-js/project-client`, `client.broadcasts.createBroadcast({ title, content, recipients: [{ externalId, email }] })`. Recipients are identified by `externalId` and/or email. ([magicbell-js](https://www.magicbell.com/docs/libraries/magicbell-js))

In all four the natural mapping is Cadence user id to vendor user id, with role-based targeting (for example "all Platform Admins") resolved by Cadence before the trigger. Knock objects, Novu topics, and Courier lists and audiences could carry role groups, but that wasn't needed for this comparison.

### 7. Local dev story

- **Knock**: separate development and production environments with their own keys. Without enhanced security mode the client only needs the public key and a user id (`authenticate({ id })`), so DevUI user switching is just a prop change. Production should turn on enhanced security, which needs a server-signed RS256 token (`signUserToken` from `@knocklabs/node`). The in-app channel has no sandbox mode, so dev-environment feed messages are real messages and count toward usage. ([environments](https://docs.knock.app/concepts/environments), [security](https://docs.knock.app/in-app-ui/security-and-authentication), [plans](https://docs.knock.app/manage-your-account/knock-plans))
- **Novu**: Development and Production environments on Free, but runs from both count toward the 10,000 cap. `<Inbox />` takes a `subscriberId`, and new subscribers are created on first session, so switching DevUI users is a prop change. HMAC (`subscriberHash`, HMAC-SHA256 of the subscriber id on the server) is needed once enabled for production. Optional code-first workflows (Novu Framework) need a bridge endpoint in the app. ([production prep](https://docs.novu.co/platform/inbox/prepare-for-production), [framework](https://docs.novu.co/framework/overview))
- **Courier**: Test and Production environments with separate keys and fully partitioned data. The default test email provider only delivers to the signup address. Mock keys (no provider call) are Enterprise-only. The inbox always needs a server-minted JWT, so each DevUI user switch means minting a new token. ([environments and keys](https://courier.com/docs/platform/workspaces/environments-api-keys), [React SDK](https://www.courier.com/docs/sdk-libraries/courier-react-web))
- **MagicBell**: the inbox always needs a User JWT (HS256, signed with the project secret, carrying `user_external_id` and/or `user_email`), minted on the server per user. Free Builder has one project, so dev and prod can't be separated on the free tier. ([User JWT](https://www.magicbell.com/docs/api/authentication/user), [pricing](https://www.magicbell.com/pricing))

## Key trade-offs

- **Novu** has the most built in for the least money: prebuilt Inbox with preferences, Tailwind-friendly styling, and per-run billing so email adds no vendor cost. The catch is a hard 10,000-run cap on Free, shared across environments.
- **Knock** has the most polished feed SDK and the softest free tier (no hard cap, unlimited environments). There's no prebuilt preferences component, it bills per channel, and the first paid step is $250/mo.
- **Courier** has prebuilt inbox and preferences components, a pay-as-you-go paid tier with no monthly minimum, and per-recipient billing. Its client auth always needs a server-minted JWT, which makes DevUI user switching slightly more work.
- **MagicBell**'s free tier is too small for comfort: 1,000 deliveries, counted per channel, with one project and no dev/prod split. The next step is $249/mo.
- **SuprSend**'s free tier is reasonable, but preferences start at $250/mo.

## Open questions for the user

- Live updates or "on next load"? (See section 3.)
- In-app only for v1, or in-app plus email? This decides whether per-channel billing matters.
- Is a prebuilt preferences UI a v1 requirement? It counts against Knock and SuprSend's free tier.
