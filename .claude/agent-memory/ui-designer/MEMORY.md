# UI Designer Agent Memory

## Project Design System
- **Theme**: Warm neutral/sandy palette (light: sandy beige bg, dark: near-black bg)
- **Radius**: `--radius: 0.5rem` (sm/md/lg/xl variants)
- **Fonts**: Inter (sans), Playfair Display (serif), JetBrains Mono (mono)
- **Tracking**: Custom `--tracking-normal: 0.01em`
- **Shadows**: Custom warm shadow system defined in globals.css
- **Style**: shadcn/ui New York variant, neutral color base

## Key Files
- `app/globals.css` - All design tokens (colors, shadows, fonts, radius)
- `components/ui/` - shadcn primitives (dialog, button, input, separator, switch, etc.)
- `lib/utils.ts` - `cn()` utility for class merging

## Component Conventions
- **Button sizes**: default, xs, sm, lg, icon, icon-xs, icon-sm, icon-lg
- **DialogContent**: Uses `gap-4` between direct children (from the component's grid layout)
- **Labels as section headers**: Use `<Label className="text-xs text-muted-foreground">` for subtle field labels
- **Separator**: Use between conceptual sections within dialogs
- **Input groups**: Wrap prefix + input in a bordered div with `bg-muted/50`, delegate focus ring to wrapper with `focus-within:ring-ring/50 focus-within:border-ring focus-within:ring-[3px]`

## Formatting
- Biome formatter (not Prettier) - tabs, single quotes, no semicolons
- Run `bunx biome format --write <file>` after editing
- UI language: French
