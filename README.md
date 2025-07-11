# AutoWeave Integrations Module

This module contains all integration protocols and bridges for AutoWeave, including MCP (Model Context Protocol), ANP (Agent Network Protocol), and kagent integration.

## Components

### 1. MCP (Model Context Protocol)

MCP enables AutoWeave to expose its capabilities as tools that can be discovered and used by LLMs and other MCP-compatible systems.

#### MCP Discovery Service
- **File**: `src/mcp/discovery.js`
- **Purpose**: Discovers and manages MCP servers and tools
- **Features**:
  - Automatic server discovery
  - Tool registration and management
  - Periodic rediscovery
  - Protocol version negotiation

#### AutoWeave MCP Server
- **File**: `src/mcp/autoweave-mcp-server.js`
- **Purpose**: Exposes AutoWeave functionality as MCP tools
- **Exposed Tools**:
  - `create-agent`: Create AI agents from natural language
  - `list-agents`: List all deployed agents
  - `create-config`: Generate configurations with AI
  - `generate-gitops`: Create GitOps manifests

#### Unified MCP Server
- **File**: `src/mcp/unified-autoweave-mcp-server.js`
- **Purpose**: Enhanced MCP server with additional capabilities
- **Features**:
  - Unified tool interface
  - Resource management
  - Extended protocol support

### 2. ANP (Agent Network Protocol)

ANP provides standardized REST endpoints for agent-to-agent communication and discovery.

#### ANP Server
- **File**: `src/anp/anp-server.js`
- **Purpose**: RESTful API for agent communication
- **Endpoints**:
  - `GET /agent` - Get agent card with capabilities
  - `POST /agent/tasks` - Create new task
  - `GET /agent/tasks/:id` - Get task status
  - `GET /agent/tasks/:id/steps` - Get task execution steps
  - `GET /agent/capabilities` - List agent capabilities
  - `GET /agent/openapi/validate` - Validate all OpenAPI specs
  - `POST /agent/openapi/validate` - Validate custom OpenAPI spec
  - `GET /agent/external/:id/validate` - Validate external agent

#### ANP Features
- OpenAPI 3.1 specification generation
- Task management with step tracking
- External agent discovery
- Specification validation
- Protocol version negotiation

### 3. kagent Integration

kagent bridge enables Kubernetes-native agent deployment and management.

#### kagent Bridge
- **File**: `src/kagent/bridge.js`
- **Purpose**: Interface between AutoWeave and kagent
- **Features**:
  - Agent deployment to Kubernetes
  - Status monitoring
  - Resource management
  - Log aggregation

#### YAML Generator
- **File**: `src/kagent/yaml-generator.js`
- **Purpose**: Convert AutoWeave agent definitions to kagent YAML
- **Features**:
  - Multi-step workflow generation
  - Resource specification
  - Security context configuration
  - Service mesh integration

#### kagent Routes
- **File**: `src/routes/kagent.js`
- **Purpose**: REST API endpoints for kagent operations
- **Endpoints**:
  - `POST /kagent/deploy` - Deploy agent to Kubernetes
  - `GET /kagent/status/:id` - Get agent status
  - `DELETE /kagent/agents/:id` - Remove agent
  - `GET /kagent/logs/:id` - Get agent logs

## Installation

```bash
npm install autoweave-integrations
```

## Usage

### Using MCP Discovery

```javascript
const { MCPDiscovery } = require('autoweave-integrations');

const config = {
    discoveryEnabled: true,
    anpPort: 8083
};

const discovery = new MCPDiscovery(config);
await discovery.start();

// Get available tools
const tools = discovery.getAvailableTools();
```

### Starting ANP Server

```javascript
const { ANPServer } = require('autoweave-integrations');

const config = {
    anpPort: 8083,
    externalANPRegistries: ['http://registry.example.com']
};

const anpServer = new ANPServer(config);
await anpServer.start();
```

### Using kagent Bridge

```javascript
const { KagentBridge } = require('autoweave-integrations');

const bridge = new KagentBridge(config);

// Deploy an agent
const result = await bridge.deployAgent({
    name: 'file-processor',
    yaml: generatedYaml
});
```

## API Documentation

### MCP Protocol

MCP follows the Model Context Protocol specification with these extensions:

- **Tool Discovery**: Dynamic tool registration and discovery
- **Version Negotiation**: Support for multiple protocol versions
- **Resource Management**: File and configuration resource handling

### ANP Protocol

ANP follows RESTful principles with OpenAPI 3.1 specifications:

- **Agent Cards**: Standardized agent capability descriptions
- **Task Management**: Asynchronous task execution with tracking
- **Validation**: Built-in OpenAPI specification validation

### kagent Integration

kagent integration provides:

- **CRD Support**: Full kagent Custom Resource Definition support
- **Observability**: OpenTelemetry integration for tracing
- **Multi-cluster**: Support for multi-cluster deployments

## Configuration

### Environment Variables

```bash
# MCP Configuration
MCP_DISCOVERY_ENABLED=true
MCP_SERVER_PORT=3002

# ANP Configuration
ANP_PORT=8083
EXTERNAL_ANP_REGISTRIES=http://registry1.com,http://registry2.com

# kagent Configuration
KAGENT_NAMESPACE=default
KUBECONFIG=/path/to/kubeconfig
```

### Configuration Object

```javascript
const config = {
    // MCP settings
    discoveryEnabled: true,
    mcpServerPort: 3002,
    
    // ANP settings
    anpPort: 8083,
    externalANPRegistries: [],
    
    // kagent settings
    kagentNamespace: 'default',
    kubeconfig: process.env.KUBECONFIG
};
```

## Testing

Run tests with:

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details