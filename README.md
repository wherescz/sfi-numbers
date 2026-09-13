<p>
  <img alt="Licence MIT" src="https://img.shields.io/badge/licence-MIT-036ee6?style=flat-square">
  <img alt="Bundle 13 kB" src="https://img.shields.io/badge/bundle-13%20kB-1c1c21?style=flat-square">
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-none-1c1c21?style=flat-square">
  <img alt="React 18 or 19" src="https://img.shields.io/badge/React-18%20%7C%2019-1c1c21?style=flat-square">
  <img alt="Types included" src="https://img.shields.io/badge/types-included-1c1c21?style=flat-square">
  <img alt="Zero config" src="https://img.shields.io/badge/SSR-safe-1c1c21?style=flat-square">
</p>

A counter that turns rather than blinks. Each column is a strip of digits behind
a window; changing the value turns only the columns whose digit actually moved,
and the box grows or shrinks to fit what it now says.

From **The San Francisco Interface**, shipped on its own for projects that want
the readout and nothing else.

```sh
npm i @sfi/numbers
```

```tsx
import { Numbers } from "@sfi/numbers";
import "@sfi/numbers/styles.css";

<Numbers value={count} />
```

---

## What it does that a counter usually does not

**Only what changed moves.** Add one to `1,240` and a single wheel turns. Add
forty-seven and three do, each by a different distance, on the same clock.

**It turns the way the number went.** Counting up out of `9` goes forward to `0`
rather than back through eight digits. Pin it with `trend` when the value moves
the opposite way to the thing it measures — a countdown, a burn-down, a stock
going the wrong way.

**It is the number in your type.** Face, size, weight, colour and tracking are
all inherited. The stylesheet describes motion and geometry and nothing else, so
a readout in a heading is the heading's type and a readout in a caption is the
caption's.

**It reads as one number.** The visible digits are `aria-hidden`; a single
formatted string sits behind them for assistive technology, so a screen reader
says "one thousand two hundred and four", not twelve separate glyphs.

---

## Formatting

Formatting is `Intl.NumberFormat`. Currency, percentages, compact notation,
numbering systems and every locale come from the platform, not from here.

```tsx
<Numbers value={1125.64} format={{ style: "currency", currency: "USD" }} />
<Numbers value={0.0241}  format={{ style: "percent", maximumFractionDigits: 2 }} />
<Numbers value={48200}   format={{ notation: "compact" }} locale="en-GB" />
```

## Transitions

Five ways for a column to change. Only `roll` turns through the digits between.

```tsx
<Numbers value={n} transition="tick" />
```

| | |
| --- | --- |
| `roll` | the strip turns, through every digit on the way |
| `tick` | the old digit slides out, the new one slides in |
| `blur` | it dissolves, defocused, in place |
| `flip` | it turns over, like a split-flap board |
| `scale` | it shrinks away and the new one grows |

## How much of the roll you see

`fade` is how far the soft edge of the window reaches, and while a column turns
it deepens so the passing digits go ghostly and settle back.

```tsx
<Numbers value={n} fade={0} />     // hard window, the neighbours fully there
<Numbers value={n} />              // 1
<Numbers value={n} fade={2.4} />   // one digit read, the rest a suggestion
```

---

## Props

Everything else is spread onto the root `<span>`.

| prop | type | default |
| --- | --- | --- |
| `value` | `number` | **required** |
| `format` | `Intl.NumberFormatOptions` | — |
| `locale` | `string \| string[]` | the runtime's |
| `transition` | `"roll" \| "tick" \| "blur" \| "flip" \| "scale"` | `"roll"` |
| `trend` | `"auto" \| "up" \| "down"` | `"auto"` |
| `blur` | `boolean` | `true` |
| `fade` | `number` | `1` |
| `duration` | `number` (ms) | `520` |
| `label` | `string` | the formatted value |

## Theming

Every value is a custom property. Set one on `:root` for the app, on a wrapper
for a region, or inline for a single readout.

| token | default | |
| --- | --- | --- |
| `--sfi-numbers-roll` | `520ms` | how long a column takes to turn |
| `--sfi-numbers-exit` | `240ms` | how long a column leaving the number takes to go |
| `--sfi-numbers-cell` | `1.4em` | the pitch the digits are stacked at |
| `--sfi-numbers-blur` | `0.09em` | the deepest a fast column smears |
| `--sfi-numbers-fade` | `1` | how far the window's soft edge reaches |
| `--sfi-numbers-fade-roll` | `1.9` | how much further it reaches mid-turn |
| `--sfi-numbers-ease` | `cubic-bezier(0.32, 0.72, 0, 1)` | the curve a column turns on |
| `--sfi-numbers-ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | and the one it leaves on |

```css
:root {
  --sfi-numbers-roll: 700ms;
  --sfi-numbers-cell: 1.25em;
}
```

The stylesheet ships in one `@layer arc`, below your own rules, so a `className`
of yours always wins without `!important`.

## Reduced motion

With `prefers-reduced-motion: reduce` the columns do not turn, do not blur and
do not fade. The number changes to its new value, and the component never
animates a thing.

## Requirements

React 18 or 19. No dependencies. Types are bundled. It renders on the server
with the formatted value already in the markup, so there is no flash of an empty
box and nothing to guard.

## Licence

MIT.
