import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { usePortfolioData } from './hooks/usePortfolioData';
import PortfolioDashboard from './components/PortfolioDashboard';
import { CircularProgress, Box, Typography, Alert } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

function App() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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
          <Typography variant="h6">Error loading portfolio data</Typography>
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
          <Typography>No portfolio data available</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PortfolioDashboard
        portfolioData={portfolioData}
        performanceData={portfolioData.performance}
        onDateChange={setSelectedDate}
      />
    </ThemeProvider>
  );
}

export default App;
