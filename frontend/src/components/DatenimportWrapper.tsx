import React from 'react';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import { usePortfolioData } from '../hooks/usePortfolioData';
import Datenimport from './Datenimport';

const DatenimportWrapper: React.FC = () => {
  const { portfolioData, loading, error } = usePortfolioData();

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

  return <Datenimport />;
};

export default DatenimportWrapper;
