import React, { useState } from 'react';
import { ThemeProvider, createTheme, useColorScheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { usePortfolioData } from './hooks/usePortfolioData';
import PortfolioDashboard from './components/PortfolioDashboard';
import { CircularProgress, Box, Typography, Alert, RadioGroup, Radio, FormControl, FormControlLabel, FormLabel } from '@mui/material';

const theme = createTheme({
  colorSchemes: {
    dark: true,
  },
});

function ThemeToggle() {
  const { mode, setMode } = useColorScheme();

  if (!mode) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 1000,
        bgcolor: 'background.paper',
        borderRadius: 1,
        p: 1,
        boxShadow: 1,
      }}
    >
      <FormControl size="small">
        <RadioGroup
          row
          value={mode}
          onChange={(event) =>
            setMode(event.target.value as 'system' | 'light' | 'dark')
          }
        >
          <FormControlLabel value="system" control={<Radio size="small" />} label="System" />
          <FormControlLabel value="light" control={<Radio size="small" />} label="Light" />
          <FormControlLabel value="dark" control={<Radio size="small" />} label="Dark" />
        </RadioGroup>
      </FormControl>
    </Box>
  );
}

function App() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { portfolioData, loading, error, investments } = usePortfolioData(selectedDate || undefined);

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
      <ThemeToggle />
      <PortfolioDashboard
        portfolioData={portfolioData}
        performanceData={portfolioData.performance}
        onDateChange={setSelectedDate}
        investments={investments}
      />
    </ThemeProvider>
  );
}

export default App;
