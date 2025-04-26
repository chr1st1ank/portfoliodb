import React, { useState } from 'react';
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
  Grid
} from '@mui/material';
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

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Sort movements by date (newest first)
  const sortedMovements = [...movements].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

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
                  {sortedMovements
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
              count={movements.length}
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
