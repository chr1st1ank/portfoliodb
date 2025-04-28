import React, { useState, useMemo } from 'react';
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
  Chip,
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Stack,
  Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import { Movement, ActionType } from '../types/api';
import { formatCurrency, formatDate } from '../utils/formatting';

interface MovementsProps {
  movements: Movement[];
  actionTypes: ActionType[];
  investments: { id: number; name: string; shortname: string }[];
}

export function Movements({ movements, actionTypes, investments }: MovementsProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [investmentFilter, setInvestmentFilter] = useState<number | ''>('');
  const [actionFilter, setActionFilter] = useState<number | ''>('');

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const clearFilters = () => {
    setDateFilter(null);
    setInvestmentFilter('');
    setActionFilter('');
  };

  // Sort movements by date (newest first)
  const sortedMovements = [...movements].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Apply filters
  const filteredMovements = useMemo(() => {
    return sortedMovements.filter(movement => {
      // Date filter
      if (dateFilter) {
        const movementDate = new Date(movement.date);
        const filterDate = new Date(dateFilter);
        
        if (
          movementDate.getFullYear() !== filterDate.getFullYear() ||
          movementDate.getMonth() !== filterDate.getMonth() ||
          movementDate.getDate() !== filterDate.getDate()
        ) {
          return false;
        }
      }
      
      // Investment filter
      if (investmentFilter !== '' && movement.investment !== investmentFilter) {
        return false;
      }
      
      // Action filter
      if (actionFilter !== '' && movement.action !== actionFilter) {
        return false;
      }
      
      return true;
    });
  }, [sortedMovements, dateFilter, investmentFilter, actionFilter]);

  // Get action name from action id
  const getActionName = (actionId: number) => {
    const action = actionTypes.find(a => a.id === actionId);
    return action ? action.name : 'Unknown';
  };

  // Get investment name from investment id
  const getInvestmentName = (investmentId: number) => {
    const investment = investments.find(i => i.id === investmentId);
    return investment ? investment.name : 'Unknown';
  };

  // Get action chip color based on action type
  const getActionChipColor = (actionId: number): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    // Map action types to colors
    const actionColorMap: Record<string, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
      1: "success", // Buy
      2: "error",   // Sell
      3: "info",    // Dividend
      4: "warning"  // Fee
      // Add more mappings as needed
    };
    
    return actionColorMap[actionId] || "default";
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Movements
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            All investment transactions and movements
          </Typography>
        </Grid>
        
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ width: '100%', mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
              <Tooltip title={showFilters ? "Hide filters" : "Show filters"}>
                <IconButton onClick={toggleFilters} color={showFilters ? "primary" : "default"}>
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
            {showFilters && (
              <Box sx={{ p: 2, borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Filter by date"
                      value={dateFilter}
                      onChange={(newValue) => setDateFilter(newValue)}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </LocalizationProvider>
                  
                  <FormControl size="small" fullWidth>
                    <InputLabel id="investment-filter-label">Investment</InputLabel>
                    <Select
                      labelId="investment-filter-label"
                      id="investment-filter"
                      value={investmentFilter}
                      label="Investment"
                      onChange={(e) => setInvestmentFilter(e.target.value as number | '')}
                    >
                      <MenuItem value="">
                        <em>All</em>
                      </MenuItem>
                      {investments.map((investment) => (
                        <MenuItem key={investment.id} value={investment.id}>
                          {investment.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl size="small" fullWidth>
                    <InputLabel id="action-filter-label">Action</InputLabel>
                    <Select
                      labelId="action-filter-label"
                      id="action-filter"
                      value={actionFilter}
                      label="Action"
                      onChange={(e) => setActionFilter(e.target.value as number | '')}
                    >
                      <MenuItem value="">
                        <em>All</em>
                      </MenuItem>
                      {actionTypes.map((action) => (
                        <MenuItem key={action.id} value={action.id}>
                          {action.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Tooltip title="Clear filters">
                    <IconButton onClick={clearFilters} size="small">
                      <ClearIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
            )}
            
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="movements table">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Investment</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Fee</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredMovements
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell component="th" scope="row">
                          {formatDate(new Date(movement.date))}
                        </TableCell>
                        <TableCell>{getInvestmentName(movement.investment)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={getActionName(movement.action)} 
                            color={getActionChipColor(movement.action)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">{typeof movement.quantity === 'number' ? movement.quantity.toFixed(4) : 'N/A'}</TableCell>
                        <TableCell align="right">{formatCurrency(movement.amount)}</TableCell>
                        <TableCell align="right">{formatCurrency(movement.fee)}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredMovements.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Movements;
