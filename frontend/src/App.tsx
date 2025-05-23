import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { usePortfolioData } from './hooks/usePortfolioData';
import PortfolioDashboard from './components/PortfolioDashboard';
import { CircularProgress, Box, Typography, Alert, AppBar, Toolbar, Container, Tabs, Tab, Paper, Divider } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, useParams, useLocation, Link as RouterLink } from 'react-router-dom';
import InvestmentDetail from './components/InvestmentDetail';
import { ThemeToggle } from './components/ThemeToggle';
import { theme } from './theme';
import MovementsWrapper from './components/MovementsWrapper';
import InvestmentsWrapper from './components/InvestmentsWrapper';
import DatenimportWrapper from './components/DatenimportWrapper';

function App() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { portfolioData, loading, error, refetch } = usePortfolioData(selectedDate || undefined);
  const [mode, setMode] = useState<'light' | 'dark' | 'system'>('system');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    document.title = "Portfolio Assistant";
  }, []);

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Set initial theme based on system preference
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    // Add listener for theme changes
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    // Clean up listener
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const currentTheme = React.useMemo(
    () => createTheme({
      ...theme,
      palette: {
        mode: mode === 'system' ? systemTheme : mode,
      },
    }),
    [mode, systemTheme]
  );

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        p={2}
      >
        <Alert severity="error">
          <Typography variant="h6">Fehler beim Laden der Portfoliodaten</Typography>
          <Typography>{error}</Typography>
        </Alert>
      </Box>
    );
  }

  if (!portfolioData) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Alert severity="warning">
          <Typography>Keine Portfoliodaten verfügbar</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <Box sx={{ margin: 'auto' }}>
        <Router>
          <AppLayout mode={mode} setMode={setMode}>
            <Routes>
              <Route
                path="/"
                element={
                  <PortfolioDashboard
                    portfolioData={portfolioData}
                    onDateChange={setSelectedDate}
                    investments={portfolioData.investments}
                  />
                }
              />
              <Route path="/investment/:id" element={<InvestmentDetailWrapper />} />
              <Route path="/movements" element={<MovementsWrapper onDataChanged={() => {
                // Force refresh of portfolio data when returning to dashboard
                refetch();
                setRefreshTrigger(prev => prev + 1);
              }} />} />
              <Route path="/investments" element={<InvestmentsWrapper />} />
              <Route path="/datenimport" element={<DatenimportWrapper onDataImported={() => {
                // Force refresh of portfolio data when returning to dashboard
                refetch();
                setRefreshTrigger(prev => prev + 1);
              }} />} />
            </Routes>
          </AppLayout>
        </Router>
      </Box>
    </ThemeProvider>
  );
}

interface AppLayoutProps {
  children: React.ReactNode;
  mode: 'light' | 'dark' | 'system';
  setMode: (mode: 'light' | 'dark' | 'system') => void;
}

// Custom LinkTab component to properly handle routing with MUI Tab
interface LinkTabProps {
  label: string;
  to: string;
}

const LinkTab: React.FC<LinkTabProps> = (props) => {
  return (
    <Tab
      component={RouterLink}
      {...props}
    />
  );
};

const AppLayout: React.FC<AppLayoutProps> = ({ children, mode, setMode }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <Container maxWidth="xl" sx={{ px: 2, display: 'flex' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Portfolio Assistant
            </Typography>
          </Container>
        </Toolbar>
      </AppBar>

      {/* Navigation Tabs */}
      <Paper sx={{ borderRadius: 0 }}>
        <Container maxWidth="xl" sx={{ px: 2 }}>
          <Tabs 
            value={
              currentPath === '/' ? 0 : 
              currentPath === '/movements' ? 1 :
              currentPath === '/investments' ? 2 :
              currentPath === '/datenimport' ? 3 :
              currentPath.startsWith('/investment/') ? false : false
            } 
            aria-label="navigation tabs"
          >
            <LinkTab label="Dashboard" to="/" />
            <LinkTab label="Movements" to="/movements" />
            <LinkTab label="Investments" to="/investments" />
            <LinkTab label="Datenimport" to="/datenimport" />
            {/* Additional tabs can be added here */}
          </Tabs>
        </Container>
      </Paper>
      <Divider />

      {/* Main Content */}
      <Container 
        maxWidth="xl" 
        sx={{ 
          flexGrow: 1, 
          py: 3,
          px: 2,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Container>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 2, 
          mt: 'auto',
          backgroundColor: (theme) => theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800]
        }}
      >
        <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'center' }}>
          <ThemeToggle mode={mode} setMode={setMode} />
        </Container>
      </Box>
    </Box>
  );
};

const InvestmentDetailWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedDate] = useState<Date | null>(null);
  const { portfolioData, loading, error } = usePortfolioData(selectedDate || undefined);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        p={2}
      >
        <Alert severity="error">
          <Typography variant="h6">Fehler beim Laden der Portfoliodaten</Typography>
          <Typography>{error}</Typography>
        </Alert>
      </Box>
    );
  }

  if (!portfolioData) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Alert severity="warning">
          <Typography>Keine Portfoliodaten verfügbar</Typography>
        </Alert>
      </Box>
    );
  }

  const investment = portfolioData.investments.find(inv => inv.id === Number(id));
  if (!investment) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Alert severity="error">
          <Typography>Investment nicht gefunden</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <InvestmentDetail
      investment={investment}
      movements={portfolioData.movements.filter(m => m.investment === investment.id)}
      developments={portfolioData.developments.filter(d => d.investment === investment.id)}
    />
  );
};

export default App;
