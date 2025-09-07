# AI Compliance Scanner - Frontend-Backend Integration Guide

## 🚀 Quick Start

### 1. Start Backend Server
```bash
cd backend-mvp
npm run dev
```
Backend runs on: http://localhost:3001

### 2. Start Frontend Server
```bash
cd frontend
npm start
```
Frontend runs on: http://localhost:4028

## 🔗 Integration Points

### API Configuration
- **Backend API Base URL**: `http://localhost:3001/api`
- **Frontend Environment**: Configured in `frontend/.env`
- **CORS**: Enabled for localhost:4028, localhost:3000, localhost:5173

### Authentication Flow
1. **Login**: POST `/api/auth/login`
2. **Register**: POST `/api/auth/register`
3. **Token Storage**: JWT stored in localStorage
4. **Authorization Header**: `Bearer <token>`

### Key API Endpoints

#### Documents
- `GET /api/documents` - Get all documents (requires auth)
- `POST /api/documents/upload` - Upload document (requires auth)
- `GET /api/documents/:id` - Get specific document
- `DELETE /api/documents/:id` - Delete document

#### Analysis
- `POST /api/analysis/documents/:id/analyze` - Analyze document
- `GET /api/analysis/documents/:id/results` - Get analysis results
- `GET /api/analysis/results` - Get all analysis results

#### Marketing Compliance
- `POST /api/marketing/analyze/content` - Analyze marketing content
- `POST /api/marketing/check/quick` - Quick compliance check

#### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/documents` - Get recent documents
- `GET /api/dashboard/analyses` - Get recent analyses

## 🧪 Testing the Integration

### 1. Health Check
```bash
curl http://localhost:3001/health
```

### 2. Test Authentication
```javascript
// Register a new user
fetch('http://localhost:3001/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'Test123!@#',
    name: 'Test User'
  })
})

// Login
fetch('http://localhost:3001/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'Test123!@#'
  })
})
```

### 3. Test Document Upload
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

fetch('http://localhost:3001/api/documents/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
```

## 🔍 Troubleshooting

### Backend Not Starting
1. Check if port 3001 is available
2. Verify `.env` file has correct Supabase credentials
3. Run `npm install` in backend-mvp directory

### Frontend Not Starting
1. Check if port 4028 is available
2. Verify `.env` file has correct API_BASE_URL
3. Run `npm install` in frontend directory

### CORS Issues
- Backend is configured to accept requests from:
  - http://localhost:4028 (Vite default)
  - http://localhost:3000 (Next.js default)
  - http://localhost:5173 (Vite alternative)

### Authentication Issues
1. Check if JWT token is being stored in localStorage
2. Verify token is included in Authorization header
3. Check token expiry

## 📊 Environment Variables

### Backend (.env)
```env
SUPABASE_URL=https://mfhurzqghebidzrcdyxy.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
GOOGLE_AI_API_KEY=<your-gemini-key>
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:4028
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://mfhurzqghebidzrcdyxy.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_URL=http://localhost:4028
```

## 🎯 Features Status

### ✅ Working
- Backend server with all API endpoints
- Frontend React application
- API service configuration
- CORS configuration
- Environment variables setup
- Authentication middleware
- Document processing pipeline
- AI compliance analysis
- Marketing content analysis

### 🔄 Integration Ready
- Login/Register flow
- Document upload interface
- Analysis results display
- Dashboard statistics
- Violation tracking
- Batch processing

## 📝 Next Steps

1. **Test Authentication**: Create a test user and login
2. **Upload Document**: Test document upload functionality
3. **Run Analysis**: Analyze uploaded documents for compliance
4. **View Results**: Check analysis results and violations
5. **Dashboard**: Monitor compliance statistics

## 🛠️ Development Tips

1. **Hot Reload**: Both servers support hot reload for development
2. **Logging**: Check console logs for debugging
3. **Network Tab**: Use browser DevTools to monitor API calls
4. **Error Handling**: Frontend has comprehensive error handling
5. **Rate Limiting**: Backend has rate limiting enabled

## 📞 Support

For issues or questions:
1. Check the console logs in both frontend and backend
2. Verify environment variables are correctly set
3. Ensure both servers are running
4. Check network requests in browser DevTools
