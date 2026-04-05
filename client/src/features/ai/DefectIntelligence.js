import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  Divider,
  Alert,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Collapse,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  BugReport as BugIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  AutoAwesome as SparkleIcon,
  ContentCopy as CopyIcon,
  LinkOff as DuplicateIcon,
  Memory as ServiceIcon,
  Category as ModuleIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

// Quick example defects for the team
const QUICK_EXAMPLES = [
  {
    title: 'NullPointerException in import',
    description: `Bug ID: NEW-001
Summary: File import fails with NullPointerException
Description: When uploading a large YAML file, the import process fails with NullPointerException.
Steps to Reproduce:
1. Go to Import section
2. Upload file > 2MB
3. Click Import
Error: NullPointerException at Parser.java:87
Environment: SIT`
  },
  {
    title: 'Certificate error on onboarding',
    description: `Bug ID: NEW-002
Summary: Device onboarding fails with certificate error
Description: Firewall device onboarding fails with x509 certificate signed by unknown authority.
Steps to Reproduce:
1. Add new device
2. Enter device details
3. Click Onboard
Error: x509: certificate signed by unknown authority
Service: device-manager`
  },
  {
    title: 'Deployment timeout',
    description: `Bug ID: NEW-003
Summary: Policy deployment stuck in progress
Description: Deployment remains in IN_PROGRESS state for more than 30 minutes.
Steps to Reproduce:
1. Create policy
2. Deploy to multiple devices
3. Check status after 30 min
Error: Timeout waiting for device response
Module: orchestration`
  }
];

// Pipeline steps for defect analysis
const PIPELINE_STEPS = [
  { label: 'Defect Input', description: 'Parse and validate defect information' },
  { label: 'Preprocessing', description: 'Normalize, extract key terms' },
  { label: 'Hybrid Search', description: 'BM25 + Vector search for similar defects' },
  { label: 'Re-Ranking', description: 'Score and rank similar defects' },
  { label: 'Deduplication', description: 'Identify potential duplicates' },
  { label: 'Summarization', description: 'Generate pattern summary' },
  { label: 'Analysis Generation', description: 'Generate insights via LLM' },
  { label: 'Complete', description: 'Analysis ready' }
];

// Defect analysis prompt template
const DEFECT_ANALYSIS_PROMPT = `# DEFECT INTELLIGENCE SYSTEM

## ROLE
You are an expert Software Quality Engineer and Bug Analyst helping teams identify patterns, duplicates, and root causes in defects.

## TASK
Analyze the submitted defect against similar defects found in the database. Provide:
1. Duplicate detection - Is this likely a duplicate of an existing bug?
2. Pattern analysis - What patterns exist across similar defects?
3. Root cause hypothesis - Potential root causes based on similar resolved bugs
4. Impact assessment - Services and modules affected
5. Resolution suggestions - Based on how similar bugs were fixed

## OUTPUT FORMAT
Provide your analysis in the following JSON structure:
{
  "duplicateAnalysis": {
    "isDuplicate": boolean,
    "confidence": "high|medium|low",
    "potentialDuplicateOf": "bug_id or null",
    "reasoning": "explanation"
  },
  "patternAnalysis": {
    "commonPatterns": ["pattern1", "pattern2"],
    "affectedServices": ["service1", "service2"],
    "affectedModules": ["module1", "module2"],
    "errorSignatureMatch": boolean
  },
  "rootCauseHypothesis": {
    "likelyRootCause": "description",
    "confidence": "high|medium|low",
    "basedOn": ["bug_id1", "bug_id2"],
    "similarRCAs": ["rca1", "rca2"]
  },
  "impactAssessment": {
    "severity": "Critical|High|Medium|Low",
    "affectedAreas": ["area1", "area2"],
    "riskLevel": "high|medium|low"
  },
  "resolutionSuggestions": {
    "suggestedFix": "description",
    "basedOnFixes": ["fix1", "fix2"],
    "estimatedEffort": "low|medium|high",
    "preventionMeasures": ["measure1", "measure2"]
  },
  "summary": "Brief overall analysis summary",
  "recommendations": ["recommendation1", "recommendation2"]
}

## GUIDELINES
- Focus on actionable insights
- Reference specific bug IDs when possible
- Be specific about patterns and root causes
- Prioritize duplicate detection accuracy`;

