import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { usePortfolioData } from './hooks/usePortfolioData';
import PortfolioDashboard from './components/PortfolioDashboard';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import InvestmentDetail from './components/InvestmentDetail';
import { ThemeToggle } from './components/ThemeToggle';
import { theme } from './theme';

function App() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { portfolioData, loading, error } = usePortfolioData(selectedDate || undefined);
  const [mode, setMode] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    document.title = "Portfolio";
  }, []);

  const currentTheme = React.useMemo(
    () => createTheme({
      ...theme,
      palette: {
        mode: mode === 'system' ? 'light' : mode,
      },
    }),
    [mode]
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
      <ThemeToggle mode={mode} setMode={setMode} />
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <PortfolioDashboard
                portfolioData={portfolioData}
                performanceData={portfolioData.performance}
                onDateChange={setSelectedDate}
                investments={portfolioData.investments}
              />
            }
          />
          <Route path="/investment/:id" element={<InvestmentDetailWrapper />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

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

  // Filter performance data for this specific investment
  const investmentPerformanceData = portfolioData.performance
    .map(data => ({
      date: new Date(data.date),
      value: data.investmentValues?.[investment.isin] || 0,
      investmentValues: { [investment.isin]: data.investmentValues?.[investment.isin] || 0 }
    }))
    .filter(data => data.value > 0);

  // Filter and sort movements for this investment
  const investmentMovements = portfolioData.movements
    .filter(movement => movement.investment === Number(id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <InvestmentDetail
      investment={investment}
      performanceData={investmentPerformanceData}
      movements={investmentMovements}
    />
  );
};

export default App;
