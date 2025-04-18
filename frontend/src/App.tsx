import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import PortfolioDashboard from './components/PortfolioDashboard';
import { PortfolioData, PerformanceData } from './types/portfolio';

// Sample data - replace with actual API calls
const samplePortfolioData: PortfolioData = {
  currentDate: '25.10.2017',
  investments: [
    {
      isin: 'DE0002635307',
      name: 'STOXX Europe 600',
      previousValue: 5730.57,
      paymentSum: 6907.30,
      quantityAfter: 0,
      valueAfter: 0,
      balance: 1176.73,
      endValue: 1170.62,
      return: 39.38,
    },
    {
      isin: 'DE000ETFL268',
      name: 'MSCI USA',
      previousValue: 5875.80,
      paymentSum: 6487.55,
      quantityAfter: 0,
      valueAfter: 0,
      balance: 611.75,
      endValue: 591.65,
      return: 19.00,
    },
    {
      isin: 'LU0392495023',
      name: 'MSCI Pacific',
      previousValue: 2277.09,
      paymentSum: 2788.95,
      quantityAfter: 0,
      valueAfter: 0,
      balance: 511.86,
      endValue: 510.67,
      return: 44.30,
    },
    {
      isin: 'LU0292107645',
      name: 'MSCI EM',
      previousValue: 5622.66,
      paymentSum: -588.26,
      quantityAfter: 199,
      valueAfter: 7751.05,
      balance: 1540.13,
      endValue: 1363.67,
      return: 8.19,
    },
    {
      isin: 'LU0419741177',
      name: 'Rohstoffe',
      previousValue: 2982.85,
      paymentSum: -866.63,
      quantityAfter: 42,
      valueAfter: 3501.54,
      balance: -347.94,
      endValue: -457.60,
      return: -3.30,
    },
    {
      isin: 'DE000ETFL375',
      name: 'Corp. Bonds',
      previousValue: 4188.52,
      paymentSum: 4095.98,
      quantityAfter: 0,
      valueAfter: 0,
      balance: -92.54,
      endValue: -117.79,
      return: -4.05,
    },
    {
      isin: 'LU0444605645',
      name: 'Gov. Bonds',
      previousValue: 3819.44,
      paymentSum: 3705.67,
      quantityAfter: 0,
      valueAfter: 0,
      balance: -113.77,
      endValue: -139.47,
      return: -4.98,
    },
  ],
  total: {
    previousValue: 30496.93,
    paymentSum: 22530.56,
    valueAfter: 11252.59,
    balance: 3286.22,
    endValue: 2921.76,
    return: 8.21,
  },
};

const samplePerformanceData: PerformanceData = {
  total: [
    { date: 1326150000000, value: 5915.85 },
    { date: 1326236400000, value: 9899.28 },
    { date: 1327273200000, value: 12885.12 },
    // Add more historical data points here
  ],
  investments: {},
};

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
