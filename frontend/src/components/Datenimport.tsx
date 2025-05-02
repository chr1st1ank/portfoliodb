import React, { useState, useCallback, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Alert, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Grid,
  Chip
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { api } from '../services/api';
import { DataImportResult } from '../parsing/types';
import { ParserRegistry } from '../parsing/parser';
// Import the Flatex parser to ensure it's registered
import '../parsing/flatexParser';

// Define interface for the import preview
// We're using the same properties as DataImportResult
type ImportPreview = DataImportResult;

// Map action types to readable German names
const actionTypeNames: Record<number, string> = {
  1: 'Kauf',
  2: 'Verkauf',
  3: 'Dividende',
  0: 'Unbekannt'
};

const Datenimport: React.FC = () => {
  // State for file input and import process
  const [fileType, setFileType] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [actionTypes, setActionTypes] = useState<Record<number, string>>({});
  const [availableParsers, setAvailableParsers] = useState<Array<{name: string, description: string}>>([]);

  // Initialize available parsers
  useEffect(() => {
    const parsers = ParserRegistry.getParsers();
    setAvailableParsers(parsers.map(parser => ({
      name: parser.getName(),
      description: parser.getDescription()
    })));
    
    // Set default parser if available
    if (parsers.length > 0) {
      setFileType(parsers[0].getName());
    }
  }, []);

  // Fetch action types when component mounts
  useEffect(() => {
    const fetchActionTypes = async () => {
      try {
        const types = await api.actionTypes.getAll();
        const typeMap: Record<number, string> = {};
        types.forEach(type => {
          typeMap[type.id] = type.name;
        });
        setActionTypes(typeMap);
      } catch (err) {
        console.error('Failed to fetch action types:', err);
      }
    };

    fetchActionTypes();
  }, []);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setError(null);
      setPreview(null);
      setImportSuccess(false);
      
      // Try to detect the file type from the extension
      const extension = files[0].name.split('.').pop()?.toLowerCase();
      if (extension) {
        const matchingParsers = ParserRegistry.getParsersByExtension(extension);
        if (matchingParsers.length === 1) {
          setFileType(matchingParsers[0].getName());
        }
      }
    }
  };

  // Generate preview of the import
  const generatePreview = useCallback(async () => {
    if (!file) {
      setError('Bitte wählen Sie eine Datei aus');
      return;
    }

    if (!fileType) {
      setError('Bitte wählen Sie einen Dateityp aus');
      return;
    }

    setIsLoading(true);
    setError(null);
    setPreview(null);

    try {
      // Read file content
      const content = await file.text();

      // Get the parser for the selected file type
      const parser = ParserRegistry.getParserByName(fileType);
      
      if (!parser) {
        setError(`Kein Parser für den Dateityp "${fileType}" gefunden`);
        return;
      }
      
      // Process data using the selected parser
      const parseResult = parser.parse(content);
      
      // Create preview data
      setPreview(parseResult);
    } catch (err) {
      setError(`Fehler beim Verarbeiten der Datei: ${err}`);
    } finally {
      setIsLoading(false);
    }
  }, [file, fileType]);

  // Handle the actual import
  const handleImport = async () => {
    if (!preview || preview.errors.length > 0) {
      setError('Bitte beheben Sie zuerst alle Fehler');
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportSuccess(false);

    try {
      // Create new investments
      const investmentMap = new Map<number, number>();
      
      for (const investment of preview.investments) {
        if (!investment.name || !investment.isin || !investment.shortname) {
          console.warn('Skipping investment with missing required fields:', investment);
          continue;
        }

        const tempId = investment.id || -1;
        // Check if investment already exists by ISIN
        const existingInvestments = await api.investments.getAll();
        const existingInvestment = existingInvestments.find(inv => inv.isin === investment.isin);
        
        if (existingInvestment) {
          investmentMap.set(tempId, existingInvestment.id);
        } else {
          // Create new investment
          const newInvestment = await api.investments.create({ 
            name: investment.name, 
            isin: investment.isin, 
            shortname: investment.shortname 
          });
          investmentMap.set(tempId, newInvestment.id);
        }
      }

      // Create movements with correct investment IDs
      for (const movement of preview.movements) {
        if (!movement.date || movement.action === undefined || 
            movement.quantity === undefined || movement.amount === undefined) {
          console.warn('Skipping movement with missing required fields:', movement);
          continue;
        }

        const investmentId = investmentMap.get(movement.investment || -1) || movement.investment || -1;
        
        await api.movements.create({
          date: movement.date,
          action: movement.action,
          investment: investmentId,
          quantity: movement.quantity,
          amount: movement.amount,
          fee: movement.fee || 0
        });
      }

      setImportSuccess(true);
      setPreview(null);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (err) {
      setError(`Fehler beim Import: ${err}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Get the action type name
  const getActionTypeName = (actionId: number): string => {
    return actionTypes[actionId] || actionTypeNames[actionId] || 'Unbekannt';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Datenimport
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Datei auswählen
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="file-type-label">Dateityp</InputLabel>
              <Select
                labelId="file-type-label"
                value={fileType}
                label="Dateityp"
                onChange={(e) => setFileType(e.target.value)}
              >
                {availableParsers.map(parser => (
                  <MenuItem key={parser.name} value={parser.name}>
                    {parser.name} - {parser.description}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ mt: 3 }}>
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<UploadFileIcon />}
                  fullWidth
                >
                  CSV-Datei auswählen
                </Button>
              </label>
              {file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Ausgewählte Datei: {file.name}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={generatePreview}
            disabled={!file || !fileType || isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Vorschau generieren'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {importSuccess && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Daten wurden erfolgreich importiert!
        </Alert>
      )}

      {preview && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Import Vorschau
          </Typography>

          {preview.errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Fehler:</Typography>
              <ul>
                {preview.errors.map((error, index) => (
                  <li key={`error-${index}`}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}

          {preview.warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Warnungen:</Typography>
              <ul>
                {preview.warnings.map((warning, index) => (
                  <li key={`warning-${index}`}>{warning}</li>
                ))}
              </ul>
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Zusammenfassung:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={`${preview.investments.length} neue Investments`} 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                label={`${preview.movements.length} neue Bewegungen`} 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                label={`${preview.movements.filter(m => m.action === 1).length} Käufe`} 
                color="success" 
                variant="outlined" 
              />
              <Chip 
                label={`${preview.movements.filter(m => m.action === 2).length} Verkäufe`} 
                color="error" 
                variant="outlined" 
              />
              <Chip 
                label={`${preview.movements.filter(m => m.action === 3).length} Dividenden`} 
                color="info" 
                variant="outlined" 
              />
            </Box>
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            Neue Investments: {preview.investments.length}
          </Typography>

          {preview.investments.length > 0 && (
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>ISIN</TableCell>
                    <TableCell>Kurzname</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.investments.map((investment, index) => (
                    <TableRow key={`investment-${index}`}>
                      <TableCell>{investment.name || '-'}</TableCell>
                      <TableCell>{investment.isin || '-'}</TableCell>
                      <TableCell>{investment.shortname || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Typography variant="subtitle1" gutterBottom>
            Neue Bewegungen: {preview.movements.length}
          </Typography>

          {preview.movements.length > 0 && (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Datum</TableCell>
                    <TableCell>Aktion</TableCell>
                    <TableCell>Investment</TableCell>
                    <TableCell align="right">Anzahl</TableCell>
                    <TableCell align="right">Betrag</TableCell>
                    <TableCell align="right">Gebühr</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.movements.map((movement, index) => {
                    const investment = preview.investments.find(inv => inv.id === movement.investment) || 
                                      { name: 'Unbekannt', isin: '', shortname: '' };
                    return (
                      <TableRow key={`movement-${index}`}>
                        <TableCell>{movement.date?.toLocaleDateString() || '-'}</TableCell>
                        <TableCell>
                          {movement.action !== undefined && (
                            <Chip 
                              label={getActionTypeName(movement.action)} 
                              color={
                                movement.action === 1 ? 'success' : 
                                movement.action === 2 ? 'error' : 
                                movement.action === 3 ? 'info' : 'default'
                              }
                              size="small"
                            />
                          )}
                        </TableCell>
                        <TableCell>{investment.name}</TableCell>
                        <TableCell align="right">{movement.quantity?.toFixed(3) || '-'}</TableCell>
                        <TableCell align="right">{movement.amount?.toFixed(2) || '-'} €</TableCell>
                        <TableCell align="right">{movement.fee?.toFixed(2) || '0.00'} €</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleImport}
              disabled={isImporting || preview.errors.length > 0}
            >
              {isImporting ? <CircularProgress size={24} /> : 'Daten importieren'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default Datenimport;
