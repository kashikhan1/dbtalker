# Database Explorer

## Overview
Database Explorer is a full-stack application that enables users to connect to a PostgreSQL database, explore its tables, view table structures, execute SQL queries, and stream real-time data insights. The backend leverages AI agents built with LangGraph, Ollama, and OpenRouter to intelligently process database interactions, while the frontend provides a modern, user-friendly interface built with Next.js and Radix UI.

## Features
- **Database Connectivity:** Connect to a PostgreSQL database using a connection string.
- **Table Exploration:** List all tables in the database and view their structures.
- **SQL Query Execution:** Run custom SQL queries and display results in a clean, tabular format.
- **Real-Time Data Streaming:** Stream live data updates from the database.
- **AI-Powered Agents:** Utilize AI agents (built with LangGraph, Ollama, and OpenRouter) to assist with query generation, optimization, and data analysis.
- **Responsive UI:** A sleek, intuitive frontend interface with tabs for table structure, SQL queries, query results, and streaming data.

## Tech Stack
### Backend
- **Node.js & Express:** For building the RESTful API.
- **LangGraph:** For orchestrating AI workflows and agents.
- **Ollama:** Local LLM integration for query assistance (model: qwen2.5).
- **OpenRouter:** Cloud-based LLM for advanced language processing (model: qwen/qwq-32b:free).
- **PostgreSQL:** Database for storing and querying data.
- **TypeScript:** For type-safe development.
- **Zod:** For schema validation.
- **CORS:** For enabling cross-origin requests.

### Frontend
- **Next.js:** React framework for building the UI.
- **Radix UI:** For accessible, unstyled UI components.
- **Tailwind CSS:** For styling the application.
- **React Hook Form:** For form handling and validation.
- **Zod:** For schema validation on the frontend.
- **AI SDK (OpenAI):** For integrating AI features in the frontend.
- **Lucide React:** For icons.

## Project Structure
```
database-explorer/
├── backend/
│   ├── src/
│   │   ├── agent/
│   │   │   └── agent.ts          # AI agent logic
│   │   ├── model/
│   │   │   ├── ollama.ts         # Ollama LLM integration
│   │   │   ├── openRouter.ts     # OpenRouter API integration
│   │   ├── tool/
│   │   │   ├── index.ts          # Tool index file
│   │   │   ├── mathTool.ts       # Math processing tools
│   │   │   ├── pgTool.ts         # PostgreSQL query tool
│   │   ├── server.ts             # Entry point for the backend
│   ├── package.json              # Backend dependencies
│   ├── tsconfig.json             # TypeScript configuration
│   ├── .env                      # Environment variables
└── frontend/
    ├── app/
    │   ├── api/
    │   │   ├── chat/
    │   │   │   ├── route.ts       # Chat API route
    │   ├── globals.css            # Global styles
    │   ├── layout.tsx             # Root layout component
    │   ├── page.tsx               # Main page component
    ├── components/
    │   ├── theme-provider.tsx      # Theme provider
    │   ├── ui/
    │   │   ├── accordion.tsx       # Accordion component
    │   │   ├── button.tsx          # Button component
    │   │   ├── dialog.tsx          # Dialog component
    │   │   ├── table.tsx           # Table component
    │   │   ├── toast.tsx           # Toast component
    │   │   ├── and more...
    ├── hooks/
    │   ├── use-mobile.tsx          # Hook for mobile detection
    │   ├── use-toast.ts            # Hook for toast notifications
    ├── lib/
    │   ├── agent-interface.ts      # Agent interface logic
    │   ├── ai-agent.ts             # AI agent utilities
    │   ├── utils.ts                # General utility functions
    ├── public/
    │   ├── placeholder-logo.png    # Placeholder logo
    │   ├── placeholder-user.jpg    # Placeholder user image
    ├── styles/
    │   ├── globals.css             # Global styles
    ├── package.json                # Frontend dependencies
    ├── tailwind.config.js          # Tailwind configuration
    ├── tsconfig.json               # TypeScript configuration
```

## Prerequisites
- **Node.js:** v18 or higher
- **PostgreSQL:** A running PostgreSQL instance
- **Ollama:** A running Ollama instance (for local LLM)
- **OpenRouter API Key:** Obtain from OpenRouter
- **Docker (optional):** For containerized deployment

## Setup Instructions
### Backend Setup
#### Clone the Repository:
```bash
git clone <repository-url>
cd database-explorer/backend
```
#### Install Dependencies:
```bash
npm install
```
#### Configure Environment Variables:
Create a `.env` file in the `backend/` directory with the following:
```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/database_name
```
#### Run the Backend:
```bash
npm start
```

### Frontend Setup
#### Navigate to the Frontend Directory:
```bash
cd ../frontend
```
#### Install Dependencies:
```bash
npm install
```
#### Configure Environment Variables:
Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```
#### Run the Frontend:
```bash
npm run dev
```
The frontend will run on `http://localhost:3000`.

## Usage
1. Open `http://localhost:3000`.
2. Enter your PostgreSQL connection string.
3. Click **"Connect to Database & run agents"**.
4. Explore tables, run SQL queries, and stream real-time data.

## Contributing
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License
This project is licensed under the **ISC License**. See the LICENSE file for details.

## Contact
For questions or feedback, reach out to **Muhammad Kashif Khan**.
