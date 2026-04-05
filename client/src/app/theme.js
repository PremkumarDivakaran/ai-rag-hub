import { alpha, createTheme } from '@mui/material/styles';

export function createAppTheme(mode) {
  const isLight = mode === 'light';
  const surface = isLight ? '#ffffff' : '#111827';
  const surfaceAlt = isLight ? '#f8fafc' : '#0f172a';
  const border = isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(148, 163, 184, 0.16)';
  const primaryMain = '#0f62fe';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: primaryMain,
        light: '#4f8cff',
        dark: '#0043ce',
        contrastText: '#ffffff'
      },
      secondary: {
        main: '#14b8a6',
        light: '#5eead4',
        dark: '#0f766e',
        contrastText: '#042f2e'
      },
      background: {
        default: isLight ? '#edf2f7' : '#020617',
        paper: surface
      },
      text: {
        primary: isLight ? '#0f172a' : '#e5eefb',
        secondary: isLight ? '#475569' : '#94a3b8'
      },
      divider: border,
      action: {
        hover: alpha(primaryMain, isLight ? 0.06 : 0.14),
        selected: alpha(primaryMain, isLight ? 0.12 : 0.22)
      }
    },
    shape: {
      borderRadius: 16
    },
    typography: {
      fontFamily: '"Manrope", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
      h4: {
        fontWeight: 800,
        fontSize: '1.9rem',
        letterSpacing: '-0.03em'
      },
      h6: {
        fontWeight: 700,
        letterSpacing: '-0.02em'
      },
      subtitle1: {
        fontWeight: 600
      },
      button: {
        fontWeight: 700
      }
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: isLight
              ? 'radial-gradient(circle at top left, rgba(15,98,254,0.10), transparent 30%), linear-gradient(180deg, #f8fbff 0%, #edf2f7 55%, #e2e8f0 100%)'
              : 'radial-gradient(circle at top left, rgba(15,98,254,0.18), transparent 28%), linear-gradient(180deg, #020617 0%, #0b1220 48%, #111827 100%)'
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isLight
              ? 'linear-gradient(135deg, #0f172a 0%, #172554 45%, #0f62fe 100%)'
              : 'linear-gradient(135deg, #020617 0%, #172554 45%, #1d4ed8 100%)',
            boxShadow: isLight
              ? '0 18px 48px rgba(15, 23, 42, 0.12)'
              : '0 18px 48px rgba(2, 6, 23, 0.42)'
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${border}`,
            background: isLight
              ? 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)'
              : 'linear-gradient(180deg, #111827 0%, #0f172a 100%)'
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            boxShadow: 'none'
          },
          contained: {
            background: 'linear-gradient(135deg, #0f62fe 0%, #2563eb 100%)',
            '&:hover': {
              boxShadow: '0 12px 24px rgba(15, 98, 254, 0.24)'
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: `1px solid ${border}`,
            boxShadow: isLight
              ? '0 12px 36px rgba(15, 23, 42, 0.06)'
              : '0 12px 36px rgba(2, 6, 23, 0.32)'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${border}`,
            boxShadow: isLight
              ? '0 12px 36px rgba(15, 23, 42, 0.06)'
              : '0 12px 36px rgba(2, 6, 23, 0.32)'
          }
        }
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            margin: '4px 10px',
            '&.Mui-selected': {
              backgroundColor: alpha(primaryMain, isLight ? 0.12 : 0.2),
              border: `1px solid ${alpha(primaryMain, isLight ? 0.18 : 0.32)}`
            }
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 14,
              backgroundColor: alpha(surfaceAlt, isLight ? 0.7 : 0.4)
            }
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 999
          }
        }
      }
    }
  });
}
