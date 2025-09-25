// Dark mode inversion of the neo-brutalist navy & orange scheme.
const palette = {
  neutral900: "#FFFFFF",
  neutral800: "#F2F5FA",
  neutral700: "#E1E6EE",
  neutral600: "#C2CBD8",
  neutral500: "#7A8696",
  neutral400: "#4A5563",
  neutral300: "#273041",
  neutral200: "#162033",
  neutral100: "#0D1624",

  primary600: "#FFE8D6",
  primary500: "#FFCFA8",
  primary400: "#FFB26B",
  primary300: "#FF9833",
  primary200: "#FF7A00",
  primary100: "#CC5F00",

  secondary500: "#D4E2FF",
  secondary400: "#A9C4FF",
  secondary300: "#7E9FE8",
  secondary200: "#4F72B8",
  secondary100: "#2E4E82",

  accent500: "#FFF4CC",
  accent400: "#FFE899",
  accent300: "#FFDC66",
  accent200: "#FFD033",
  accent100: "#FFC400",

  angry100: "#FEE4E2",
  angry500: "#D92D20",

  overlay20: "rgba(255,255,255,0.2)",
  overlay50: "rgba(255,255,255,0.5)",
} as const

export const colors = {
  palette,
  transparent: "rgba(0, 0, 0, 0)",
  text: palette.neutral800,
  textDim: palette.neutral600,
  background: palette.neutral200,
  border: palette.neutral400,
  tint: palette.primary500,
  tintInactive: palette.neutral300,
  separator: palette.neutral300,
  error: palette.angry500,
  errorBackground: palette.angry100,
} as const
