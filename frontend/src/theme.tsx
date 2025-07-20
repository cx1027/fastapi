import { createSystem, defaultConfig } from "@chakra-ui/react"
import { buttonRecipe } from "./theme/button.recipe"

export const system = createSystem(defaultConfig, {
  globalCss: {
    html: {
      fontSize: "16px",
    },
    body: {
      fontSize: "0.875rem",
      margin: 0,
      padding: 0,
    },
    ".main-link": {
      color: "ui.main",
      fontWeight: "bold",
    },
  },
  theme: {
    tokens: {
      colors: {
        ui: {
          main: { value: "#FFC107" },
        },
        yellow: {
          500: { value: "#FFC107" },
          600: { value: "#E6A800" },
          700: { value: "#CC9500" },
        },
        customYellow: {
          50: { value: "#FFFBEB" },
          100: { value: "#FEF3C7" },
          200: { value: "#FDE68A" },
          300: { value: "#FCD34D" },
          400: { value: "#FBBF24" },
          500: { value: "#FFC107" },
          600: { value: "#E6A800" },
          700: { value: "#CC9500" },
          800: { value: "#B38600" },
          900: { value: "#997300" },
        },
        yellow500: {
          50: { value: "#FFFBEB" },
          100: { value: "#FEF3C7" },
          200: { value: "#FDE68A" },
          300: { value: "#FCD34D" },
          400: { value: "#FBBF24" },
          500: { value: "#FFC107" },
          600: { value: "#E6A800" },
          700: { value: "#CC9500" },
          800: { value: "#B38600" },
          900: { value: "#997300" },
        },
      },
    },
    recipes: {
      button: buttonRecipe,
    },
  },
})
