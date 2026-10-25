# Table Page Styling Audit

Comparing the Vue port's table page against the legacy viewer. Scope: page shell, secondary navbar, filter bar, grid, empty/loading states, upload button, typography, palette and icons. Drawers and modals are out of scope.

Method: the legacy theme (`app/theme/_table.scss`, `_secondaryNavbar.scss`, `_filterEntriesControls.scss`, `_variables.scss`, `_mediaQueries.scss`), the legacy DOM (`app/containers/table/Table.js`, `TableCell.js`, `CellChildren.js`, `CellBranch.js`, `SecondaryNavbar.js`, `FilterEntriesControls.js`, `UploadEntriesControls.js`) and the legacy stylesheet sources (`app/index.html` loads Google's Arimo plus `site.css` / `vendor-site.css`) were compared against the port's `src/theme/table/*`, `src/theme/pages/PageTable.scss`, `src/theme/app/NavbarSecondary*.scss`, `src/theme/variables.css` and its components. No live side-by-side was possible: the legacy app and the map/entries endpoints sit on another server branch.

## Before changing anything: pick the target

Two of the three delta families below are *direction*, not defects, and they need a decision because they pull against each other:

- **Pixel parity with `site.css`**: copy Arimo, the 13px table text, the 32px dark navbar, flat bootstrap buttons and the fixed-data-table look. Some of this fights Ionic (heights, button parts, ripple).
- **Ionic-native look, legacy structure**: keep the current frosted/rounded shell, port only the *functional* facts from the legacy layout (which columns exist, sizes, states) and consciously drop pixel parity. This is close to what the port does today.

Items tagged **defect** hold in either direction (missing state, hidden/shown mismatch, wrong number, wrong text). Items tagged **direction** only matter if the first option is chosen.

## Page shell

| # | Legacy | Port | Gap | Type | Effort |
|---|---|---|---|---|---|
| 1 | `body { font-family: Arimo }`, Arimo loaded from Google Fonts | No `font-family` anywhere in `src/theme`; falls back to Ionic's system stack | Different typeface everywhere, changing perceived weight/size of the whole page | defect (if Arimo is the brand font) | S |
| 2 | Page background is flat (`site.css` / white, `$light-grey` panels) | `src/theme/main.scss` paints a purple radial gradient over a white→`--app-bg` gradient | Every surface sits on a tinted, high-contrast backdrop the legacy app never had | direction | S |
| 3 | Fixed navbars, table wrapper `margin-top: 60px`, document scroll, table height = `window.innerHeight - 230` | Ionic shell with internal scroll, `PageTable` uses flex + 10px padding, no offset | Page height/scroll behaviour differs; a very tall page scrolls differently | direction | M |
| 4 | Table text `font-size: 13px` for the whole wrapper | AG Grid Quartz defaults (14px body, 13px headers only) | Slightly larger, looser rows than legacy | direction | S |

## Secondary navbar (table controls)

| # | Legacy | Port | Gap | Type | Effort |
|---|---|---|---|---|---|
| 5 | Height **32px**, `background: rgba(51,6,70,.6)`, white text, sits under a 64px primary navbar | `min-height: 56px`, primary at 80% opacity with `backdrop-filter: blur(12px)` and a 30px shadow | Navbar is ~24px taller, translucent-blurred and shadowed instead of a flat dark strip | direction | S |
| 6 | Pagination is bare text: `Total: 12, ` + `3/4` + two borderless white chevrons, hover `$hot-pink` (#c159b3) | `Total 12 \| Page 3/4` + two 34px rounded buttons with circle icons and a light border | Wording, icon shape and button chrome all differ; loses the pink hover | direction | S |
| 7 | Add-entry is a text link (`playlist_add` icon + "Add {name}", underline on hover) | A bordered pill with `addCircle` icon and a label that collapses under 600px | Different affordance for the same action | direction | S |
| 8 | Back navigation is a bare `arrow_back` / `chevron_left` icon button | 36px rounded button with hover fill | Similar function, different chrome | direction | S |

## Filter bar

| # | Legacy | Port | Gap | Type | Effort |
|---|---|---|---|---|---|
| 9 | Inline row **above the table**: title input (`Filter by title`, col-sm-5), right-aligned small bootstrap buttons `From: <date>`, `To: <date>`, order dropdown showing the current value, and an `X` clear-all; the date pickers are `react-day-picker` popovers | Own light bar (`NavbarSecondaryLight`, 56px) with `ion-searchbar` (6fr), two `ion-datetime-button`s with `From:`/`To:` prefixes, order `Dropdown`, and a 40px `X` icon button; the pickers are `ion-datetime` calendars | Same controls, different widgets and spacing; dates are 42px tall Ion buttons, and the calendar is Ionic's instead of `react-day-picker` | direction | M |
| 10 | Dates read as one label (`From: 01/01/2024`) inside the button | Prefix is a separate absolutely-positioned `From:` span, the date comes from the Ion button | Label/date alignment and truncation behave differently on narrow widths | direction | S |
| 11 | Mobile: `From`/`To` duplicate into a second, right-aligned row while the desktop copies stay in the group above 768px | Every control stacks into one column at 768px, search first | Mobile ordering and grouping differ (legacy keeps the title input on its own half-width row) | direction | S |

## Grid structure

| # | Legacy | Port | Gap | Type | Effort |
|---|---|---|---|---|---|
| 12 | **Delete and Edit columns render only when the user is logged in** (`isUserLoggedIn` in `Table.js`); anonymous visitors see View + data only | All three action columns always render; Edit/Delete are merely disabled | Anonymous/public viewers get 140px of dead buttons legacy never showed | defect | S |
| 13 | Column widths: View/Delete/Edit **58**, children **120**, title **150**, created at **150**, each question **200** | Action **70**, children **110**, title **220**, created at **160**, question **200** | Title and action columns are wider, the children column narrower | direction | S |
| 14 | Pinned columns only when the container is > **768px**; below that the whole table scrolls | `pinned: 'left'` on five fixed columns at every width | On a phone the pinned area is ~540px of a ~360px viewport, so the data columns are barely reachable | defect (mobile usability) | M |
| 15 | Row height **50**, header height **50** | Row height **50**, header height left to the Quartz theme's default | Header band does not match legacy's 50px | direction | S |
| 16 | No coloured grid frame; fixed-data-table's own light grid lines | 1px purple-tinted borders on every column plus a 4px radius and outer border | Visibly heavier separator lines | direction | S |
| 17 | No zebra striping, no row hover | `--ag-odd-row-background-color` 3% purple, hover 12% green, selected 20% green | Rows are tinted in the port and not in legacy | direction | S |
| 18 | Header cells are plain (white, bold, 13px); no sort affordance | Quartz header with 8% purple background, 13px | Header band colour and weight differ | direction | S |
| 19 | Cell content `padding-left: 5px`, `line-height: 50px`, single line with ellipsis | AG Grid default cell padding (~8px), vertically centred, ellipsis | Slight left padding/vertical rhythm difference | direction | S |

## Cells

| # | Legacy | Port | Gap | Type | Effort |
|---|---|---|---|---|---|
| 20 | Children/branch count: **16px bold, `$deep-purple` (#673b91), underlined**, 10px padding (`countButton` mixin) | Count inherits the cell font (~14px), `--ion-text-color`, bold, **no underline** | The count no longer reads as a link — the single most-used affordance in the table | defect | S |
| 21 | Add-entry icon in the cell is a small green icon floated right, `margin-top: -2px` | 34px round green pill button in a 34px grid track | Larger, rounder, and it shifts the count left | direction | S |
| 22 | Action buttons: bootstrap `btn-icon` in a 5px padded, centred cell; disabled = `$light-grey` background with white icon | 34px circles; disabled = 55% opacity | Disabled actions look "faded" rather than "flat grey" | direction | S |
| 23 | Media thumb: `img { border: 1px solid #bbb; padding: 2px }` centred, natural aspect ratio | 50px button, `aspect-ratio: 1/1`, `object-fit: cover`, 1px `#bbb` frame + white mat | Thumbnails are cropped square in the port and keep their aspect ratio in legacy | direction | M |
| 24 | Icons are **Material Icons** (`remove_red_eye`, `delete`, `edit`, `add`, plus `playlist_add` in the navbar) | **Ionicons** SVG (`eye`, `trash`, `pencil`, `addCircle`) | Different glyph set on every action: the eye differs in shape, the add icon is a circled plus instead of a plain one | direction | M |

## Empty, error and loading states

| # | Legacy | Port | Gap | Type | Effort |
|---|---|---|---|---|---|
| 25 | No rows: `<h2>No entries found.</h2>`, absolutely centred in the table area (`centerOnPage`) | `h1` "No Entries Found" + explanatory paragraph, left-aligned block with 32px padding | Different wording, heading level and placement; the port's empty state occupies the top-left instead of the centre | defect (wording) | S |
| 26 | Fetching: the table is **replaced** by a centred `Loader` (`table-loader`) | Rows stay mounted, dimmed under a white scrim with a spinner; the grid is set `visibility: hidden` | Legacy hides the previous page's data, the port shows it dimmed — different perceived speed | direction | S |
| 27 | Failed load: bootstrap alert with the server errors (`ErrorView`) | `placeholder-view` with `h1` "Entries Load Failed" and joined error strings | Different presentation of errors | direction | S |

## Upload button

| # | Legacy | Port | Gap | Type | Effort |
|---|---|---|---|---|---|
| 28 | Text link `cloud_upload` + "Upload" + **`<sup>Beta</sup>`**, `$deep-purple`, absolutely placed bottom-right of the table area, with `disabled`/`hidden` variants | Solid green pill "UPLOAD" (uppercase) with cloud icon in a 50px footer at the bottom-right | Placement matches; colour, shape and the missing "Beta" marker differ | direction | S |
| 29 | Enabled/disabled by role and `can_bulk_upload` (NOBODY/MEMBERS/EVERYBODY), `hidden` when nobody may upload | Always shown; nothing in `src/` reads `can_bulk_upload` or `access`, so a project that forbids bulk upload still shows the button | Functional, not styling: the button can open a drawer the project disabled | defect | S |

## Suggested order (cheapest first)

Everything below is small unless marked; do the defects first because they hold regardless of the styling decision.

1. **#12** hide Delete/Edit columns when nobody is signed in (and keep them for the dev bypass), so the grid matches legacy for public viewers.
2. **#14** stop pinning columns below ~768px.
3. **#29** gate the upload button on `can_bulk_upload` / role, and hide it where legacy hides it.
4. **#20** restore the underlined purple count styling — it is the table's primary interaction cue.
5. **#25** switch the empty state to legacy's centred "No entries found." and **#27** match the error copy.
6. **#1** load Arimo and set the base font (decides most of the perceived difference).
7. **#13/#15/#19** align column widths, header height and cell padding.
8. **#5/#6** navbar height, colour and pagination chrome.
9. **#16/#17/#18** grid frame, striping and header tint — remove if going Ionic-native, match if going pixel-parity.
10. **#23** media thumb aspect ratio, then **#24** the icon set (the only large item, because a Material Icons set has to be wired through the grid renderers and the nav).
