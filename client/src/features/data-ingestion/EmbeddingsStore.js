import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  LinearProgress,
  Grid,
  Fade,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
  InsertDriveFile as FileIcon,
  Add as AddIcon,
  Folder as CollectionIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

function EmbeddingsStore() {
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [jobProgress, setJobProgress] = useState(null);
  
  // Collection management
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [collectionMode, setCollectionMode] = useState('existing'); // 'existing' or 'new'
  const [loadingCollections, setLoadingCollections] = useState(false);
  
  const { enqueueSnackbar } = useSnackbar();

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/files`);
      const validatedFiles = validateFiles(response.data || []);
      setFiles(validatedFiles);
      enqueueSnackbar(`Loaded ${validatedFiles.length} files`, { variant: 'success' });
    } catch (err) {
      setError('Failed to load files');
      enqueueSnackbar('Failed to load files', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  // Load existing collections from MongoDB
  const loadCollections = useCallback(async () => {
    setLoadingCollections(true);
    try {
      const response = await axios.get(`${API_BASE}/collections`);
      if (response.data.success && response.data.collections) {
        setCollections(response.data.collections);
        // Set default collection from env if available
        if (response.data.defaultCollection) {
          setSelectedCollection(response.data.defaultCollection);
        }
      }
    } catch (err) {
      // Silently handle - collections list not critical
      setCollections([]);
    } finally {
      setLoadingCollections(false);
    }
  }, []);

  // Check for active jobs on component mount (handles page refresh)
  const checkForActiveJobs = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/jobs/active`);
      if (response.data.jobs && response.data.jobs.length > 0) {
        const activeJob = response.data.jobs[0];
        setCurrentJobId(activeJob.id);
        setProcessing(true);
        setJobProgress(activeJob);
        enqueueSnackbar('Resuming embedding process...', { variant: 'info' });
      }
    } catch (err) {
      // Silently handle - no active jobs
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    loadFiles();
    loadCollections();
    checkForActiveJobs();
  }, [loadFiles, loadCollections, checkForActiveJobs]);

  // Poll for job status when processing
  useEffect(() => {
    if (!currentJobId || !processing) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_BASE}/jobs/${currentJobId}`);
        const job = response.data;
        
        setJobProgress(job);
        
        if (job.status === 'completed') {
          setProcessing(false);
          setResults(job.results);
          setCurrentJobId(null);
          setJobProgress(null);
          
          const successful = job.results.filter(r => r.status === 'completed').length;
          const failed = job.results.filter(r => r.status === 'failed').length;
          
          if (failed === 0) {
            enqueueSnackbar(`Successfully processed all ${successful} files!`, { variant: 'success' });
          } else {
            enqueueSnackbar(`Processed ${successful} files, ${failed} failed`, { variant: 'warning' });
          }
          
          clearInterval(pollInterval);
        }
      } catch (err) {
        clearInterval(pollInterval);
        setProcessing(false);
        setCurrentJobId(null);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [currentJobId, processing, enqueueSnackbar]);

  // Enhanced file data validation
  const validateFiles = (fileList) => {
    return fileList.filter(file => 
      file && 
      typeof file === 'object' && 
      file.name && 
      typeof file.size === 'number' &&
      file.modified
    );
  };

  const handleSelectionChange = (newSelection) => {
    try {
      let selectedFileNames = [];
      
      if (Array.isArray(newSelection)) {
        selectedFileNames = newSelection.filter(Boolean);
      } else if (newSelection && typeof newSelection === 'object') {
        if (newSelection.type === 'include' && newSelection.ids) {
          selectedFileNames = Array.from(newSelection.ids).filter(Boolean);
        } else if (newSelection.type === 'exclude' && newSelection.ids) {
          const excludedIds = new Set(newSelection.ids);
          selectedFileNames = files
            .map(file => file.name)
            .filter(name => !excludedIds.has(name));
        }
      }
      
      setSelectedFiles(selectedFileNames);
    } catch (error) {
      enqueueSnackbar('Selection error: ' + error.message, { variant: 'error' });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString();
  };

  // Get the target collection name
  const getTargetCollection = () => {
    if (collectionMode === 'new' && newCollectionName.trim()) {
      return newCollectionName.trim();
    }
    return selectedCollection;
  };

  const handleCreateEmbeddings = async () => {
    if (selectedFiles.length === 0) {
      enqueueSnackbar('Please select at least one file', { variant: 'warning' });
      return;
    }

    const targetCollection = getTargetCollection();
    if (!targetCollection) {
      enqueueSnackbar('Please select or enter a collection name', { variant: 'warning' });
      return;
    }

    setProcessing(true);
    setError(null);
    setResults([]);
    setJobProgress(null);

    try {
      const isNewCollection = collectionMode === 'new';
      
      // Debug logging
      console.log('=== Create Embeddings Debug ===');
      console.log('collectionMode:', collectionMode);
      console.log('newCollectionName:', newCollectionName);
      console.log('selectedCollection:', selectedCollection);
      console.log('targetCollection (from getTargetCollection()):', targetCollection);
      console.log('isNewCollection:', isNewCollection);
      console.log('===============================');
      
      enqueueSnackbar(
        `Starting to process ${selectedFiles.length} files into ${isNewCollection ? 'new' : 'existing'} collection "${targetCollection}"...`, 
        { variant: 'info' }
      );
      
      const response = await axios.post(`${API_BASE}/create-embeddings`, {
        files: selectedFiles,
        collectionName: targetCollection,
        createNew: isNewCollection
      });

      // Save job ID and start polling
      setCurrentJobId(response.data.jobId);
      enqueueSnackbar('Embedding process started in background', { variant: 'success' });
      
      // Refresh collections list after processing starts (in case new collection was created)
      if (isNewCollection) {
        setTimeout(() => loadCollections(), 2000);
      }
      
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to create embeddings';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      setProcessing(false);
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: 'File Name',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileIcon color="primary" fontSize="small" />
          <Typography variant="body2">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'size',
      headerName: 'Size',
      width: 120,
      renderCell: (params) => formatFileSize(params.value),
    },
    {
      field: 'modified',
      headerName: 'Modified',
      width: 180,
      renderCell: (params) => formatDate(params.value),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => (
        <Chip label={(params.value || '').toUpperCase()} size="small" variant="outlined" />
      ),
    },
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'in-progress':
        return <ScheduleIcon color="primary" />;
      default:
        return <ScheduleIcon color="disabled" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'in-progress':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <StorageIcon color="primary" sx={{ fontSize: '2rem' }} />
          Embeddings & Store
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select JSON files to create embeddings and store them in MongoDB Atlas Vector Database.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* File Management */}
        <Grid item xs={12} lg={8}>
          <Card elevation={3}>
            <CardHeader
              title="Available Files"
              subheader={`${files.length} JSON files found`}
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Settings">
                    <IconButton onClick={() => setShowSettings(true)}>
                      <SettingsIcon />
                    </IconButton>
                  </Tooltip>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadFiles}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                </Box>
              }
            />
            <CardContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : files.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                  <Typography color="text.secondary">
                    No JSON files found in the data directory
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ height: 400, width: '100%' }}>
                  <DataGrid
                    rows={files}
                    columns={columns}
                    getRowId={(row) => row.name}
                    checkboxSelection
                    onRowSelectionModelChange={handleSelectionChange}
                    density="comfortable"
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{
                      pagination: {
                        paginationModel: { page: 0, pageSize: 10 },
                      },
                    }}
                    sx={{
                      '& .MuiDataGrid-cell:focus': {
                        outline: 'none',
                      },
                      '& .MuiDataGrid-row:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  />
                </Box>
              )}

              {selectedFiles.length > 0 && (
                <Fade in={true}>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                    <Typography variant="body2" color="primary" fontWeight={600}>
                      Selected {selectedFiles.length} file(s): {selectedFiles.join(', ')}
                    </Typography>
                  </Box>
                </Fade>
              )}

              {processing && jobProgress && (
                <Fade in={true}>
                  <Card variant="outlined" sx={{ mt: 2, bgcolor: 'info.50', borderColor: 'info.main' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="subtitle1" fontWeight={600} color="info.main">
                          Processing Embeddings...
                        </Typography>
                        <Chip 
                          label={`${jobProgress.progress}/${jobProgress.total}`} 
                          color="info" 
                          size="small"
                        />
                      </Box>
                      
                      {jobProgress.currentFile && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Current file: <strong>{jobProgress.currentFile}</strong>
                        </Typography>
                      )}
                      
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Progress: {Math.round((jobProgress.progress / jobProgress.total) * 100)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Job ID: {currentJobId?.substring(0, 20)}...
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(jobProgress.progress / jobProgress.total) * 100}
                          sx={{ height: 8, borderRadius: 1 }}
                        />
                      </Box>
                      
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="caption">
                          ✨ This process continues even if you refresh the page!
                        </Typography>
                      </Alert>
                    </CardContent>
                  </Card>
                </Fade>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Action Panel */}
        <Grid item xs={12} lg={4}>
          <Card elevation={2}>
            <CardHeader
              title="Actions"
              subheader="Process selected files"
              avatar={<PlayArrowIcon color="primary" />}
            />
            <CardContent>
              {/* Collection Selection */}
              <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CollectionIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    Target Collection
                  </Typography>
                </Box>

                {/* Collection Mode Toggle */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button
                    variant={collectionMode === 'existing' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setCollectionMode('existing')}
                    sx={{ flex: 1 }}
                  >
                    Existing
                  </Button>
                  <Button
                    variant={collectionMode === 'new' ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => setCollectionMode('new')}
                    startIcon={<AddIcon />}
                    sx={{ flex: 1 }}
                  >
                    New
                  </Button>
                </Box>

                {collectionMode === 'existing' ? (
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Collection</InputLabel>
                    <Select
                      value={selectedCollection}
                      label="Select Collection"
                      onChange={(e) => setSelectedCollection(e.target.value)}
                      disabled={loadingCollections || processing}
                    >
                      {loadingCollections ? (
                        <MenuItem disabled>Loading...</MenuItem>
                      ) : collections.length === 0 ? (
                        <MenuItem disabled>No collections found</MenuItem>
                      ) : (
                        collections.map((col) => (
                          <MenuItem key={col.name} value={col.name}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                              <span>{col.name}</span>
                              <Chip 
                                label={`${col.count} docs`} 
                                size="small" 
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    label="New Collection Name"
                    placeholder="e.g., my_test_cases"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    disabled={processing}
                    helperText="Only lowercase letters, numbers, and underscores"
                  />
                )}

                {/* Collection info */}
                {collectionMode === 'existing' && selectedCollection && (
                  <Alert severity="info" sx={{ mt: 1 }} icon={false}>
                    <Typography variant="caption">
                      Data will be <strong>added to</strong> existing collection
                    </Typography>
                  </Alert>
                )}
                {collectionMode === 'new' && newCollectionName && (
                  <Alert severity="success" sx={{ mt: 1 }} icon={false}>
                    <Typography variant="caption">
                      New collection "<strong>{newCollectionName}</strong>" will be created
                    </Typography>
                  </Alert>
                )}
              </Card>

              <Divider sx={{ my: 2 }} />

              <Button
                variant="contained"
                startIcon={processing ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                onClick={handleCreateEmbeddings}
                disabled={selectedFiles.length === 0 || processing || !getTargetCollection()}
                size="large"
                fullWidth
                sx={{ mb: 2 }}
              >
                {processing ? 'Processing...' : 'Create Embeddings'}
              </Button>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Processing Time:</strong> ~10-30 seconds per file<br />
                  <strong>Cost:</strong> ~$0.0001 per test case
                </Typography>
              </Alert>

              {selectedFiles.length > 0 && (
                <Card variant="outlined">
                  <CardContent sx={{ py: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Selected Files
                    </Typography>
                    <List dense>
                      {selectedFiles.slice(0, 3).map((file) => (
                        <ListItem key={file} sx={{ px: 0, py: 0.5 }}>
                          <ListItemText 
                            primary={file}
                            primaryTypographyProps={{ fontSize: '0.875rem' }}
                          />
                        </ListItem>
                      ))}
                      {selectedFiles.length > 3 && (
                        <ListItem sx={{ px: 0, py: 0.5 }}>
                          <ListItemText 
                            primary={`... and ${selectedFiles.length - 3} more`}
                            primaryTypographyProps={{ 
                              fontSize: '0.875rem',
                              fontStyle: 'italic',
                              color: 'text.secondary'
                            }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Results Section */}
      {results.length > 0 && (
        <Fade in={true}>
          <Card elevation={3} sx={{ mt: 3 }}>
            <CardHeader
              title="Processing Results"
              subheader={`${results.filter(r => r.status === 'completed').length} completed, ${results.filter(r => r.status === 'failed').length} failed`}
            />
            <CardContent>
              <List>
                {results.map((result, index) => (
                  <ListItem key={index} sx={{ display: 'flex', alignItems: 'flex-start', border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                    <Box sx={{ mr: 2, mt: 0.5 }}>
                      {getStatusIcon(result.status)}
                    </Box>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {result.file}
                          </Typography>
                          <Chip 
                            label={result.status} 
                            size="small" 
                            color={getStatusColor(result.status)}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          {result.error ? (
                            <Alert severity="error" size="small" sx={{ mt: 1 }}>
                              {result.error}
                            </Alert>
                          ) : (
                            result.output && (
                              <Paper elevation={1} sx={{ p: 1, mt: 1, bgcolor: 'grey.50' }}>
                                <Typography variant="body2" component="pre" sx={{ 
                                  whiteSpace: 'pre-wrap', 
                                  fontSize: '0.75rem',
                                  fontFamily: 'monospace'
                                }}>
                                  {result.output.substring(0, 200)}
                                  {result.output.length > 200 && '...'}
                                </Typography>
                              </Paper>
                            )
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* Settings Dialog */}
      <Dialog open={showSettings} onClose={() => setShowSettings(false)} maxWidth="md" fullWidth>
        <DialogTitle>Embedding Configuration</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Current embedding configuration and settings:
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Model Settings</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Model" secondary="text-embedding-3-small" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Dimensions" secondary="1536" />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="API Source" secondary="LLM API" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Database Settings</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Database" secondary="MongoDB Atlas" />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Target Collection" 
                        secondary={getTargetCollection() || 'Not selected'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Available Collections" 
                        secondary={`${collections.length} collections found`} 
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Collections List */}
          <Card variant="outlined" sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Available Collections</Typography>
              {collections.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No collections found. Create embeddings to add a new collection.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {collections.map((col) => (
                    <Chip
                      key={col.name}
                      label={`${col.name} (${col.count})`}
                      variant={selectedCollection === col.name ? 'filled' : 'outlined'}
                      color={selectedCollection === col.name ? 'primary' : 'default'}
                      onClick={() => {
                        setSelectedCollection(col.name);
                        setCollectionMode('existing');
                      }}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </DialogContent>
        <DialogActions>
          <Button 
            variant="outlined" 
            onClick={loadCollections}
            startIcon={<RefreshIcon />}
          >
            Refresh Collections
          </Button>
          <Button onClick={() => setShowSettings(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default EmbeddingsStore;