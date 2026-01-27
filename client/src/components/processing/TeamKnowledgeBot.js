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
  Fade,
  Collapse,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  alpha
} from '@mui/material';
import {
  PlayArrow as SearchIcon,
  Psychology as AiIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  AutoAwesome as SparkleIcon,
  QuestionAnswer as QuestionIcon,
  MenuBook as BookIcon,
  Lightbulb as TipIcon,
  ContentCopy as CopyIcon,
  Article as ArticleIcon,
  Build as BuildIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  BugReport as BugIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

// Quick example queries for the team
const QUICK_EXAMPLES = [
  {
    category: 'Infrastructure',
    icon: <CloudIcon />,
    queries: [
      'How do I install Kubernetes on Ubuntu?',
      'What are the steps to configure Helm charts?',
      'How to set up a MongoDB replica set?'
    ]
  },
  {
    category: 'Monitoring',
    icon: <SpeedIcon />,
    queries: [
      'How to install Prometheus and Grafana?',
      'What alert rules should I configure?',
      'How do I set up dashboard for monitoring?'
    ]
  },
  {
    category: 'Incident Response',
    icon: <BugIcon />,
    queries: [
      'What is the P1 incident response procedure?',
      'How do I escalate an incident?',
      'What are the communication templates for incidents?'
    ]
  },
  {
    category: 'Database',
    icon: <StorageIcon />,
    queries: [
      'How to backup PostgreSQL database?',
      'What is the disaster recovery procedure?',
      'How to configure MongoDB authentication?'
    ]
  },
  {
    category: 'Security',
    icon: <SecurityIcon />,
    queries: [
      'How to configure SSL certificates?',
      'What are the security best practices for Jenkins?',
      'How to set up secrets management?'
    ]
  },
  {
    category: 'CI/CD',
    icon: <BuildIcon />,
    queries: [
      'How do I set up Jenkins pipeline?',
      'What is the deployment process to staging?',
      'How to configure automated testing?'
    ]
  }
];

// Pipeline steps for knowledge retrieval
const PIPELINE_STEPS = [
  { label: 'Query Input', description: 'Validate and parse user query' },
  { label: 'Preprocessing', description: 'Normalize query, expand terms' },
  { label: 'Vector Search', description: 'Semantic search in Confluence knowledge base' },
  { label: 'Re-Ranking', description: 'Score fusion and result optimization' },
  { label: 'Deduplication', description: 'Remove duplicate content' },
  { label: 'Summarization', description: 'Generate context summary' },
  { label: 'Answer Generation', description: 'Generate comprehensive answer via LLM' },
  { label: 'Complete', description: 'Answer ready' }
];

// Answer generation prompt template
const ANSWER_PROMPT_TEMPLATE = `# TEAM KNOWLEDGE BASE ASSISTANT

## ROLE
You are an expert DevOps and Production Support assistant helping team members find information from the team's Confluence knowledge base.

## TASK
Answer the user's question based on the retrieved documentation context. Your answer should be:
- Accurate and based on the provided context
- Well-structured with clear sections
- Include specific commands, configurations, or steps when relevant
- Reference the source documents
- Highlight any important warnings or notes

## OUTPUT FORMAT
Provide your answer in the following JSON structure:
{
  "answer": "Your comprehensive answer with markdown formatting",
  "summary": "A brief 1-2 sentence summary",
  "confidence": "high|medium|low",
  "relevantSections": ["List of relevant document sections referenced"],
  "additionalResources": ["Links or references for further reading"],
  "warnings": ["Any important warnings or caveats"],
  "relatedTopics": ["Related topics the user might want to explore"]
}

## GUIDELINES
- If the context doesn't contain enough information, say so clearly
- Use code blocks for commands and configurations
- Be concise but thorough
- Cite specific documents when possible`;

function TeamKnowledgeBot() {
  // Core state
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  // View state
  const [showPipelineDetails, setShowPipelineDetails] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState('Infrastructure');
  
  // Pipeline metadata
  const [pipelineData, setPipelineData] = useState(null);
  
  const { enqueueSnackbar } = useSnackbar();

  // Handle quick example click
  const handleExampleClick = (exampleQuery) => {
    setQuery(exampleQuery);
    enqueueSnackbar('Query loaded! Click "Ask Atlas" to search', { variant: 'info' });
  };

  // Copy answer to clipboard
  const handleCopyAnswer = () => {
    if (result?.answer) {
      navigator.clipboard.writeText(result.answer);
      enqueueSnackbar('Answer copied to clipboard', { variant: 'success' });
    }
  };

  // Main search function - RAG Pipeline
  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a question to search');
      return;
    }

    setIsSearching(true);
    setError(null);
    setResult(null);
    setCurrentStep(0);
    setPipelineData(null);

    try {
      // STEP 1: Query Input
      setCurrentStep(0);
      await delay(200);

      // STEP 2: Preprocessing
      setCurrentStep(1);
      const preprocessResponse = await fetch('http://localhost:3001/api/search/preprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          options: {
            enableAbbreviations: true,
            enableSynonyms: true,
            smartExpansion: true
          }
        })
      });

      let processedQuery = query;
      let preprocessingData = null;
      
      if (preprocessResponse.ok) {
        preprocessingData = await preprocessResponse.json();
        processedQuery = preprocessingData.finalQuery || query;
      }

      // STEP 3: Vector Search
      // Using Confluence collection: confluence_data with confluence_vector_index
      setCurrentStep(2);
      const searchResponse = await fetch('http://localhost:3001/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: processedQuery,
          limit: 30,
          useConfluence: true  // Use Confluence collection and index
        })
      });

      if (!searchResponse.ok) {
        throw new Error('Vector search failed - please check your connection and collection settings');
      }

      const searchData = await searchResponse.json();
      
      if (!searchData.results || searchData.results.length === 0) {
        throw new Error('No relevant documentation found. Try rephrasing your question or check if Confluence pages are loaded.');
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
          rerankTopK: 30,
          bm25Weight: 0.3,
          vectorWeight: 0.7,
          useConfluence: true  // Use Confluence collection and index
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
          const { embedding, content, ...rest } = r;
          return { ...rest, content: r.content?.substring(0, 500) || r.title };
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
          // Map back to original results
          const dedupIds = new Set(dedupData.deduplicated?.map(d => d._id || d.id || d.title));
          finalResults = finalResults.filter(r => dedupIds.has(r._id || r.id || r.title));
        }
      }

      const topResults = finalResults.slice(0, 8);

      // STEP 6: Summarization
      setCurrentStep(5);
      const resultsForSummary = topResults.slice(0, 5).map(r => ({
        title: r.title,
        content: r.content?.substring(0, 1000) || '',
        pageType: r.pageType,
        link: r.link
      }));
      
      const summarizeResponse = await fetch('http://localhost:3001/api/search/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results: resultsForSummary,
          summaryType: 'detailed'
        })
      });

      let summaryData = { summary: 'Context from retrieved documents' };
      if (summarizeResponse.ok) {
        summaryData = await summarizeResponse.json();
      }

      // STEP 7: Answer Generation
      setCurrentStep(6);
      
      // Prepare context from retrieved documents
      const contextDocs = topResults.slice(0, 5).map((doc, idx) => {
        // Strip HTML tags for cleaner context
        const cleanContent = doc.content
          ?.replace(/<[^>]*>/g, ' ')
          ?.replace(/\s+/g, ' ')
          ?.substring(0, 2000) || '';
        
        return `
### Document ${idx + 1}: ${doc.title}
${cleanContent}
---`;
      }).join('\n');

      const fullPrompt = `${ANSWER_PROMPT_TEMPLATE}

## USER QUESTION
${query}

## RETRIEVED DOCUMENTATION CONTEXT
The following ${topResults.length} documents were retrieved from the team's Confluence knowledge base:

${contextDocs}

## CONTEXT SUMMARY
${summaryData.summary}

## INSTRUCTIONS
Based on the above context, provide a comprehensive answer to the user's question. If the context doesn't fully answer the question, indicate what additional information might be needed.`;

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
        throw new Error('Answer generation failed');
      }

      const generatedData = await generateResponse.json();

      // STEP 8: Complete
      setCurrentStep(7);

      // Parse the response
      let parsedAnswer = null;
      try {
        let rawResponse = generatedData.response;
        
        if (rawResponse?.raw) {
          rawResponse = rawResponse.raw;
        }
        
        if (typeof rawResponse === 'string') {
          // Try to extract JSON from markdown code block
          const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            parsedAnswer = JSON.parse(jsonMatch[1].trim());
          } else {
            parsedAnswer = JSON.parse(rawResponse);
          }
        } else if (typeof rawResponse === 'object') {
          parsedAnswer = rawResponse;
        }
      } catch (e) {
        // If parsing fails, use raw text as answer
        parsedAnswer = {
          answer: generatedData.response?.raw || generatedData.response || 'Unable to parse response',
          summary: 'Response generated',
          confidence: 'medium',
          relevantSections: topResults.map(r => r.title),
          warnings: [],
          relatedTopics: []
        };
      }

      // Set result
      setResult({
        answer: parsedAnswer.answer || parsedAnswer,
        summary: parsedAnswer.summary,
        confidence: parsedAnswer.confidence || 'medium',
        relevantSections: parsedAnswer.relevantSections || [],
        warnings: parsedAnswer.warnings || [],
        relatedTopics: parsedAnswer.relatedTopics || [],
        additionalResources: parsedAnswer.additionalResources || [],
        sources: topResults,
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

      enqueueSnackbar('Answer generated successfully!', { variant: 'success' });

    } catch (err) {
      setError(err.message);
      setCurrentStep(-1);
      enqueueSnackbar(err.message, { variant: 'error' });
    } finally {
      setIsSearching(false);
    }
  };

  // Helper delay function
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Handle Enter key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !isSearching) {
      event.preventDefault();
      handleSearch();
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
            background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AiIcon sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Atlas - Team Knowledge Bot
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ask questions about your team's Confluence documentation and get instant answers
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column - Input & Examples */}
        <Grid item xs={12} lg={5}>
          {/* Search Input */}
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <QuestionIcon color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Ask a Question
              </Typography>
            </Box>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything about your team's documentation...&#10;&#10;Example: How do I set up Kubernetes on Ubuntu?"
              variant="outlined"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  fontSize: '1rem',
                  lineHeight: 1.6
                }
              }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={isSearching ? <CircularProgress size={20} color="inherit" /> : <SparkleIcon />}
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
              sx={{
                py: 1.5,
                fontWeight: 600,
                fontSize: '1rem',
                background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)'
                }
              }}
            >
              {isSearching ? 'Searching Knowledge Base...' : 'Ask Atlas'}
            </Button>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
          </Paper>

          {/* Quick Examples */}
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TipIcon color="warning" />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Quick Examples
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Click any question below to load it into the search box
            </Typography>

            {QUICK_EXAMPLES.map((category) => (
              <Box key={category.category} sx={{ mb: 1 }}>
                <ListItemButton
                  onClick={() => setExpandedCategory(
                    expandedCategory === category.category ? null : category.category
                  )}
                  sx={{ 
                    borderRadius: 1, 
                    mb: 0.5,
                    bgcolor: expandedCategory === category.category ? alpha('#7C3AED', 0.08) : 'transparent'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: 'primary.main' }}>
                    {category.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={category.category}
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                  />
                  {expandedCategory === category.category ? <CollapseIcon /> : <ExpandIcon />}
                </ListItemButton>
                
                <Collapse in={expandedCategory === category.category}>
                  <List dense sx={{ pl: 2 }}>
                    {category.queries.map((q, idx) => (
                      <ListItem key={idx} disablePadding>
                        <ListItemButton
                          onClick={() => handleExampleClick(q)}
                          sx={{ 
                            borderRadius: 1,
                            py: 0.75,
                            '&:hover': {
                              bgcolor: alpha('#7C3AED', 0.04)
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <QuestionIcon fontSize="small" color="action" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={q}
                            primaryTypographyProps={{ 
                              fontSize: '0.85rem',
                              color: 'text.secondary'
                            }}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </Box>
            ))}
          </Paper>

          {/* Pipeline Progress (when searching) */}
          {isSearching && (
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, mt: 3 }}>
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
                          '&.Mui-active': { color: '#7C3AED' },
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
          {!result && !isSearching && (
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
                bgcolor: alpha('#7C3AED', 0.02)
              }}
            >
              <BookIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Ask Atlas Anything
              </Typography>
              <Typography variant="body2" color="text.disabled" align="center" sx={{ maxWidth: 400 }}>
                Type your question or select from the examples on the left.<br/>
                Atlas will search your team's Confluence documentation and provide a comprehensive answer.
              </Typography>
            </Paper>
          )}

          {isSearching && !result && (
            <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                <CircularProgress size={48} sx={{ mb: 3, color: '#7C3AED' }} />
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Searching Knowledge Base
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Atlas is finding the best answers for you...
                </Typography>
                <LinearProgress sx={{ width: '60%', mt: 3, '& .MuiLinearProgress-bar': { bgcolor: '#7C3AED' } }} />
              </Box>
            </Paper>
          )}

          {result && (
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
              {/* Result Header */}
              <Box sx={{ 
                p: 2, 
                bgcolor: alpha('#7C3AED', 0.04), 
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
                      Answer Found
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                      <Chip 
                        label={`Confidence: ${result.confidence}`}
                        size="small" 
                        color={getConfidenceColor(result.confidence)}
                        variant="outlined"
                      />
                      <Chip 
                        label={`${result.sources?.length || 0} sources`}
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Box>
                <Tooltip title="Copy Answer">
                  <IconButton onClick={handleCopyAnswer}>
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Main Answer */}
              <Box sx={{ p: 3 }}>
                {/* Summary */}
                {result.summary && (
                  <Alert severity="info" sx={{ mb: 3 }} icon={<InfoIcon />}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {result.summary}
                    </Typography>
                  </Alert>
                )}

                {/* Answer Content */}
                <Card elevation={0} sx={{ mb: 3, bgcolor: alpha('#7C3AED', 0.02), border: '1px solid', borderColor: alpha('#7C3AED', 0.12) }}>
                  <CardContent>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        lineHeight: 1.8,
                        whiteSpace: 'pre-wrap',
                        '& code': {
                          bgcolor: 'grey.100',
                          px: 0.5,
                          py: 0.25,
                          borderRadius: 0.5,
                          fontFamily: 'monospace',
                          fontSize: '0.9em'
                        }
                      }}
                    >
                      {typeof result.answer === 'string' 
                        ? result.answer 
                        : JSON.stringify(result.answer, null, 2)
                      }
                    </Typography>
                  </CardContent>
                </Card>

                {/* Warnings */}
                {result.warnings && result.warnings.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Important Notes
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {result.warnings.map((warning, idx) => (
                        <li key={idx}>
                          <Typography variant="body2">{warning}</Typography>
                        </li>
                      ))}
                    </ul>
                  </Alert>
                )}

                {/* Related Topics */}
                {result.relatedTopics && result.relatedTopics.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Related Topics
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {result.relatedTopics.map((topic, idx) => (
                        <Chip 
                          key={idx}
                          label={topic}
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setQuery(topic);
                            enqueueSnackbar('Topic loaded! Click "Ask Atlas" to search', { variant: 'info' });
                          }}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Sources Section */}
                <Box>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      p: 1,
                      borderRadius: 1,
                      '&:hover': { bgcolor: alpha('#7C3AED', 0.04) }
                    }}
                    onClick={() => setShowSources(!showSources)}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ArticleIcon fontSize="small" color="primary" />
                      Source Documents ({result.sources?.length || 0})
                    </Typography>
                    <IconButton size="small">
                      {showSources ? <CollapseIcon /> : <ExpandIcon />}
                    </IconButton>
                  </Box>

                  <Collapse in={showSources}>
                    <List dense>
                      {result.sources?.map((source, idx) => (
                        <ListItem key={idx} sx={{ 
                          bgcolor: 'grey.50', 
                          borderRadius: 1, 
                          mb: 1,
                          flexDirection: 'column',
                          alignItems: 'flex-start'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', mb: 0.5 }}>
                            <ArticleIcon fontSize="small" color="action" />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, flexGrow: 1 }}>
                              {source.title}
                            </Typography>
                            {source.fusedScore && (
                              <Chip 
                                label={`${(source.fusedScore * 100).toFixed(0)}%`}
                                size="small"
                                color={source.fusedScore >= 0.7 ? 'success' : 'default'}
                              />
                            )}
                          </Box>
                          {source.link && (
                            <Typography 
                              variant="caption" 
                              color="primary"
                              component="a"
                              href={source.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                            >
                              Open in Confluence →
                            </Typography>
                          )}
                        </ListItem>
                      ))}
                    </List>
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
                        '&:hover': { bgcolor: alpha('#7C3AED', 0.04) }
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
                    onClick={handleCopyAnswer}
                  >
                    Copy Answer
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

export default TeamKnowledgeBot;
