// mock-stdio.ts
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";

export class MockStdioTransport extends StdioServerTransport {
  public responses: string[] = [];

  // Public method to simulate input data
  public simulateInput(data: string): void {
    console.log(`[MockStdioTransport] Simulating input: ${data.trim()}`);
    // Need to access the protected _ondata method to process the input
    // Use TypeScript's type assertion to access the protected method
    (this as any)._ondata(Buffer.from(data, 'utf8'));
  }

  // Override write to capture output
  public write(data: string): void {
    console.log(`[MockStdioTransport] Received output: ${data.trim()}`);
    this.responses.push(data);
    // Call the parent's write method if needed
    // super.write(data);
  }
}