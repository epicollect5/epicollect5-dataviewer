# Known legacy defects — do not reproduce in `vue-port/`

The legacy React app (`app/`) is being rewritten in Vue (`vue-port/`). The Jest suite in
`__tests__/` characterises the legacy behaviour so that the rewrite has a specification to work
from.

**That makes the tests a porting contract.** A test that asserts a buggy value as the *expected*
result is a mechanism for faithfully porting the bug. The rule the legacy suite follows is
therefore:

> **No test asserts a known defect as expected behaviour.** The reachable, non-defective paths are
> asserted; the defect itself is listed below and left untested.

A green legacy suite is **not** evidence that these are fixed. They are still there in `app/`.

This document is the artefact the Vue work reads. Each entry gives the file and line in `app/`, the
mechanism, and what the Vue implementation must do instead.

## How the entries are tagged

The three tags carry different obligations, so they are not interchangeable:

| Tag | Meaning | Obligation in `vue-port/` |
|---|---|---|
| **[not portable]** | Dead code, or a broken import that never crashes. | Nothing — the code will not exist in Vue. Listed so nobody "fixes" it in `app/`. |
| **[re-implemented]** | A path Vue writes from scratch anyway. | Any new guard or state change must be justified by **Vue's own** failure mode (see the Refactoring Rules in `AGENTS.md`), not inherited from legacy. |
| **[live]** | Behaviour a faithful port would copy verbatim. | Must **not** be reproduced. This is the list that matters. |

Only three of the ten are **[live]**, and only one of those is user visible.

---

## 1. [not portable] `this` in a function component

**`app/components/ButtonImport.js:9`**

```js
onClick={() => {
    this.handleImport();
}}
```

`this` is `undefined` in module scope, so the click throws a `TypeError`.

The file is **not imported anywhere** — it is dead code. It will not exist in Vue, and there is
nothing to fix in `app/`.

## 2. [not portable] `ModalStartDate` has no state and undefined globals

**`app/components/ModalStartDate.js`**

- `this.state.selectedStartDate` (line 27) throws — the component has no constructor state, so
  `this.state` is `null`.
- `endDateInJS` / `startDateInJS` (lines 33–34) are undefined globals → `ReferenceError`.
- `handleStartDateClick` and `onStartDateApplyClick` are not defined at all.

The file is **not imported anywhere** — it is dead code. The date pickers live in
`containers/FilterEntriesControls.js` instead.

## 3. [not portable] broken import of a non exported action

**`app/containers/Main.js:5` and `app/containers/Main.js:194`**

```js
import { fetchProject, fetchProjectAndEntries, toastResetState } from 'actions';
```

`app/actions/index.js` exports only `fetchProjectAndEntries` and `toastResetState`. Redux 3's
`bindActionCreators` skips non-functions, so `this.props.fetchProject` is `undefined`. It is never
called, so nothing crashes.

Vue has no `bindActionCreators`, so the equivalent mistake would be a missing import that the
bundler catches. Not a porting risk.

## 4. [re-implemented] delete a row before any page has loaded

**`app/reducers/tableReducer.js:261`**

```js
const newTotal = state.pagination.total - 1;
```

`initialState.pagination` is `null` (line 27), so dispatching `DELETE_ENTRY + '_FULFILLED'` before
any table page has loaded throws a `TypeError`.

Unreachable through the UI — a delete always originates from a rendered row.

**In Vue:** initialise the pagination state (or guard it) on its own terms. The Vue store has no
`combineReducers` default, so "the initial state is null" is a Vue decision, not a legacy one.

## 5. [live] a hardcoded two second delay on every table page

**`app/actions/index.js:485–491`**

```js
axios.get(requestUrl)
    .then(function(response) {
        setTimeout(function() {
            dispatch({ type: FETCH_ENTRIES_TABLE_PAGE + '_FULFILLED', ... });
        }, 2000);
    })
```

**This is the only user visible defect in this list.** Every table page fetch waits two extra
seconds before the rows appear, and the delay exists for no reason.

**In Vue: drop it.** Dispatch `_FULFILLED` as soon as the request resolves. (The legacy test
asserts the `_FULFILLED` dispatch, not the delay, so the porting contract is not affected.)

## 6. [re-implemented] module level mutable state in a reducer

**`app/reducers/navigationReducer.js:49`**

```js
let hierarchyNavigatorCopy;
```

A module scope variable mutated by the reducer. It is reassigned before every read, so no value
leaks today, but it makes the reducer impure and its behaviour depends on module evaluation order.

