# Quick Start Guide

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
# or if you prefer bun
bun install
```

### 2. Initialize Database

```bash
npx prisma generate
npx prisma db push
```

### 3. Start Development Server

```bash
npm run dev
# or
bun dev
```

### 4. Open the Application

Navigate to [http://localhost:3000](http://localhost:3000)

## First-Time Connection

### Step 1: Enter Jira URL
- Enter your Jira instance URL
- Example: `https://yourcompany.atlassian.net`
- For self-hosted: `https://jira.yourcompany.com`

### Step 2: Choose Authentication Method

**Recommended: API Token (for Jira Cloud)**
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a name (e.g., "Jira Stats Dashboard")
4. Copy the token

**Alternative Methods:**
- **OAuth 2.0**: Best for production, requires app registration
- **Personal Access Token**: For Jira Server/Data Center
- **Username + Password**: Legacy method (may not work)
- **Session Cookie**: Quick testing only
- **API Token + Username**: For Jira Server with API tokens

### Step 3: Enter Credentials
- Enter your email and API token
- Click "Test Connection"
- If successful, click "Save & Continue to Dashboard"

### Step 4: View Dashboard
- Select a board from the dropdown
- Select a sprint to view metrics
- View KPIs, tech debt ratio, cycle time, and velocity

## Key Metrics Explained

### KPI (Product Topics)
Issues WITHOUT labels containing:
- "tech"
- "tech-debt"
- "tech_debt"

These represent product-focused work items.

### Tech Debt Ratio
Percentage of technical debt issues vs total issues:
- Formula: `(tech issues / total issues) × 100`
- Lower is better (more product work)
- Aim for 20-30% as a healthy balance

### Cycle Time
Time from "In Progress" to "Done":
- Measured in days
- Shows team efficiency
- Lower is better
- Track sprint-on-sprint for trends

### Velocity
Total story points completed:
- Helps with sprint planning
- Track consistency over time
- Compare teams by component

## Component-Based Team Filtering

If your teams are separated by Components in Jira:
1. The dashboard will automatically detect components
2. View team comparison in the "Team Comparison" section
3. Filter metrics by component using the component selector

## Troubleshooting

### "No active Jira connection"
- Go to Settings and test your connection
- If failed, reconnect using the login page

### "No sprints found"
- Ensure you have access to the board
- Check that closed sprints exist
- Verify board permissions in Jira

### "Failed to fetch metrics"
- Check your Jira credentials are still valid
- Ensure you have permission to view sprint data
- Try testing the connection in Settings

### Authentication Errors
- **401 Unauthorized**: Credentials are invalid or expired
- **403 Forbidden**: User doesn't have required permissions
- **404 Not Found**: Jira URL is incorrect

**Solutions:**
1. Go to Settings → Test Connection
2. If failed, try a different authentication method
3. Regenerate your API token if using API Token auth
4. Check Jira admin hasn't revoked API access

## Production Deployment

### Environment Variables
Set these in your production environment:
```bash
ENCRYPTION_KEY=your-secure-32-character-key
DATABASE_URL=postgresql://user:pass@host:5432/dbname
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Database Migration
For production, use PostgreSQL:
1. Update `DATABASE_URL` in `.env`
2. Update `prisma/schema.prisma` provider to `postgresql`
3. Run migrations: `npx prisma migrate deploy`

### Security Checklist
- [ ] Use strong ENCRYPTION_KEY (32+ random characters)
- [ ] Use PostgreSQL instead of SQLite
- [ ] Enable HTTPS
- [ ] Set secure cookie settings
- [ ] Implement rate limiting on API routes
- [ ] Regular credential rotation
- [ ] Monitor for unauthorized access

## Support

For issues or questions:
1. Check the README.md for detailed documentation
2. Review the plan file for architecture details
3. Check Jira API documentation: https://developer.atlassian.com/cloud/jira/platform/rest/v3/

## Next Steps

1. **Customize Metrics**: Edit `lib/metrics/` to add custom calculations
2. **Add More Charts**: Create new chart components in `components/dashboard/`
3. **Historical Data**: Implement sprint snapshots for trend analysis
4. **Export Reports**: Add CSV/PDF export functionality
5. **Notifications**: Set up alerts for metric thresholds
