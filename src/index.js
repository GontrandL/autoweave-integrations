/**
 * AutoWeave Integrations Module
 * Exports all integration components: MCP, kagent, ANP, and services
 */

// MCP (Model Context Protocol) exports
const MCPServer = require('./mcp/autoweave-mcp-server');
const MCPDiscovery = require('./mcp/discovery');

// kagent integration exports
const KagentBridge = require('./kagent/bridge');
const YamlGenerator = require('./kagent/yaml-generator');

// Services exports
const AgentService = require('./services/agent-service');
const FreshSourcesService = require('./services/fresh-sources-service');

// ANP (Agent Network Protocol) - Standalone server
const { ANPServer } = require('./anp/anp-server');

// Note: MCPDiscovery also contains ANP functionality for backward compatibility

module.exports = {
    // MCP Components
    MCPServer,
    MCPDiscovery,
    
    // ANP Components
    ANPServer,
    
    // kagent Components
    KagentBridge,
    YamlGenerator,
    
    // Services
    AgentService,
    FreshSourcesService,
    
    // Convenience exports
    createMCPServer: (config) => new MCPServer(config),
    createMCPDiscovery: (config, kagentBridge, autoweaveInstance) => new MCPDiscovery(config, kagentBridge, autoweaveInstance),
    createANPServer: (config, kagentBridge, autoweaveInstance) => new ANPServer(config, kagentBridge, autoweaveInstance),
    createKagentBridge: (kubeConfig) => new KagentBridge(kubeConfig),
    createAgentService: (kagentBridge) => new AgentService(kagentBridge),
    createFreshSourcesService: () => new FreshSourcesService(),
    
    // Version info
    version: '1.0.0',
    protocols: ['MCP', 'ANP', 'kagent']
};