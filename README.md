# @sfi/numbers

A number that turns to its new value.

Part of [**The San Francisco Interface**](https://github.com/wherescz/the-san-francisco-interface), shipped on its own for
projects that want the readout and not the library.

```sh
npm i @sfi/numbers
```

```tsx
import { Numbers } from "@sfi/numbers";
import "@sfi/numbers/styles.css";

<Numbers value={count} />

// Formatting is Intl's: currency, percent, compact, any locale
<Numbers value={1125.64} format={{ style: "currency", currency: "USD" }} />
<Numbers value={48200} format={{ notation: "compact" }} locale="en-GB" />

// Five ways for a column to change; only roll turns through the digits between
<Numbers value={n} transition="tick" />

// How much the passing digits dissolve. 0 is a hard window, 2 and up is ghostly
<Numbers value={n} fade={2.2} />
```

Each column is a strip of digits behind a window. Changing the value turns only
the columns that changed, and the box grows or shrinks to fit what it now says.
Everything about the type is inherited, so a counter is the number in whatever
face, size, weight and colour it was written in.

## It is the same component

The full library, `@sfi/ui`, is not on npm yet. This package is, and it is built
from the same source file the library will ship, not from a copy of it, so the
two cannot drift apart and nothing written against it now has to change later.

About 6kB of JavaScript and one stylesheet. No dependencies; React is a peer.

When `@sfi/ui` does land it will contain `Numbers` as well. Install one or the
other then, not both.

## Theming

The stylesheet borrows four values from the library's motion tokens and falls
back to the library's own numbers when they are not on the page, so it works
standalone and follows the library when both are loaded. Every one of them is a
custom property you can set from `:root`, from a wrapper, or on one instance:

| | |
| --- | --- |
| `--sfi-numbers-roll` | how long a column takes to turn |
| `--sfi-numbers-exit` | how long a column leaving the number takes to go |
| `--sfi-numbers-blur` | the deepest a fast column smears, relative to the type |
| `--sfi-numbers-cell` | the pitch the digits are stacked at |
| `--sfi-numbers-fade` | how far the window's soft edge reaches; also the `fade` prop |
| `--sfi-numbers-fade-roll` | how much further it reaches while a column is turning |
| `--sfi-numbers-ease` | the curve a column turns on |

## Licence

MIT.
