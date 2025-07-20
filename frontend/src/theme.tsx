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
        customYellow: { value: "#FFC107" },
      },
    },
    recipes: {
      button: buttonRecipe,
    },
  },
})
