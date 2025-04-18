import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import PortfolioDashboard from './components/PortfolioDashboard';
import { PortfolioData, PerformanceData } from './types/portfolio';

// Sample data for testing
const samplePortfolioData: PortfolioData = {
  currentDate: '2024-03-15',
  investments: [
    {
      isin: 'DE000A0F5UF5',
      name: 'iShares Core MSCI World UCITS ETF',
      previousValue: 10000,
      paymentSum: 5000,
      quantityAfter: 150,
      valueAfter: 15000,
      balance: 0,
      endValue: 15000,
      return: 50.0
    },
    {
      isin: 'IE00B4L5Y983',
      name: 'iShares Core MSCI EM IMI UCITS ETF',
      previousValue: 5000,
      paymentSum: 2500,
      quantityAfter: 200,
      valueAfter: 7500,
      balance: 0,
      endValue: 7500,
      return: 50.0
    },
    {
      isin: 'DE000A0F5UH1',
      name: 'iShares Core MSCI Europe UCITS ETF',
      previousValue: 3000,
      paymentSum: 1500,
      quantityAfter: 100,
      valueAfter: 4500,
      balance: 0,
      endValue: 4500,
      return: 50.0
    }
  ],
  total: {
    previousValue: 18000,
    paymentSum: 9000,
    valueAfter: 27000,
    balance: 0,
    endValue: 27000,
    return: 50.0
  }
};

