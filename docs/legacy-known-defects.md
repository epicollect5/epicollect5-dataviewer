# Known legacy defects — do not reproduce in `vue-port/`

The legacy React app (`app/`) is being rewritten in Vue (`vue-port/`). The Jest suite in
`__tests__/` characterises the legacy behaviour so that the rewrite has a specification to work
from.

**That makes the tests a porting contract.** A test that asserts a buggy value as the *expected*
result is a mechanism for faithfully porting the bug. The rule the legacy suite follows is
therefore:

> **No test asserts a known defect as expected behaviour.** While a defect was unfixed, the
> reachable, non-defective paths were asserted and the defect itself was left untested. Once fixed
> (see **Legacy status**), the tests assert the corrected behaviour.

The ten defects below have since been fixed in `app/`. They stay in this document because the
analysis is what the Vue work reads: each entry gives the mechanism, what the legacy fix was, and
what the Vue implementation must do instead. A green legacy suite is **not** a specification of
correct behaviour on its own — the entries below still mark what a faithful port must not
reproduce.

## How the entries are tagged

The three tags carry different obligations, so they are not interchangeable:

| Tag | Meaning | Obligation in `vue-port/` |
|---|---|---|
| **[not portable]** | Dead code, or a broken import that never crashes. | Nothing — the code will not exist in Vue. Listed so nobody "fixes" it in `app/`. |
| **[re-implemented]** | A path Vue writes from scratch anyway. | Any new guard or state change must be justified by **Vue's own** failure mode (see the Refactoring Rules in `AGENTS.md`), not inherited from legacy. |
| **[live]** | Behaviour a faithful port would copy verbatim. | Must **not** be reproduced. This is the list that matters. |

Three of the ten are **[live]**. Two of those are genuine defects — #7 throws on a malformed entry
and #9 hangs the bulk upload on a network failure. #5 turned out to be intentional (a minimum
loader time), not a defect; see its entry.

## Legacy status

All ten were fixed on `fix/legacy-known-issues`, one commit per defect, with `npm test` green after
every commit. Each entry below records what the fix was, and its file/line references point at the
fixed code.

| Commit | Covers |
|---|---|
| `2a094e6` `chore(legacy): remove the unused components and the phantom import` | 1, 2, 3 |
| `3438d76` `fix(utils): return the query string of an url` | 10 |
| `f898954` `fix(utils): correct the form navigation bounds checks` | 8 |
| `373f9ca` `fix(reducers): guard the delete entry pagination` | 4 |
| `a0390e6` `refactor(actions): name the table page loading delay` | 5 |
| `544b007` `refactor(reducers): keep the navigation state out of module scope` | 6 |
| `7abe805` `fix(utils): guard the answer dereference in the entry parser` | 7 |
| `fe93970` `fix(requests): settle the bulk upload promise on network failure` | 9 |
| `7ae167a` `fix(containers): ignore the stale responses of a stopped upload` | 9 (follow-up) |
| `4f49bd6` `fix(containers): stop the upload when the modal is closed` | 9 (follow-up) |

Fixing `app/` diverges it from `vue-port/`, which lives on `codex/datavuer`. The same fixes have to
be re-applied there.

---

## 1. [not portable] `this` in a function component

**`app/components/ButtonImport.js`** — deleted

```js
onClick={() => {
    this.handleImport();
}}
```

`this` is `undefined` in module scope, so the click throws a `TypeError`.

The file was **not imported anywhere** — it was dead code.

**Legacy status:** fixed — the component was deleted, together with its now unused `.button-import`
rule in `app/theme/app.scss` and the rebuilt `dist/dataviewer.css`.

**In Vue:** nothing. The component will not exist.

## 2. [not portable] `ModalStartDate` has no state and undefined globals

**`app/components/ModalStartDate.js`** — deleted

- `this.state.selectedStartDate` threw — the component had no constructor state, so `this.state`
  was `null`.
- `endDateInJS` / `startDateInJS` were undefined globals → `ReferenceError`.
- `handleStartDateClick` and `onStartDateApplyClick` were not defined at all.

The file was **not imported anywhere** — it was dead code. The date pickers live in
`containers/FilterEntriesControls.js` instead.

