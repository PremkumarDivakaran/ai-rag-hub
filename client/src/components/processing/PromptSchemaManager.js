import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  Tabs,
  Tab,
  Divider,
  Alert,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fade,
  Collapse,
  IconButton,
  Tooltip,
  alpha
} from '@mui/material';
import {
  PlayArrow as GenerateIcon,
  GetApp as ExportIcon,
  Psychology as AiIcon,
  Search as SearchIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Description as DocIcon,
  Science as TestIcon,
  Assignment as StoryIcon,
  AutoAwesome as SparkleIcon
} from '@mui/icons-material';

// Default prompt template (hidden from UI but used internally)
const DEFAULT_PROMPT_TEMPLATE = `# TEST CASE GENERATION FROM USER STORY

## INSTRUCTION
Generate 6 high-quality test cases for the user story using retrieved test case context. Each must:
- Include 5-8 detailed, numbered test steps
- Define measurable expected results
- Cover positive, negative, and edge cases
- Reference source test cases

## CONTEXT
MongoDB database with test cases covering multiple modules and scenarios.

## PERSONA
Senior QA Engineer with domain expertise in test automation and quality assurance.

## OUTPUT FORMAT
Valid JSON with this schema:
{
  "analysis": {
    "userStoryTitle": "string",
    "userStoryModule": "string",
    "existingCoverageCount": number,
    "gapsIdentified": ["string"]
  },
  "newTestCases": [{
    "testCaseId": "string",
    "module": "string",
    "testCaseTitle": "string",
    "testCaseDescription": "string",
    "preconditions": "string",
    "testSteps": "string with \\r\\n separators",
    "expectedResults": "string",
    "priority": "P1|P2|P3",
    "testType": "Integration|Functional",
    "riskLevel": "Critical|High|Medium|Low",
    "linkedUserStories": ["string"],
    "sourceCitations": ["string"],
    "complianceNotes": "string",
    "estimatedExecutionTime": "string"
  }],
  "rationale": [{"testCaseId": "string", "reason": "string"}],
  "recommendations": "string"
}

## TONE
Professional, technical. Use precise terminology. Measurable language.`;

const EXAMPLE_USER_STORY = `User Story ID: US-125
Title: User Login with Multi-Factor Authentication

As a registered user,
I want to log in to my account using multi-factor authentication,
So that my account remains secure from unauthorized access.

Acceptance Criteria:
1. User must enter valid email and password
2. System sends OTP to registered mobile number
3. OTP expires after 5 minutes
4. Maximum 3 OTP attempts allowed before account lockout
5. User receives email notification on successful login
6. System logs all login attempts for security audit`;

// Pipeline steps definition
const PIPELINE_STEPS = [
  { label: 'User Story Input', description: 'Validate and parse user story' },
  { label: 'Query Preprocessing', description: 'Normalize, expand synonyms, handle abbreviations' },
  { label: 'Hybrid Search', description: 'BM25 + Vector search with weighted fusion' },
  { label: 'Re-Ranking', description: 'RRF cross-encoder scoring, select top results' },
  { label: 'Deduplication', description: 'Remove similar results (cosine > 0.95)' },
  { label: 'RAG Summarization', description: 'Generate context summary via LLM' },
  { label: 'Prompt Assembly', description: 'Build optimized prompt with context' },
  { label: 'Test Generation', description: 'Generate test cases via LLM' },
  { label: 'Validation', description: 'Validate JSON structure and content' },
  { label: 'Complete', description: 'Results ready for review' }
];

