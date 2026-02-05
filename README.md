# Jira Metrics Dashboard

A comprehensive, real-time dashboard for tracking Jira sprint metrics, KPIs, tech debt analysis, cycle time trends, and team velocity. Gain actionable insights into your team's productivity and technical debt management.

## ✨ Features

- **Multiple Authentication Methods**: Support for 6 different Jira authentication methods
  - API Token (Recommended for Jira Cloud)
  - OAuth 2.0 (Best for production)
  - Personal Access Token (Jira Server/Data Center)
  - Username + Password (Legacy)
  - Session Cookie (Quick testing)
  - API Token + Username (Jira Server)

- **Key Metrics & Analytics**:
  - 📊 KPI tracking (Product topics vs Tech debt)
  - 🎯 Tech debt ratio percentage analysis
  - ⏱️ Cycle time analysis (sprint-on-sprint)
  - 📈 Velocity tracking and trends
  - 👥 Component-based team filtering
  - 🐛 Bug vs Story comparison
  - 📊 Workload distribution analysis
  - ⏳ Issue aging analysis

- **Smart Filtering**:
  - Filter by Project, Board, Sprint
  - Tech Epics/Topics configuration
  - JQL query support for advanced searches
  - Preset filter combinations for quick access
  - Inline preset editing with auto-generated names

- **Visualizations**:
  - Real-time trend charts
  - Team productivity comparisons
  - Sprint-on-sprint analysis
  - Technical debt distribution charts
  - Cycle time histograms
  - Workload and aging metrics

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Jira instance (Cloud, Server, or Data Center)
- API credentials (see Authentication Methods below)

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

## Using the Dashboard

### Getting Started with Filters

1. **Open the Filter Panel**: Click the **filter icon** (⫬) in the top-right header to open the filter options
2. **Select a Project**: Choose a Jira project from the dropdown
3. **Select a Board**: Pick a board from your project
4. **Select Sprint(s)**: Choose one or more sprints to analyze
5. **Configure Tech Topics/Epics** (Optional):
   - Use **Tech Epics**: Select from linked tech epics if your board uses them
   - **OR** Use **Labels**: Go to Settings (⚙️) to configure custom tech-related labels (default: "tech", "tech-debt", "tech_debt")
6. **Apply Filters**: Click the "Apply Filters" button to load your metrics

### Dashboard Elements

Once filters are applied, you'll see the following panels:

#### KPI Metrics
- **Product Topics**: Story points for work NOT tagged as technical debt
- **Tech Debt**: Story points for technical debt work
- **Ratio**: Balance between feature work and tech debt

#### Performance Metrics
- **Cycle Time**: Average time from "In Progress" to "Done"
- **Velocity**: Total story points completed per sprint
- **Team Workload**: Distribution of work across team members

#### Analysis Charts
- **Cycle Time Trend**: Track efficiency over time
- **Tech Debt Ratio Chart**: Monitor technical debt accumulation
- **Issue Aging**: Identify stalled or long-running issues
- **Bugs vs Stories**: Compare bug work vs feature work
- **Assignee Workload**: See who's handling the most work
- **Sprint Comparison**: Compare metrics across sprints

### Filter Management

- **Save Filters**: Click the 💾 button to save your current filter as a preset
- **Auto-Named Presets**: Presets are automatically named (e.g., "Preset #1", "Preset #2")
- **Edit Preset Names**: Click the ✏️ icon next to a preset name to edit it
- **Load Presets**: Click on a preset row to quickly apply those filters
- **Delete Presets**: Click the 🗑️ icon to remove a preset

### Advanced Filtering with JQL

1. Toggle to **JQL Mode** in the filter panel
2. Enter your custom Jira Query Language (JQL) query
3. Click **Execute** to run the query and load results
4. This is useful for complex queries that go beyond standard board/sprint filtering

### Configuration & Settings

Click the **Settings icon (⚙️)** in the top-right to:
- **Manage Tech Labels**: Configure which labels mark issues as technical debt
- **Ignore Issues**: Exclude specific issues from metrics (by key)
- **Tech Epics**: Configure epic tracking for tech debt categorization

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
Issues that do NOT have labels containing "tech", "tech-debt", or "tech_debt". These represent product-focused work and business value delivery.

### Tech Debt
Issues marked with tech-related labels or assigned to tech epics. These represent technical improvements and infrastructure work.

### Tech Debt Ratio
Percentage of technical debt issues vs total issues in a sprint. A healthy balance is typically 15-30%. Helps maintain code quality while delivering features.

### Cycle Time
Average time from "In Progress" to "Done" status. Measured sprint-on-sprint to track team efficiency and identify bottlenecks.

### Velocity
Total story points completed in a sprint. Helps with sprint planning and capacity estimation. Track trends to predict future capacity.

### Workload Distribution
Breakdown of work across team members. Helps identify overloaded team members and ensure fair distribution.

### Issue Aging
Time spent in current status. Long-aging issues may indicate blockers or priority misalignment.

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
