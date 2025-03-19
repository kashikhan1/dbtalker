"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Database, Table, FileText, Code, Play, BarChart } from "lucide-react"

// Types for database structures
type TableColumn = {
  name: string
  type: string
  enum_values?: string[]
}

type TableRecord = Record<string, any>

type TableStructure = {
  name: string
  columns: TableColumn[]
  records: TableRecord[]
}

type StreamingData = {
  type: string
  data: any
}

export default function Home() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableNames, setTableNames] = useState<string[]>([])
  const [tableStructures, setTableStructures] = useState<TableStructure[]>([])
  const [queryResults, setQueryResults] = useState<any[] | null>(null)
  const [streamingResults, setStreamingResults] = useState<any[]>([])
  const [isExecuting, setIsExecuting] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [dbUrl, setDbUrl] = useState("postgresql://postgres:mysecretpassword@localhost:5436/chat-app2")
  const [sqlQuery, setSqlQuery] = useState("")
  const [activeTab, setActiveTab] = useState("structure")
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Clean up any active streams when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName)
  }

  const executeQuery = () => {
    if (!sqlQuery.trim()) return

    setIsExecuting(true)
    setError(null)

    // Simulate query execution with a timeout
    setTimeout(() => {
      setIsExecuting(false)

      // Mock query results based on the SQL query
      if (sqlQuery.toLowerCase().includes("user") && sqlQuery.toLowerCase().includes("chat")) {
        setQueryResults([
          {
            id: 1,
            username: "user",
            email: "user@example.com",
            chats: [{ id: 1, title: "germnay" }],
          },
        ])
      } else if (sqlQuery.toLowerCase().includes("user")) {
        setQueryResults([
          { id: 1, username: "user", email: "user@example.com", phoneNumber: "+13344442222", status: "ACTIVE" },
        ])
      } else if (sqlQuery.toLowerCase().includes("chat")) {
        setQueryResults([{ id: 1, title: "germnay", userId: 4, createdAt: "2025-02-12T07:37:10.524Z" }])
      } else {
        setQueryResults([])
      }

      // Switch to the results tab
      setActiveTab("results")
    }, 1000)
  }

  const startStreamingData = async () => {
    console.log("startStreamingData called")
    if (isStreaming) {
      // If already streaming, stop it
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      setIsStreaming(false)
      return
    }

    setIsStreaming(true)
    setStreamingResults([])
    setError(null)

    // Create a new AbortController for this stream
    abortControllerRef.current = new AbortController()
    // const signal = abortControllerRef.current.signal

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: dbUrl || "SELECT * FROM User" }),
        // signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Switch to the streaming tab
      setActiveTab("streaming")

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("Response body is null")
      }

      const decoder = new TextDecoder()
      let buffer = ""

      // Process the stream
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // Process any remaining data in the buffer
          if (buffer.trim()) {
            try {
              const data = JSON.parse(buffer)
              setStreamingResults((prev) => [...prev, data])
            } catch (e) {
              console.error("Error parsing JSON from buffer:", buffer)
            }
          }
          break
        }

        // Decode the chunk and add it to our buffer
        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        // Process complete JSON objects from the buffer
        let newlineIndex
        while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, newlineIndex).trim()
          buffer = buffer.slice(newlineIndex + 1)

          if (line) {
            try {
              const data = JSON.parse(line)
              // console.log("data:  ")
              // console.log(data)
              if(data.toolCallTableName) {
                setTableNames(JSON.parse(data.toolCallTableName))
              }
              if(data.toolCallTableStructure) {
                console.log("data.toolCallTableStructure:  ")
                console.log(data.toolCallTableStructure)
                console.log("JSON.parse(data.toolCallTableStructure):  ") 
                console.log(JSON.parse(data.toolCallTableStructure))
                setTableStructures(JSON.parse(data.toolCallTableStructure))
              }
              
              if(data.llmCall) {
                  const result = data.llmCall
                  const { kwargs } = result
                  const { tool_calls } = kwargs
                  if(tool_calls.length > 0) {
                    const { args } = tool_calls[0]
                    const { query } = args
                    setSqlQuery(query)
                  }
                // setSqlQuery(data.toolCallQueryResult)
              }
              if(data.toolCall) {
                setQueryResults(JSON.parse(data.toolCall))
              }
              setStreamingResults((prev) => [...prev, data])
            } catch (e) {
              console.error("Error parsing JSON:", line)
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Streaming error:", err)
        setError(err.message || "Error streaming data")
      }
    } finally {
      setIsStreaming(false)
    }
  }

  const getSelectedTableStructure : any = () => {
    if (!selectedTable) return null

    // Find the table structure by name (either exact match or contains)
    return tableStructures.find((table) => table.name === selectedTable || table.name.includes(selectedTable))
  }

  // Function to render table data
  const renderTableData = (data: any[] | null) => {
    if (!data || data.length === 0) {
      return <div className="text-center py-4 text-muted-foreground">No results to display</div>
    }

    // Get all unique keys from all objects
    const allKeys = Array.from(
      new Set(data.flatMap((item) => Object.keys(item).filter((key) => typeof item[key] !== "function"))),
    )

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              {allKeys.map((key) => (
                <th key={key} className="py-2 px-4 text-left font-medium">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b">
                {allKeys.map((key) => (
                  <td key={`${rowIndex}-${key}`} className="py-2 px-4">
                    {renderCellValue(row[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // Helper function to render cell values
  const renderCellValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">null</span>
    }

    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return (
          <div className="max-h-40 overflow-y-auto">
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
          </div>
        )
      }
      return (
        <div className="max-h-40 overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
        </div>
      )
    }

    return String(value)
  }

  return (
    <main className="flex min-h-screen flex-col p-4 md:p-8">
      <Card className="w-full mb-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <Database className="mr-2 h-6 w-6" />
            Database Explorer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Input
              value={dbUrl}
              onChange={(e) => setDbUrl(e.target.value)}
              placeholder="Database URL"
              className="flex-grow"
            />
            <Button
              onClick={startStreamingData}
              className="whitespace-nowrap"
            >
              Connect to Database & run agents
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Table Names Panel */}
        <Card className="md:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium flex items-center">
              <Table className="mr-2 h-5 w-5" />
              Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tableNames.length === 0 ? (
              <div className="text-muted-foreground text-sm">No tables found. Connect to a database first.</div>
            ) : (
              <div className="space-y-1">
                {tableNames.map((tableName) => (
                  <Button
                    key={tableName}
                    variant={selectedTable === tableName ? "secondary" : "ghost"}
                    className="w-full justify-start text-left"
                    onClick={() => handleTableSelect(tableName)}
                  >
                    {tableName}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Panel */}
        <div className="md:col-span-9 space-y-6">
          {/* Table Structure and Query Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="structure">Table Structure</TabsTrigger>
              <TabsTrigger value="query">SQL Query</TabsTrigger>
              <TabsTrigger value="results">Query Results</TabsTrigger>
              <TabsTrigger value="streaming">Streaming Data</TabsTrigger>
            </TabsList>

            {/* Table Structure Tab */}
            <TabsContent value="structure" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    {selectedTable ? `Structure: ${selectedTable}` : "Select a table"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedTable ? (
                    <div className="text-muted-foreground text-sm">
                      Select a table from the list to view its structure.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 px-4 text-left font-medium">Column</th>
                            <th className="py-2 px-4 text-left font-medium">Type</th>
                            <th className="py-2 px-4 text-left font-medium">Values</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getSelectedTableStructure()?.columns.map((column: any, index: any) => (
                            <tr key={index} className="border-b">
                              <td className="py-2 px-4">{column.name}</td>
                              <td className="py-2 px-4">{column.type}</td>
                              <td className="py-2 px-4">{column.enum_values ? column.enum_values.join(", ") : ""}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sample Records */}
              {selectedTable && getSelectedTableStructure()?.records.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Sample Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            {getSelectedTableStructure()?.columns.map((column: any, index: any) => (
                              <th key={index} className="py-2 px-4 text-left font-medium">
                                {column.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {getSelectedTableStructure()?.records.map((record: any, recordIndex: any) => (
                            <tr key={recordIndex} className="border-b">
                              {getSelectedTableStructure()?.columns.map((column: any, colIndex: any) => (
                                <td key={colIndex} className="py-2 px-4">
                                  {renderCellValue(record[column.name])}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* SQL Query Tab */}
            <TabsContent value="query" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center">
                    <Code className="mr-2 h-5 w-5" />
                    SQL Query
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      <div className="relative">
                        <textarea
                          className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="SELECT * FROM users WHERE..."
                          value={sqlQuery}
                          onChange={(e) => setSqlQuery(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button onClick={executeQuery} disabled={isExecuting || !sqlQuery.trim()} className="flex-1">
                          {isExecuting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Executing...
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Execute Query
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={startStreamingData}
                          variant={isStreaming ? "destructive" : "secondary"}
                          className="flex-1"
                        >
                          {isStreaming ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Stop Streaming
                            </>
                          ) : (
                            <>
                              <BarChart className="mr-2 h-4 w-4" />
                              Stream Data
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Query Results Tab */}
            <TabsContent value="results" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center">
                    <FileText className="mr-2 h-5 w-5" />
                    Query Results
                  </CardTitle>
                </CardHeader>
                <CardContent>{renderTableData(queryResults)}</CardContent>
              </Card>
            </TabsContent>

            {/* Streaming Data Tab */}
            <TabsContent value="streaming" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium flex items-center">
                    <BarChart className="mr-2 h-5 w-5" />
                    Streaming Data
                    {isStreaming && <div className="ml-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {error && <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">{error}</div>}

                  {streamingResults.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      {isStreaming ? "Waiting for data..." : "Click 'Stream Data' to start receiving streaming data"}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground mb-2">
                        Received {streamingResults.length} data points
                      </div>
                      {renderTableData(streamingResults)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  )
}

