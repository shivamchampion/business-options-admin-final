# Business Options Admin Panel

## Environment Setup

### Development Environment

1. Copy the `.env.example` file to create your environment file:
```bash
cp .env.example .env.development
```

2. Open `.env.development` and replace the placeholder values with your actual Firebase configuration values:
- `VITE_FIREBASE_API_KEY`: Your Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Your Firebase authentication domain
- `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID`: Your Firebase app ID

3. The following environment variables are optional but recommended for development:
- `VITE_API_BASE_URL`: Base URL for your API (defaults to `http://localhost:3000`)
- `VITE_APP_ENV`: Application environment (defaults to `development`)
- `VITE_ENABLE_DEBUG_LOGS`: Enable/disable debug logs (defaults to `true`)

### Important Notes
- Never commit your `.env` files to version control
- The `.env.example` file is provided as a template and should be committed
- Environment variables must be prefixed with `VITE_` to be exposed to your Vite application
- Keep your Firebase credentials secure and never share them publicly