function DefectIntelligence() {
  // Core state
  const [defectInput, setDefectInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // View state
  const [showPipelineDetails, setShowPipelineDetails] = useState(false);
  const [showSimilarDefects, setShowSimilarDefects] = useState(false);
  
  // Pipeline metadata
  const [pipelineData, setPipelineData] = useState(null);
  
  const { enqueueSnackbar } = useSnackbar();

  // Handle example click
  const handleExampleClick = (example) => {
    setDefectInput(example.description);
    enqueueSnackbar('Example loaded! Click "Analyze Defect" to search', { variant: 'info' });
  };

  // Copy analysis to clipboard
  const handleCopyAnalysis = () => {
    if (result?.summary) {
      const analysisText = `
Defect Analysis Summary:
${result.summary}

Duplicate Analysis: ${result.duplicateAnalysis?.isDuplicate ? 'Potential duplicate of ' + result.duplicateAnalysis.potentialDuplicateOf : 'Not a duplicate'}

Root Cause Hypothesis: ${result.rootCauseHypothesis?.likelyRootCause || 'N/A'}

Suggested Fix: ${result.resolutionSuggestions?.suggestedFix || 'N/A'}

Recommendations:
${result.recommendations?.map((r, i) => `${i + 1}. ${r}`).join('\n') || 'N/A'}
      `.trim();
      navigator.clipboard.writeText(analysisText);
      enqueueSnackbar('Analysis copied to clipboard', { variant: 'success' });
    }
  };

  // Main analysis function - RAG Pipeline
  const handleAnalyze = async () => {
    if (!defectInput.trim()) {
      setError('Please enter defect information to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setCurrentStep(0);
    setPipelineData(null);

    try {
      // STEP 1: Defect Input
      setCurrentStep(0);
      await delay(200);

      // STEP 2: Preprocessing
      setCurrentStep(1);
      const preprocessResponse = await fetch('http://localhost:3001/api/search/preprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: defectInput,
          options: {
            enableAbbreviations: true,
            enableSynonyms: true,
            smartExpansion: true
          }
        })
      });

      let processedQuery = defectInput;
      let preprocessingData = null;
      
      if (preprocessResponse.ok) {
        preprocessingData = await preprocessResponse.json();
        processedQuery = preprocessingData.finalQuery || defectInput;
      }

      // STEP 3: Hybrid Search (BM25 + Vector using defects collection)
      setCurrentStep(2);
      const searchResponse = await fetch('http://localhost:3001/api/search/hybrid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: processedQuery,
          limit: 20,
          bm25Weight: 0.75,
          vectorWeight: 0.25,
          useDefects: true  // Use Defects collection and index (DEFECT_COLLECTION_NAME, DEFECT_VECTOR_INDEX_NAME, DEFECT_BM25_INDEX_NAME)
        })
      });

      if (!searchResponse.ok) {
        throw new Error('Hybrid search failed - please check your connection and defects collection/index settings');
      }

      const searchData = await searchResponse.json();
      
      if (!searchData.results || searchData.results.length === 0) {
        throw new Error('No similar defects found in the database. Please ensure defects are loaded with embeddings and BM25 index exists.');
      }

      // STEP 4: Re-Ranking
      setCurrentStep(3);
      const rerankResponse = await fetch('http://localhost:3001/api/search/rerank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: processedQuery,
          limit: 10,
          fusionMethod: 'rrf',
          rerankTopK: 20,
          bm25Weight: 0.3,
          vectorWeight: 0.7,
          useDefects: true  // Use Defects collection and index
        })
      });

      let rerankedResults = [];
      let rerankData = null;
      
      if (rerankResponse.ok) {
        rerankData = await rerankResponse.json();
        rerankedResults = rerankData.results || [];
      } else {
        rerankedResults = (searchData.results || []).slice(0, 10);
      }

      // STEP 5: Deduplication
      setCurrentStep(4);
      let finalResults = rerankedResults;
      let dedupData = null;
      
      if (finalResults.length > 3) {
        const resultsForDedup = finalResults.map(r => {
          const { embedding, ...rest } = r;
          return rest;
        });
        
        const dedupResponse = await fetch('http://localhost:3001/api/search/deduplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            results: resultsForDedup,
            threshold: 0.90
          })
        });

        if (dedupResponse.ok) {
          dedupData = await dedupResponse.json();
          const dedupIds = new Set(dedupData.deduplicated?.map(d => d._id || d.bug_id || d.id));
          finalResults = finalResults.filter(r => dedupIds.has(r._id || r.bug_id || r.id));
        }
      }

      const topResults = finalResults.slice(0, 8);

      // STEP 6: Summarization (token-aware gate)
      setCurrentStep(5);
      const resultsForSummary = topResults.slice(0, 5).map(r => ({
        bug_id: r.bug_id,
        summary: r.summary,
        service: r.service,
        module: r.module,
        status: r.status,
        priority: r.priority,
        rca: r.rca,
        fix_summary: r.fix_summary,
        error_signature: r.error_signature
      }));

      // Rough estimate: ~4 chars/token for English text.
      const contextTextForEstimate = resultsForSummary
        .map((r) =>
          `${r.bug_id || ''} ${r.summary || ''} ${r.service || ''} ${r.module || ''} ` +
          `${r.status || ''} ${r.priority || ''} ${r.rca || ''} ${r.fix_summary || ''} ${r.error_signature || ''}`
        )
        .join(' ');
      const estimatedContextTokens = Math.ceil(contextTextForEstimate.length / 4);
      const SUMMARY_GATE_TOKENS = 450;

      let summaryData = { summary: 'Context from similar defects', skipped: false };
      if (estimatedContextTokens >= SUMMARY_GATE_TOKENS) {
        const summarizeResponse = await fetch('http://localhost:3001/api/search/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            results: resultsForSummary,
            summaryType: 'detailed'
          })
        });

        if (summarizeResponse.ok) {
          summaryData = await summarizeResponse.json();
        }
      } else {
        const compact = resultsForSummary
          .slice(0, 3)
          .map((r, i) => `${i + 1}. ${r.bug_id || 'N/A'} | ${r.service || 'N/A'} | ${r.module || 'N/A'} | ${r.summary || 'No summary'}`)
          .join('\n');
        summaryData = {
          summary: `Token-aware gate: summarization skipped (estimated ${estimatedContextTokens} tokens < ${SUMMARY_GATE_TOKENS}).\n${compact}`,
          skipped: true,
          estimatedContextTokens
        };
      }

      // STEP 7: Analysis Generation
      setCurrentStep(6);
      
      // Prepare context from similar defects
      const contextDefects = topResults.slice(0, 5).map((defect, idx) => {
        return `
### Similar Defect ${idx + 1}: ${defect.bug_id}
- Summary: ${defect.summary}
- Service: ${defect.service}
- Module: ${defect.module}
- Status: ${defect.status}
- Priority: ${defect.priority}
- Error Signature: ${defect.error_signature || 'N/A'}
- RCA: ${defect.rca || 'Not available'}
- Fix: ${defect.fix_summary || 'Not available'}
- Duplicate Of: ${defect.duplicate_of || 'None'}
---`;
      }).join('\n');

      const fullPrompt = `${DEFECT_ANALYSIS_PROMPT}

## SUBMITTED DEFECT FOR ANALYSIS
${defectInput}

## SIMILAR DEFECTS FOUND IN DATABASE (${topResults.length} matches)
${contextDefects}

## CONTEXT SUMMARY
${summaryData.summary}

## INSTRUCTIONS
Analyze the submitted defect against the similar defects found. Determine if it's a duplicate, identify patterns, suggest root cause and resolution based on similar resolved bugs.`;

      const generateResponse = await fetch('http://localhost:3001/api/test-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          temperature: 0.3,
          maxTokens: 3000
        })
      });

      if (!generateResponse.ok) {
        throw new Error('Analysis generation failed');
      }

      const generatedData = await generateResponse.json();

      // STEP 8: Complete
      setCurrentStep(7);

      // Parse the response
      let parsedAnalysis = null;
      try {
        let rawResponse = generatedData.response;
        
        if (rawResponse?.raw) {
          rawResponse = rawResponse.raw;
        }
        
        if (typeof rawResponse === 'string') {
          const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            parsedAnalysis = JSON.parse(jsonMatch[1].trim());
          } else {
            parsedAnalysis = JSON.parse(rawResponse);
          }
        } else if (typeof rawResponse === 'object') {
          parsedAnalysis = rawResponse;
        }
      } catch (e) {
        parsedAnalysis = {
          summary: generatedData.response?.raw || generatedData.response || 'Analysis completed',
          duplicateAnalysis: { isDuplicate: false, confidence: 'low' },
          patternAnalysis: { commonPatterns: [], affectedServices: [], affectedModules: [] },
          rootCauseHypothesis: { likelyRootCause: 'Unable to determine', confidence: 'low' },
          impactAssessment: { severity: 'Medium', riskLevel: 'medium' },
          resolutionSuggestions: { suggestedFix: 'Review similar defects manually' },
          recommendations: ['Review similar defects in the list below']
        };
      }

      // Set result
      setResult({
        ...parsedAnalysis,
        similarDefects: topResults,
        contextSummary: summaryData.summary,
        tokens: generatedData.tokens,
        cost: generatedData.cost
      });

      setPipelineData({
        preprocessing: preprocessingData,
        searchCount: searchData.results?.length || 0,
        rerankedCount: rerankedResults.length,
        dedupRemoved: dedupData?.stats?.duplicatesRemoved || 0,
        finalCount: topResults.length
      });

      enqueueSnackbar('Defect analysis completed!', { variant: 'success' });

    } catch (err) {
      setError(err.message);
      setCurrentStep(-1);
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper delay function
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Handle Enter key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && event.ctrlKey && !isAnalyzing) {
      event.preventDefault();
      handleAnalyze();
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 2, 
            background: 'linear-gradient(135deg, #DC2626 0%, #F87171 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <BugIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Defect Intelligence System
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Analyze defects to find duplicates, patterns, root causes, and resolution suggestions
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Input & Examples */}
        <Grid item xs={12} lg={5}>
          {/* Defect Input */}
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <BugIcon color="error" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Enter Defect Details
              </Typography>
            </Box>
            
            <TextField
              fullWidth
              multiline
              rows={10}
              value={defectInput}
              onChange={(e) => setDefectInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Enter defect information to analyze...

Example:
Bug ID: BUG-001
Summary: Import fails with NullPointerException
Description: When uploading large files...
Steps to Reproduce:
1. Go to Import
2. Upload file
Error: NullPointerException
Service: parser-service
Environment: SIT`}
              variant="outlined"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.9rem',
                  fontFamily: 'monospace',
                  lineHeight: 1.6
                }
              }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={isAnalyzing ? <CircularProgress size={20} color="inherit" /> : <SparkleIcon />}
              onClick={handleAnalyze}
              disabled={isAnalyzing || !defectInput.trim()}
              sx={{
                py: 1.5,
                fontWeight: 600,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #DC2626 0%, #F87171 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)'
                }
              }}
            >
              {isAnalyzing ? 'Analyzing Defect...' : 'Analyze Defect'}
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Tip: Press Ctrl+Enter to analyze
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
          </Paper>

          {/* Quick Examples */}
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <InfoIcon color="info" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Example Defects
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click to load an example defect for analysis
            </Typography>

            <List dense>
              {QUICK_EXAMPLES.map((example, idx) => (
                <ListItem key={idx} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => handleExampleClick(example)}
                    sx={{ 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor: alpha('#DC2626', 0.04),
                        borderColor: '#DC2626'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <BugIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={example.title}
                      primaryTypographyProps={{ 
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Pipeline Progress (when analyzing) */}
          {isAnalyzing && (
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, mt: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Analysis Progress
              </Typography>
              <Stepper activeStep={currentStep} orientation="vertical">
                {PIPELINE_STEPS.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel
                      optional={
                        <Typography variant="caption" color="text.secondary">
                          {step.description}
                        </Typography>
                      }
                      StepIconProps={{
                        sx: {
                          '&.Mui-active': { color: '#DC2626' },
                          '&.Mui-completed': { color: 'success.main' }
                        }
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: currentStep === index ? 600 : 400 }}>
                        {step.label}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>
          )}
        </Grid>

        {/* Right Column - Results */}
        <Grid item xs={12} lg={7}>
          {!result && !isAnalyzing && (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 6, 
                border: '2px dashed', 
                borderColor: 'divider', 
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 500,
                bgcolor: alpha('#DC2626', 0.02)
              }}
            >
              <BugIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Defect Intelligence System
              </Typography>
              <Typography variant="body2" color="text.disabled" align="center" sx={{ maxWidth: 400 }}>
                Enter defect details on the left to find similar bugs, identify duplicates, 
                analyze patterns, and get resolution suggestions.
              </Typography>
            </Paper>
          )}

          {isAnalyzing && !result && (
            <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                <CircularProgress size={48} sx={{ mb: 3, color: '#DC2626' }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Analyzing Defect
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Searching for similar defects and generating analysis...
                </Typography>
                <LinearProgress sx={{ width: '60%', mt: 3, '& .MuiLinearProgress-bar': { bgcolor: '#DC2626' } }} />
              </Box>
            </Paper>
          )}

          {result && (
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
              {/* Result Header */}
              <Box sx={{ 
                p: 2, 
                bgcolor: alpha('#DC2626', 0.04), 
                borderBottom: '1px solid', 
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SuccessIcon color="success" />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Analysis Complete
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip 
                        label={result.duplicateAnalysis?.isDuplicate ? 'Potential Duplicate' : 'Not a Duplicate'}
                        size="small" 
                        color={result.duplicateAnalysis?.isDuplicate ? 'warning' : 'success'}
                        variant="outlined"
                        icon={result.duplicateAnalysis?.isDuplicate ? <DuplicateIcon /> : <SuccessIcon />}
                      />
                      <Chip 
                        label={`${result.similarDefects?.length || 0} similar`}
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Box>
                <Tooltip title="Copy Analysis">
                  <IconButton onClick={handleCopyAnalysis}>
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Analysis Content */}
              <Box sx={{ p: 3 }}>
                {/* Summary */}
                {result.summary && (
                  <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {result.summary}
                    </Typography>
                  </Alert>
                )}

                {/* Duplicate Analysis */}
                <Card elevation={0} sx={{ mb: 3, bgcolor: result.duplicateAnalysis?.isDuplicate ? alpha('#F59E0B', 0.08) : alpha('#10B981', 0.08), border: '1px solid', borderColor: result.duplicateAnalysis?.isDuplicate ? alpha('#F59E0B', 0.3) : alpha('#10B981', 0.3) }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <DuplicateIcon color={result.duplicateAnalysis?.isDuplicate ? 'warning' : 'success'} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Duplicate Analysis
                      </Typography>
                      <Chip 
                        label={`Confidence: ${result.duplicateAnalysis?.confidence || 'N/A'}`}
                        size="small"
                        color={getConfidenceColor(result.duplicateAnalysis?.confidence)}
                      />
                    </Box>
                    {result.duplicateAnalysis?.isDuplicate ? (
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Potential duplicate of:</strong> {result.duplicateAnalysis.potentialDuplicateOf}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {result.duplicateAnalysis.reasoning}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {result.duplicateAnalysis?.reasoning || 'This defect does not appear to be a duplicate of any existing bugs.'}
                      </Typography>
                    )}
                  </CardContent>
                </Card>

                {/* Pattern Analysis */}
                <Card elevation={0} sx={{ mb: 3, bgcolor: alpha('#3B82F6', 0.04), border: '1px solid', borderColor: alpha('#3B82F6', 0.12) }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Pattern Analysis
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">Common Patterns</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          {result.patternAnalysis?.commonPatterns?.map((pattern, idx) => (
                            <Chip key={idx} label={pattern} size="small" variant="outlined" />
                          )) || <Typography variant="body2" color="text.secondary">No patterns identified</Typography>}
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Affected Services</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          {result.patternAnalysis?.affectedServices?.map((service, idx) => (
                            <Chip key={idx} label={service} size="small" color="primary" variant="outlined" icon={<ServiceIcon />} />
                          )) || <Typography variant="body2">-</Typography>}
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">Affected Modules</Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                          {result.patternAnalysis?.affectedModules?.map((module, idx) => (
                            <Chip key={idx} label={module} size="small" color="secondary" variant="outlined" icon={<ModuleIcon />} />
                          )) || <Typography variant="body2">-</Typography>}
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Root Cause & Resolution */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ height: '100%', bgcolor: alpha('#8B5CF6', 0.04), border: '1px solid', borderColor: alpha('#8B5CF6', 0.12) }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#8B5CF6' }}>
                          Root Cause Hypothesis
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {result.rootCauseHypothesis?.likelyRootCause || 'Unable to determine root cause'}
                        </Typography>
                        {result.rootCauseHypothesis?.basedOn?.length > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            Based on: {result.rootCauseHypothesis.basedOn.join(', ')}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card elevation={0} sx={{ height: '100%', bgcolor: alpha('#10B981', 0.04), border: '1px solid', borderColor: alpha('#10B981', 0.12) }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#10B981' }}>
                          Suggested Resolution
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {result.resolutionSuggestions?.suggestedFix || 'Review similar defects for resolution ideas'}
                        </Typography>
                        <Chip 
                          label={`Effort: ${result.resolutionSuggestions?.estimatedEffort || 'Unknown'}`}
                          size="small"
                          variant="outlined"
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Recommendations
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {result.recommendations.map((rec, idx) => (
                        <li key={idx}>
                          <Typography variant="body2">{rec}</Typography>
                        </li>
                      ))}
                    </ul>
                  </Alert>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Similar Defects Section */}
                <Box>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      p: 1,
                      borderRadius: 1,
                      '&:hover': { bgcolor: alpha('#DC2626', 0.04) }
                    }}
                    onClick={() => setShowSimilarDefects(!showSimilarDefects)}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BugIcon fontSize="small" color="error" />
                      Similar Defects ({result.similarDefects?.length || 0})
                    </Typography>
                    <IconButton size="small">
                      {showSimilarDefects ? <CollapseIcon /> : <ExpandIcon />}
                    </IconButton>
                  </Box>

                  <Collapse in={showSimilarDefects}>
                    <TableContainer sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Bug ID</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Summary</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Service</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {result.similarDefects?.map((defect, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'error.main' }}>
                                {defect.bug_id}
                              </TableCell>
                              <TableCell sx={{ maxWidth: 200 }}>
                                <Typography variant="body2" noWrap>
                                  {defect.summary}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={defect.service} size="small" variant="outlined" />
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={defect.status} 
                                  size="small" 
                                  color={defect.status === 'Done' ? 'success' : 'warning'}
                                />
                              </TableCell>
                              <TableCell>
                                {defect.score ? (
                                  <Chip 
                                    label={`${(defect.score * 100).toFixed(0)}%`}
                                    size="small"
                                    color={defect.score >= 0.8 ? 'success' : 'default'}
                                  />
                                ) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Collapse>
                </Box>

                {/* Pipeline Details */}
                {pipelineData && (
                  <Box sx={{ mt: 2 }}>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        p: 1,
                        borderRadius: 1,
                        '&:hover': { bgcolor: alpha('#DC2626', 0.04) }
                      }}
                      onClick={() => setShowPipelineDetails(!showPipelineDetails)}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SuccessIcon color="success" fontSize="small" />
                        Pipeline Details
                      </Typography>
                      <IconButton size="small">
                        {showPipelineDetails ? <CollapseIcon /> : <ExpandIcon />}
                      </IconButton>
                    </Box>
                    
                    <Collapse in={showPipelineDetails}>
                      <Box sx={{ pl: 2, pt: 1, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip label={`Search: ${pipelineData.searchCount}`} size="small" variant="outlined" />
                        <Chip label={`Reranked: ${pipelineData.rerankedCount}`} size="small" variant="outlined" />
                        <Chip label={`Dedup removed: ${pipelineData.dedupRemoved}`} size="small" variant="outlined" />
                        <Chip label={`Final: ${pipelineData.finalCount}`} size="small" variant="outlined" color="success" />
                      </Box>
                    </Collapse>
                  </Box>
                )}
              </Box>

              {/* Footer with cost info */}
              {result.tokens && (
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  borderTop: '1px solid', 
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="caption" color="text.secondary">
                    Tokens: {result.tokens.total} • Cost: ${result.cost?.total || '0.00'}
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<CopyIcon />}
                    onClick={handleCopyAnalysis}
                  >
                    Copy Analysis
                  </Button>
                </Box>
              )}
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default DefectIntelligence;
