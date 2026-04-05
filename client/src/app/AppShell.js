import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CssBaseline,
  ThemeProvider,
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
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  NavigateNext as NavigateNextIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import { SnackbarProvider } from 'notistack';
import { createAppTheme } from './theme';
import { collapsedDrawerWidth, drawerWidth, menuItems, menuSections } from './navigation';

function AppShell() {
  const [selectedMenuItem, setSelectedMenuItem] = useState('convert');
  const [drawerOpen, setDrawerOpen] = useState(true);
  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState({
    ingestion: true,
    retrieval: true,
    intelligence: true,
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
    () => createAppTheme(darkMode ? 'dark' : 'light'),
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
                AI RAG Hub
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
              background: darkMode
                ? 'linear-gradient(135deg, rgba(2,6,23,0.96) 0%, rgba(23,37,84,0.92) 60%, rgba(29,78,216,0.88) 100%)'
                : 'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(30,41,59,0.88) 52%, rgba(15,98,254,0.84) 100%)',
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
                  : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
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
                    AI RAG Hub
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
                    Production Workspace
                  </Typography>
                  <br />
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ fontSize: '0.65rem' }}
                  >
                    Retrieval, ranking, summarization, and AI workflows
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
              backgroundImage: darkMode
                ? 'radial-gradient(circle at top right, rgba(37,99,235,0.12), transparent 24%)'
                : 'radial-gradient(circle at top right, rgba(15,98,254,0.10), transparent 24%)',
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

export default AppShell;
