import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0C4A8A",
      dark: "#08315C",
      light: "#3D7CC4",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#0E8F8A",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F3F6FB",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#12263A",
      secondary: "#5C6B7A",
    },
    divider: "#E2E8F0",
    error: {
      main: "#C2413B",
    },
    success: {
      main: "#0E8F8A",
    },
  },
  typography: {
    fontFamily: '"Manrope", "Segoe UI", sans-serif',
    h3: { fontWeight: 800, letterSpacing: "-0.04em" },
    h4: { fontWeight: 800, letterSpacing: "-0.03em" },
    h5: { fontWeight: 700, letterSpacing: "-0.02em" },
    h6: { fontWeight: 700 },
    button: { textTransform: "none", fontWeight: 700 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, paddingInline: 16 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700 },
      },
    },
  },
});

export default theme;
