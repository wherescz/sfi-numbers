import * as React from "react";
import { cx } from "./utils/cx";
import { mergeRefs } from "./utils/refs";

export type NumbersTransition = "roll" | "tick" | "blur" | "flip" | "scale";

export interface NumbersProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  value: number;
  locale?: string | string[];
  format?: Intl.NumberFormatOptions;
  trend?: "auto" | "up" | "down";
  transition?: NumbersTransition;
  blur?: boolean;
  fade?: number;
  duration?: number;
  label?: string;
}

const CYCLE = 10;
const HOME = CYCLE;

const CELLS = Array.from({ length: CYCLE * 3 }, (_, i) => i % CYCLE);

function numeralsOf(locale: NumbersProps["locale"], format: NumbersProps["format"]) {
  let glyphs = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  try {
    const numberingSystem = new Intl.NumberFormat(locale, format).resolvedOptions().numberingSystem;
    const plain = new Intl.NumberFormat(locale, { numberingSystem, useGrouping: false });
    glyphs = Array.from({ length: CYCLE }, (_, i) => plain.format(i));
  } catch {
  }
  return { glyphs, index: new Map(glyphs.map((glyph, i) => [glyph, i])) };
}

type Cell =
  | { key: string; kind: "digit"; digit: number }
  | { key: string; kind: "mark"; text: string };

function cellsFor(
  value: number,
  locale: NumbersProps["locale"],
  format: NumbersProps["format"],
  index: Map<string, number>,
): Cell[] {
  const parts = new Intl.NumberFormat(locale, format).formatToParts(value);
  let integers = 0;
  for (const part of parts) if (part.type === "integer") integers += part.value.length;

  const out: Cell[] = [];
  let seen = 0;
  let fraction = 0;
  let marks = 0;
  for (const part of parts) {
    if (part.type === "integer") {
      for (const glyph of part.value) {
        out.push({ key: `d${integers - 1 - seen}`, kind: "digit", digit: index.get(glyph) ?? 0 });
        seen += 1;
      }
    } else if (part.type === "fraction") {
      for (const glyph of part.value) {
        fraction += 1;
        out.push({ key: `f${fraction}`, kind: "digit", digit: index.get(glyph) ?? 0 });
      }
    } else if (part.type === "group") {
      out.push({ key: `g${integers - 1 - seen}`, kind: "mark", text: part.value });
    } else {
      marks += 1;

      out.push({ key: `${part.type}${marks}`, kind: "mark", text: part.value });
    }
  }
  return out;
}

function turn(from: number, to: number, dir: 1 | -1): number {
  if (from === to) return 0;
  const forward = ((to - from) * dir % CYCLE + CYCLE) % CYCLE;
  return dir * forward;
}

function ms(value: string, fallback: number): number {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return fallback;
  return value.trim().endsWith("s") && !value.trim().endsWith("ms") ? n * 1000 : n;
}

function px(value: string, fontSize: number, fallback: number): number {
  const n = parseFloat(value);
  if (!Number.isFinite(n)) return fallback;
  return value.includes("em") ? n * fontSize : n;
}

