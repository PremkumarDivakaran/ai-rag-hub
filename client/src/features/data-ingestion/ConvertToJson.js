import React, { useState } from 'react';
import {
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  TextField,
  Card,
  CardContent,
  Chip,
  Grid,
  Fade,
  LinearProgress,
  alpha
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  InsertDriveFile as FileIcon,
  Transform as TransformIcon,
  Refresh as ResetIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

function ConvertToJson() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [sheetName, setSheetName] = useState('Sheet1');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        enqueueSnackbar('Please select a valid Excel file (.xlsx or .xls)', { variant: 'error' });
        return;
      }
      setSelectedFile(file);
      setResult(null);
      setError(null);
      enqueueSnackbar('File selected successfully', { variant: 'success' });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      enqueueSnackbar('Please select a file first', { variant: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('sheetName', sheetName.trim() || 'Sheet1');

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post(`${API_BASE}/upload-excel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
      enqueueSnackbar('File converted successfully!', { variant: 'success' });
    } catch (err) {
      const errorData = err.response?.data;
      const errorMessage = errorData?.error || 'Upload failed';
      const suggestion = errorData?.suggestion || errorData?.details || '';
      setError({ message: errorMessage, suggestion });
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setSheetName('Sheet1');
    setResult(null);
    setError(null);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 2, 
            background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TransformIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Convert Excel to JSON
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload Excel files and convert them to JSON format for embedding creation
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Upload Section */}
        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              {/* File Upload Area */}
              <Box sx={{ mb: 3 }}>
                <input
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  id="excel-file-upload"
                  type="file"
                  onChange={handleFileSelect}
                />
                <label htmlFor="excel-file-upload">
                  <Box
                    component="span"
                    sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 4, 
                      border: '2px dashed',
                      borderColor: selectedFile ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      bgcolor: selectedFile ? alpha('#1976D2', 0.04) : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': { 
                        borderColor: 'primary.main',
                        bgcolor: alpha('#1976D2', 0.04)
                      }
                    }}
                  >
                    <CloudUploadIcon sx={{ fontSize: 48, color: selectedFile ? 'primary.main' : 'text.disabled', mb: 1 }} />
                    <Typography variant="subtitle1" color={selectedFile ? 'primary.main' : 'text.secondary'}>
                      {selectedFile ? 'Click to change file' : 'Click to select Excel file'}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      Supports .xlsx and .xls files
                    </Typography>
                  </Box>
                </label>
              </Box>

              {/* Selected File Display */}
              {selectedFile && (
                <Fade in={true}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    p: 2, 
                    mb: 3,
                    bgcolor: alpha('#1976D2', 0.06),
                    borderRadius: 2
                  }}>
                    <FileIcon color="primary" />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {selectedFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </Typography>
                    </Box>
                    <Chip label="Ready" color="primary" size="small" variant="outlined" />
                  </Box>
                </Fade>
              )}

              {/* Sheet Name Input */}
              <TextField
                label="Sheet Name"
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                variant="outlined"
                fullWidth
                size="small"
                sx={{ mb: 3 }}
                helperText="Enter the Excel sheet name (leave as 'Sheet1' to use first sheet)"
              />

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <TransformIcon />}
                  size="large"
                  sx={{ 
                    flexGrow: 1,
                    py: 1.5,
                    background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)'
                    }
                  }}
                >
                  {uploading ? 'Converting...' : 'Convert to JSON'}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={resetForm}
                  disabled={uploading}
                  startIcon={<ResetIcon />}
                >
                  Reset
                </Button>
              </Box>

              {/* Progress Bar */}
              {uploading && <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />}
            </CardContent>
          </Card>
        </Grid>

        {/* Results Section */}
        <Grid item xs={12} md={5}>
          {!result && !error && (
            <Box sx={{ 
              p: 4, 
              border: '2px dashed', 
              borderColor: 'divider', 
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 250,
              bgcolor: alpha('#1976D2', 0.02)
            }}>
              <TransformIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" align="center">
                Conversion results will appear here
              </Typography>
              <Typography variant="caption" color="text.disabled" align="center">
                Select a file and click Convert
              </Typography>
            </Box>
          )}

          {error && (
            <Fade in={true}>
              <Alert 
                severity="error" 
                icon={<ErrorIcon />}
                sx={{ borderRadius: 2 }}
                action={
                  <Button color="inherit" size="small" onClick={resetForm}>
                    Try Again
                  </Button>
                }
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  {error.message}
                </Typography>
                {error.suggestion && (
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {error.suggestion}
                  </Typography>
                )}
              </Alert>
            </Fade>
          )}

          {result && (
            <Fade in={true}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'success.light', borderRadius: 2, bgcolor: alpha('#4CAF50', 0.04) }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="subtitle1" fontWeight={600} color="success.main">
                      Conversion Successful
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">Output File</Typography>
                    <Typography variant="body1" fontWeight={600} color="primary.main">
                      {result.outputFile}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip 
                      label={`${result.rowCount || '?'} rows`} 
                      size="small" 
                      color="success" 
                      variant="outlined"
                    />
                    <Chip 
                      label={`Sheet: ${result.sheetUsed || sheetName}`} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>

                  {result.output && (
                    <Box sx={{ 
                      p: 1.5, 
                      bgcolor: 'grey.50', 
                      borderRadius: 1,
                      fontFamily: 'monospace',
                      fontSize: '0.75rem'
                    }}>
                      {result.output}
                    </Box>
                  )}

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                    File saved to src/data folder. You can now create embeddings.
                  </Typography>
                </CardContent>
              </Card>
            </Fade>
          )}
        </Grid>
      </Grid>

    </Box>
  );
}

export default ConvertToJson;