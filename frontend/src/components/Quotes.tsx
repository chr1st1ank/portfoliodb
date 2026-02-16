import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import EditIcon from '@mui/icons-material/Edit';
import TimelineIcon from '@mui/icons-material/Timeline';
import { Investment, InvestmentPrice } from '../types/api';
import { api } from '../services/api';
import { API_BASE_URL } from '../config';
import PriceHistoryDialog from './PriceHistoryDialog';

interface QuotesProps {
  investments: Investment[];
  onInvestmentUpdated?: () => void;
  onQuotesFetched?: () => void;
}

interface InvestmentFormData {
  name: string;
  isin: string;
  shortname: string;
  ticker_symbol: string;
  quote_provider: string;
}

interface InvestmentWithPrice extends Investment {
  latestPrice?: InvestmentPrice;
  configurationStatus: 'configured' | 'not_configured';
}

interface FetchResult {
  investment_id: number;
  success: boolean;
  error?: string;
}

interface FetchResponse {
  total: number;
  successful: number;
  failed: number;
  results: FetchResult[];
}

function Quotes({ investments, onInvestmentUpdated, onQuotesFetched }: QuotesProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [investmentPrices, setInvestmentPrices] = useState<InvestmentPrice[]>([]);
  const [providers, setProviders] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<FetchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Edit investment dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [investmentToEdit, setInvestmentToEdit] = useState<Investment | null>(null);
  const [editFormData, setEditFormData] = useState<InvestmentFormData>({
    name: '',
    isin: '',
    shortname: '',
    ticker_symbol: '',
    quote_provider: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof InvestmentFormData, string>>>({});

  // Price history dialog
  const [priceHistoryDialogOpen, setPriceHistoryDialogOpen] = useState(false);
  const [investmentForHistory, setInvestmentForHistory] = useState<Investment | null>(null);

  // Load investment prices and providers on mount
  useEffect(() => {
    loadInvestmentPrices();
    loadProviders();
  }, []);

  const loadInvestmentPrices = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch last 2 years of prices - enough to show latest price
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 2);

      const prices = await api.investmentPrices.getAll({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });
      setInvestmentPrices(prices);
    } catch (err) {
      console.error('Error loading investment prices:', err);
      setError('Failed to load investment prices');
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    try {
      const data = await api.quotes.getProviders();
      const providerMap: Record<string, string> = {};
      data.forEach(p => {
        providerMap[p.id] = p.name;
      });
      setProviders(providerMap);
    } catch (err) {
      console.error('Error loading providers:', err);
    }
  };

  // Combine investments with their latest prices
  const investmentsWithPrices: InvestmentWithPrice[] = investments.map(investment => {
    // Find latest price for this investment
    const prices = investmentPrices
      .filter(p => p.investment === investment.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const latestPrice = prices.length > 0 ? prices[0] : undefined;

    // Determine configuration status - only provider is required
    let configurationStatus: 'configured' | 'not_configured';
    if (investment.quote_provider) {
      configurationStatus = 'configured';
    } else {
      configurationStatus = 'not_configured';
    }

    return {
      ...investment,
      latestPrice,
      configurationStatus
    };
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 25));
    setPage(0);
  };

  const handleFetchAll = async () => {
    try {
      setFetching(true);
      setFetchResult(null);
      setError(null);

      // Call the fetch endpoint
      const response = await fetch(`${API_BASE_URL}/quotes/fetch/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: FetchResponse = await response.json();
      setFetchResult(result);

      // Reload prices after fetch
      await loadInvestmentPrices();

      // Trigger portfolio data refresh
      if (onQuotesFetched) {
        onQuotesFetched();
      }
    } catch (err) {
      console.error('Error fetching quotes:', err);
      setError('Failed to fetch quotes. Please try again.');
    } finally {
      setFetching(false);
    }
  };

  const getConfigurationStatusChip = (status: 'configured' | 'not_configured') => {
    switch (status) {
      case 'configured':
        return <Chip icon={<CheckCircleIcon />} label="Configured" color="success" size="small" />;
      case 'not_configured':
        return <Chip icon={<ErrorIcon />} label="Not Configured" color="error" size="small" />;
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

  const formatProviderName = (provider: string) => {
    return providers[provider] || provider;
  };

  // Edit investment handlers
  const handleEditClick = (investment: Investment) => {
    setInvestmentToEdit(investment);
    setEditFormData({
      name: investment.name || '',
      isin: investment.isin || '',
      shortname: investment.shortname || '',
      ticker_symbol: investment.ticker_symbol || '',
      quote_provider: investment.quote_provider || ''
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setInvestmentToEdit(null);
  };

  const validateForm = (formData: InvestmentFormData): boolean => {
    const errors: Partial<Record<keyof InvestmentFormData, string>> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.isin.trim()) {
      errors.isin = 'ISIN is required';
    } else if (!/^[A-Z0-9]{12}$/.test(formData.isin)) {
      errors.isin = 'ISIN must be 12 alphanumeric characters';
    }

    if (!formData.shortname.trim()) {
      errors.shortname = 'Short name is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditConfirm = async () => {
    if (!investmentToEdit) return;

    if (!validateForm(editFormData)) {
      return;
    }

    try {
      setIsEditing(true);

      const updatedInvestment = {
        name: editFormData.name,
        isin: editFormData.isin,
        shortname: editFormData.shortname,
        ticker_symbol: editFormData.ticker_symbol.trim() || null,
        quote_provider: editFormData.quote_provider || null
      };

      await api.investments.update(investmentToEdit.id, updatedInvestment);

      setEditDialogOpen(false);
      setInvestmentToEdit(null);

      // Notify parent to refresh data
      if (onInvestmentUpdated) {
        onInvestmentUpdated();
      }
    } catch (error) {
      console.error('Error updating investment:', error);
      setError('Failed to update investment');
    } finally {
      setIsEditing(false);
    }
  };

  const handleEditFormChange = (field: keyof InvestmentFormData, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value || ''
    }));

    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Price history handlers
  const handlePriceHistoryClick = (investment: Investment) => {
    setInvestmentForHistory(investment);
    setPriceHistoryDialogOpen(true);
  };

  const handlePriceHistoryClose = () => {
    setPriceHistoryDialogOpen(false);
    setInvestmentForHistory(null);
  };

  // Pagination
  const paginatedInvestments = investmentsWithPrices.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Quotes
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage and fetch investment quotes
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={fetching ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
              onClick={handleFetchAll}
              disabled={fetching}
            >
              {fetching ? 'Fetching...' : 'Fetch All Quotes'}
            </Button>
          </Stack>
        </Grid>

        {/* Fetch Result Alert */}
        {fetchResult && (
          <Grid size={{ xs: 12 }}>
            <Alert
              severity={fetchResult.failed === 0 ? 'success' : 'warning'}
              onClose={() => setFetchResult(null)}
            >
              <Typography variant="body2">
                <strong>Fetch completed:</strong> {fetchResult.successful} successful, {fetchResult.failed} failed out of {fetchResult.total} total
              </Typography>
              {fetchResult.failed > 0 && (
                <Box component="ul" sx={{ mt: 1, mb: 0 }}>
                  {fetchResult.results
                    .filter(r => !r.success)
                    .map(r => (
                      <li key={r.investment_id}>
                        Investment ID {r.investment_id}: {r.error}
                      </li>
                    ))}
                </Box>
              )}
            </Alert>
          </Grid>
        )}

        {/* Error Alert */}
        {error && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Investments Table */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ width: '100%', mb: 2 }}>
            <TableContainer>
              <Table aria-label="quotes table">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>ISIN</TableCell>
                    <TableCell>Ticker Symbol</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell>Latest Price</TableCell>
                    <TableCell>Price Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedInvestments.map((investment) => (
                    <TableRow key={investment.id}>
                      <TableCell>{investment.name}</TableCell>
                      <TableCell>{investment.isin}</TableCell>
                      <TableCell>{investment.ticker_symbol || '-'}</TableCell>
                      <TableCell>
                        {investment.quote_provider ? (
                          <Chip label={formatProviderName(investment.quote_provider)} size="small" variant="outlined" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {investment.latestPrice ? formatPrice(investment.latestPrice.price) : '-'}
                      </TableCell>
                      <TableCell>
                        {investment.latestPrice ? formatDate(investment.latestPrice.date) : '-'}
                      </TableCell>
                      <TableCell>
                        {getConfigurationStatusChip(investment.configurationStatus)}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="View Price History">
                            <IconButton
                              size="small"
                              onClick={() => handlePriceHistoryClick(investment)}
                              aria-label="price history"
                              disabled={!investment.latestPrice}
                            >
                              <TimelineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(investment)}
                              aria-label="edit"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedInvestments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No investments found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={investmentsWithPrices.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Price History Dialog */}
      <PriceHistoryDialog
        open={priceHistoryDialogOpen}
        investment={investmentForHistory}
        onClose={handlePriceHistoryClose}
      />

      {/* Edit Investment Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditCancel}
        aria-labelledby="edit-investment-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="edit-investment-dialog-title">
          Edit Investment
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={editFormData.name}
              onChange={(e) => handleEditFormChange('name', e.target.value)}
              fullWidth
              error={!!formErrors.name}
              helperText={formErrors.name}
            />

            <TextField
              label="ISIN"
              value={editFormData.isin}
              onChange={(e) => handleEditFormChange('isin', e.target.value)}
              fullWidth
              error={!!formErrors.isin}
              helperText={formErrors.isin}
            />

            <TextField
              label="Short Name"
              value={editFormData.shortname}
              onChange={(e) => handleEditFormChange('shortname', e.target.value)}
              fullWidth
              error={!!formErrors.shortname}
              helperText={formErrors.shortname}
            />

            <TextField
              label="Ticker Symbol"
              value={editFormData.ticker_symbol}
              onChange={(e) => handleEditFormChange('ticker_symbol', e.target.value)}
              fullWidth
              helperText="Optional: Symbol for quote fetching (e.g., AAPL, MSFT)"
            />

            <FormControl fullWidth>
              <InputLabel id="quote-provider-label">Quote Provider</InputLabel>
              <Select
                labelId="quote-provider-label"
                label="Quote Provider"
                value={editFormData.quote_provider}
                onChange={(e) => handleEditFormChange('quote_provider', e.target.value)}
              >
                <MenuItem value="">Not configured</MenuItem>
                {Object.entries(providers).map(([id, name]) => (
                  <MenuItem key={id} value={id}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel} disabled={isEditing}>
            Cancel
          </Button>
          <Button
            onClick={handleEditConfirm}
            color="primary"
            variant="contained"
            disabled={isEditing}
          >
            {isEditing ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Quotes;
