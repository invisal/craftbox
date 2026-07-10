# Color tokens

Defined in `src/renderer/src/assets/main.css` as CSS custom properties. Tailwind
picks them up as `bg-*` / `border-*` / `text-*` utilities automatically
(e.g. `--color-surface` -> `bg-surface`).

## Surface scale (`bg-surface`, `bg-surface-2` … `bg-surface-5`)

An elevation scale, lowest to highest. Higher numbers sit "on top of" or are
interactive states of the layer below — do not treat them as unrelated colors.

- `bg-surface` — base background, the lowest layer.
- `bg-surface-2` — elevation 1. Either a panel sitting on top of the base
  surface, or the hover state of a row/item on `bg-surface`.
- `bg-surface-3` — elevation 2. Hover state on top of `bg-surface-2`, or the
  selected state on top of `bg-surface`.
- `bg-surface-4` — elevation 3. Selected state on top of `bg-surface-2`.
- `bg-surface-5` — elevation 4. Selected state on top of `bg-surface-3`.

General pattern for an interactive row/item:

```
bg-surface            (base)
hover:bg-surface-2     (hover)
selected: bg-surface-3
```

If the container itself is already `bg-surface-2`, shift the chain up one step:
hover becomes `bg-surface-3`, selected becomes `bg-surface-4`.

## Border levels: `border-border` vs `border-border-dark`

There are only two border colors — don't introduce a third:

- `border-border` — the subtle level. Low contrast, meant to barely separate
  content sitting on `bg-surface` (e.g. a hairline between rows).
- `border-border-dark` — the stronger level. Higher contrast, used where a
  border needs to actually read as a border rather than a faint seam —
  structural dividers between major layout regions.

When adding a new border, default to `border-border`. Reach for
`border-border-dark` only when `border-border` isn't visible enough for
what you're separating.
