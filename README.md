# @autoweave/integrations

AutoWeave integrations module providing MCP (Model Context Protocol), ANP (Agent Network Protocol), kagent integration, and various services.

## Overview

This module contains all the integration components for AutoWeave:

- **MCP (Model Context Protocol)**: Enable LLMs to use AutoWeave tools
- **ANP (Agent Network Protocol)**: Standardized agent-to-agent communication
- **kagent Integration**: Kubernetes-native agent deployment
- **Services**: Agent management and package discovery services

## Installation

```bash
npm install @autoweave/integrations
```

## Usage

### MCP Server

```javascript
const { createMCPServer } = require('@autoweave/integrations');

const mcpServer = createMCPServer({
    port: 3002,
    enableDiscovery: true
});

await mcpServer.start();
```

### ANP Server (via MCPDiscovery)

```javascript
const { createMCPDiscovery } = require('@autoweave/integrations');

const discovery = createMCPDiscovery({
    discoveryEnabled: true,
    anpPort: 8083
}, kagentBridge, autoweaveInstance);

await discovery.start();
```

### kagent Bridge

```javascript
const { createKagentBridge } = require('@autoweave/integrations');

const bridge = createKagentBridge({
    namespace: 'default',
    kubeconfig: '/path/to/kubeconfig'
});

const manifest = await bridge.generateManifest(agentDefinition);
await bridge.deployAgent(manifest);
```

### Services

```javascript
const { createAgentService, createFreshSourcesService } = require('@autoweave/integrations');

// Agent Service
const agentService = createAgentService(kagentBridge);
const agents = await agentService.listAgents();

// Fresh Sources Service
const freshSources = createFreshSourcesService();
const versions = await freshSources.searchPackage('redis');
```

## Components

### MCP (Model Context Protocol)
- `MCPServer`: Exposes AutoWeave tools to LLMs
- `MCPDiscovery`: Discovers and integrates MCP servers

### ANP (Agent Network Protocol)
- Integrated within `MCPDiscovery`
- RESTful agent communication
- OpenAPI 3.1 specifications
- Task management and validation

### kagent Integration
- `KagentBridge`: Kubernetes agent deployment
- `YamlGenerator`: YAML manifest generation

### Services
- `AgentService`: Agent lifecycle management
- `FreshSourcesService`: Multi-registry package discovery

## API Reference

### MCPServer
- `start()`: Start the MCP server
- `stop()`: Stop the MCP server
- `getTools()`: Get available tools
- `executeTool(name, params)`: Execute a tool

### MCPDiscovery
- `start()`: Start discovery and ANP server
- `stop()`: Stop services
- `discoverServers()`: Discover MCP servers
- `getAgentCard()`: Get ANP agent card
- `createTask(input)`: Create ANP task

### KagentBridge
- `generateManifest(definition)`: Generate kagent manifest
- `deployAgent(manifest)`: Deploy agent to Kubernetes
- `getAgentStatus(id)`: Get agent status
- `deleteAgent(id)`: Delete agent

### Services
- `AgentService.listAgents()`: List all agents
- `AgentService.createAgent(definition)`: Create new agent
- `FreshSourcesService.searchPackage(query)`: Search package versions
- `FreshSourcesService.getLatestVersion(name, registry)`: Get latest version

## Environment Variables

- `KUBECONFIG`: Path to Kubernetes config
- `KAGENT_NAMESPACE`: Kubernetes namespace (default: "default")
- `MCP_PORT`: MCP server port (default: 3002)
- `ANP_PORT`: ANP server port (default: 8083)
- `EXTERNAL_ANP_REGISTRIES`: External ANP registry URLs

## License

MIT