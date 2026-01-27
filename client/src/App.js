import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Container,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link,
  useMediaQuery,
  Collapse,
  Switch,
  FormControlLabel,
  Fade,
  alpha
} from '@mui/material';
import {
  Transform as TransformIcon,
  Storage as StorageIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  NavigateNext as NavigateNextIcon,
  TextFields as KeywordIcon,
  AutoFixHigh as HybridIcon,
  CompareArrows as RerankIcon,
  Psychology as PreprocessIcon,
  Summarize as SummarizeIcon,
  Science as TestGeneratorIcon,
  StarRate as RateIcon,
  CloudUpload as IngestionIcon,
  ManageSearch as RetrievalIcon,
  Build as FeaturesIcon,
  SmartToy as BotIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import { SnackbarProvider } from 'notistack';

// Import components
import ConvertToJson from './components/data/ConvertToJson';
import EmbeddingsStore from './components/data/EmbeddingsStore';
import QuerySearch from './components/search/QuerySearch';
import BM25Search from './components/search/BM25Search';
import HybridSearch from './components/search/HybridSearch';
import RerankingSearch from './components/search/RerankingSearch';
import QueryPreprocessing from './components/processing/QueryPreprocessing';
import SummarizationDedup from './components/processing/SummarizationDedup';
import PromptSchemaManager from './components/processing/PromptSchemaManager';
import UserStoryRating from './components/processing/UserStoryRating';
import TeamKnowledgeBot from './components/processing/TeamKnowledgeBot';
import Settings from './components/settings/Settings';

// Enterprise color palette - Light Blue theme
const createEnterpriseTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#1976D2', // Material Blue
      light: '#42A5F5',
      dark: '#1565C0',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#0288D1', // Light Blue accent
      light: '#03A9F4',
      dark: '#01579B',
      contrastText: '#ffffff'
    },
    background: {
      default: mode === 'light' ? '#E3F2FD' : '#0D1B2A', // Light blue background
      paper: mode === 'light' ? '#FFFFFF' : '#1B2838'
    },
    text: {
      primary: mode === 'light' ? '#1A237E' : '#E3F2FD',
      secondary: mode === 'light' ? '#5C6BC0' : '#90CAF9'
    },
    action: {
      hover: mode === 'light' ? 'rgba(25, 118, 210, 0.08)' : 'rgba(66, 165, 245, 0.12)',
      selected: mode === 'light' ? 'rgba(25, 118, 210, 0.16)' : 'rgba(66, 165, 245, 0.24)'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.2,
      letterSpacing: '-0.02em'
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.3
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.4
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5
    },
    body2: {
      fontSize: '0.75rem',
      lineHeight: 1.4
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
          }
        },
        contained: {
          background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)'
          }
        },
        outlined: {
          borderColor: '#1976D2',
          color: '#1976D2',
          '&:hover': {
            borderColor: '#1565C0',
            backgroundColor: 'rgba(25, 118, 210, 0.04)'
          }
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '0 4px 20px rgba(25, 118, 210, 0.15)',
          background: mode => mode === 'light' 
            ? 'linear-gradient(180deg, #FFFFFF 0%, #F5F9FF 100%)'
            : 'linear-gradient(180deg, #1B2838 0%, #0D1B2A 100%)'
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          margin: '2px 8px',
          transition: 'all 0.2s ease-in-out',
          '&.Mui-selected': {
            borderLeft: '4px solid #42A5F5',
            backgroundColor: 'rgba(25, 118, 210, 0.12)',
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.18)',
            }
          },
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.06)',
            transform: 'translateX(2px)'
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(25, 118, 210, 0.2)',
          background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px'
        },
        elevation1: {
          boxShadow: '0 2px 12px rgba(25, 118, 210, 0.1)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(25, 118, 210, 0.12)'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px'
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#42A5F5'
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1976D2'
            }
          }
        }
      }
    }
  }
});

const drawerWidth = 300;
const collapsedDrawerWidth = 72;