**Legacy status:** fixed — the component was deleted. The `.start-date-modal` styles stay in
`app/theme/app.scss`: they are still used by `containers/FilterEntriesControls.js`.

**In Vue:** nothing. The component will not exist.

## 3. [not portable] broken import of a non exported action

**`app/containers/Main.js:5` and `app/containers/Main.js:193`**

```js
import { fetchProject, fetchProjectAndEntries, toastResetState } from 'actions';
```

`app/actions/index.js` exported only `fetchProjectAndEntries` and `toastResetState`. Redux 3's
`bindActionCreators` skips non-functions, so `this.props.fetchProject` was `undefined`. It was never
called, so nothing crashed.

**Legacy status:** fixed — `fetchProject` was removed from both the import and the
`bindActionCreators` call.

**In Vue:** nothing. Vue has no `bindActionCreators`, so the equivalent mistake would be a missing
import that the bundler catches. Not a porting risk.

## 4. [re-implemented] delete a row before any page has loaded

**`app/reducers/tableReducer.js:257–283`** — `DELETE_ENTRY + '_FULFILLED'`

```js
const newTotal = state.pagination.total - 1;
```

`initialState.pagination` is `null` (line 27), so dispatching `DELETE_ENTRY + '_FULFILLED'` before
any table page has loaded threw a `TypeError`.

Unreachable through the UI — a delete always originates from a rendered row.

**Legacy status:** fixed — when `pagination` is still `null` the case removes the row and clears
`rowIndexToDelete`, and leaves `pagination` unchanged; otherwise it also decrements the total. A
reducer test covers the no-pagination path.

**In Vue:** initialise the pagination state (or guard it) on its own terms. The Vue store has no
`combineReducers` default, so "the initial state is null" is a Vue decision, not a legacy one.

## 5. [live] a two second delay on every table page

**`app/actions/index.js:494`**, constant in **`app/config/parameters.js:315`**

```js
axios.get(requestUrl)
    .then(function(response) {
        setTimeout(function() {
            dispatch({ type: FETCH_ENTRIES_TABLE_PAGE + '_FULFILLED', ... });
        }, PARAMETERS.DELAY.TABLE_PAGE_MIN);
    })
```

Every table page fetch holds the rows back for a further two seconds after the response arrives.

**This is intentional, not a bug.** The delay is a **minimum loader time**: it keeps the loading
state on screen instead of letting it flash for a few milliseconds on a fast connection. The guard
against repeated clicks is a different mechanism — `paginationDisabled` in
`containers/SecondaryNavbar.js:129,146` (3 s) and the `lodash.debounce` in
`containers/FilterEntriesControls.js` (500 ms). All three arrived in the same commit (`bf9466c`),
which is what implied the delay was an anti-double-click guard: it is not.

It is still user visible — every page waits two seconds — so the port must make a deliberate
choice about it rather than inherit the number.

**Legacy status:** behaviour unchanged. The literal `2000` was named `PARAMETERS.DELAY.TABLE_PAGE_MIN`
with a comment stating what it is for. The millisecond value is identical, so every existing test
passes untouched.

**In Vue:** drop it, or define an explicit minimum-loader constant of its own. Dispatch
`_FULFILLED` as soon as the request resolves if no floor is wanted. (The legacy test asserts the
`_FULFILLED` dispatch, not the delay, so the porting contract is not affected.)

## 6. [re-implemented] module level mutable state in a reducer

**`app/reducers/navigationReducer.js`** — the variable is gone; the copies are local at lines 246,
290 and 300

```js
let hierarchyNavigatorCopy;
```

A module scope variable mutated by the reducer. It was reassigned before every read, so no value
leaked, but it made the reducer impure and its behaviour depended on module evaluation order.

**Legacy status:** fixed — the module level variable was removed and each of the three cases
(`FETCH_CHILD_ENTRIES + '_FULFILLED'`, `HIERARCHY_NAVIGATE_BACK`, `HIERARCHY_NAVIGATE_RESET`)
declares its own `const`. The existing tests cover all three paths.

**In Vue:** keep the navigation state in the store and derive the copy locally, as the rest of the
reducers already do.

## 7. [live] unguarded dereference of the answer and of the raw entry

**`app/utils/entry-parser.js:20–36`** — `getParsedEntryForDisplay`

```js
if (rawEntry.answers[inputRef].was_jumped) {
```

