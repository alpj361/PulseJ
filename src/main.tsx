// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import LogRocket from 'logrocket';
import App from "./App";
import "./index.css";

// Inicializar LogRocket
LogRocket.init('yxc4k4/pulse-jornal');

// Crear un tema personalizado con colores y tipografía similares al diseño original
const theme = createTheme({
  palette: {
    primary: {
      main: '#3b82f6', // Color primario (azul)
      dark: '#2563eb',
      light: '#60a5fa',
    },
    secondary: {
      main: '#0ea5e9', // Color secundario (azul más claro)
    },
    error: {
      main: '#ef4444', // Color de error (rojo)
    },
    warning: {
      main: '#eab308', // Color de advertencia (amarillo)
    },
    success: {
      main: '#22c55e', // Color de éxito (verde)
    },
    background: {
      default: '#f9fafb', // Fondo por defecto (gris muy claro)
      paper: '#ffffff', // Fondo de tarjetas y papeles (blanco)
    },
    text: {
      primary: '#1f2937', // Texto principal (casi negro)
      secondary: '#4b5563', // Texto secundario (gris)
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '8px 16px',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider> */}
    <App />
  </React.StrictMode>
);