const samplePerformanceData: PerformanceData = {
  total: [
    { date: new Date('2024-01-01').getTime(), value: 20000 },
    { date: new Date('2024-01-15').getTime(), value: 19800 },
    { date: new Date('2024-02-01').getTime(), value: 20500 },
    { date: new Date('2024-02-15').getTime(), value: 21500 },
    { date: new Date('2024-03-01').getTime(), value: 22500 },
    { date: new Date('2024-03-15').getTime(), value: 24000 },
    { date: new Date('2024-04-01').getTime(), value: 23500 },
    { date: new Date('2024-01-15').getTime(), value: 20500 },
    { date: new Date('2024-02-01').getTime(), value: 21000 },
    { date: new Date('2024-02-15').getTime(), value: 22500 },
    { date: new Date('2024-03-01').getTime(), value: 24000 },
    { date: new Date('2024-03-15').getTime(), value: 27000 },
    { date: new Date('2024-04-01').getTime(), value: 28500 },
    { date: new Date('2024-04-15').getTime(), value: 30000 },
    { date: new Date('2024-05-01').getTime(), value: 31500 },
    { date: new Date('2024-05-15').getTime(), value: 33000 },
    { date: new Date('2024-06-01').getTime(), value: 34500 },
    { date: new Date('2024-06-15').getTime(), value: 36000 },
    { date: new Date('2024-07-01').getTime(), value: 37500 },
    { date: new Date('2024-07-15').getTime(), value: 39000 },
    { date: new Date('2024-08-01').getTime(), value: 40500 },
    { date: new Date('2024-08-15').getTime(), value: 42000 },
    { date: new Date('2024-09-01').getTime(), value: 43500 },
    { date: new Date('2024-09-15').getTime(), value: 45000 },
    { date: new Date('2024-10-01').getTime(), value: 46500 },
    { date: new Date('2024-10-15').getTime(), value: 48000 },
    { date: new Date('2024-11-01').getTime(), value: 49500 },
    { date: new Date('2024-11-15').getTime(), value: 51000 },
    { date: new Date('2024-12-01').getTime(), value: 52500 },
    { date: new Date('2024-12-15').getTime(), value: 54000 },
    { date: new Date('2025-01-01').getTime(), value: 55500 },
    { date: new Date('2025-01-15').getTime(), value: 57000 },
    { date: new Date('2025-02-01').getTime(), value: 58500 },
    { date: new Date('2025-02-15').getTime(), value: 60000 },
    { date: new Date('2025-03-01').getTime(), value: 61500 },
    { date: new Date('2025-03-15').getTime(), value: 63000 },
    { date: new Date('2025-04-01').getTime(), value: 64500 },
    { date: new Date('2025-04-15').getTime(), value: 66000 }
  ],
  investments: {
    'DE000A0F5UF5': [
      { date: new Date('2024-01-01').getTime(), value: 10000 },
      { date: new Date('2024-01-15').getTime(), value: 10200 },
      { date: new Date('2024-02-01').getTime(), value: 10500 },
      { date: new Date('2024-02-15').getTime(), value: 12000 },
      { date: new Date('2024-03-01').getTime(), value: 13000 },
      { date: new Date('2024-03-15').getTime(), value: 15000 },
      { date: new Date('2024-04-01').getTime(), value: 16000 },
      { date: new Date('2024-04-15').getTime(), value: 17000 },
      { date: new Date('2024-05-01').getTime(), value: 18000 },
      { date: new Date('2024-05-15').getTime(), value: 19000 },
      { date: new Date('2024-06-01').getTime(), value: 20000 },
      { date: new Date('2024-06-15').getTime(), value: 21000 },
      { date: new Date('2024-07-01').getTime(), value: 22000 },
      { date: new Date('2024-07-15').getTime(), value: 23000 },
      { date: new Date('2024-08-01').getTime(), value: 24000 },
      { date: new Date('2024-08-15').getTime(), value: 25000 },
      { date: new Date('2024-09-01').getTime(), value: 26000 },
      { date: new Date('2024-09-15').getTime(), value: 27000 },
      { date: new Date('2024-10-01').getTime(), value: 28000 },
      { date: new Date('2024-10-15').getTime(), value: 29000 },
      { date: new Date('2024-11-01').getTime(), value: 30000 },
      { date: new Date('2024-11-15').getTime(), value: 31000 },
      { date: new Date('2024-12-01').getTime(), value: 32000 },
      { date: new Date('2024-12-15').getTime(), value: 33000 },
      { date: new Date('2025-01-01').getTime(), value: 34000 },
      { date: new Date('2025-01-15').getTime(), value: 35000 },
      { date: new Date('2025-02-01').getTime(), value: 36000 },
      { date: new Date('2025-02-15').getTime(), value: 37000 },
      { date: new Date('2025-03-01').getTime(), value: 38000 },
      { date: new Date('2025-03-15').getTime(), value: 39000 },
      { date: new Date('2025-04-01').getTime(), value: 40000 },
      { date: new Date('2025-04-15').getTime(), value: 41000 }
    ],
    'IE00B4L5Y983': [
      { date: new Date('2024-01-01').getTime(), value: 5000 },
      { date: new Date('2024-01-15').getTime(), value: 5100 },
      { date: new Date('2024-02-01').getTime(), value: 5200 },
      { date: new Date('2024-02-15').getTime(), value: 5500 },
      { date: new Date('2024-03-01').getTime(), value: 6000 },
      { date: new Date('2024-03-15').getTime(), value: 7500 },
      { date: new Date('2024-04-01').getTime(), value: 8000 },
      { date: new Date('2024-04-15').getTime(), value: 8500 },
      { date: new Date('2024-05-01').getTime(), value: 9000 },
      { date: new Date('2024-05-15').getTime(), value: 9500 },
      { date: new Date('2024-06-01').getTime(), value: 10000 },
      { date: new Date('2024-06-15').getTime(), value: 10500 },
      { date: new Date('2024-07-01').getTime(), value: 11000 },
      { date: new Date('2024-07-15').getTime(), value: 11500 },
      { date: new Date('2024-08-01').getTime(), value: 12000 },
      { date: new Date('2024-08-15').getTime(), value: 12500 },
      { date: new Date('2024-09-01').getTime(), value: 13000 },
      { date: new Date('2024-09-15').getTime(), value: 13500 },
      { date: new Date('2024-10-01').getTime(), value: 14000 },
      { date: new Date('2024-10-15').getTime(), value: 14500 },
      { date: new Date('2024-11-01').getTime(), value: 15000 },
      { date: new Date('2024-11-15').getTime(), value: 15500 },
      { date: new Date('2024-12-01').getTime(), value: 16000 },
      { date: new Date('2024-12-15').getTime(), value: 16500 },
      { date: new Date('2025-01-01').getTime(), value: 17000 },
      { date: new Date('2025-01-15').getTime(), value: 17500 },
      { date: new Date('2025-02-01').getTime(), value: 18000 },
      { date: new Date('2025-02-15').getTime(), value: 18500 },
      { date: new Date('2025-03-01').getTime(), value: 19000 },
      { date: new Date('2025-03-15').getTime(), value: 19500 },
      { date: new Date('2025-04-01').getTime(), value: 20000 },
      { date: new Date('2025-04-15').getTime(), value: 20500 }
    ],
    'DE000A0F5UH1': [
      { date: new Date('2024-01-01').getTime(), value: 3000 },
      { date: new Date('2024-01-15').getTime(), value: 3100 },
      { date: new Date('2024-02-01').getTime(), value: 3200 },
      { date: new Date('2024-02-15').getTime(), value: 3500 },
      { date: new Date('2024-03-01').getTime(), value: 4000 },
      { date: new Date('2024-03-15').getTime(), value: 4500 },
      { date: new Date('2024-04-01').getTime(), value: 5000 },
      { date: new Date('2024-04-15').getTime(), value: 5500 },
      { date: new Date('2024-05-01').getTime(), value: 6000 },
      { date: new Date('2024-05-15').getTime(), value: 6500 },
      { date: new Date('2024-06-01').getTime(), value: 7000 },
      { date: new Date('2024-06-15').getTime(), value: 7500 },
      { date: new Date('2024-07-01').getTime(), value: 8000 },
      { date: new Date('2024-07-15').getTime(), value: 8500 },
      { date: new Date('2024-08-01').getTime(), value: 9000 },
      { date: new Date('2024-08-15').getTime(), value: 9500 },
      { date: new Date('2024-09-01').getTime(), value: 10000 },
      { date: new Date('2024-09-15').getTime(), value: 10500 },
      { date: new Date('2024-10-01').getTime(), value: 11000 },
      { date: new Date('2024-10-15').getTime(), value: 11500 },
      { date: new Date('2024-11-01').getTime(), value: 12000 },
      { date: new Date('2024-11-15').getTime(), value: 12500 },
      { date: new Date('2024-12-01').getTime(), value: 13000 },
      { date: new Date('2024-12-15').getTime(), value: 13500 },
      { date: new Date('2025-01-01').getTime(), value: 14000 },
      { date: new Date('2025-01-15').getTime(), value: 14500 },
      { date: new Date('2025-02-01').getTime(), value: 15000 },
      { date: new Date('2025-02-15').getTime(), value: 15500 },
      { date: new Date('2025-03-01').getTime(), value: 16000 },
      { date: new Date('2025-03-15').getTime(), value: 16500 },
      { date: new Date('2025-04-01').getTime(), value: 17000 },
      { date: new Date('2025-04-15').getTime(), value: 17500 }
    ]
  }
};

// Create a theme instance
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PortfolioDashboard
        portfolioData={samplePortfolioData}
        performanceData={samplePerformanceData}
      />
    </ThemeProvider>
  );
}

export default App;
