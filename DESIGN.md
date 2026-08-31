# DESIGN.md — Twolander Design System (Rose Red & Crisp White)

## Visual Identity & Rationale
Twolander is a modern, high-contrast calendar designed for couples.
The visual identity is anchored in **Vivid Rose Red (`#e11d48`) & Crisp White (`#ffffff`)** with deep slate typography and razor-sharp border separation.
No dark muddy or faded backgrounds; no emojis. All states and indicators use vector icons and typography.

---

## Design Tokens

```yaml
colors:
  base: "#ffffff"           # Pure crisp white background
  surface: "#f8fafc"        # Elevated background surface
  surfaceRaised: "#ffffff"  # Card surface
  border: "#e2e8f0"         # Razor sharp border
  borderSubtle: "#f1f5f9"   # Grid divider
  
  accent: "#e11d48"         # Primary Rose Red
  accentHover: "#be123c"    # Deep Rose Red
  accentDim: "#ffe4e6"      # Soft Rose Red tint
  
  partner: "#0d9488"        # Crisp Teal for partner events
  partnerHover: "#0f766e"
  partnerDim: "#ccfbf1"     # Soft Teal tint
  
  sacred: "#7c3aed"         # Protected "Us Time" violet
  sacredDim: "#ede9fe"

  text: "#0f172a"           # Deep dark slate text (100% contrast)
  textSecondary: "#475569"  # High-contrast slate
  textTertiary: "#64748b"   # Clear legible slate

typography:
  fontDisplay: "Geist, sans-serif"
  fontBody: "Geist, sans-serif"
  fontMono: "Geist Mono, monospace"

radius:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.5rem"
  pill: "9999px"
```

## Rules & Constraints
1. **Zero Emojis:** Strictly no emoji characters anywhere.
2. **Rose Red & White Identity:** Primary actions, badges, active indicators use Vivid Rose Red (`#e11d48`) on Crisp White (`#ffffff`).
3. **Maximum Contrast & Legibility:** Dark slate (`#0f172a`) text on white surfaces.
