import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme } from '@mui/material/styles';

const ThemeContext = createContext();

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeProvider');
  }
  return context;
};

export const createAppTheme = (mode, fontSize = 14) => createTheme({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode colors
          primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
            contrastText: '#fff',
          },
          secondary: {
            main: '#9c27b0',
            light: '#ba68c8',
            dark: '#7b1fa2',
            contrastText: '#fff',
          },
          background: {
            default: '#f5f5f5',
            paper: '#ffffff',
          },
          text: {
            primary: '#212121',
            secondary: '#757575',
          },
        }
      : {
          // Dark mode colors
          primary: {
            main: '#90caf9',
            light: '#bbdefb',
            dark: '#42a5f5',
            contrastText: '#000',
          },
          secondary: {
            main: '#ce93d8',
            light: '#f3e5f5',
            dark: '#ab47bc',
            contrastText: '#000',
          },
          background: {
            default: '#121212',
            paper: '#1e1e1e',
          },
          text: {
            primary: '#ffffff',
            secondary: '#b0b0b0',
          },
        }),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: fontSize,
    h1: {
      fontSize: `${fontSize * 2.5 / 14}rem`,
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: `${fontSize * 2 / 14}rem`,
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: `${fontSize * 1.75 / 14}rem`,
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: `${fontSize * 1.5 / 14}rem`,
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: `${fontSize * 1.25 / 14}rem`,
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: `${fontSize / 14}rem`,
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: `${fontSize / 14}rem`,
      lineHeight: 1.6,
    },
    body2: {
      fontSize: `${fontSize * 0.875 / 14}rem`,
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: mode === 'light' 
            ? '0 4px 20px rgba(0,0,0,0.1)' 
            : '0 4px 20px rgba(0,0,0,0.3)',
          borderRadius: 16,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          padding: '10px 24px',
        },
        contained: {
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
          color: mode === 'light' ? '#212121' : '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
        },
      },
    },
  },
});

export const ThemeModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    // Get mode from localStorage or default to 'light'
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  const [fontSize, setFontSize] = useState(() => {
    // Get font size from localStorage or default to 14
    const savedFontSize = localStorage.getItem('fontSize');
    return savedFontSize ? parseInt(savedFontSize) : 14;
  });

  const [language, setLanguage] = useState(() => {
    // Get language from localStorage or default to 'en'
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'en';
  });

  useEffect(() => {
    // Save mode to localStorage whenever it changes
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  useEffect(() => {
    // Save font size to localStorage whenever it changes
    localStorage.setItem('fontSize', fontSize.toString());
    // Apply font size to document root
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  useEffect(() => {
    // Save language to localStorage whenever it changes
    localStorage.setItem('language', language);
  }, [language]);

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const updateFontSize = (newSize) => {
    setFontSize(newSize);
  };

  const updateLanguage = (newLanguage) => {
    setLanguage(newLanguage);
  };

  const theme = createAppTheme(mode, fontSize);

  const value = {
    mode,
    fontSize,
    language,
    toggleMode,
    updateFontSize,
    updateLanguage,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};