Two unguarded dereferences: `rawEntry` (which is `currentEntry.branch_entry` when `branchInputRef`
is set, otherwise `currentEntry.entry`) and `answers[inputRef]`. The only guard was at the call site,
`app/utils/table.js:157`:

```js
if (currentEntry.answers[inputRef]) {
```

which covers the answer but not `rawEntry`.

**Legacy status:** fixed — the answers map and the answer are read null-safely, and a missing answer
returns the same empty-answer shape the `was_jumped` path already returned. The `was_jumped` flag is
now read off the resolved answer. Three parser tests cover a missing answer, a branch entry with no
answers, and a missing branch entry.

**In Vue:** guard at the parser. The parser is the boundary that owns the shape of the answer, so
that is where the check belongs — not in the caller.

## 8. [re-implemented] the form navigation bounds check is always true

**`app/utils/table.js:209–235` — `getChildFormRef` / `getParentFormRef`, and
`app/utils/helpers.js:261–275` — `getParentFormForUpload`**

```js
if (i !== len) {
```

`i` never reaches `len` inside the loop, so the check was always true. When the ref **was** found at
the last (resp. first) index, the function dereferenced `forms[i + 1].ref` / `forms[i - 1].ref` on
`undefined` and threw a `TypeError`. It only returned `false` when the ref was absent from the list
entirely.

Unreachable through the UI — navigation only calls these when a next/previous form exists.

**Legacy status:** fixed — `getChildFormRef` now checks `i !== len - 1`, `getParentFormRef` and
`getParentFormForUpload` check `i !== 0`, so the boundary cases return `false`. The helpers were
kept rather than deleted: they are the API the port re-implements. `containers/DrawerUpload.js` now
keeps its `null` parent refs when the helper returns `false` — `utils/reverse-entry-parser.js:42`
compares them against `null`, so a leaked `undefined` would have built a malformed entry. Boundary
tests were added for all three helpers.

**In Vue:** return `false` at the boundary. The legacy tests now assert it, so the port has the
same contract.

## 9. [live] the bulk upload promise never settles on a network failure

**`app/utils/requests.js:21–48`** — `uploadOneEntry`

```js
.catch((error) => {
    if (error.response) {
        resolve(error.response.data);
    }
});
```

There was no `reject`. A failure that carries no `response` (a network error, a timeout, a DNS
failure) left the returned promise **pending forever**. Callers await it for the bulk upload
result, so such a failure hung the upload flow with no error shown.

**Legacy status:** fixed on both sides:

- `uploadOneEntry` still resolves with the server's error payload when the server answered, and
  now rejects when it did not.
- `containers/ModalUploadEntries.js` catches the rejection, records the entry as a failed row,
  shows "Upload not confirmed by the server" (it may or may not have been stored, so a retry can
  duplicate — the wording deliberately does not say "rejected"), and carries on with the next
  entry instead of stopping.
- The synthetic error carries `PARAMETERS.UPLOAD_ERRORS.CLIENT_SOURCE` / `CLIENT_CODE`, which
  `components/upload-table/RowErrorsBootstrap.js` renders on every column the way it renders the
  other upload-level errors.
- `failedReverseEntries` is now reset when a new upload round starts, so a previous round's
  failures cannot reach the "failed only" filter.
- Four container tests cover the failed row, the continued chain, and the two stale-callback cases
  below; the request-layer test would time out against the old code, which is the hang itself.
- Three more cover the stop itself: no entry is submitted after the user stopped, no result lands
  after the modal was closed, and a new run starts with an empty result state.

**A related flaw, found while fixing this one (not introduced by it):** stopping an upload does
not cancel the request that is in flight — `uploadOneEntry` has no cancel token and no timeout, so
the POST stays alive. The modal is a single, always-mounted instance (`Main.js:155` renders it
unconditionally, and `render()` returns `null` rather than unmounting), so the next upload round
shares the same `this.state.responses` and the same queue. A response from the stopped round that
arrived *after* the next round had started was therefore appended to the new round's table — and,
worse, its callback shifted an entry out of the new round's queue and started a second concurrent
upload, so entries could be uploaded twice or skipped. `wasInterruptedUpload` did not prevent it:
it is reset to `false` when the new round starts, and it is a round-level boolean, not a
per-request token.

