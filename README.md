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

## Installation

1. Clone repo
2. Run `npm install`
3. Copy `.env.example` to `.env.local`
4. Set `GEMINI_API_KEY` in `.env.local`

## Running Locally

To start the local development server (frontend + API):
\`\`\`bash
npm run dev
\`\`\`
The application will be accessible at http://localhost:3000

## Building for Production

To create an optimized production build:
\`\`\`bash
npm run build
npm start
\`\`\`

## API Documentation

- \`POST /api/analyze-schedule\`
  - Request: \`{ schedules: IScheduleItem[] }\`
  - Response: \`{ analysis: string }\`
- \`POST /api/ai-chat\`
  - Request: \`{ message: string, knowledgeContext?: string }\`
  - Response: \`{ reply: string }\`
- \`GET /health\`
  - Response: \`{ status, timestamp, uptime_seconds, api_key_configured, response_time_ms }\`
- \`GET /api/status\`
  - Response: \`{ version, node_version, memory_usage_mb, app_uptime_seconds, active_connections }\`

## Environment Variables Table

| Variable | Description | Required | Default |
| --- | --- | --- | --- |
| \`GEMINI_API_KEY\` | Google Gemini API Key | Yes | |
| \`APP_URL\` | Public URL for CORS | No | \`http://localhost:3000\` |
| \`NODE_ENV\` | Environment Mode | No | \`development\` |
| \`PORT\` | Server Port | No | \`3000\` |

## Troubleshooting

- **AI Analysis Offline / API Key not configured**: Make sure \`GEMINI_API_KEY\` is loaded in \`.env.local\`.
- **Port 3000 already in use**: The system currently hardcodes port 3000 due to platform constraints. Kill the process running on port 3000.
- **Build failures**: Check Node.js version is at least 18. Ensure there are no TypeScript interface mismatches.

## Project Structure

- \`/src\` - Frontend React components and Backend Express utilities and types
- \`/config\` - Application and Firebase configuration files
- \`/scripts\` - Build and utility scripts
- \`/tests\` - Unit and integration tests
- \`/dist\` - Compiled production build
- \`/logs\` - Server logs

## Contributing guidelines
- Fork the repository.
- Create a feature branch.
- Submit a Pull Request.

## License
MIT License.
