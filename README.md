# Jira Metrics Dashboard

A comprehensive dashboard for tracking Jira sprint metrics including KPIs, tech debt ratio, cycle time, and velocity.

## Features

- **Multiple Authentication Methods**: Support for 6 different Jira authentication methods
  - API Token (Recommended for Jira Cloud)
  - OAuth 2.0 (Best for production)
  - Personal Access Token (Jira Server/Data Center)
  - Username + Password (Legacy)
  - Session Cookie (Quick testing)
  - API Token + Username (Jira Server)

- **Key Metrics**:
  - KPI tracking (Product topics vs Tech debt)
  - Tech debt ratio percentage
  - Cycle time analysis (sprint-on-sprint)
  - Velocity tracking
  - Component-based team filtering

- **Visualizations**:
  - Cycle time trend charts
  - Tech debt ratio charts
  - Team comparison views
  - Sprint-on-sprint analysis

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Jira instance (Cloud, Server, or Data Center)

### Installation

1. Clone the repository:
```bash
cd jira-stats
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `ENCRYPTION_KEY`: A 32-character secret key for encrypting credentials
- Optional OAuth credentials if using OAuth 2.0

4. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
# or
bun dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## First-Time Setup

1. You'll be greeted with the connection wizard
2. Enter your Jira instance URL (e.g., `https://yourcompany.atlassian.net`)
3. Choose an authentication method
4. Enter your credentials
5. Test the connection
6. Save and start using the dashboard!

## Authentication Methods

### API Token (Recommended)
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Create an API token
3. Use your email and the token to connect

### OAuth 2.0
1. Register your app at https://developer.atlassian.com/console/myapps/
2. Set callback URL to `http://localhost:3000/api/auth/jira/callback`
3. Use Client ID and Client Secret to connect

### Personal Access Token
1. In Jira, go to Settings → Security → Personal Access Tokens
2. Generate a new token
3. Use the token to connect

## Project Structure

```
jira-stats/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── login/             # Connection wizard
│   ├── settings/          # Settings page
│   └── page.tsx           # Dashboard
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   └── ui/               # UI components
├── lib/                   # Core libraries
│   ├── jira/             # Jira API client & auth
│   ├── metrics/          # Metrics calculators
│   ├── db.ts             # Database client
│   └── encryption.ts     # Credential encryption
├── prisma/               # Database schema
└── types/                # TypeScript types
```

## Metrics Explained

### KPI (Product Topics)
Issues that do NOT have labels containing "tech", "tech-debt", or "tech_debt". These represent product-focused work.

### Tech Debt Ratio
Percentage of technical debt issues vs total issues in a sprint. Helps maintain a healthy balance between product work and technical improvements.

### Cycle Time
Average time from "In Progress" to "Done" status. Measured sprint-on-sprint to track team efficiency.

### Velocity
Total story points completed in a sprint. Helps with sprint planning and capacity estimation.

## Security

- All credentials are encrypted using AES-256-GCM before storage
- Credentials are never exposed to the client-side
- Stored in SQLite database (can be upgraded to PostgreSQL for production)
- Connection testing validates credentials before saving

## Development

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma with SQLite (dev) / PostgreSQL (prod)
- **Charts**: Recharts

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Troubleshooting

### Connection Issues
- Verify your Jira URL is correct
- Check that your credentials are valid
- Ensure your Jira instance allows API access
- Try a different authentication method

### No Sprints Showing
- Ensure you have access to the board
- Check that sprints exist and are closed
- Verify your user has permission to view sprint data

## License

MIT
