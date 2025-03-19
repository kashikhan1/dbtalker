require('dotenv').config()
import express, { Request, Response, Express } from "express";
import { agent, agentQuery } from "./agent/agent";
const app: Express = express(); // Explicitly type as Express

const PORT = process.env.PORT || 3000;
import cors from "cors";
import { openRouterLLM } from "./model/openRouter";

app.use(express.json());
app.use(cors());

app.post("/process", async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      return res
        .status(400)
        .json({ error: "Query is required and must be a string" });
    }

    const messages = [
      { role: "user", content: `get table and table structure ${query}` },
    ];

    // Set headers for streaming
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Transfer-Encoding", "chunked");

    const stream = await agent.stream(messages, { streamMode: "updates" });
    let tableStructure = "";
    // Stream each step as it's received
    for await (const step of stream) {
      console.log("Streaming step:", step);
      if (!step.agent) {
        if (step.toolCallTableStructure) {
          tableStructure = step.toolCallTableStructure;
        }
        res.write(JSON.stringify(step) + "\n"); // Send each chunk as a newline-separated JSON
      }
    }

    const getQuery =
      await openRouterLLM.invoke(`based strictly on the provided table structure and input conditions.
Table Structure:
${tableStructure}
Query Requirement:
${query}
Generate only the PostgreSQL query without any additional text, explanation, or formatting.
Strictly use the provided table structure and do not infer missing columns or relationships.
Always enclose table names and column names in double quotes (e.g., "TableName", "ColumnName", "TableName"."ColumnName").
Ensure proper joins based on the primary and foreign key relationships in the table structure.
Optimize query performance by selecting only necessary columns and avoiding redundant joins.
Format the output as a valid PostgreSQL query ready for execution.
Return only the PostgreSQL query—nothing else.`);

    const queryMessage = [
      {
        role: "user",
        content: `query ${getQuery.content} ${query.split("query")[0]?.trim()}`,
      },
    ];

    const streamQuery = await agentQuery.stream(queryMessage, {
      streamMode: "updates",
    });

    // Stream each step as it's received
    for await (const step of streamQuery) {
      console.log("Streaming step:", step);
      res.write(JSON.stringify(step) + "\n"); // Send each chunk as a newline-separated JSON
    }

    res.end(); // End the stream
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "healthy" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