**In Vue:** keep the navigation state in the store and derive the copy locally, as the rest of the
reducers already do.

## 7. [live] unguarded dereference of the answer and of the raw entry

**`app/utils/entry-parser.js:23`**

```js
if (rawEntry.answers[inputRef].was_jumped) {
```

Two unguarded dereferences: `rawEntry` (which is `currentEntry.branch_entry` when `branchInputRef`
is set, otherwise `currentEntry.entry`) and `answers[inputRef]`. The only guard is at the call site,
`app/utils/table.js:157`:

```js
if (currentEntry.answers[inputRef]) {
```

which covers the answer but not `rawEntry`.

**In Vue: guard at the parser.** The parser is the boundary that owns the shape of the answer, so
that is where the check belongs — not in the caller.

## 8. [re-implemented] the form navigation bounds check is always true

**`app/utils/table.js` — `getChildFormRef` / `getParentFormRef`, and
`app/utils/helpers.js` — `getParentFormForUpload`**

```js
if (i !== len) {
```

`i` never reaches `len` inside the loop, so the check is always true (it should be
`i !== len - 1`). When the ref **is** found at the last (resp. first) index, the function
dereferences `forms[i + 1].ref` / `forms[i - 1].ref` on `undefined` and throws a `TypeError`. It
only returns `false` when the ref is absent from the list entirely.

Unreachable through the UI — navigation only calls these when a next/previous form exists.

**In Vue:** the tests assert the working paths only (mid-list resolution, and `false` for a ref
that is not in the list). The boundary case is deliberately not asserted, so the legacy suite does
not cement the defect — and Vue is free to return `false` there.

## 9. [live] the bulk upload promise never settles on a network failure

**`app/utils/requests.js` — `uploadOneEntry`**

```js
.catch((error) => {
    if (error.response) {
        resolve(error.response.data);
    }
});
```

There is no `reject`. A failure that carries no `response` (a network error, a timeout, a DNS
failure) leaves the returned promise **pending forever**. Callers await it for the bulk upload
result, so such a failure hangs the upload flow with no error shown.

**In Vue: reject (or time out).** The upload flow must surface the failure instead of hanging.

## 10. [re-implemented] `getQueryString` never returns the query string

**`app/utils/helpers.js:107`**

```js
getQueryString(url) {
    const urlParts = url.split('?', 1); //split only on first occurrence
    return urlParts[urlParts.length - 1];
}
```

`String.prototype.split`'s second argument is a **limit on the number of results**, not a limit on
the number of splits. `'a?b'.split('?', 1)` returns `['a']`, so the helper always returns the URL
up to the first `?` and never the query string.

Its only caller is `app/containers/Main.js:47`, where the result is used to strip the query string
from the base path — so the bug is currently harmless there.

**In Vue:** if a query string is needed, read it explicitly. The legacy suite deliberately does **not** assert this helper: pinning the broken return
value would make it look like a contract. See the rule at the top of this document.

---

## Summary

| # | Where | Tag | Reproduce in Vue? |
|---|---|---|---|
| 1 | `app/components/ButtonImport.js:9` | not portable | no — dead code |
| 2 | `app/components/ModalStartDate.js` | not portable | no — dead code |
| 3 | `app/containers/Main.js:5,194` | not portable | no — broken import |
| 4 | `app/reducers/tableReducer.js:261` | re-implemented | guard it, on Vue's terms |
| 5 | `app/actions/index.js:485–491` | **live** | **no — drop the 2s delay** |
| 6 | `app/reducers/navigationReducer.js:49` | re-implemented | no — keep the state pure |
| 7 | `app/utils/entry-parser.js:23` | **live** | **no — guard at the parser** |
| 8 | `app/utils/table.js`, `app/utils/helpers.js` | re-implemented | fix the bounds check |
| 9 | `app/utils/requests.js` | **live** | **no — reject on failure** |
| 10 | `app/utils/helpers.js:107` | re-implemented | read the query string explicitly |

## Where the behaviour is pinned

The legacy suite lives in `__tests__/` and mirrors `app/`:

- `__tests__/reducers/` — the Redux state layer
- `__tests__/utils/` — the display pipeline (`entry-parser` → `entry-group-parser` → `table`),
  the map and chart maths, and the small helpers
- `__tests__/actions/index.test.js` — the action layer

These are Jest tests against the legacy React app. When the Vue port lands, they migrate to Vitest
against the new implementation — the assertions are the specification, not the legacy code.
