import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#8b5cf6" },
    secondary: { main: "#3b82f6" },
    background: { default: "#0b0f1a", paper: "#12192b" },
  },
  shape: { borderRadius: 12 },
});
