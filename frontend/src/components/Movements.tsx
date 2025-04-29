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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Stack,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  TextField,
  Fab,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { Movement, ActionType } from '../types/api';
import { formatCurrency, formatDate, formatNumber } from '../utils/formatting';
import { api } from '../services/api';

interface MovementsProps {
  movements: Movement[];
  actionTypes: ActionType[];
  investments: { id: number; name: string; shortname: string }[];
  onMovementDeleted?: () => void;
  onMovementAdded?: () => void;
  onMovementUpdated?: () => void;
}

interface NewMovementFormData {
  date: Date | null;
  investment: number | '';
  action: number | '';
  quantity: string;
  amount: string;
  fee: string;
}

interface MovementDialogProps {
  open: boolean;
  title: string;
  formData: NewMovementFormData;
  formErrors: Partial<Record<keyof NewMovementFormData, string>>;
  isProcessing: boolean;
  actionTypes: ActionType[];
  investments: { id: number; name: string; shortname: string }[];
  onCancel: () => void;
  onConfirm: () => void;
  onFormChange: (field: keyof NewMovementFormData, value: any) => void;
  confirmButtonText: string;
  processingButtonText: string;
}

// Movement dialog component for both add and edit operations
function MovementDialog({
  open,
  title,
  formData,
  formErrors,
  isProcessing,
  actionTypes,
  investments,
  onCancel,
  onConfirm,
  onFormChange,
  confirmButtonText,
  processingButtonText
}: MovementDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="movement-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="movement-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              value={formData.date}
              onChange={(newValue) => onFormChange('date', newValue)}
              slotProps={{ 
                textField: { 
                  fullWidth: true,
                  error: !!formErrors.date,
                  helperText: formErrors.date
                } 
              }}
            />
          </LocalizationProvider>
          
          <FormControl fullWidth error={!!formErrors.investment}>
            <InputLabel id="movement-investment-label">Investment</InputLabel>
            <Select
              labelId="movement-investment-label"
              id="movement-investment"
              value={formData.investment}
              label="Investment"
              onChange={(e) => onFormChange('investment', e.target.value)}
            >
              {investments.map((investment) => (
                <MenuItem key={investment.id} value={investment.id}>
                  {investment.name}
                </MenuItem>
              ))}
            </Select>
            {formErrors.investment && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {formErrors.investment}
              </Typography>
            )}
          </FormControl>
          
          <FormControl fullWidth error={!!formErrors.action}>
            <InputLabel id="movement-action-label">Action</InputLabel>
            <Select
              labelId="movement-action-label"
              id="movement-action"
              value={formData.action}
              label="Action"
              onChange={(e) => onFormChange('action', e.target.value)}
            >
              {actionTypes.map((action) => (
                <MenuItem key={action.id} value={action.id}>
                  {action.name}
                </MenuItem>
              ))}
            </Select>
            {formErrors.action && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {formErrors.action}
              </Typography>
            )}
          </FormControl>
          
          <TextField
            label="Quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => onFormChange('quantity', e.target.value)}
            fullWidth
            InputProps={{
              inputProps: { min: 0, step: "0.0001" }
            }}
            error={!!formErrors.quantity}
            helperText={formErrors.quantity}
          />
          
          <TextField
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => onFormChange('amount', e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start">€</InputAdornment>,
              inputProps: { step: "0.01" }
            }}
            error={!!formErrors.amount}
            helperText={formErrors.amount}
          />
          
          <TextField
            label="Fee"
            type="number"
            value={formData.fee}
            onChange={(e) => onFormChange('fee', e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: <InputAdornment position="start">€</InputAdornment>,
              inputProps: { min: 0, step: "0.01" }
            }}
            error={!!formErrors.fee}
            helperText={formErrors.fee}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button 
          onClick={onConfirm} 
          color="primary" 
          variant="contained"
          disabled={isProcessing}
        >
          {isProcessing ? processingButtonText : confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function Movements({ movements, actionTypes, investments, onMovementDeleted, onMovementAdded, onMovementUpdated }: MovementsProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [investmentFilter, setInvestmentFilter] = useState<number | ''>('');
  const [actionFilter, setActionFilter] = useState<number | ''>('');
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<Movement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Add movement dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof NewMovementFormData, string>>>({});
  const [newMovement, setNewMovement] = useState<NewMovementFormData>({
    date: new Date(),
    investment: '',
    action: '',
    quantity: '',
    amount: '',
    fee: '0'
  });

  // Edit movement dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [movementToEdit, setMovementToEdit] = useState<Movement | null>(null);
  const [editFormData, setEditFormData] = useState<NewMovementFormData>({
    date: new Date(),
    investment: '',
    action: '',
    quantity: '',
    amount: '',
    fee: '0'
  });

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
  
  // Delete handlers
  const handleDeleteClick = (movement: Movement) => {
    setMovementToDelete(movement);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setMovementToDelete(null);
  };
  
  const handleDeleteConfirm = async () => {
    if (!movementToDelete) return;
    
    try {
      setIsDeleting(true);
      await api.movements.delete(movementToDelete.id);
      
      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setMovementToDelete(null);
      
      // Notify parent component to refresh data
      if (onMovementDeleted) {
        onMovementDeleted();
      }
    } catch (error) {
      console.error('Error deleting movement:', error);
      // You could add error handling UI here
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Add movement handlers
  const handleAddClick = () => {
    setAddDialogOpen(true);
  };
  
  const handleAddCancel = () => {
    setAddDialogOpen(false);
    resetNewMovementForm();
  };
  
  const resetNewMovementForm = () => {
    setNewMovement({
      date: new Date(),
      investment: '',
      action: '',
      quantity: '',
      amount: '',
      fee: '0'
    });
    setFormErrors({});
  };
  
  const validateForm = (formData: NewMovementFormData): boolean => {
    const errors: Partial<Record<keyof NewMovementFormData, string>> = {};
    
    if (!formData.date) {
      errors.date = 'Date is required';
    }
    
    if (formData.investment === '') {
      errors.investment = 'Investment is required';
    }
    
    if (formData.action === '') {
      errors.action = 'Action is required';
    }
    
    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      errors.quantity = 'Quantity must be a positive number';
    }
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount)) {
      errors.amount = 'Amount must be a valid number';
    }
    
    const fee = parseFloat(formData.fee);
    if (isNaN(fee) || fee < 0) {
      errors.fee = 'Fee must be a non-negative number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleAddConfirm = async () => {
    if (!validateForm(newMovement)) {
      return;
    }
    
    try {
      setIsAdding(true);
      
      const movementData = {
        date: newMovement.date as Date,
        investment: newMovement.investment as number,
        action: newMovement.action as number,
        quantity: parseFloat(newMovement.quantity),
        amount: parseFloat(newMovement.amount),
        fee: parseFloat(newMovement.fee || '0')
      };
      
      await api.movements.create(movementData);
      
      // Close dialog and reset form
      setAddDialogOpen(false);
      resetNewMovementForm();
      
      // Notify parent component to refresh data
      if (onMovementAdded) {
        onMovementAdded();
      }
    } catch (error) {
      console.error('Error adding movement:', error);
      // You could add error handling UI here
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleFormChange = (field: keyof NewMovementFormData, value: any) => {
    setNewMovement(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear the error for this field if it exists
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Edit movement handlers
  const handleEditClick = (movement: Movement) => {
    setMovementToEdit(movement);
    setEditFormData({
      date: movement.date,
      investment: movement.investment,
      action: movement.action,
      quantity: movement.quantity.toString(),
      amount: movement.amount.toString(),
      fee: movement.fee.toString()
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };
  
  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setMovementToEdit(null);
  };
  
  const handleEditConfirm = async () => {
    if (!movementToEdit) return;
    
    if (!validateForm(editFormData)) {
      return;
    }
    
    try {
      setIsEditing(true);
      
      // Convert form data to Movement format
      const updatedMovement = {
        date: editFormData.date as Date,
        investment: editFormData.investment as number,
        action: editFormData.action as number,
        quantity: parseFloat(editFormData.quantity),
        amount: parseFloat(editFormData.amount),
        fee: parseFloat(editFormData.fee)
      };
      
      console.log('Updating movement:', movementToEdit.id, updatedMovement);
      const result = await api.movements.update(movementToEdit.id, updatedMovement);
      console.log('Update response:', result);
      
      // Close dialog and reset state
      setEditDialogOpen(false);
      setMovementToEdit(null);
      
      // Notify parent component to refresh data
      if (onMovementUpdated) {
        console.log('Calling onMovementUpdated callback');
        onMovementUpdated();
      } else {
        console.warn('No onMovementUpdated callback provided');
      }
    } catch (error) {
      console.error('Error updating movement:', error);
      // You could add error handling UI here
    } finally {
      setIsEditing(false);
    }
  };
  
  const handleEditFormChange = (field: keyof NewMovementFormData, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field if it exists
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
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
                    <TableCell align="right">Actions</TableCell>
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
                        <TableCell align="right">{formatNumber(Number(movement.quantity))}</TableCell>
                        <TableCell align="right">{formatCurrency(movement.amount)}</TableCell>
                        <TableCell align="right">{formatCurrency(movement.fee)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Edit">
                              <IconButton 
                                size="small" 
                                onClick={() => handleEditClick(movement)}
                                aria-label="edit"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteClick(movement)}
                                aria-label="delete"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
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
      
      {/* Floating Add Button */}
      <Fab 
        color="primary" 
        aria-label="add" 
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={handleAddClick}
      >
        <AddIcon />
      </Fab>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this movement? This action cannot be undone.
          </DialogContentText>
          
          {movementToDelete && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Movement details:</Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>Date: {formatDate(new Date(movementToDelete.date))}</li>
                <li>Investment: {getInvestmentName(movementToDelete.investment)}</li>
                <li>Action: {getActionName(movementToDelete.action)}</li>
                <li>Amount: {formatCurrency(movementToDelete.amount)}</li>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            disabled={isDeleting}
            autoFocus
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Movement Dialog */}
      <MovementDialog
        open={addDialogOpen}
        title="Add New Movement"
        formData={newMovement}
        formErrors={formErrors}
        isProcessing={isAdding}
        actionTypes={actionTypes}
        investments={investments}
        onCancel={handleAddCancel}
        onConfirm={handleAddConfirm}
        onFormChange={handleFormChange}
        confirmButtonText="Add Movement"
        processingButtonText="Adding..."
      />
      
      {/* Edit Movement Dialog */}
      <MovementDialog
        open={editDialogOpen}
        title="Edit Movement"
        formData={editFormData}
        formErrors={formErrors}
        isProcessing={isEditing}
        actionTypes={actionTypes}
        investments={investments}
        onCancel={handleEditCancel}
        onConfirm={handleEditConfirm}
        onFormChange={handleEditFormChange}
        confirmButtonText="Save Changes"
        processingButtonText="Saving..."
      />
    </Box>
  );
}