// Organized menu structure with sections
const menuSections = [
  {
    id: 'ingestion',
    title: 'Data Ingestion',
    icon: <IngestionIcon />,
    items: [
      { 
        id: 'convert', 
        label: 'Convert to JSON', 
        icon: <TransformIcon />, 
        component: ConvertToJson,
        description: 'Upload and convert Excel files'
      },
      { 
        id: 'embeddings', 
        label: 'Embeddings & Store', 
        icon: <StorageIcon />, 
        component: EmbeddingsStore,
        description: 'Create and manage embeddings'
      }
    ]
  },
  {
    id: 'retrieval',
    title: 'Search & Retrieval',
    icon: <RetrievalIcon />,
    items: [
      { 
        id: 'preprocess', 
        label: 'Query Preprocessing', 
        icon: <PreprocessIcon />, 
        component: QueryPreprocessing,
        description: 'Transform & expand queries'
      },
      { 
        id: 'query', 
        label: 'Vector Search', 
        icon: <SearchIcon />, 
        component: QuerySearch,
        description: 'Semantic vector search'
      },
      { 
        id: 'bm25', 
        label: 'BM25 Search', 
        icon: <KeywordIcon />, 
        component: BM25Search,
        description: 'Keyword-based search'
      },
      { 
        id: 'hybrid', 
        label: 'Hybrid Search', 
        icon: <HybridIcon />, 
        component: HybridSearch,
        description: 'Combined BM25 + Vector'
      },
      { 
        id: 'rerank', 
        label: 'Score Fusion', 
        icon: <RerankIcon />, 
        component: RerankingSearch,
        description: 'BM25+Vector fusion reranking'
      },
      { 
        id: 'summarize', 
        label: 'Summarize & Dedup', 
        icon: <SummarizeIcon />, 
        component: SummarizationDedup,
        description: 'AI summarization & deduplication'
      }
    ]
  },
  {
    id: 'features',
    title: 'AI Features',
    icon: <FeaturesIcon />,
    items: [
      { 
        id: 'test-generator', 
        label: 'Test Case Generator', 
        icon: <TestGeneratorIcon />, 
        component: PromptSchemaManager,
        description: 'AI-powered test case generation from user stories'
      },
      { 
        id: 'story-rating', 
        label: 'User Story Rating', 
        icon: <RateIcon />, 
        component: UserStoryRating,
        description: 'RAG-powered user story analysis & rating'
      },
      { 
        id: 'knowledge-bot', 
        label: 'Atlas - Knowledge Bot', 
        icon: <BotIcon />, 
        component: TeamKnowledgeBot,
        description: 'AI assistant for team Confluence documentation'
      }
    ]
  },
  {
    id: 'system',
    title: 'System',
    icon: <SettingsIcon />,
    items: [
      { 
        id: 'settings', 
        label: 'Settings', 
        icon: <SettingsIcon />, 
        component: Settings,
        description: 'Configure environment'
      }
    ]
  }
];

// Flatten menu items for component lookup
const menuItems = menuSections.flatMap(section => section.items);

