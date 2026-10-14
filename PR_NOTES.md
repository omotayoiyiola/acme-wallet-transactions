## What this does

Adds `/transactions` using the live mock API, with desktop and 375px layouts based on the supplied design screenshots. Includes debounced search, type/status filters, grouped history, pagination, a desktop details drawer and mobile bottom sheet, and loading, empty, failure and not-found states.

## Changes outside the Transactions page

- The API client now throws `ApiError` for non-success responses and no longer logs financial response bodies. Existing dashboard, account menu and conversion callers handle rejected requests.
- `TransactionRow` renders provider narration as text, uses status badges, and supports long names and amounts on mobile. `Money` delegates to the shared minor-unit formatter so all currencies keep two decimals.
- `Button` is a native button; input/select labels reference their controls. `Drawer` uses a native modal dialog for keyboard focus containment, Escape, focus restoration and background isolation. Clicking its content no longer closes it.
- The navbar uses `usePathname` and displays the mobile navigation shown in the reference.
- Prettier accepts existing platform line endings, avoiding Windows checkout failures. No mock API files changed and no libraries were added.

## Decisions

- The URL is the source of truth: `q`, `type`, `status`, `page`, and `transaction`. Native History API changes integrate with Next.js and retain scroll position; Back/Forward and refresh restore selections.
- Search commits after 300ms. Every request is abortable, and late responses from superseded requests are ignored. Previous results remain visible, dimmed and marked busy, while a replacement request runs. Explicit retries keep the selected filters.
- Pagination uses the backend's page size of 20 and metadata. Invalid page/filter values are normalized for requests; pages beyond the final page are replaced with the final valid page.
- Details always load from the individual endpoint, including shared links. Total is amount plus fee in the transaction currency, using integer minor units. Deposit, transfer-in and conversion retain the starter's credit convention.
- Date groups and displayed timestamps use the browser's local timezone consistently. API date filters, when supplied in a URL, retain the backend's UTC interpretation.
- The visible filters are type and status, as shown in the screenshots. Existing `currency`, `from` and `to` URL filters are supported and disclosed in the UI, but no extra controls were invented.
- The supplied filter-options frame includes Reversed, absent from the documented transaction response statuses. It is supported as a filter-only value: the unchanged backend accepts `status=reversed` and returns no matches. It remains in the URL and uses the normal no-results/clear-filters behavior. Response domain types remain aligned with the API.
- Native selects retain browser keyboard and mobile picker behavior; their opened menus vary by browser rather than reproducing the reference's custom menu styling exactly.
- Exact Figma measurements/assets were unavailable because the connector rejected access. Existing design tokens and icons were reused against the supplied screenshots, including the filter-options frame.

## Noticed but not fixed

- Pixel-perfect Figma verification remains pending editor access or full-resolution exports; filter option labels and order have been checked against the supplied frame.
- Broader conversion-page behavior, including stale rate responses and floating-point exchange calculations, remains outside this page's scope.
- Dependency installation reported five high-severity audit findings in the starter dependency tree. Dependency upgrades were not included in this feature change.
- Publishing a personal public repository, committing the working branch, opening a PR, and emailing the submission remain for the candidate. The starter `main` remains unchanged.

## How I tested it

- Before the Reversed follow-up: `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test` (20 passing tests), and `npm run build` passed. The follow-up adds a 21st regression test, but permission to rerun tests was declined. TypeScript passed, and a direct request to `/api/transactions?status=reversed` returned an empty list with total zero. Rerun the suite before submission.
- Added tests for HTTP failures, abort propagation, stale-response ordering, retries, URL filters and search, pagination ranges, untrusted narration, details fees and 404 versus transient failure.
- Browser checks at desktop and 375px: long narration and large values, mobile details, Escape dismissal, no results and clear filters, status filtering, pagination, Back, refresh, and recovery after a mock API failure.
- Tests ran on the available Node 22.19 runtime, which satisfies package.json; the README recommends Node 24. Repeat CI on Node 24 before submission.

## AI usage

Codex inspected the starter, implemented the page and shared fixes, wrote tests, and checked the browser against the provided screenshots. Figma connector access failed, so screenshots and existing tokens were used. Candidate review of the implementation and these decisions is still pending.

## Time spent

Approximately 45 minutes of AI-assisted inspection, implementation and validation, excluding time waiting for screenshots. Add the candidate's own review time before submitting.
