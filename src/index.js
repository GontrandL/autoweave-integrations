/**
 * AutoWeave Integrations Module
 * Exports all integration protocols and bridges
 */

// MCP (Model Context Protocol)
const MCPDiscovery = require('./mcp/discovery');
const AutoWeaveMCPServer = require('./mcp/autoweave-mcp-server');
const UnifiedAutoWeaveMCPServer = require('./mcp/unified-autoweave-mcp-server');

// ANP (Agent Network Protocol)
const { ANPServer } = require('./anp/anp-server');

// kagent Integration
const KagentBridge = require('./kagent/bridge');
const YAMLGenerator = require('./kagent/yaml-generator');

// Routes
const kagentRoutes = require('./routes/kagent');

// Utils
const { Logger } = require('./utils/logger');
const { RetryHelper } = require('./utils/retry');

module.exports = {
    // MCP exports
    MCPDiscovery,
    AutoWeaveMCPServer,
    UnifiedAutoWeaveMCPServer,
    
    // ANP exports
    ANPServer,
    
    // kagent exports
    KagentBridge,
    YAMLGenerator,
    
    // Routes
    kagentRoutes,
    
    // Utils
    Logger,
    RetryHelper,
    
    // Version info
    version: '1.0.0',
    protocols: ['MCP', 'ANP', 'kagent']
};