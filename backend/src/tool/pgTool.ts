import { tool } from "@langchain/core/tools";
import { z } from "zod";
import pg from "pg";

// Define new tools
const getTableNames = tool(
  async ({ dbUrl }: { dbUrl: string }) => {
    const pool = new pg.Pool({
      connectionString: dbUrl,
    });

    const client = await pool.connect();
    try {
      // Step 1: Get all tables with their schemas
      // and table_name not in ('SequelizeMeta','property_v2','raw_properties','property_data','urls','graph_data','new_timeseries_data');
      const { rows: tableRows } = await client.query(`
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('pg_catalog', 'information_schema') and table_name not in ('SequelizeMeta','property_v2','raw_properties','property_data','urls','graph_data','new_timeseries_data');
      `);

      const tables = tableRows.map((row) => row.table_name);
      return JSON.stringify(tables);
    } finally {
      client.release();
    }
  },
  {
    name: "getTableNames",
    description: "Get the list of table names from the database.",
    schema: z.object({
      dbUrl: z.string().describe("Database URL"),
    }),
  }
);

const getTableStructure = tool(
  async ({
    dbUrl,
    requiredTables,
  }: {
    dbUrl: string;
    requiredTables: string[];
  }) => {
    const pool = new pg.Pool({ connectionString: dbUrl });
    const client = await pool.connect();
    console.log({
      dbUrl: dbUrl,
      requiredTables: requiredTables,
      // query: query,
    });
    try {
      const tableStructures = [];
      const enumNames = new Set();

      for (const tableName of requiredTables) {
        let [schema, name] = tableName.split(".");
        if (!name) {
          schema = "public";
          name = tableName;
        }
        const { rows: columnRows } = await client.query(
          `SELECT column_name, data_type, is_nullable, column_default, udt_name
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2;`,
          [schema, name]
        );

        const { rows: records } = await client.query(
          `SELECT * FROM "${schema}"."${name}" LIMIT 1;`
        );

        const columns = columnRows.map((col) => {
          let type = col.data_type;
          if (col.data_type === "USER-DEFINED") {
            type = `enum(${col.udt_name})`;
            enumNames.add(col.udt_name);
          }
          return {
            name: col.column_name,
            type: type,
          };
        });

        tableStructures.push({
          // schema: 'public',
          name: tableName,
          columns: columns,
          records: records,
        });
      }

      const enumValues: any = {};
      for (const udtName of enumNames) {
        const { rows: enumRows } = await client.query(
          `SELECT e.enumlabel
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = $1;`,
          [udtName]
        );
        enumValues[udtName as string] = enumRows.map((row) => row.enumlabel);
      }

      // Attach enum values to the columns
      for (const table of tableStructures) {
        for (const col of table.columns as any) {
          if (col.type.startsWith("enum(")) {
            const udtName = col.type.substring(5, col.type.length - 1);
            col.enum_values = enumValues[udtName];
          }
        }
      }

      return JSON.stringify(tableStructures);
    } finally {
      client.release();
    }
  },
  {
    name: "getTableStructure",
    description: "Get the structure of specified tables from the database.",
    schema: z.object({
      dbUrl: z.string().describe("Database URL"),
      requiredTables: z
        .array(z.string())
        .describe("Array of schema-qualified table names"),
    }),
  }
);
// Assuming the original 'query' tool is still needed
const query = tool(
  async ({ dbUrl, query }: { dbUrl: string; query: string }) => {
    const pool = new pg.Pool({
      connectionString: dbUrl,
    });

    const client = await pool.connect();
    try {
      console.log(`Executing query: ${query}`);
      const { rows } = await pool.query(query);
      return JSON.stringify(rows, null, 2);
    } catch (error) {
      console.log(`Error executing query: ${error}`);
      return `Error executing query: ${error}`;
    } finally {
      client.release();
    }
  },
  {
    name: "query",
    description: "execute a postgres query and get the results or data.",
    schema: z.object({
      dbUrl: z.string().describe("Database URL"),
      query: z.string().describe("postgres query to execute and get the results or data from the database"),
    }),
  }
);


// const query = tool(
//   async ({
//     dbUrl,
//     query,
//     tableStructure,
//   }: {
//     dbUrl: string;
//     query: string;
//     tableStructure: {
//       name: string;
//       columns: {
//         name: string;
//         type: string;
//       }[];
//     }[];
//   }) => {
//     const pool = new pg.Pool({
//       connectionString: dbUrl,
//     });

//     console.log("===================================================");
//     console.log({ dbUrl, query, tableStructure });
//     console.log("===================================================");

//     const client = await pool.connect();
//     try {
//       const { rows } = await pool.query(query);
//       return JSON.stringify(rows, null, 2);
//     } finally {
//       client.release();
//     }
//   },
//   {
//     name: "query",
//     description: "Execute a PostgreSQL query and get the results or data.",
//     schema: z.object({
//       dbUrl: z.string().describe("Database URL"),
//       query: z.string().describe("A valid PostgreSQL query to execute"),
//       tableStructure: z
//         .array(
//           z.object({
//             name: z.string(),
//             columns: z.array(
//               z.object({
//                 name: z.string(),
//                 type: z.string(),
//               })
//             ),
//           })
//         )
//         .describe("Detailed table structure (table name & columns with data types and names) for the database"),
//     }),
//   }
// );


export { getTableNames, getTableStructure, query };
