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
          // main: { value: "#009688" },
          main: { value: "#FFC107" },
        },
        button: {
          bg:{value:"#FFC107"},
          text: { value: "#D7D7D7" },
        },
      },
    },
    recipes: {
      button: buttonRecipe,
    },
  },
})
