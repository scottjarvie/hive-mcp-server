// mock-stdio.ts
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";


export class MockStdioTransport extends StdioServerTransport {
  public responses: string[] = [];

  // Public method to simulate input data
  public simulateInput(data: string): void {
    const bufferData = Buffer.from(data, 'utf8');
    this._ondata(bufferData); // Call the internal _ondata method
  }

  // Override write to capture output
  public write(data: string): void {
    this.responses.push(data);
  }
}