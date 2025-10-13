import { NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import os from "os"

const execAsync = promisify(exec)

export async function POST() {
  try {
    // Get the path to the web directory
    const webDir = process.cwd()

    // Detect environment and set correct path
    const hostname = os.hostname()
    const isProductionServer = hostname.includes("bidevlspark02")
    
    // Use absolute path on server, relative path in development
    const pro360Dir = isProductionServer 
      ? "/home/go_projects/src/github.com/pro360go"
      : path.resolve(webDir, "../../../pro360go")

    // Command to execute
    const command = "./pro360 RefreshAny2Any any2any_db2bq_Databricks_listprices"

    // Execute the command in the pro360go directory
    const { stdout, stderr } = await execAsync(command, {
      cwd: pro360Dir,
      timeout: 300000, // 5 minutes timeout
      shell: "/bin/bash",
      env: { ...process.env },
    })

    return NextResponse.json({
      success: true,
      stdout,
      stderr,
      message: "Job completed successfully",
    })
  } catch (error: unknown) {
    console.error("Error executing job:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
