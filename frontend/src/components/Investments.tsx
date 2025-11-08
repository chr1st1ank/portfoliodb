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
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { Investment } from '../types/api';
import { api } from '../services/api';

interface InvestmentsProps {
  investments: Investment[];
  onInvestmentDeleted?: () => void;
  onInvestmentAdded?: () => void;
  onInvestmentUpdated?: () => void;
}

interface InvestmentFormData {
  name: string;
  isin: string;
  shortname: string;
  ticker_symbol: string;
  quote_provider: string;
}

interface InvestmentDialogProps {
  open: boolean;
  title: string;
  formData: InvestmentFormData;
  formErrors: Partial<Record<keyof InvestmentFormData, string>>;
  isProcessing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onFormChange: (field: keyof InvestmentFormData, value: any) => void;
  confirmButtonText: string;
  processingButtonText: string;
  providers: Array<{id: string, name: string}>;
}

// Investment dialog component for both add and edit operations
function InvestmentDialog({
  open,
  title,
  formData,
  formErrors,
  isProcessing,
  onCancel,
  onConfirm,
  onFormChange,
  confirmButtonText,
  processingButtonText,
  providers
}: InvestmentDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="investment-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="investment-dialog-title">
        {title}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            value={formData.name}
            onChange={(e) => onFormChange('name', e.target.value)}
            fullWidth
            error={!!formErrors.name}
            helperText={formErrors.name}
          />
          
          <TextField
            label="ISIN"
            value={formData.isin}
            onChange={(e) => onFormChange('isin', e.target.value)}
            fullWidth
            error={!!formErrors.isin}
            helperText={formErrors.isin}
          />
          
          <TextField
            label="Short Name"
            value={formData.shortname}
            onChange={(e) => onFormChange('shortname', e.target.value)}
            fullWidth
            error={!!formErrors.shortname}
            helperText={formErrors.shortname}
          />
          
          <TextField
            label="Ticker Symbol"
            value={formData.ticker_symbol}
            onChange={(e) => onFormChange('ticker_symbol', e.target.value)}
            fullWidth
            helperText="Optional: Symbol for quote fetching (e.g., AAPL, MSFT)"
          />
          
          <FormControl fullWidth>
            <InputLabel id="quote-provider-label">Quote Provider</InputLabel>
            <Select
              labelId="quote-provider-label"
              label="Quote Provider"
              value={formData.quote_provider}
              onChange={(e) => onFormChange('quote_provider', e.target.value)}
            >
              <MenuItem value="">Not configured</MenuItem>
              {providers.map((provider) => (
                <MenuItem key={provider.id} value={provider.id}>
                  {provider.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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

function Investments({ investments, onInvestmentDeleted, onInvestmentAdded, onInvestmentUpdated }: InvestmentsProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [providers, setProviders] = useState<Array<{id: string, name: string}>>([]);
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState<Investment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Add investment dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof InvestmentFormData, string>>>({});
  const [newInvestment, setNewInvestment] = useState<InvestmentFormData>({
    name: '',
    isin: '',
    shortname: '',
    ticker_symbol: '',
    quote_provider: ''
  });

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

  // Load providers on mount
  useEffect(() => {
    const loadProviders = async () => {
      try {
        const data = await api.quotes.getProviders();
        setProviders(data);
      } catch (error) {
        console.error('Error loading providers:', error);
      }
    };
    loadProviders();
  }, []);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 25));
    setPage(0);
  };

  // Delete handlers
  const handleDeleteClick = (investment: Investment) => {
    setInvestmentToDelete(investment);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setInvestmentToDelete(null);
  };
  
  const handleDeleteConfirm = async () => {
    if (!investmentToDelete) return;
    
    try {
      setIsDeleting(true);
      console.log('Deleting investment:', investmentToDelete.id);
      await api.investments.delete(investmentToDelete.id);
      
      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setInvestmentToDelete(null);
      
      // Notify parent component to refresh data
      if (onInvestmentDeleted) {
        console.log('Calling onInvestmentDeleted callback');
        onInvestmentDeleted();
      } else {
        console.warn('No onInvestmentDeleted callback provided');
      }
    } catch (error) {
      console.error('Error deleting investment:', error);
      // You could add error handling UI here
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Add investment handlers
  const handleAddClick = () => {
    setAddDialogOpen(true);
  };
  
  const handleAddCancel = () => {
    setAddDialogOpen(false);
    resetNewInvestmentForm();
  };
  
  const resetNewInvestmentForm = () => {
    setNewInvestment({
      name: '',
      isin: '',
      shortname: '',
      ticker_symbol: '',
      quote_provider: ''
    });
    setFormErrors({});
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

  const handleAddConfirm = async () => {
    if (!validateForm(newInvestment)) {
      return;
    }
    
    try {
      setIsAdding(true);
      
      // Convert form data to Investment format
      const investment = {
        name: newInvestment.name,
        isin: newInvestment.isin,
        shortname: newInvestment.shortname,
        ticker_symbol: newInvestment.ticker_symbol || undefined,
        quote_provider: newInvestment.quote_provider || undefined
      };
      
      console.log('Creating investment:', investment);
      const result = await api.investments.create(investment);
      console.log('Create response:', result);
      
      // Close dialog and reset state
      setAddDialogOpen(false);
      resetNewInvestmentForm();
      
      // Notify parent component to refresh data
      if (onInvestmentAdded) {
        console.log('Calling onInvestmentAdded callback');
        onInvestmentAdded();
      } else {
        console.warn('No onInvestmentAdded callback provided');
      }
    } catch (error) {
      console.error('Error adding investment:', error);
      // You could add error handling UI here
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleFormChange = (field: keyof InvestmentFormData, value: any) => {
    setNewInvestment(prev => ({
      ...prev,
      [field]: value || ''
    }));
    
    // Clear error for this field if it exists
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
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
  
  const handleEditConfirm = async () => {
    if (!investmentToEdit) return;
    
    if (!validateForm(editFormData)) {
      return;
    }
    
    try {
      setIsEditing(true);
      
      // Convert form data to Investment format
      const updatedInvestment = {
        name: editFormData.name,
        isin: editFormData.isin,
        shortname: editFormData.shortname,
        ticker_symbol: editFormData.ticker_symbol || undefined,
        quote_provider: editFormData.quote_provider || undefined
      };
      
      console.log('Updating investment:', investmentToEdit.id, updatedInvestment);
      const result = await api.investments.update(investmentToEdit.id, updatedInvestment);
      console.log('Update response:', result);
      
      // Close dialog and reset state
      setEditDialogOpen(false);
      setInvestmentToEdit(null);
      
      // Notify parent component to refresh data
      if (onInvestmentUpdated) {
        console.log('Calling onInvestmentUpdated callback');
        onInvestmentUpdated();
      } else {
        console.warn('No onInvestmentUpdated callback provided');
      }
    } catch (error) {
      console.error('Error updating investment:', error);
      // You could add error handling UI here
    } finally {
      setIsEditing(false);
    }
  };
  
  const handleEditFormChange = (field: keyof InvestmentFormData, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value || ''
    }));
    
    // Clear error for this field if it exists
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Pagination
  const paginatedInvestments = investments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Investments
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Manage your investment instruments
          </Typography>
        </Grid>
        
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ width: '100%', mb: 2 }}>
            <TableContainer>
              <Table aria-label="investments table">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>ISIN</TableCell>
                    <TableCell>Short Name</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedInvestments.map((investment) => (
                    <TableRow key={investment.id}>
                      <TableCell>{investment.name}</TableCell>
                      <TableCell>{investment.isin}</TableCell>
                      <TableCell>{investment.shortname}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditClick(investment)}
                              aria-label="edit"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteClick(investment)}
                              aria-label="delete"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedInvestments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
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
              count={investments.length}
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
            Are you sure you want to delete this investment? This action cannot be undone.
          </DialogContentText>
          
          {investmentToDelete && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Investment details:</Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>Name: {investmentToDelete.name}</li>
                <li>ISIN: {investmentToDelete.isin}</li>
                <li>Short Name: {investmentToDelete.shortname}</li>
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
      
      {/* Add Investment Dialog */}
      <InvestmentDialog
        open={addDialogOpen}
        title="Add New Investment"
        formData={newInvestment}
        formErrors={formErrors}
        isProcessing={isAdding}
        onCancel={handleAddCancel}
        onConfirm={handleAddConfirm}
        onFormChange={handleFormChange}
        confirmButtonText="Add Investment"
        processingButtonText="Adding..."
        providers={providers}
      />
      
      {/* Edit Investment Dialog */}
      <InvestmentDialog
        open={editDialogOpen}
        title="Edit Investment"
        formData={editFormData}
        formErrors={formErrors}
        isProcessing={isEditing}
        onCancel={handleEditCancel}
        onConfirm={handleEditConfirm}
        onFormChange={handleEditFormChange}
        confirmButtonText="Save Changes"
        processingButtonText="Saving..."
        providers={providers}
      />
    </Box>
  );
}

export default Investments;
