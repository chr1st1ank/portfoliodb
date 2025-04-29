import React, { useState, useCallback } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { usePortfolioData } from '../hooks/usePortfolioData';
import Investments from './Investments';

const InvestmentsWrapper: React.FC = () => {
  const [selectedDate] = useState<Date | null>(null);
  const { portfolioData, loading, error, refetch } = usePortfolioData(selectedDate || undefined);
  
  const handleInvestmentDeleted = useCallback(() => {
    // Refresh the data when an investment is deleted
    refetch();
  }, [refetch]);
  
  const handleInvestmentAdded = useCallback(() => {
    // Refresh the data when an investment is added
    refetch();
  }, [refetch]);
  
  const handleInvestmentUpdated = useCallback(() => {
    // Refresh the data when an investment is updated
    refetch();
  }, [refetch]);

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
          <Typography variant="h6">Fehler beim Laden der Daten</Typography>
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
    <Investments
      investments={portfolioData.investments}
      onInvestmentDeleted={handleInvestmentDeleted}
      onInvestmentAdded={handleInvestmentAdded}
      onInvestmentUpdated={handleInvestmentUpdated}
    />
  );
};

export default InvestmentsWrapper;
