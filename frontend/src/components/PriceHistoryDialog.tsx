import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { Investment, InvestmentPrice } from '../types/api';
import { api } from '../services/api';

interface PriceHistoryDialogProps {
  open: boolean;
  investment: Investment | null;
  onClose: () => void;
}

type ViewMode = 'chart' | 'table';

function PriceHistoryDialog({ open, investment, onClose }: PriceHistoryDialogProps) {
  const theme = useTheme();
  const [prices, setPrices] = useState<InvestmentPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('chart');

  useEffect(() => {
    if (open && investment) {
      loadPriceHistory();
    }
  }, [open, investment]);

  const loadPriceHistory = async () => {
    if (!investment) return;

    try {
      setLoading(true);
      setError(null);
      const priceData = await api.investmentPrices.getByInvestment(investment.id);
      // Sort by date ascending for chart
      const sortedPrices = priceData.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setPrices(sortedPrices);
    } catch (err) {
      console.error('Error loading price history:', err);
      setError('Failed to load price history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(price);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(value);
  };

  // Prepare chart data
  const chartData = prices.map(p => ({
    date: formatDate(p.date),
    price: p.price,
    fullDate: p.date
  }));

  const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newMode: ViewMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  // Calculate statistics
  const stats = prices.length > 0 ? {
    latest: prices[prices.length - 1].price,
    oldest: prices[0].price,
    highest: Math.max(...prices.map(p => p.price)),
    lowest: Math.min(...prices.map(p => p.price)),
    change: prices.length > 1 
      ? ((prices[prices.length - 1].price - prices[0].price) / prices[0].price * 100)
      : 0
  } : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby="price-history-dialog-title"
    >
      <DialogTitle id="price-history-dialog-title">
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6">Price History</Typography>
            {investment && (
              <Typography variant="body2" color="text.secondary">
                {investment.name} ({investment.isin})
              </Typography>
            )}
          </Box>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            aria-label="view mode"
          >
            <ToggleButton value="chart">Chart</ToggleButton>
            <ToggleButton value="table">Table</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && prices.length === 0 && (
          <Alert severity="info">
            No price history available for this investment.
          </Alert>
        )}

        {!loading && !error && prices.length > 0 && (
          <>
            {/* Statistics */}
            {stats && (
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Statistics</Typography>
                <Box display="flex" gap={3} flexWrap="wrap">
                  <Box>
                    <Typography variant="caption" color="text.secondary">Latest Price</Typography>
                    <Typography variant="body1" fontWeight="bold">{formatCurrency(stats.latest)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Change</Typography>
                    <Typography 
                      variant="body1" 
                      fontWeight="bold"
                      color={stats.change >= 0 ? 'success.main' : 'error.main'}
                    >
                      {stats.change >= 0 ? '+' : ''}{stats.change.toFixed(2)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Highest</Typography>
                    <Typography variant="body1">{formatCurrency(stats.highest)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Lowest</Typography>
                    <Typography variant="body1">{formatCurrency(stats.lowest)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Data Points</Typography>
                    <Typography variant="body1">{prices.length}</Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Chart View */}
            {viewMode === 'chart' && (
              <Box sx={{ height: 400, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tickFormatter={(value: number) => formatPrice(value)}
                      tick={{ fontSize: 12 }}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label: string) => `Date: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name="Price"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Change</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...prices].reverse().map((price, index, arr) => {
                      const prevPrice = arr[index + 1];
                      const change = prevPrice 
                        ? ((price.price - prevPrice.price) / prevPrice.price * 100)
                        : null;
                      
                      return (
                        <TableRow key={price.id}>
                          <TableCell>{formatDate(price.date)}</TableCell>
                          <TableCell align="right">{formatCurrency(price.price)}</TableCell>
                          <TableCell 
                            align="right"
                            sx={{ 
                              color: change !== null 
                                ? (change >= 0 ? 'success.main' : 'error.main')
                                : 'text.primary'
                            }}
                          >
                            {change !== null 
                              ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
                              : '-'
                            }
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default PriceHistoryDialog;
