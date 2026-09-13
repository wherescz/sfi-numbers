<div align="center">

<img src="https://i.ibb.co/JW039HkW/wifmef.png" width="1920" height="400" alt="">

### @sfi/numbers

Numbers that move the way they should. A React component from **The San Francisco Interface**.

<img src="https://github.com/wherescz/sfi-numbers/blob/7d99a099ac153e5b2cef80f33e264606d54ef0f1/tags.svg" alt="MIT · 13 kB · No dependencies · React 18 and 19 · TypeScript · SSR ready">

<br>
<br>
<br>

<img src="https://github.com/wherescz/sfi-numbers/blob/3311b4e84cd7e4ba7119cefd76a0bb57f8ebed8b/preview-gif.gif" width="1920" alt="A number rolling from 1,204 to 1,251">

</div>

<br>

```sh
npm i @sfi/numbers
```

```tsx
import { Numbers } from "@sfi/numbers";
import "@sfi/numbers/styles.css";

<Numbers value={count} />
```

<br>

Each column is a strip of digits behind a window. Changing the value turns only
the columns whose digit actually moved, and the box grows or shrinks to fit what
it now says.

Face, size, weight, colour and tracking are inherited — the stylesheet describes
motion and geometry and nothing else. A readout in a heading is the heading's
type.

The digits are `aria-hidden`; one formatted string sits behind them, so a screen
reader says *one thousand two hundred and four*, not twelve glyphs.

From **The San Francisco Interface**, shipped on its own.

<br>

## Formatting

`Intl.NumberFormat`. Currency, percentages, compact notation and every locale
come from the platform.

```tsx
<Numbers value={1125.64} format={{ style: "currency", currency: "USD" }} />
<Numbers value={0.0241}  format={{ style: "percent", maximumFractionDigits: 2 }} />
<Numbers value={48200}   format={{ notation: "compact" }} locale="en-GB" />
```

<br>

## Transitions

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

<br>

## Fade

How far the soft edge of the window reaches. While a column turns it deepens, so
the passing digits go ghostly and settle back.

```tsx
<Numbers value={n} fade={0} />
<Numbers value={n} />
<Numbers value={n} fade={2.4} />
```

<br>

## Props

| prop | type | default |
| --- | --- | --- |
| `value` | `number` | required |
| `format` | `Intl.NumberFormatOptions` | — |
| `locale` | `string \| string[]` | the runtime's |
| `transition` | `"roll" \| "tick" \| "blur" \| "flip" \| "scale"` | `"roll"` |
| `trend` | `"auto" \| "up" \| "down"` | `"auto"` |
| `blur` | `boolean` | `true` |
| `fade` | `number` | `1` |
| `duration` | `number` ms | `520` |
| `label` | `string` | the formatted value |

Everything else is spread onto the root `<span>`.

<br>

## Theming

Every value is a custom property — set one on `:root`, on a wrapper, or inline.

| token | default | |
| --- | --- | --- |
| `--sfi-numbers-roll` | `520ms` | how long a column takes to turn |
| `--sfi-numbers-exit` | `240ms` | how long a leaving column takes to go |
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
of yours wins without `!important`.

<br>

## Reduced motion

With `prefers-reduced-motion: reduce` the columns do not turn, blur or fade. The
number changes, and nothing animates.

<br>

## Requirements

React 18 or 19. No dependencies, types bundled. It renders on the server with
the formatted value already in the markup — no empty box, nothing to guard.

<br>

MIT
