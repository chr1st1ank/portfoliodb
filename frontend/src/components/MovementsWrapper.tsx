import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { usePortfolioData } from '../hooks/usePortfolioData';
import Movements from './Movements';
import { api } from '../services/api';
import { ActionType } from '../types/api';

const MovementsWrapper: React.FC = () => {
  const [selectedDate] = useState<Date | null>(null);
  const { portfolioData, loading, error } = usePortfolioData(selectedDate || undefined);
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [loadingActionTypes, setLoadingActionTypes] = useState(true);
  const [actionTypesError, setActionTypesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActionTypes = async () => {
      try {
        setLoadingActionTypes(true);
        const data = await api.actionTypes.getAll();
        setActionTypes(data);
      } catch (err) {
        console.error('Error fetching action types:', err);
        setActionTypesError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoadingActionTypes(false);
      }
    };

    fetchActionTypes();
  }, []);

  if (loading || loadingActionTypes) {
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

  if (error || actionTypesError) {
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
          <Typography>{error || actionTypesError}</Typography>
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
    <Movements
      movements={portfolioData.movements}
      actionTypes={actionTypes}
      investments={portfolioData.investments.map(inv => ({
        id: inv.id,
        name: inv.name,
        shortname: inv.shortname
      }))}
    />
  );
};

export default MovementsWrapper;
