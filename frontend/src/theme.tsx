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
  // theme: {
  //   tokens: {
  //     colors: {
  //       ui: {
  //         // main: { value: "#009688" },
  //         main: { value: "#FFC107" },
  //       },
  //       button: {
  //         bg:{value:"#FFC107"},
  //         text: { value: "#D7D7D7" },
  //       },
  //     },
  //   },
  //   recipes: {
  //     button: buttonRecipe,
  //   },

  // },
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#FFC107" },
          100: { value: "#FFC107" },
          200: { value: "#FFC107" },
          300: { value: "#FFC107" },
          500: { value: "#FFC107" },
          700: { value: "#FFC107" },
          800: { value: "#FFC107" },
          // ...
          950: { value: "#FFC107" },
        },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: "{colors.brand.500}" },
          // contrast: { value: "#D7D7D7" },
          contrast: { value: "white" },
          fg: { value: "{colors.brand.700}" },
          muted: { value: "{colors.brand.100}" },
          subtle: { value: "{colors.brand.200}" },
          emphasized: { value: "{colors.brand.300}" },
          focusRing: { value: "{colors.brand.500}" },
        },
      },
    },
    recipes: {
      button: buttonRecipe,
    },
  }
})
