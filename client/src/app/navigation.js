import React from 'react';
import {
  Transform as TransformIcon,
  Storage as StorageIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  TextFields as KeywordIcon,
  AutoFixHigh as HybridIcon,
  CompareArrows as RerankIcon,
  Psychology as PreprocessIcon,
  Summarize as SummarizeIcon,
  Science as TestGeneratorIcon,
  StarRate as RateIcon,
  CloudUpload as IngestionIcon,
  ManageSearch as RetrievalIcon,
  Build as FeaturesIcon,
  SmartToy as BotIcon,
  BugReport as BugIcon
} from '@mui/icons-material';

import ConvertToJson from '../features/data-ingestion/ConvertToJson';
import EmbeddingsStore from '../features/data-ingestion/EmbeddingsStore';
import QuerySearch from '../features/search/QuerySearch';
import BM25Search from '../features/search/BM25Search';
import HybridSearch from '../features/search/HybridSearch';
import RerankingSearch from '../features/search/RerankingSearch';
import QueryPreprocessing from '../features/ai/QueryPreprocessing';
import SummarizationDedup from '../features/ai/SummarizationDedup';
import PromptSchemaManager from '../features/ai/PromptSchemaManager';
import UserStoryRating from '../features/ai/UserStoryRating';
import TeamKnowledgeBot from '../features/ai/TeamKnowledgeBot';
import DefectIntelligence from '../features/ai/DefectIntelligence';
import Settings from '../features/settings/Settings';

export const drawerWidth = 320;
export const collapsedDrawerWidth = 84;

export const menuSections = [
  {
    id: 'ingestion',
    title: 'Data Ingestion',
    icon: <IngestionIcon />,
    items: [
      {
        id: 'convert',
        label: 'Convert to JSON',
        icon: <TransformIcon />,
        component: ConvertToJson,
        description: 'Upload workbooks and convert structured data into JSON assets.'
      },
      {
        id: 'embeddings',
        label: 'Embeddings & Store',
        icon: <StorageIcon />,
        component: EmbeddingsStore,
        description: 'Generate embeddings and push curated datasets into MongoDB.'
      }
    ]
  },
  {
    id: 'retrieval',
    title: 'Retrieval',
    icon: <RetrievalIcon />,
    items: [
      {
        id: 'preprocess',
        label: 'Query Preprocessing',
        icon: <PreprocessIcon />,
        component: QueryPreprocessing,
        description: 'Normalize, expand, and inspect retrieval queries before search.'
      },
      {
        id: 'query',
        label: 'Vector Search',
        icon: <SearchIcon />,
        component: QuerySearch,
        description: 'Run semantic retrieval against your indexed test assets.'
      },
      {
        id: 'bm25',
        label: 'BM25 Search',
        icon: <KeywordIcon />,
        component: BM25Search,
        description: 'Use lexical search for IDs, exact terms, and focused keyword queries.'
      },
      {
        id: 'hybrid',
        label: 'Hybrid Search',
        icon: <HybridIcon />,
        component: HybridSearch,
        description: 'Blend lexical and semantic ranking with adjustable weights.'
      },
      {
        id: 'rerank',
        label: 'Score Fusion',
        icon: <RerankIcon />,
        component: RerankingSearch,
        description: 'Fuse BM25 and vector candidates into a reranked final result set.'
      },
      {
        id: 'summarize',
        label: 'Summarize & Dedup',
        icon: <SummarizeIcon />,
        component: SummarizationDedup,
        description: 'Cluster, deduplicate, and summarize retrieval output with LLM support.'
      }
    ]
  },
  {
    id: 'intelligence',
    title: 'AI Workflows',
    icon: <FeaturesIcon />,
    items: [
      {
        id: 'test-generator',
        label: 'Test Intelligence',
        icon: <TestGeneratorIcon />,
        component: PromptSchemaManager,
        description: 'Create prompts and generate test intelligence from retrieved context.'
      },
      {
        id: 'story-rating',
        label: 'User Story Rating',
        icon: <RateIcon />,
        component: UserStoryRating,
        description: 'Rate user stories using retrieval, reranking, and structured prompts.'
      },
      {
        id: 'knowledge-bot',
        label: 'Knowledge Bot',
        icon: <BotIcon />,
        component: TeamKnowledgeBot,
        description: 'Answer operational questions from Confluence-backed knowledge sources.'
      },
      {
        id: 'defect-intelligence',
        label: 'Defect Intelligence',
        icon: <BugIcon />,
        component: DefectIntelligence,
        description: 'Analyze duplicate defects, failure patterns, and remediation signals.'
      }
    ]
  },
  {
    id: 'system',
    title: 'System',
    icon: <SettingsIcon />,
    items: [
      {
        id: 'settings',
        label: 'Settings',
        icon: <SettingsIcon />,
        component: Settings,
        description: 'Manage environment settings and runtime configuration.'
      }
    ]
  }
];

export const menuItems = menuSections.flatMap((section) => section.items);