The fix numbers each upload round (`uploadRound`) and checks it in every callback, so a late
response or failure from a stopped round is dropped instead of touching the current one. The
pre-existing success path had the same flaw and is covered by the same fix.

Closing the modal invalidates the round as well. Two things followed from the round being a
round-level flag rather than a per-request token:

- **An entry could reach the server after the user stopped the upload.** The chain waits a second
  (`PARAMETERS.DELAY.LONG`) between entries, and the entry waiting in that delay was submitted
  unconditionally: the interruption was only checked *after* the POST came back. The round and the
  interruption are now checked before the entry is submitted, so a stopped upload submits nothing
  more.
- **A result could land after the modal was closed.** Closing with the last entry still in flight
  takes the branch that does not set `wasInterruptedUpload` (the queue is already empty), so the
  late response was accepted and appended to the results — and the next run did not clear them,
  so its table showed the previous run's row. Closing now invalidates the round, and each run
  starts with an empty result state (`resultsRound`).

The round is invalidated **only when the modal really closes**: the confirmation the user gets when
entries are still queued can be declined, and declining it must leave the upload running.
Invalidating the round before the confirmation would drop the response of the pending request and
strand the upload with the modal still open.

**In Vue: reject (or time out).** The upload flow must surface the failure instead of hanging.
If the flow can be stopped, also give each upload run an identity of its own and drop the
callbacks that arrive after it ended — a cancelled request that still answers must not write into
the next run's results — and check the interruption *before* submitting, not only after.

## 10. [re-implemented] `getQueryString` never returns the query string

**`app/utils/helpers.js:107–115`**

```js
getQueryString(url) {
    const urlParts = url.split('?', 1); //split only on first occurrence
    return urlParts[urlParts.length - 1];
}
```

`String.prototype.split`'s second argument is a **limit on the number of results**, not a limit on
the number of splits. `'a?b'.split('?', 1)` returns `['a']`, so the helper always returned the URL
up to the first `?` and never the query string.

Its only caller is `app/containers/Main.js:47`, where the result was used to strip the query string
from the base path — so the bug was harmless there.

**Legacy status:** fixed — it now finds the first `?` with `indexOf` and returns the rest, or `''`
when there is none. The `Main.js` caller behaves identically in every case (the old return value
never matched, so the replace was a no-op), and a helper test pins the new contract.

**In Vue:** if a query string is needed, read it explicitly. The legacy suite deliberately does
**not** assert this helper against the broken return value. See the rule at the top of this
document.

---

## Summary

| # | Where | Tag | Legacy status | Reproduce in Vue? |
|---|---|---|---|---|
| 1 | `app/components/ButtonImport.js` | not portable | deleted | no — dead code |
| 2 | `app/components/ModalStartDate.js` | not portable | deleted | no — dead code |
| 3 | `app/containers/Main.js:5,193` | not portable | import removed | no — broken import |
| 4 | `app/reducers/tableReducer.js:257` | re-implemented | guarded | guard it, on Vue's terms |
| 5 | `app/actions/index.js:494` | **live** | constant named, value unchanged | **decide on your own; no inherited 2s** |
| 6 | `app/reducers/navigationReducer.js` | re-implemented | local copies | no — keep the state pure |
| 7 | `app/utils/entry-parser.js:20` | **live** | guarded | **no — guard at the parser** |
| 8 | `app/utils/table.js`, `app/utils/helpers.js` | re-implemented | bounds corrected | fix the bounds check |
| 9 | `app/utils/requests.js:21` | **live** | rejects and reports | **no — reject on failure** |
| 10 | `app/utils/helpers.js:107` | re-implemented | returns the query string | read the query string explicitly |

## Where the behaviour is pinned

The legacy suite lives in `__tests__/` and mirrors `app/`:

- `__tests__/reducers/` — the Redux state layer
- `__tests__/utils/` — the display pipeline (`entry-parser` → `entry-group-parser` → `table`),
  the map and chart maths, and the small helpers
- `__tests__/actions/index.test.js` — the action layer
- `__tests__/containers/` — the Redux-connected containers, including the bulk upload flow

These are Jest tests against the legacy React app. When the Vue port lands, they migrate to Vitest
against the new implementation — the assertions are the specification, not the legacy code.
