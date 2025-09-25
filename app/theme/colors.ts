// Neo-brutalist navy & orange palette.
// Kept semantic key names to avoid refactors. Neutral scale skews warm gray with navy anchors.
const palette = {
  neutral100: "#FFFFFF", // pure white surfaces
  neutral200: "#F2F5FA", // light cool background
  neutral300: "#E1E6EE", // light border bg
  neutral400: "#C2CBD8", // secondary border
  neutral500: "#7A8696", // dim text
  neutral600: "#4A5563", // subdued text
  neutral700: "#273041", // deep navy surface alt
  neutral800: "#162033", // primary navy surface
  neutral900: "#0D1624", // almost black navy

  // Primary = Orange ladder (accent brand)
  primary100: "#FFE8D6",
  primary200: "#FFCFA8",
  primary300: "#FFB26B",
  primary400: "#FF9833",
  primary500: "#FF7A00", // main brand orange
  primary600: "#CC5F00",

  // Secondary = Navy accent ladder (reverse of neutrals for semantic pairing)
  secondary100: "#D4E2FF",
  secondary200: "#A9C4FF",
  secondary300: "#7E9FE8",
  secondary400: "#4F72B8",
  secondary500: "#2E4E82",

  // Accent = High energy vivid orange/yellow for highlights
  accent100: "#FFF4CC",
  accent200: "#FFE899",
  accent300: "#FFDC66",
  accent400: "#FFD033",
  accent500: "#FFC400",

  angry100: "#FEE4E2",
  angry500: "#D92D20",

  overlay20: "rgba(13,22,36,0.2)",
  overlay50: "rgba(13,22,36,0.5)",
} as const

export const colors = {
  /**
   * The palette is available to use, but prefer using the name.
   * This is only included for rare, one-off cases. Try to use
   * semantic names as much as possible.
   */
  palette,
  /**
   * A helper for making something see-thru.
   */
  transparent: "rgba(0, 0, 0, 0)",
  /**
   * The default text color in many components.
   */
  text: palette.neutral800,
  /**
   * Secondary text information.
   */
  textDim: palette.neutral600,
  /**
   * The default color of the screen background.
   */
  background: palette.neutral200,
  /**
   * The default border color.
   */
  border: palette.neutral400,
  /**
   * The main tinting color.
   */
  tint: palette.primary500,
  /**
   * The inactive tinting color.
   */
  tintInactive: palette.neutral300,
  /**
   * A subtle color used for lines.
   */
  separator: palette.neutral300,
  /**
   * Error messages.
   */
  error: palette.angry500,
  /**
   * Error Background.
   */
  errorBackground: palette.angry100,
} as const