function PromptSchemaManager() {
  // Core state
  const [userStory, setUserStory] = useState(EXAMPLE_USER_STORY);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // View state
  const [activeTab, setActiveTab] = useState(0); // 0: Reference, 1: Generated
  const [showPipelineDetails, setShowPipelineDetails] = useState(false);
  
  // Pipeline metadata
  const [pipelineData, setPipelineData] = useState(null);

  // Generate test cases - Complete RAG Pipeline
  const handleGenerate = async () => {
    if (!userStory.trim()) {
      setError('Please enter a user story to generate test cases');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setCurrentStep(0);
    setPipelineData(null);

    try {
      // STEP 1: User Story Input
      setCurrentStep(0);
      await delay(300);

      // STEP 2: Query Preprocessing
      setCurrentStep(1);
      const preprocessResponse = await fetch('http://localhost:3001/api/search/preprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userStory,
          options: {
            enableAbbreviations: true,
            enableSynonyms: true,
            maxSynonymVariations: 5,
            smartExpansion: true,
            preserveTestCaseIds: true
          }
        })
      });

      let processedQuery = userStory;
      let preprocessingData = null;
      
      if (preprocessResponse.ok) {
        preprocessingData = await preprocessResponse.json();
        processedQuery = preprocessingData.processedQuery || userStory;
      }

      // STEP 3: Hybrid Search
      setCurrentStep(2);
      const searchResponse = await fetch('http://localhost:3001/api/search/hybrid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: processedQuery,
          limit: 50,
          bm25Weight: 0.4,
          vectorWeight: 0.6
        })
      });

      if (!searchResponse.ok) {
        throw new Error('Search failed - please check your connection');
      }

      const searchData = await searchResponse.json();

      // STEP 4: Re-Ranking
      setCurrentStep(3);
      const rerankResponse = await fetch('http://localhost:3001/api/search/rerank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: processedQuery,
          limit: 10,
          fusionMethod: 'rrf',
          rerankTopK: 50,
          bm25Weight: 0.4,
          vectorWeight: 0.6
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
      
      if (finalResults.length > 5) {
        const resultsWithoutEmbeddings = finalResults.map(r => {
          const { embedding, ...rest } = r;
          return rest;
        });
        
        const dedupResponse = await fetch('http://localhost:3001/api/search/deduplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            results: resultsWithoutEmbeddings,
            threshold: 0.95
          })
        });

        if (dedupResponse.ok) {
          dedupData = await dedupResponse.json();
          finalResults = dedupData.deduplicated || finalResults;
        }
      }

      const topResults = finalResults.slice(0, 10);
      
      if (topResults.length === 0) {
        throw new Error('No relevant test cases found. Try a different user story.');
      }

      // STEP 6: RAG Summarization
      setCurrentStep(5);
      const topResultsForSummary = topResults.slice(0, 5).map(r => {
        const { embedding, ...rest } = r;
        return rest;
      });
      
      const summarizeResponse = await fetch('http://localhost:3001/api/search/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results: topResultsForSummary,
          summaryType: 'detailed'
        })
      });

      if (!summarizeResponse.ok) {
        throw new Error('Summarization failed');
      }

      const summaryData = await summarizeResponse.json();

      // STEP 7: Prompt Assembly
      setCurrentStep(6);
      const latestIdResponse = await fetch('http://localhost:3001/api/testcases/latest-id');
      let nextTestCaseId = 'TC_NEW_001';
      
      if (latestIdResponse.ok) {
        const latestIdData = await latestIdResponse.json();
        nextTestCaseId = latestIdData.nextTestCaseId || 'TC_NEW_001';
      }
      
      const essentialTestCases = topResults.slice(0, 5).map(tc => ({
        id: tc.id,
        module: tc.module,
        title: tc.title,
        steps: tc.steps,
        priority: tc.priority
      }));
      
      const fullPrompt = `${DEFAULT_PROMPT_TEMPLATE}

### USER STORY FOR TEST GENERATION:
${userStory}

### RAG SUMMARY (${topResults.length} similar test cases found):
${summaryData.summary}

### REFERENCE TEST CASES (Top ${essentialTestCases.length}):
${JSON.stringify(essentialTestCases, null, 2)}

### REQUIREMENTS:
1. Start IDs from ${nextTestCaseId}
2. Format testSteps with \\r\\n separators
3. Include 5-8 steps per test case
4. Generate 6 test cases covering various scenarios`;

      // STEP 8: Test Generation
      setCurrentStep(7);
      const generateResponse = await fetch('http://localhost:3001/api/test-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          temperature: 0.5,
          maxTokens: 10000
        })
      });

      if (!generateResponse.ok) {
        throw new Error('Generation failed');
      }

      const generatedData = await generateResponse.json();

      // STEP 9: Validation
      setCurrentStep(8);
      let validatedResponse = generatedData.response;
      let validationErrors = [];
      
      try {
        let rawText = null;
        
        if (validatedResponse && validatedResponse.raw) {
          rawText = validatedResponse.raw;
        } else if (typeof validatedResponse === 'string') {
          rawText = validatedResponse;
        }
        
        if (rawText) {
          const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            rawText = jsonMatch[1].trim();
          }
          validatedResponse = JSON.parse(rawText);
        }
      } catch (e) {
        validationErrors.push(`JSON parsing error: ${e.message}`);
      }
      
      // Validate structure
      if (validatedResponse && typeof validatedResponse === 'object') {
        if (!validatedResponse.newTestCases || validatedResponse.newTestCases.length === 0) {
          validationErrors.push('No test cases generated');
        }
      }

      // STEP 10: Complete
      setCurrentStep(9);
      
      // Calculate quality score
      const avgSimilarity = topResults.reduce((sum, tc) => sum + (tc.score || 0), 0) / topResults.length;

      // Set result
      setResult({
        generated: validatedResponse,
        reference: topResults,
        summary: summaryData.summary,
        tokens: generatedData.tokens,
        cost: generatedData.cost,
        qualityScore: avgSimilarity,
        validationErrors
      });

      setPipelineData({
        preprocessing: preprocessingData,
        searchCount: searchData.results?.length || 0,
        rerankedCount: rerankedResults.length,
        dedupRemoved: dedupData?.stats?.duplicatesRemoved || 0,
        finalCount: topResults.length
      });

    } catch (err) {
      setError(err.message);
      setCurrentStep(-1);
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper delay function
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Export to CSV
  const exportToCSV = (testCases, filename) => {
    if (!testCases || testCases.length === 0) {
      return;
    }

    const headers = ['Test Case ID', 'Title', 'Module', 'Priority', 'Test Type', 'Preconditions', 'Test Steps', 'Expected Results'];
    const rows = testCases.map(tc => {
      let stepsText = '';
      if (typeof tc.testSteps === 'string') {
        stepsText = tc.testSteps.replace(/\\r\\n|\\n|\r\n|\n/g, ' | ');
      } else if (Array.isArray(tc.testSteps)) {
        stepsText = tc.testSteps.join(' | ');
      }
      
      return [
        tc.testCaseId || tc.id || '',
        tc.testCaseTitle || tc.title || '',
        tc.module || '',
        tc.priority || '',
        tc.testType || 'Functional',
        tc.preconditions || tc.testCaseDescription || '',
        stepsText,
        tc.expectedResults || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Render test case table
  const renderTestCaseTable = (testCases, isReference = false) => {
    if (!testCases || testCases.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No test cases available
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper} elevation={0} sx={{ 
        maxHeight: 500, 
        overflow: 'auto',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2
      }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, bgcolor: isReference ? alpha('#1976D2', 0.08) : alpha('#2E7D32', 0.08) }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: isReference ? alpha('#1976D2', 0.08) : alpha('#2E7D32', 0.08) }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: isReference ? alpha('#1976D2', 0.08) : alpha('#2E7D32', 0.08) }}>Module</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: isReference ? alpha('#1976D2', 0.08) : alpha('#2E7D32', 0.08) }}>Priority</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: isReference ? alpha('#1976D2', 0.08) : alpha('#2E7D32', 0.08), minWidth: 280 }}>Test Steps</TableCell>
              <TableCell sx={{ fontWeight: 600, bgcolor: isReference ? alpha('#1976D2', 0.08) : alpha('#2E7D32', 0.08), minWidth: 200 }}>Expected Results</TableCell>
              {isReference && <TableCell sx={{ fontWeight: 600, bgcolor: alpha('#1976D2', 0.08) }}>Score</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {testCases.map((tc, index) => (
              <TableRow key={index} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
                  {tc.testCaseId || tc.id || `TC_${index + 1}`}
                </TableCell>
                <TableCell sx={{ fontSize: '0.85rem' }}>{tc.testCaseTitle || tc.title}</TableCell>
                <TableCell>
                  <Chip label={tc.module} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={tc.priority} 
                    size="small"
                    color={
                      tc.priority?.includes('P1') || tc.priority?.includes('Critical') ? 'error' :
                      tc.priority?.includes('P2') || tc.priority?.includes('High') ? 'warning' : 'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Box component="ol" sx={{ pl: 2, m: 0, fontSize: '0.8rem' }}>
                    {(() => {
                      if (typeof tc.testSteps === 'string') {
                        const steps = tc.testSteps.split(/\\r\\n|\\n|\r\n|\n/).filter(s => s.trim());
                        return steps.slice(0, 5).map((step, idx) => (
                          <li key={idx} style={{ marginBottom: '2px' }}>
                            {step.replace(/^\d+\.\s*/, '')}
                          </li>
                        ));
                      }
                      if (Array.isArray(tc.testSteps)) {
                        return tc.testSteps.slice(0, 5).map((step, idx) => (
                          <li key={idx} style={{ marginBottom: '2px' }}>
                            {step.replace(/^\d+\.\s*/, '')}
                          </li>
                        ));
                      }
                      return null;
                    })()}
                    {(tc.testSteps?.length > 5 || (typeof tc.testSteps === 'string' && tc.testSteps.split(/\\r\\n|\\n|\r\n|\n/).length > 5)) && (
                      <Typography variant="caption" color="text.secondary">...more</Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ fontSize: '0.8rem' }}>
                  {tc.expectedResults?.substring(0, 150) || 'N/A'}
                  {tc.expectedResults?.length > 150 && '...'}
                </TableCell>
                {isReference && (
                  <TableCell>
                    <Chip 
                      label={(tc.score * 100).toFixed(0) + '%'} 
                      size="small"
                      color={tc.score >= 0.8 ? 'success' : tc.score >= 0.6 ? 'warning' : 'default'}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
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
            <TestIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Test Case Generator
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Generate comprehensive test cases from user stories using AI-powered RAG pipeline
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Input */}
        <Grid item xs={12} lg={5}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            {/* User Story Input */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <StoryIcon color="primary" />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  User Story
                </Typography>
              </Box>
              <TextField
                fullWidth
                multiline
                rows={12}
                value={userStory}
                onChange={(e) => setUserStory(e.target.value)}
                placeholder="Enter your user story with acceptance criteria..."
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    lineHeight: 1.6
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Include user story ID, title, description, and acceptance criteria for best results
              </Typography>
            </Box>

            {/* Generate Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <SparkleIcon />}
              onClick={handleGenerate}
              disabled={isGenerating || !userStory.trim()}
              sx={{
                py: 1.5,
                fontWeight: 600,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)'
                }
              }}
            >
              {isGenerating ? 'Generating Test Cases...' : 'Generate Test Cases'}
            </Button>

            {/* Error Display */}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Pipeline Progress */}
            {isGenerating && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Pipeline Progress
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
                            '&.Mui-active': { color: 'primary.main' },
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
              </Box>
            )}

            {/* Pipeline Summary (after completion) */}
            {pipelineData && !isGenerating && (
              <Box sx={{ mt: 3 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    p: 1,
                    borderRadius: 1,
                    '&:hover': { bgcolor: alpha('#1976D2', 0.04) }
                  }}
                  onClick={() => setShowPipelineDetails(!showPipelineDetails)}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SuccessIcon color="success" fontSize="small" />
                    Pipeline Completed
                  </Typography>
                  <IconButton size="small">
                    {showPipelineDetails ? <CollapseIcon /> : <ExpandIcon />}
                  </IconButton>
                </Box>
                
                <Collapse in={showPipelineDetails}>
                  <Box sx={{ pl: 2, pt: 1 }}>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Search results: {pipelineData.searchCount}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      After re-ranking: {pipelineData.rerankedCount}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Duplicates removed: {pipelineData.dedupRemoved}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Final context: {pipelineData.finalCount} test cases
                    </Typography>
                  </Box>
                </Collapse>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Right Column - Results */}
        <Grid item xs={12} lg={7}>
          {!result && !isGenerating && (
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
                minHeight: 400,
                bgcolor: alpha('#1976D2', 0.02)
              }}
            >
              <DocIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No Test Cases Generated Yet
              </Typography>
              <Typography variant="body2" color="text.disabled" align="center">
                Enter a user story on the left and click "Generate Test Cases"<br/>
                to create comprehensive test cases using AI
              </Typography>
            </Paper>
          )}

          {isGenerating && !result && (
            <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
                <CircularProgress size={48} sx={{ mb: 3 }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Generating Test Cases
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Running RAG pipeline... This may take a moment
                </Typography>
                <LinearProgress sx={{ width: '60%', mt: 3 }} />
              </Box>
            </Paper>
          )}

          {result && (
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
              {/* Result Header */}
              <Box sx={{ 
                p: 2, 
                bgcolor: alpha('#1976D2', 0.04), 
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
                      Generation Complete
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip 
                        label={`${result.generated?.newTestCases?.length || 0} generated`} 
                        size="small" 
                        color="success"
                        variant="outlined"
                      />
                      <Chip 
                        label={`${result.reference?.length || 0} reference`} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                      <Chip 
                        label={`${(result.qualityScore * 100).toFixed(0)}% relevance`} 
                        size="small" 
                        color={result.qualityScore >= 0.7 ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Export to CSV">
                    <IconButton 
                      size="small"
                      onClick={() => exportToCSV(
                        activeTab === 0 ? result.reference : result.generated?.newTestCases,
                        activeTab === 0 ? 'reference_tests' : 'generated_tests'
                      )}
                    >
                      <ExportIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Regenerate">
                    <IconButton size="small" onClick={handleGenerate} disabled={isGenerating}>
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={activeTab} 
                  onChange={(e, v) => setActiveTab(v)}
                  sx={{ px: 2 }}
                >
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SearchIcon fontSize="small" />
                        Reference ({result.reference?.length || 0})
                      </Box>
                    } 
                  />
                  <Tab 
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SparkleIcon fontSize="small" />
                        Generated ({result.generated?.newTestCases?.length || 0})
                      </Box>
                    }
                  />
                </Tabs>
              </Box>

              {/* Tab Content */}
              <Box sx={{ p: 2 }}>
                {/* Reference Tab */}
                {activeTab === 0 && (
                  <Fade in={activeTab === 0}>
                    <Box>
                      {/* Summary Card */}
                      <Card elevation={0} sx={{ mb: 2, bgcolor: alpha('#1976D2', 0.04), border: '1px solid', borderColor: alpha('#1976D2', 0.12) }}>
                        <CardContent sx={{ py: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'primary.main' }}>
                            Context Summary
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            maxHeight: 120, 
                            overflow: 'auto', 
                            lineHeight: 1.6,
                            color: 'text.secondary'
                          }}>
                            {result.summary}
                          </Typography>
                        </CardContent>
                      </Card>
                      
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                        Reference Test Cases
                      </Typography>
                      {renderTestCaseTable(result.reference, true)}
                    </Box>
                  </Fade>
                )}

                {/* Generated Tab */}
                {activeTab === 1 && (
                  <Fade in={activeTab === 1}>
                    <Box>
                      {/* Validation Warnings */}
                      {result.validationErrors?.length > 0 && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Validation Notes
                          </Typography>
                          {result.validationErrors.map((err, idx) => (
                            <Typography key={idx} variant="caption" display="block">
                              • {err}
                            </Typography>
                          ))}
                        </Alert>
                      )}

                      {/* Analysis Card */}
                      {result.generated?.analysis && (
                        <Card elevation={0} sx={{ mb: 2, bgcolor: alpha('#2E7D32', 0.04), border: '1px solid', borderColor: alpha('#2E7D32', 0.12) }}>
                          <CardContent sx={{ py: 2 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'success.main' }}>
                              Analysis
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Title</Typography>
                                <Typography variant="body2">{result.generated.analysis.userStoryTitle}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Module</Typography>
                                <Typography variant="body2">{result.generated.analysis.userStoryModule}</Typography>
                              </Grid>
                              {result.generated.analysis.gapsIdentified?.length > 0 && (
                                <Grid item xs={12}>
                                  <Typography variant="caption" color="text.secondary">Gaps Identified</Typography>
                                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                    {result.generated.analysis.gapsIdentified.map((gap, idx) => (
                                      <Chip key={idx} label={gap} size="small" variant="outlined" />
                                    ))}
                                  </Box>
                                </Grid>
                              )}
                            </Grid>
                          </CardContent>
                        </Card>
                      )}

                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                        Generated Test Cases
                      </Typography>
                      {renderTestCaseTable(result.generated?.newTestCases, false)}

                      {/* Recommendations */}
                      {result.generated?.recommendations && (
                        <Alert severity="info" sx={{ mt: 2 }} icon={<InfoIcon />}>
                          <Typography variant="body2">
                            <strong>Recommendations:</strong> {result.generated.recommendations}
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  </Fade>
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
                    variant="outlined"
                    startIcon={<ExportIcon />}
                    onClick={() => exportToCSV(result.generated?.newTestCases, 'generated_test_cases')}
                    disabled={!result.generated?.newTestCases?.length}
                  >
                    Export Generated
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

export default PromptSchemaManager;
