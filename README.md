# PixCodes

A browser game where you match a rendered target by writing the HTML and CSS behind it. Fifteen
levels, from centring a card to a scroll-driven progress bar and cascade layers. Everything runs
in the tab, and progress is saved on this machine.

## Run it

```
npm install
npm run dev     # http://localhost:5300
npm test        # node --test, the pure logic plus the level specs
npm run lint    # oxlint
npm run build   # vite build
```

## How a level works

A level is one object: a brief, a starter, a reference solution, and a list of checks. The target
panel renders the reference through the same harness your attempt runs in, so a measurement means
the same thing on both sides. Press Run the checks and each check runs in the sandbox one at a
time, and reports its own reason when it fails.

There are two modes:

- `css`: the markup belongs to the level, and you write the stylesheet.
- `document`: the whole document is yours, markup and script both.

A check that returns nothing is treated as a bug in the level, never as a pass, so a check can
never pass by staying quiet.

## The sandbox

The target and your attempt each render inside an iframe with `sandbox="allow-scripts"` and no
`allow-same-origin`, which gives the frame an opaque origin. Your code cannot reach this page's
DOM, storage or cookies, and `parent.document` throws rather than returning. The parent accepts a
result only from the frame's own window.

Two details in there were bugs before they were tests:

- The harness never replaces its own document. `document.open()` tore down the frame's message
  listener, so the frame answered one run and then went silent.
- A run never waits on a paint. A frame scrolled out of view, or sitting in a background tab, is
  not painted, so animation frames never fire there. Every wait has a timer standing behind it, so
  the run finishes either way.

## Adding a level

1. Add `src/game/levels/NN-name.js` and register it in `src/game/levels/index.js`.
2. Run `npm test`.

The level set is validated on every test run: ids and ordinals are unique, every check compiles
against the helper preamble, a document level keeps every style inside its own html, and every
level starts unsolved.

## Where things live

| Path | What it holds |
|---|---|
| `src/game/levels/` | The fifteen levels, one file each, plus the ordered set |
| `src/game/runtime/harness.js` | The sandbox document, both render shapes, the check runner |
| `src/game/runtime/sandbox.js` | The parent half of the message protocol, with the watchdog |
| `src/game/runtime/check-helpers.js` | The helpers every check reads with, and the stage size |
| `src/lib/judge.js` | Grading and xp, pure so `node --test` can cover it |
| `src/lib/levels.js` | Ordering, unlocking, totals |
| `src/lib/store.js` | Progress and drafts in localStorage |

## Honest limits

- Progress and drafts live in this browser's localStorage. There is no account and no scoreboard,
  so a cleared level is only ever your own record.
- The board runs a dark workbench that is PixCodes' own: deep ink ground, cream editor and
  target sheets, navy ink and one orange kept from the portfolio, JetBrains Mono on the ordinals
  and xp. The change to `dark` is bound to a class nothing adds, so a dark OS cannot flip the
  game into a theme nobody designed.
- A run the frame never measured is reported as unmeasured. It is not scored, and it does not count
  as an attempt, so a frame that goes quiet costs you nothing.
