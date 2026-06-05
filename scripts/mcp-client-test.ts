/** End-to-end: spawn the built server over stdio and drive it as a real MCP client. */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({ command: "node", args: ["dist/index.js"] });
const client = new Client({ name: "smoke-client", version: "0.0.0" });
await client.connect(transport);

const tools = await client.listTools();
console.log("TOOLS:", tools.tools.map((t) => t.name).join(", "));
console.log("has outputSchema:", tools.tools.map((t) => `${t.name}=${!!t.outputSchema}`).join(", "));

const single = await client.callTool({
  name: "check_package_fitness",
  arguments: { package: "node-uuid" },
});
console.log("\n--- check_package_fitness(node-uuid) text ---");
console.log((single.content as any[])[0].text);
console.log("\n--- structuredContent.safe_migration_target ---");
console.log(JSON.stringify((single as any).structuredContent?.safe_migration_target));

const batch = await client.callTool({
  name: "audit_dependencies",
  arguments: { packages: ["react@18.2.0", "request", "left-pad"] },
});
console.log("\n--- audit_dependencies summary ---");
console.log(JSON.stringify((batch as any).structuredContent?.summary));

await client.close();
console.log("\nOK: server is callable over stdio.");
