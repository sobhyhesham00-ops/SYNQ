# Team Scheduling Portal

A high-performance Workforce Management (WFM) scheduling portal for modern clinical teams, built with React, Express, Firebase, and the Gemini 2.0 AI model.

## Features

- **Upload Master Rosters:** Import agent schedules from Excel or CSV.
- **Smart Shift Mapping:** Extracts and standardizes raw text shifts into actionable slots.
- **AI Roster Analysis:** Leverages Gemini 2.0 to provide executive insights on weekly capacity.
- **AI Chat Assistant:** Ask questions about protocols, schedules, and agent availability. 
- **Dark Mode Support:** Fluid, customizable UI.
- **Mobile-first Design:** Fully responsive.

## Prerequisites
- Node.js 18+
- npm 9+
- Firebase Project configured

## Quick start

1. Clone repo
2. Run `npm install`
3. Copy `.env.example` to `.env.local`
4. Set `GEMINI_API_KEY` in `.env.local`

## Running Locally

To start the local development server (frontend + API):
```bash
npm run dev
```
The application will be accessible at http://localhost:3000

## API Documentation

- `POST /api/analyze-schedule`
  - Request: `{ schedules: IScheduleItem[] }`
  - Response: `{ analysis: string }`
- `POST /api/ai-chat`
  - Request: `{ message: string, knowledgeContext?: string }`
  - Response: `{ reply: string }`
- `GET /health`
  - Response: `{ status, timestamp, uptime, apiKeyConfigured, version, environment }`
- `GET /api/status`
  - Response: `{ status, timestamp, memory, uptime, node_version, platform }`

## Architecture

- Frontend: React 18 with Vite, Tailwind CSS for styling.
- Backend: Express API handling scheduling and AI interactions.
- State Management: React Context API and customized hooks for centralized, predictable state.
- Database: Firebase Firestore for real-time document synchronization.

## Troubleshooting

- **AI Analysis Offline / API Key not configured**: Make sure `GEMINI_API_KEY` is loaded in `.env.local`.
- **Port 3000 already in use**: The system currently hardcodes port 3000 due to platform constraints. Kill the process running on port 3000.
- **Build failures**: Check Node.js version is at least 18. Ensure there are no TypeScript interface mismatches.

## Security features

- **Helmet**: Secures HTTP headers to protect against common web vulnerabilities.
- **Express Rate Limit**: Implements rate limiting to prevent brute-force attacks and DoS.
- **CORS**: Configured with strict origin policies to prevent unauthorized cross-origin requests.
- **Input Validation**: Central validation via `validateSchedules` and `validateMessage` to prevent malicious payloads or schema violations.

## Performance metrics

- Efficient batched database writes and queries via Firebase integration.
- Light-weight bundle sizes optimized by Vite and esbuild.

## Development guide

- Use standard pull request workflows and semantic versioning.
- Ensure all tests (`npm test`) pass before merging.

## License
MIT License.
