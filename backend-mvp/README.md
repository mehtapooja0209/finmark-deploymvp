# AI Compliance Scanner - MVP Backend

Simplified MVP backend built with Supabase for the AI Compliance Scanner project.

## 🏗️ Architecture Overview

This MVP backend replaces the complex original backend with a simplified architecture:

- **Database**: Supabase PostgreSQL (instead of Prisma)
- **Authentication**: Supabase Auth (instead of custom JWT)
- **File Storage**: Supabase Storage (instead of AWS S3)
- **AI Processing**: OpenAI GPT-4 only (instead of multiple providers)
- **Queue System**: Direct processing (instead of Redis/Bull)

## 📁 Project Structure

```
backend-mvp/
├── src/
│   ├── config/
│   │   └── supabase.ts          # Supabase client configuration
│   ├── controllers/
│   │   ├── documents.ts         # Document upload/management
│   │   └── analysis.ts          # AI compliance analysis
│   ├── middleware/
│   │   └── auth.ts              # Supabase auth middleware
│   ├── routes/
│   │   ├── documents.ts         # Document API routes
│   │   └── analysis.ts          # Analysis API routes
│   ├── services/
│   │   ├── document-processor.ts # PDF processing & upload
│   │   └── ai-service.ts        # OpenAI integration
│   ├── types/
│   │   └── database.ts          # Supabase type definitions
│   └── index.ts                 # Express server setup
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql # Database schema
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies (simplified)
└── tsconfig.json               # TypeScript configuration
```

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- Supabase account
- OpenAI API key

### 2. Setup Supabase Project
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API to get your keys
3. Run the migration in SQL Editor:
   ```sql
   -- Copy contents from supabase/migrations/001_initial_schema.sql
   ```
4. Enable Storage bucket named 'documents' in Storage section

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

### 4. Install & Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📊 Database Schema

### Tables:
- **documents**: Uploaded files metadata
- **analysis_results**: AI compliance analysis results  
- **violations**: Detected compliance violations

### Features:
- Row Level Security (RLS) enabled
- User isolation through Supabase Auth
- Automatic timestamps and triggers

## 🔌 API Endpoints

### Documents
- `POST /api/documents/upload` - Upload PDF document
- `GET /api/documents` - Get user's documents
- `GET /api/documents/:id` - Get specific document
- `DELETE /api/documents/:id` - Delete document

### Analysis  
- `POST /api/analysis/documents/:documentId/analyze` - Analyze document
- `GET /api/analysis/documents/:documentId/results` - Get analysis results
- `GET /api/analysis/results` - Get all analysis results

### Health
- `GET /health` - Health check

## 🔐 Authentication

Uses Supabase Auth with Bearer tokens:
```javascript
// Include in request headers
Authorization: Bearer <supabase_access_token>
```

## 🎯 MVP Features

✅ **Included**:
- PDF document upload to Supabase Storage
- Text extraction from PDFs  
- OpenAI GPT-4 compliance analysis
- Violation detection and scoring
- User authentication via Supabase Auth
- RESTful API endpoints

❌ **Removed for MVP**:
- Multi-tenancy/Organizations
- Complex workflows and task management  
- Multiple AI provider support
- Advanced file processing (OCR, etc.)
- Real-time notifications
- Audit logging
- Complex user roles

## 🔄 Migration from Original Backend

The original backend has been preserved as `backend-old/`. Key differences:

| Feature | Original | MVP |
|---------|----------|-----|
| Database | Prisma + PostgreSQL | Supabase PostgreSQL |
| Auth | Custom JWT | Supabase Auth |
| Storage | AWS S3 | Supabase Storage |
| AI | Multiple providers | OpenAI only |
| Queue | Redis/Bull | Direct processing |
| Complexity | High | Low |

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
1. Set up environment variables
2. Build the project: `npm run build`
3. Start: `npm start`
4. Deploy to your preferred platform (Vercel, Railway, etc.)

## 📝 Environment Variables

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Configuration  
OPENAI_API_KEY=your_openai_api_key

# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
```

## 🔍 Next Steps

After MVP validation, consider adding back:
- Multi-tenancy support
- Advanced document processing
- Real-time features
- Additional AI providers
- Complex workflows
- Advanced monitoring and logging