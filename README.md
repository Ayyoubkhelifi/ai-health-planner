# AI Health Planner

A modern, full-stack Next.js 14 web application that uses AI to generate highly personalized daily health plans based on your physical profile, dietary preferences, and fitness goals. It dynamically assigns real recipes, generates specific exercise routines, and creates personalized mindfulness/hydration tasks.

## 🚀 Features

- **Personalized AI Health Plans**: Powered by the Ling-2.6-1T model (via OpenRouter).
- **Dietary & Goal Controls**: Customize plans for weight loss, muscle gain, vegan, keto, etc.
- **Recipe Database Integration**: The AI generates meals using a localized Excel dataset of over 800+ real recipes.
- **AI Cooking Instructions**: Generate step-by-step cooking instructions and portion sizes for any recipe dynamically.
- **Regenerate Days**: Don't like a specific day's routine? Tell the AI what you want changed and regenerate just that day.
- **Track Progress**: Dashboard tracks your streaks, daily calories/protein, and task completion.

---

## 💻 Prerequisites

Before running this project from scratch, ensure you have the following installed on your machine:
1. **Node.js** (v18 or higher)
2. **PostgreSQL** (Running locally or via Docker)
3. **Git**

---

## 🛠️ Step-by-Step Setup Guide (From 0)

### 1. Clone the repository
\`\`\`bash
# Open your terminal and clone the project
git clone <repository-url>
cd health-planner
\`\`\`

### 2. Install Dependencies
Install all required Node modules.
\`\`\`bash
npm install
\`\`\`

### 3. Environment Variables Configuration
Create a `.env` file in the root of the `health-planner` directory and configure the following variables:

\`\`\`env
# 1. Database Connection URL
# Replace 'postgres' and 'your_password' with your local Postgres credentials.
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/health_planner?schema=public"

# 2. NextAuth Configuration
# Generate a secret by running `openssl rand -base64 32` in your terminal or use the one below for local dev
NEXTAUTH_SECRET="super-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# 3. OpenRouter API Key for AI Generation
# Get a free key from https://openrouter.ai/
OPENROUTER_API_KEY="sk-or-v1-your-openrouter-api-key"
\`\`\`

### 4. Setup the Database
Make sure your local PostgreSQL server is running. Then, execute the Prisma migration to create all the necessary tables in your database:
\`\`\`bash
npm run db:migrate
\`\`\`
*(If prompted for a migration name, you can press Enter or name it `init`)*

### 5. Seed the Database (Important)
The application relies on 6 Excel files located in the `db/` folder to populate the database with ingredients, allergies, and recipes. Run the seed script to import all of this data:
\`\`\`bash
npm run seed
\`\`\`
*Wait for this process to finish. It will output `🎉 Seed complete!` when done.*

### 6. Start the Development Server
You are now ready to launch the application!
\`\`\`bash
npm run dev
\`\`\`

### 7. Login and Use the App
Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**

Since the seed script created an admin user for you, you can log in immediately using these credentials:
- **Email:** `admin@healthplanner.ai`
- **Password:** `admin123`

---

## 📚 Common Commands

- `npm run dev`: Starts the local development server.
- `npm run build`: Builds the app for production.
- `npm run seed`: Re-runs the Excel data extraction script.
- `npx prisma studio`: Opens a local UI in your browser to view and edit your raw database rows.

## 🏗️ Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **AI Integration**: OpenRouter SDK (`inclusionai/ling-2.6-1t:free` model)
- **Data Parsing**: SheetJS (`xlsx`) for Excel ingestion