const reduced = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const Numbers = React.forwardRef<HTMLSpanElement, NumbersProps>(function Numbers(
  { value, locale, format, transition = "roll", trend = "auto", blur = true, fade, duration, label, className, ...props },
  ref,
) {
  const numerals = React.useMemo(() => numeralsOf(locale, format), [locale, format]);
  const cells = React.useMemo(
    () => cellsFor(value, locale, format, numerals.index),
    [value, locale, format, numerals],
  );
  const text = React.useMemo(() => new Intl.NumberFormat(locale, format).format(value), [value, locale, format]);

  const host = React.useRef<HTMLSpanElement | null>(null);
  const row = React.useRef<HTMLSpanElement | null>(null);

  const shown = React.useRef(new Map<string, Cell>());
  const seats = React.useRef(new Map<string, number>());
  const previous = React.useRef(value);

  const widthSeat = React.useRef<number | null>(null);
  const widthRun = React.useRef<Animation | null>(null);

  const [leaving, setLeaving] = React.useState<{ cell: Cell; left: number }[]>([]);

  const heading = React.useRef<1 | -1>(1);

  const spun = React.useRef(new Set<string>());

  const [outgoing, setOutgoing] = React.useState<Map<string, number>>(() => new Map());
  const outgoingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [generation, setGeneration] = React.useState(0);
  React.useEffect(() => () => {
    if (outgoingTimer.current) clearTimeout(outgoingTimer.current);
  }, []);

  React.useLayoutEffect(() => {
    const rowEl = row.current;
    const hostEl = host.current;
    if (!rowEl || !hostEl) return;

    const from = previous.current;
    previous.current = value;
    const still = reduced();

    const cs = getComputedStyle(rowEl);
    const fontSize = parseFloat(cs.fontSize) || 16;

    const roll = duration ?? ms(cs.getPropertyValue("--sfi-numbers-roll"), 520);
    const shift = ms(cs.getPropertyValue("--sfi-settle"), 240);
    const ease = cs.getPropertyValue("--sfi-ease").trim() || "ease";
    const deepest = px(cs.getPropertyValue("--sfi-numbers-blur"), fontSize, fontSize * 0.1);

    const dir: 1 | -1 = trend === "up" ? 1 : trend === "down" ? -1 : value >= from ? 1 : -1;
    heading.current = dir;

    const nextSeats = new Map<string, number>();
    const gone = new Map(shown.current);
    const swapped = new Map<string, number>();

    rowEl.querySelectorAll<HTMLElement>("[data-cell]").forEach((el) => {
      const key = el.dataset.cell as string;
      const seat = el.offsetLeft;
      nextSeats.set(key, seat);
      gone.delete(key);

      const was = seats.current.get(key);
      const before = shown.current.get(key);

      if (was === undefined) {
        if (!still && seats.current.size > 0) el.setAttribute("data-arriving", "");
        return;
      }
      el.removeAttribute("data-arriving");
      if (still) return;

      const dx = was - seat;
      if (Math.abs(dx) >= 1) {
        el.animate([{ transform: `translateX(${dx}px)` }, { transform: "translateX(0)" }], {
          duration: shift,
          easing: ease,
        });
      }

      const digit = el.dataset.digit;
      if (digit === undefined || !before || before.kind !== "digit") return;
      if (Number(digit) === before.digit) return;

      if (transition !== "roll") {
        swapped.set(key, before.digit);
        return;
      }

      const steps = turn(before.digit, Number(digit), dir);
      if (steps === 0) return;

      const strip = el.querySelector<HTMLElement>(".sfi-numbers-strip");
      const cell = strip?.firstElementChild;
      if (!strip || !cell) return;
      const height = cell.getBoundingClientRect().height;
      if (!height) return;

      const start = (HOME + before.digit) * height;
      const turning = strip.animate(
        [{ transform: `translateY(${-start}px)` }, { transform: `translateY(${-(start + steps * height)}px)` }],
        { duration: roll, easing: ease },
      );

      el.setAttribute("data-turning", "");
      turning.finished.then(() => el.removeAttribute("data-turning")).catch(() => {});

      if (blur && deepest > 0) {
        const depth = Math.min(1, Math.abs(steps) / 4) * deepest;
        el.animate(
          [
            { filter: "blur(0px)", offset: 0 },
            { filter: `blur(${depth.toFixed(2)}px)`, offset: 0.15 },
            { filter: "blur(0px)", offset: 0.62 },
            { filter: "blur(0px)", offset: 1 },
          ],
          { duration: roll, easing: "linear" },
        );
      }
    });

    if (gone.size && !still) {
      const ghosts: { cell: Cell; left: number }[] = [];
      gone.forEach((cell, key) => {
        const seat = seats.current.get(key);
        if (seat !== undefined) ghosts.push({ cell, left: seat });
      });
      if (ghosts.length) setLeaving((current) => [...current, ...ghosts]);
    }

    shown.current = new Map(cells.map((cell) => [cell.key, cell]));
    seats.current = nextSeats;

    if (swapped.size && !still) {
      hostEl.style.setProperty("--sfi-numbers-dir", String(dir));
      setOutgoing(swapped);
      setGeneration((n) => n + 1);
      if (outgoingTimer.current) clearTimeout(outgoingTimer.current);
      outgoingTimer.current = setTimeout(() => {
        outgoingTimer.current = null;
        setOutgoing(new Map());
      }, roll + 40);
    }

    const running = widthRun.current;
    const visual = running ? hostEl.getBoundingClientRect().width : null;
    if (running) {
      running.cancel();
      widthRun.current = null;
    }
    const now = rowEl.offsetWidth;
    const start = visual ?? widthSeat.current;
    widthSeat.current = now;
    if (start === null || Math.abs(start - now) < 0.5 || still) return;

    const grow = hostEl.animate([{ width: `${start}px` }, { width: `${now}px` }], {
      duration: shift,
      easing: ease,
    });
    widthRun.current = grow;
    grow.finished
      .then(() => {
        if (widthRun.current === grow) widthRun.current = null;
      })
      .catch(() => {});
  }, [cells, value, trend, blur, duration, transition]);

  React.useLayoutEffect(() => {
    const rowEl = row.current;
    if (!rowEl || leaving.length === 0 || reduced()) return;

    const cs = getComputedStyle(rowEl);
    const fontSize = parseFloat(cs.fontSize) || 16;
    const going = ms(cs.getPropertyValue("--sfi-numbers-exit"), 240);
    const ease = cs.getPropertyValue("--sfi-ease").trim() || "ease";
    const deepest = px(cs.getPropertyValue("--sfi-numbers-blur"), fontSize, fontSize * 0.1);
    const dir = heading.current;

    rowEl.querySelectorAll<HTMLElement>("[data-ghost]").forEach((el) => {
      const key = el.dataset.ghost as string;
      if (spun.current.has(key)) return;
      spun.current.add(key);
      const strip = el.querySelector<HTMLElement>(".sfi-numbers-strip");
      const cell = strip?.firstElementChild;
      if (!strip || !cell) return;
      const height = cell.getBoundingClientRect().height;
      if (!height) return;

      const start = (HOME + Number(el.dataset.digit ?? 0)) * height;
      strip.animate(
        [{ transform: `translateY(${-start}px)` }, { transform: `translateY(${-(start + dir * 3 * height)}px)` }],
        { duration: going, easing: ease },
      );
      if (blur && deepest > 0) {
        el.animate([{ filter: "blur(0px)" }, { filter: `blur(${deepest.toFixed(2)}px)` }], {
          duration: going,
          easing: ease,
        });
      }
    });
  }, [leaving, blur, transition]);

  const setHost = React.useMemo(() => mergeRefs(ref, host), [ref]);

  const knobs: Record<string, string> = {};
  if (duration !== undefined) knobs["--sfi-numbers-roll"] = `${duration}ms`;
  if (fade !== undefined) knobs["--sfi-numbers-fade"] = `${fade}`;
  const style = Object.keys(knobs).length
    ? ({ ...knobs, ...props.style } as React.CSSProperties)
    : props.style;

  return (
    <span
      ref={setHost}
      className={cx("sfi-numbers", className)}
      data-transition={transition === "roll" ? undefined : transition}
      {...props}
      style={style}
    >

      <span className="sfi-numbers-said">{label ?? text}</span>
      <span className="sfi-numbers-row" ref={row} aria-hidden="true">
        {cells.map((cell) => (
          <Piece
            key={cell.key}
            cell={cell}
            glyphs={numerals.glyphs}
            transition={transition}
            from={cell.kind === "digit" ? outgoing.get(cell.key) : undefined}
            generation={generation}
          />
        ))}
        {leaving.map((ghost) => (
          <Piece
            key={`leaving:${ghost.cell.key}`}
            cell={ghost.cell}
            glyphs={numerals.glyphs}
            transition={transition}
            generation={generation}
            leaving
            left={ghost.left}
            onDone={() => {
              spun.current.delete(ghost.cell.key);
              setLeaving((current) => current.filter((x) => x.cell.key !== ghost.cell.key));
            }}
          />
        ))}
      </span>
    </span>
  );
});