function App() {
  const [selectedMenuItem, setSelectedMenuItem] = useState('convert');
  const [drawerOpen, setDrawerOpen] = useState(true);
  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState({
    ingestion: true,
    retrieval: true,
    features: true,
    system: true
  });
  // Default to light mode - users can toggle to dark mode if preferred
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('darkMode');
      return saved === 'true'; // Only true if explicitly saved as 'true', defaults to false (light)
    } catch {
      return false; // Default to light mode
    }
  });

  const isMobile = useMediaQuery('(max-width:768px)');
  
  // Memoize theme to prevent recreation on every render
  const theme = useMemo(
    () => createEnterpriseTheme(darkMode ? 'dark' : 'light'),
    [darkMode]
  );

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  const handleDrawerToggle = useCallback(() => {
    setDrawerOpen(prev => !prev);
  }, []);

  const handleThemeToggle = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const handleSectionToggle = useCallback((sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  const getCurrentMenuItem = useCallback(() => {
    return menuItems.find(item => item.id === selectedMenuItem);
  }, [selectedMenuItem]);

  const getCurrentSection = useCallback(() => {
    for (const section of menuSections) {
      if (section.items.some(item => item.id === selectedMenuItem)) {
        return section;
      }
    }
    return null;
  }, [selectedMenuItem]);

  // Memoize current component to prevent unnecessary re-renders
  const CurrentComponent = useMemo(() => {
    const menuItem = menuItems.find(item => item.id === selectedMenuItem);
    return menuItem?.component;
  }, [selectedMenuItem]);

  const actualDrawerWidth = drawerOpen ? drawerWidth : collapsedDrawerWidth;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider 
        maxSnack={3}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        dense
        preventDuplicate
      >
        <Box sx={{ display: 'flex' }}>
          {/* App Bar */}
          <AppBar
            position="fixed"
            sx={{
              width: { sm: `calc(100% - ${actualDrawerWidth}px)` },
              ml: { sm: `${actualDrawerWidth}px` },
              transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
              </IconButton>
              
              <DashboardIcon sx={{ mr: 2 }} />
              <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                RAG Pipeline
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={darkMode}
                    onChange={handleThemeToggle}
                    icon={<LightModeIcon />}
                    checkedIcon={<DarkModeIcon />}
                  />
                }
                label=""
                sx={{ mr: 1 }}
              />
            </Toolbar>
            
            {/* Secondary Toolbar for Breadcrumbs */}
            <Toolbar variant="dense" sx={{ 
              background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)', 
              minHeight: '48px !important' 
            }}>
              <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.7)' }} />}
                sx={{ color: 'primary.contrastText' }}
              >
                <Link
                  component="button"
                  variant="body2"
                  sx={{ 
                    color: 'rgba(255,255,255,0.9)', 
                    textDecoration: 'none',
                    fontWeight: 500,
                    '&:hover': { textDecoration: 'underline', color: 'white' }
                  }}
                  onClick={() => setSelectedMenuItem('convert')}
                >
                  Home
                </Link>
                {getCurrentSection() && (
                  <Typography 
                    variant="body2" 
                    sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}
                  >
                    {getCurrentSection()?.title}
                  </Typography>
                )}
                <Typography 
                  variant="body2" 
                  sx={{ color: 'white', fontWeight: 600 }}
                >
                  {getCurrentMenuItem()?.label}
                </Typography>
              </Breadcrumbs>
              
              <Box sx={{ flexGrow: 1 }} />
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                px: 1.5,
                py: 0.5,
                borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }}>
                {getCurrentMenuItem()?.icon && React.cloneElement(getCurrentMenuItem().icon, { 
                  sx: { fontSize: 16, color: 'rgba(255,255,255,0.8)' } 
                })}
                <Typography 
                  variant="caption" 
                  sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}
                >
                  {getCurrentMenuItem()?.description}
                </Typography>
              </Box>
            </Toolbar>
          </AppBar>

          {/* Sidebar */}
          <Drawer
            variant={isMobile ? 'temporary' : 'permanent'}
            open={isMobile ? drawerOpen : true}
            onClose={handleDrawerToggle}
            sx={{
              width: actualDrawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: actualDrawerWidth,
                boxSizing: 'border-box',
                transition: theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
                overflowX: 'hidden',
                background: darkMode 
                  ? 'linear-gradient(180deg, #1B2838 0%, #0D1B2A 100%)'
                  : 'linear-gradient(180deg, #FFFFFF 0%, #F0F7FF 100%)',
              },
            }}
          >
            <Toolbar sx={{ 
              borderBottom: '1px solid',
              borderColor: darkMode ? 'rgba(144, 202, 249, 0.12)' : 'rgba(25, 118, 210, 0.12)'
            }}>
              <Fade in={drawerOpen} timeout={300}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Box 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1.5,
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
                    }}
                  >
                    <DashboardIcon sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700, 
                      background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: '1.1rem'
                    }}
                  >
                    RAG Pipeline
                  </Typography>
                </Box>
              </Fade>
              {!drawerOpen && (
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <Box 
                    sx={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)'
                    }}
                  >
                    <DashboardIcon sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                </Box>
              )}
            </Toolbar>
            
            <Box sx={{ overflowY: 'auto', flex: 1, pt: 1 }}>
              {menuSections.map((section) => (
                <Box key={section.id}>
                  {/* Section Header */}
                  {drawerOpen ? (
                    <ListItemButton
                      onClick={() => handleSectionToggle(section.id)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        mx: 1,
                        my: 0.5,
                        borderRadius: '8px',
                        backgroundColor: expandedSections[section.id] 
                          ? alpha(theme.palette.primary.main, 0.08)
                          : 'transparent',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.12)
                        }
                      }}
                    >
                      <ListItemIcon sx={{ 
                        minWidth: 40, 
                        color: 'primary.main'
                      }}>
                        {section.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={section.title}
                        primaryTypographyProps={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: 'primary.main',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      />
                      {expandedSections[section.id] ? (
                        <ExpandLess sx={{ color: 'primary.main', fontSize: 20 }} />
                      ) : (
                        <ExpandMore sx={{ color: 'text.secondary', fontSize: 20 }} />
                      )}
                    </ListItemButton>
                  ) : (
                    <Tooltip title={section.title} placement="right" arrow>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        py: 1,
                        color: 'primary.main'
                      }}>
                        {section.icon}
                      </Box>
                    </Tooltip>
                  )}
                  
                  {/* Section Items */}
                  <Collapse in={drawerOpen ? expandedSections[section.id] : true} timeout="auto">
                    <List disablePadding sx={{ pl: drawerOpen ? 1 : 0 }}>
                      {section.items.map((item) => (
                        <ListItem key={item.id} disablePadding>
                          <Tooltip 
                            title={drawerOpen ? '' : item.label} 
                            placement="right"
                            arrow
                          >
                            <ListItemButton
                              selected={selectedMenuItem === item.id}
                              onClick={() => setSelectedMenuItem(item.id)}
                              sx={{
                                minHeight: 44,
                                justifyContent: drawerOpen ? 'initial' : 'center',
                                px: 2,
                                ml: drawerOpen ? 1 : 0
                              }}
                            >
                              <ListItemIcon
                                sx={{
                                  minWidth: 0,
                                  mr: drawerOpen ? 2 : 'auto',
                                  justifyContent: 'center',
                                  color: selectedMenuItem === item.id 
                                    ? 'primary.main' 
                                    : 'text.secondary'
                                }}
                              >
                                {item.icon}
                              </ListItemIcon>
                              
                              {drawerOpen && (
                                <ListItemText
                                  primary={item.label}
                                  primaryTypographyProps={{
                                    fontSize: '0.85rem',
                                    fontWeight: selectedMenuItem === item.id ? 600 : 400,
                                    color: selectedMenuItem === item.id 
                                      ? 'primary.main' 
                                      : 'text.primary'
                                  }}
                                />
                              )}
                            </ListItemButton>
                          </Tooltip>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                </Box>
              ))}
            </Box>
            
            <Divider sx={{ borderColor: darkMode ? 'rgba(144, 202, 249, 0.12)' : 'rgba(25, 118, 210, 0.12)' }} />
            
            <Box sx={{ p: 2 }}>
              <Collapse in={drawerOpen} timeout={300}>
                <Box sx={{ 
                  p: 1.5, 
                  borderRadius: '8px', 
                  backgroundColor: alpha(theme.palette.primary.main, 0.06)
                }}>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 600,
                      color: 'primary.main'
                    }}
                  >
                    RAG Demo v1.3
                  </Typography>
                  <br />
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ fontSize: '0.65rem' }}
                  >
                    Enterprise Edition
                  </Typography>
                </Box>
              </Collapse>
            </Box>
          </Drawer>

          {/* Main Content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              bgcolor: 'background.default',
              p: { xs: 2, sm: 3 },
              minHeight: '100vh',
              transition: theme.transitions.create(['margin', 'width'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
              }),
            }}
          >
            <Toolbar />
            <Toolbar variant="dense" /> {/* Space for secondary toolbar */}
            
            <Container maxWidth={false} sx={{ mt: 2, px: 4 }}>
              <Fade in={true} timeout={500}>
                <Box>
                  {CurrentComponent ? <CurrentComponent /> : <div>Select a menu item</div>}
                </Box>
              </Fade>
            </Container>
          </Box>
        </Box>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
