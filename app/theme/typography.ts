// TODO: write documentation about fonts and typography along with guides on how to add custom fonts in own
// markdown file and add links from here

import { Platform } from "react-native"
import {
  JetBrainsMono_300Light as jetBrainsMonoLight,
  JetBrainsMono_400Regular as jetBrainsMonoRegular,
  JetBrainsMono_500Medium as jetBrainsMonoMedium,
  JetBrainsMono_600SemiBold as jetBrainsMonoSemiBold,
  JetBrainsMono_700Bold as jetBrainsMonoBold,
} from "@expo-google-fonts/jetbrains-mono"

export const customFontsToLoad = {
  jetBrainsMonoLight,
  jetBrainsMonoRegular,
  jetBrainsMonoMedium,
  jetBrainsMonoSemiBold,
  jetBrainsMonoBold,
}

const fonts = {
  jetBrainsMono: {
    light: "jetBrainsMonoLight",
    normal: "jetBrainsMonoRegular",
    medium: "jetBrainsMonoMedium",
    semiBold: "jetBrainsMonoSemiBold",
    bold: "jetBrainsMonoBold",
  },
  helveticaNeue: {
    // iOS only font.
    thin: "HelveticaNeue-Thin",
    light: "HelveticaNeue-Light",
    normal: "Helvetica Neue",
    medium: "HelveticaNeue-Medium",
  },
  courier: {
    // iOS only font.
    normal: "Courier",
  },
  sansSerif: {
    // Android only font.
    thin: "sans-serif-thin",
    light: "sans-serif-light",
    normal: "sans-serif",
    medium: "sans-serif-medium",
  },
  monospace: {
    // Android only font.
    normal: "monospace",
  },
}

export const typography = {
  /**
   * The fonts are available to use, but prefer using the semantic name.
   */
  fonts,
  /**
   * The primary font. Used in most places.
   */
  primary: fonts.jetBrainsMono,
  /**
   * An alternate font used for perhaps titles and stuff.
   */
  secondary: Platform.select({ ios: fonts.helveticaNeue, android: fonts.sansSerif }),
  /**
   * Lets get fancy with a monospace font!
   */
  code: fonts.jetBrainsMono,
}
