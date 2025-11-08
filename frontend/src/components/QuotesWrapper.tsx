import { useState, useEffect } from 'react';
import { CircularProgress, Box, Alert, Typography } from '@mui/material';
import Quotes from './Quotes';
import { api } from '../services/api';
import { Investment } from '../types/api';

interface QuotesWrapperProps {
  onQuotesFetched?: () => void;
}

function QuotesWrapper({ onQuotesFetched }: QuotesWrapperProps) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.investments.getAll();
      setInvestments(data);
    } catch (err) {
      console.error('Error loading investments:', err);
      setError('Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  const handleInvestmentUpdated = () => {
    loadInvestments();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Alert severity="error">
          <Typography variant="h6">Error loading data</Typography>
          <Typography>{error}</Typography>
        </Alert>
      </Box>
    );
  }

  return <Quotes investments={investments} onInvestmentUpdated={handleInvestmentUpdated} onQuotesFetched={onQuotesFetched} />;
}

export default QuotesWrapper;
