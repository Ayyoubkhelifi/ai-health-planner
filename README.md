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

Before running this project, ensure you have the following installed on your machine:
1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)

---

## 🛠️ How to Run the Application

There are two ways to run the application:
- **Option A:** One-Click Automated (Using Docker Compose)
- **Option B:** Manual Installation (Using Node.js and a separate Docker DB)

Choose whichever method you prefer. Option A is faster and requires zero configuration.

---

### Option A: One-Click Automated (Docker Compose)

If you have **Docker Desktop** installed and running, you can launch the entire application (Database + Frontend + Backend) with a single command.

1. Ensure **Docker Desktop** is running.
2. Open your terminal in the `health-planner` folder.
3. Open the `.env` file and make sure your `OPENROUTER_API_KEY` is pasted in.
4. Run the following command:
\`\`\`bash
docker-compose up --build
\`\`\`
*(This will automatically build the app, start the database, run the migrations, seed the Excel data, and start the Next.js server).*

5. Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**
6. Log in with: `admin@healthplanner.ai` / `admin123`

---

### Option B: Manual Installation

### 1. Copy the Project
Copy the `health-planner` folder from the DVD to your local computer (e.g., to your Desktop or Documents folder). 
Open your terminal (Command Prompt or PowerShell) and navigate into the folder:
\`\`\`bash
cd path\to\health-planner
\`\`\`

### 2. Install Dependencies
Install all required Node modules by running:
\`\`\`bash
npm install
\`\`\`

### 3. Environment Variables Configuration
Create a `.env` file in the root of the `health-planner` directory (if it doesn't already exist) and configure the following variables:

\`\`\`env
# 1. Database Connection URL (Defaults to the Docker container we will launch)
DATABASE_URL="postgresql://postgres:password@localhost:5432/health_planner?schema=public"

# 2. NextAuth Configuration
NEXTAUTH_SECRET="super-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# 3. OpenRouter API Key for AI Generation
# Get a free key from https://openrouter.ai/
OPENROUTER_API_KEY="sk-or-v1-your-openrouter-api-key"
\`\`\`

### 4. Start Docker Desktop
**CRITICAL STEP:** Before proceeding, open the **Docker Desktop** application on your computer and wait for it to fully start (the Docker icon in your system tray should indicate that the engine is running).

### 5. Run the Startup Script
We have provided an automated script that will:
1. Launch a PostgreSQL database container via Docker.
2. Create the necessary database tables.
3. Start the Next.js server (Frontend & Backend).

In your terminal, simply run:
\`\`\`bash
.\start.bat
\`\`\`
*(Keep this terminal window open, as it is running the server!)*

### 6. Seed the Database (Important)
The application relies on 6 Excel files located in the `db/` folder to populate the database with ingredients, allergies, and recipes. 

Open a **new, separate terminal window**, navigate to the project folder, and run:
\`\`\`bash
npm run seed
\`\`\`
*Wait for this process to finish. It will output `🎉 Seed complete!` when done.*

### 7. Login and Use the App
Open your browser and navigate to: **[http://localhost:3000](http://localhost:3000)**

Since the seed script created an admin user for you, you can log in immediately using these credentials:
- **Email:** `admin@healthplanner.ai`
- **Password:** `admin123`

---

## 📚 Common Commands

- `.\start.bat`: The primary script to start the database and the server.
- `npm run dev`: Starts the local development server (if the database is already running).
- `npm run seed`: Re-runs the Excel data extraction script.
- `npx prisma studio`: Opens a local UI in your browser to view and edit your raw database rows.

## 🏗️ Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database ORM**: Prisma
- **Database**: PostgreSQL (via Docker)
- **Authentication**: NextAuth.js
- **AI Integration**: OpenRouter SDK (`inclusionai/ling-2.6-1t:free` model)
- **Data Parsing**: SheetJS (`xlsx`) for Excel ingestion