const at = (digit: number) => ({ "--sfi-numbers-at": HOME + digit }) as React.CSSProperties;

function Piece({
  cell,
  glyphs,
  transition,
  from,
  generation,
  leaving,
  left,
  onDone,
}: {
  cell: Cell;
  glyphs: string[];
  transition: NumbersTransition;
  from?: number;
  generation: number;
  leaving?: boolean;
  left?: number;
  onDone?: () => void;
}) {
  const identity = leaving
    ? {
        "data-leaving": "",
        "data-ghost": cell.key,
        style: { left } as React.CSSProperties,
        onAnimationEnd: onDone,
      }
    : {
        "data-cell": cell.key,
        onAnimationEnd: (event: React.AnimationEvent<HTMLElement>) =>
          event.currentTarget.removeAttribute("data-arriving"),
      };

  if (cell.kind === "mark") {
    return (
      <span className="sfi-numbers-mark" {...identity}>
        {cell.text}
      </span>
    );
  }

  const swapping = from !== undefined && from !== cell.digit;

  return (
    <span className="sfi-numbers-slot" data-digit={cell.digit} {...identity}>

      <span className="sfi-numbers-window">
        {transition === "roll" ? (
          <span className="sfi-numbers-strip" style={at(cell.digit)}>
            {CELLS.map((n, i) => (
              <span className="sfi-numbers-cell" key={i}>
                {glyphs[n]}
              </span>
            ))}
          </span>
        ) : (
          <>
            <span
              className="sfi-numbers-face"

              data-in={swapping ? "" : undefined}
              key={`in:${cell.digit}:${swapping ? generation : "rest"}`}
            >
              {glyphs[cell.digit]}
            </span>
            {swapping ? (
              <span className="sfi-numbers-face" data-out="" key={`out:${from}:${generation}`}>
                {glyphs[from as number]}
              </span>
            ) : null}
          </>
        )}
      </span>
    </span>
  );
}
