# AI RAG Hub

A full-stack RAG (Retrieval-Augmented Generation) pipeline for managing and searching test cases and user stories using MongoDB Atlas Vector Search.

## Overview

AI RAG Hub is an enterprise-grade application that demonstrates modern RAG techniques for document retrieval and AI-powered analysis. It provides multiple search strategies (Vector, BM25, Hybrid, Score Fusion) and AI features for test case generation and user story analysis.

## Features

### Data Ingestion
- **Excel to JSON Conversion** - Upload and convert Excel files to JSON with smart column mapping
- **Embeddings Generation** - Create vector embeddings using OpenAI-compatible APIs and store in MongoDB Atlas

### Search & Retrieval
- **Vector Search** - Semantic search using embeddings
- **BM25 Search** - Keyword-based full-text search with fuzzy matching
- **Hybrid Search** - Combined BM25 + Vector search with configurable weights
- **Score Fusion & Reranking** - Advanced reranking with RRF (Reciprocal Rank Fusion) and weighted score normalization
- **Query Preprocessing** - Query normalization, abbreviation expansion, and synonym mapping
- **Summarization & Deduplication** - AI-powered result summarization and duplicate detection

### AI Features
- **Test Case Generator** - Generate test cases from user stories using customizable prompt schemas
- **User Story Rating** - RAG-powered analysis and scoring of user stories with similar story context

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB Atlas** with Vector Search
- **OpenAI-compatible API** (OpenAI)

### Frontend
- **React 19** with Material-UI (MUI) v7
- **Axios** for API communication
- **Notistack** for notifications

### Key Dependencies
- `mongodb` - MongoDB driver with vector search support
- `@huggingface/inference` - HuggingFace inference API
- `openai` - OpenAI API client
- `xlsx` - Excel file parsing
- `multer` - File upload handling

## Project Structure

```
ai-rag-hub/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── data/           # Data ingestion components
│   │   │   │   ├── ConvertToJson.js
│   │   │   │   └── EmbeddingsStore.js
│   │   │   ├── processing/     # AI processing components
│   │   │   │   ├── PromptSchemaManager.js
│   │   │   │   ├── QueryPreprocessing.js
│   │   │   │   ├── SummarizationDedup.js
│   │   │   │   └── UserStoryRating.js
│   │   │   ├── search/         # Search components
│   │   │   │   ├── BM25Search.js
│   │   │   │   ├── HybridSearch.js
│   │   │   │   ├── QuerySearch.js
│   │   │   │   └── RerankingSearch.js
│   │   │   └── settings/
│   │   │       └── Settings.js
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── server/
│   └── index.js                # Express API server
├── src/
│   ├── config/                 # Index configurations
│   │   ├── user-stories-vector-index.json
│   │   ├── testcases-vector-index.json
│   │   └── testcases-bm25-index.json
│   ├── data/                   # Data files (JSON, Excel)
│   ├── scripts/                # Utility scripts
│   │   ├── confluence/         # Confluence integration
│   │   ├── data-conversion/    # Data conversion utilities
│   │   ├── embeddings/         # Embedding generation scripts
│   │   ├── search/             # Search utility scripts
│   │   └── verification/       # Data verification scripts
│   └── query-preprocessing/    # Query preprocessing modules
├── releases/                   # Release artifacts
├── package.json
└── README.md
```

## Installation

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account with Vector Search enabled
- API key for embedding service (OpenAI)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/ai-rag-hub.git
   cd ai-rag-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   This will also install client dependencies via the `postinstall` script.

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   DB_NAME=your_database_name
   COLLECTION_NAME=testcases
   USER_STORIES_COLLECTION_NAME=user_stories

   # Index Names
   VECTOR_INDEX_NAME=vector_index
   BM25_INDEX_NAME=bm25_index
   USER_STORIES_VECTOR_INDEX_NAME=vector_index_user_story
   USER_STORIES_BM25_INDEX_NAME=bm25_index_user_story

   # LLM API Configuration
   LLM_API_BASE=https://api.openai.com/ai
   USER_EMAIL=your-email@example.com
   AUTH_TOKEN=your-auth-token

   # Server Configuration
   PORT=3001
   NODE_ENV=development
   ```

4. **Set up MongoDB Atlas Vector Search indexes**
   
   Create the following indexes in your MongoDB Atlas cluster:
   
   - **Vector Index** for embeddings search
   - **Atlas Search Index** for BM25 full-text search

   Sample index configurations are available in `src/config/`.

## Usage

### Development Mode

Run both server and client concurrently:
```bash
npm run dev
```

Or run them separately:
```bash
# Start the backend server
npm run server

# Start the React frontend (in another terminal)
npm run client
```

### Production Build

```bash
npm run build
```

### Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## API Endpoints

### Health & Status
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/jobs/active` | Get active processing jobs |
| GET | `/api/jobs/:jobId` | Get job status |

### Data Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/files` | List JSON files in data directory |
| GET | `/api/collections` | List MongoDB collections |
| POST | `/api/upload-excel` | Upload and convert Excel to JSON |
| POST | `/api/create-embeddings` | Create embeddings for files |
| GET | `/api/metadata/distinct` | Get distinct filter values |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search` | Vector similarity search |
| POST | `/api/search/bm25` | BM25 keyword search |
| POST | `/api/search/hybrid` | Combined BM25 + Vector search |
| POST | `/api/search/rerank` | Score fusion reranking |
| POST | `/api/search/preprocess` | Query preprocessing |
| POST | `/api/search/deduplicate` | Deduplicate results |
| POST | `/api/search/summarize` | AI summarization |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/test-prompt` | RAG-enhanced prompt testing |
| POST | `/api/user-story/search` | User story hybrid search |
| POST | `/api/user-story/summarize` | User story summarization |
| POST | `/api/user-story/rate` | User story rating & analysis |

### Configuration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/env` | Get environment variables |
| POST | `/api/env` | Update environment variables |

## Search Strategies

### Vector Search
Uses OpenAI text-embedding-3-small model to generate embeddings and performs cosine similarity search in MongoDB Atlas.

### BM25 Search
Full-text search with configurable field weights and fuzzy matching for typo tolerance.

### Hybrid Search
Combines BM25 and Vector search with configurable weights (default 0.5/0.5).

### Score Fusion Reranking
Three fusion methods available:
- **RRF (Reciprocal Rank Fusion)** - Rank-based fusion with k=60
- **Weighted** - Normalized score weighted combination
- **Reciprocal** - Rank-based with custom weights

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   React     │────▶│   Express   │────▶│  MongoDB Atlas  │
│   Client    │◀────│   Server    │◀────│  Vector Search  │
└─────────────┘     └──────┬──────┘     └─────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  LLM API    │
                    │ (Embeddings │
                    │  & Chat)    │
                    └─────────────┘
```

## Scripts

### Data Conversion
```bash
# Convert Excel to JSON
node src/scripts/data-conversion/excel-to-json.js

# Fetch Jira stories
node src/scripts/data-conversion/fetch-jira-stories.js
```

### Embeddings
```bash
# Create embeddings for test cases
node src/scripts/embeddings/create-embeddings-store.js

# Create embeddings for user stories
node src/scripts/embeddings/create-userstories-embeddings-store.js
```

### Search Testing
```bash
# Test BM25 search
node src/scripts/search/bm25-search.js

# Test hybrid search with score fusion
node src/scripts/search/score-fusion-search.js
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
