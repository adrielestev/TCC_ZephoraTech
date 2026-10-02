export const colors = {
  backgroundTop: "#FFFFFF",
  backgroundBottom: "#F3FAFF",
  surface: "rgba(255, 255, 255, 0.88)",
  surfaceSolid: "#FFFFFF",
  surfaceMuted: "#F7FAFD",
  surfaceAccent: "#EAF4FC",
  white: "#FFFFFF",
  ink: "#111827",
  text: "#253247",
  muted: "#667085",
  border: "#D6E0EA",
  borderStrong: "#B9CCDD",
  borderFocus: "#4E86B8",
  primary: "#2F6FAD",
  primaryPressed: "#245987",
  primarySoft: "#E8F2FB",
  error: "#B42318",
  errorSoft: "#FFF1F0",
  success: "#16794C",
  successSoft: "#EAF7F0",
  warning: "#A15C00",
  warningSoft: "#FFF5E7",
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  field: 12,
  card: 20,
  button: 12,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: "800" as const },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "800" as const },
  section: { fontSize: 16, lineHeight: 22, fontWeight: "800" as const },
  body: { fontSize: 15, lineHeight: 21, fontWeight: "400" as const },
  bodyStrong: { fontSize: 15, lineHeight: 21, fontWeight: "700" as const },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: "600" as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: "700" as const },
} as const;

export const shadows = {
  card: {
    shadowColor: "#31516D",
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  button: {
    shadowColor: "#244D70",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
} as const;

export const layout = {
  screenPadding: 20,
  contentMaxWidth: 720,
  formMaxWidth: 440,
  minTouchTarget: 44,
  desktopBreakpoint: 960,
} as const;
