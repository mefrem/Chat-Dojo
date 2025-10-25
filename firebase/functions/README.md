# Chat Dojo Cloud Functions

Cloud Functions for AI-powered features in Chat Dojo.

## Functions

### 1. `transcribeVoiceMessage`

- **Trigger:** Firestore onCreate (`conversations/{conversationId}/messages/{messageId}`)
- **Purpose:** Transcribe voice messages using OpenAI Whisper
- **API:** OpenAI Whisper API

### 2. `generateReflection`

- **Trigger:** Scheduled (every 5 minutes)
- **Purpose:** Generate AI reflections for completed conversations
- **API:** OpenAI GPT-4 API

### 3. `archiveOldConversations`

- **Trigger:** Scheduled (daily at midnight UTC)
- **Purpose:** Auto-archive conversations older than 7 days

### 4. `healthCheck`

- **Trigger:** HTTPS request
- **Purpose:** Health check endpoint for monitoring

## Setup

### 1. Install Dependencies

```bash
cd firebase/functions
npm install
```

### 2. Set Environment Variables

Set your OpenAI API key as a Firebase secret:

```bash
firebase functions:secrets:set OPENAI_API_KEY
```

When prompted, paste your OpenAI API key.

### 3. Build TypeScript

```bash
npm run build
```

### 4. Deploy Functions

```bash
firebase deploy --only functions
```

Or deploy individual functions:

```bash
firebase deploy --only functions:transcribeVoiceMessage
firebase deploy --only functions:generateReflection
```

## Local Development

### 1. Set up local environment

Create `.env` file (git-ignored):

```
OPENAI_API_KEY=sk-...your-key-here...
```

### 2. Run Firebase Emulators

```bash
npm run serve
```

This starts the Functions emulator and allows you to test locally.

### 3. Watch Mode

For development with auto-rebuild:

```bash
npm run build:watch
```

## Cost Estimates

### OpenAI API Costs

- **Whisper:** $0.006 per minute of audio
- **GPT-4:** ~$0.03-0.10 per reflection (depends on conversation length)

### Firebase Functions Costs

- **Free tier:** 2M invocations/month, 400K GB-seconds, 200K CPU-seconds
- **Paid:** Beyond free tier, typically $0.40 per million invocations

### Example Monthly Cost (100 active users)

- Whisper transcriptions: ~$6/month (1000 voice messages)
- GPT-4 reflections: ~$25/month (500 reflections)
- Firebase Functions: Free tier sufficient
- **Total:** ~$31/month

## Monitoring

### View Logs

```bash
npm run logs
```

Or in Firebase Console:
https://console.firebase.google.com/project/YOUR_PROJECT/functions/logs

### Function Health

Check the health endpoint:

```
https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/healthCheck
```

## Troubleshooting

### "OpenAI API Key not set"

- Run: `firebase functions:secrets:set OPENAI_API_KEY`
- Redeploy functions

### "Module not found"

- Run: `npm install` in functions directory
- Run: `npm run build`

### "Permission denied"

- Check Firestore security rules
- Ensure service account has proper permissions

## Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Build and watch for changes
npm run build:watch

# Run local emulator
npm run serve

# Deploy all functions
npm run deploy

# View logs
npm run logs
```

## File Structure

```
functions/
├── src/
│   ├── index.ts          # Main entry point
│   ├── transcribe.ts     # Whisper transcription
│   ├── reflection.ts     # GPT-4 reflection generation
│   └── archive.ts        # Auto-archive old conversations
├── lib/                  # Compiled JavaScript (git-ignored)
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript configuration
└── .gitignore           # Git ignore rules
```

## Security

- OpenAI API key stored as Firebase secret (encrypted)
- Functions run with Firebase service account (admin privileges)
- All user data stays within Firebase ecosystem
- OpenAI processes audio/text but doesn't store user data

## Next Steps

After deployment:

1. Test transcription by sending a voice message
2. Monitor logs for any errors
3. Check that reflections generate after conversations
4. Verify costs in OpenAI dashboard
