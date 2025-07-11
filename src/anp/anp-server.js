const { Logger } = require('../utils/logger');
const { RetryHelper } = require('../utils/retry');
const express = require('express');
const SwaggerParser = require('swagger-parser');
const Ajv = require('ajv');
const fetch = require('node-fetch');

/**
 * ANP (Agent Network Protocol) Server
 * Provides standardized endpoints for agent-to-agent communication
 * Based on AutoWeave's ANP implementation
 */
class ANPServer {
    constructor(config, kagentBridge = null, autoweaveInstance = null) {
        this.config = config;
        this.logger = new Logger('ANPServer');
        
        // ANP Server components
        this.kagentBridge = kagentBridge;
        this.autoweaveInstance = autoweaveInstance;
        this.anpTasks = new Map();
        this.externalAgents = new Map();
        
        // ANP Express app
        this.anpApp = express();
        this.anpApp.use(express.json());
        this.anpServer = null;
        
        // JSON Schema validator
        this.ajv = new Ajv();
    }

    async start() {
        this.logger.info('Starting ANP Server...');
        
        try {
            // Initialize ANP server
            await this.initializeANPServer();
            
            // Start ANP server
            await this.startANPServer();
            
            this.logger.success('ANP Server started');
            
        } catch (error) {
            this.logger.error('Failed to start ANP Server:', error);
            throw error;
        }
    }

    async stop() {
        this.logger.info('Stopping ANP Server...');
        
        // Stop ANP server
        if (this.anpServer) {
            this.anpServer.close();
            this.logger.info('ANP server stopped');
        }
    }

    async initializeANPServer() {
        this.logger.info('Initializing ANP Server...');
        
        // Setup ANP routes
        this.setupANPRoutes();
        
        // Initialize external agent discovery
        await this.initializeExternalAgentDiscovery();
        
        this.logger.debug('ANP Server initialized');
    }

    async startANPServer() {
        return new Promise((resolve, reject) => {
            const port = this.config.anpPort || 8083;
            
            this.anpServer = this.anpApp.listen(port, (err) => {
                if (err) {
                    this.logger.error('Failed to start ANP server:', err);
                    reject(err);
                } else {
                    this.logger.success(`ANP Server listening on port ${port}`);
                    resolve();
                }
            });
        });
    }

    setupANPRoutes() {
        // ANP Endpoint: GET /agent
        this.anpApp.get('/agent', async (req, res) => {
            this.logger.debug('ANP GET /agent request received');
            
            try {
                // Use validation parameter to determine response type
                const validate = req.query.validate === 'true';
                
                let agentCard;
                if (validate) {
                    agentCard = await this.generateValidatedAgentCard();
                } else {
                    agentCard = this.generateAutoWeaveAgentCard();
                }
                
                res.json(agentCard);
                this.logger.debug(`ANP /agent served successfully (validated: ${validate})`);
                
            } catch (error) {
                this.logger.error('Failed to serve ANP /agent:', error);
                res.status(500).json({ 
                    error: 'Failed to generate agent card',
                    details: error.message 
                });
            }
        });

        // ANP Endpoint: POST /agent/tasks
        this.anpApp.post('/agent/tasks', async (req, res) => {
            const { input, tools, agent_id } = req.body;
            const taskId = `autoweave-task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            this.logger.info(`ANP POST /agent/tasks received for ID: ${taskId}`);
            
            try {
                // Create task
                const task = {
                    task_id: taskId,
                    input: input,
                    tools: tools || [],
                    agent_id: agent_id || 'autoweave-orchestrator',
                    status: 'created',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                
                // Store task
                this.anpTasks.set(taskId, task);
                
                // Process task asynchronously
                this.processANPTask(taskId, task);
                
                res.status(201).json(task);
                this.logger.debug(`ANP task ${taskId} created successfully`);
                
            } catch (error) {
                this.logger.error(`Failed to handle ANP task ${taskId}:`, error);
                res.status(500).json({ 
                    error: error.message, 
                    task_id: taskId, 
                    status: 'failed' 
                });
            }
        });

        // ANP Endpoint: GET /agent/tasks/{task_id}
        this.anpApp.get('/agent/tasks/:task_id', (req, res) => {
            const taskId = req.params.task_id;
            const task = this.anpTasks.get(taskId);
            
            if (task) {
                res.json(task);
                this.logger.debug(`ANP GET /agent/tasks/${taskId} served`);
            } else {
                res.status(404).json({ error: 'Task not found' });
                this.logger.warn(`ANP GET /agent/tasks/${taskId} not found`);
            }
        });

        // ANP Endpoint: GET /agent/tasks/{task_id}/steps
        this.anpApp.get('/agent/tasks/:task_id/steps', (req, res) => {
            const taskId = req.params.task_id;
            const task = this.anpTasks.get(taskId);
            
            if (task) {
                res.json({
                    task_id: taskId,
                    steps: task.steps || [],
                    current_step: task.current_step || 0
                });
            } else {
                res.status(404).json({ error: 'Task not found' });
            }
        });

        // ANP Endpoint: GET /agent/capabilities
        this.anpApp.get('/agent/capabilities', (req, res) => {
            try {
                const capabilities = this.getAutoWeaveCapabilities();
                res.json(capabilities);
            } catch (error) {
                this.logger.error('Failed to serve capabilities:', error);
                res.status(500).json({ error: 'Failed to get capabilities' });
            }
        });

        // ANP Endpoint: GET /agent/openapi/validate
        this.anpApp.get('/agent/openapi/validate', async (req, res) => {
            this.logger.debug('ANP GET /agent/openapi/validate request received');
            
            try {
                const validationResults = await this.validateAllToolsOpenAPI();
                
                res.json({
                    validated_at: new Date().toISOString(),
                    tools_total: validationResults.length,
                    tools_valid: validationResults.filter(r => r.valid).length,
                    tools_invalid: validationResults.filter(r => !r.valid).length,
                    validation_results: validationResults
                });
                
                this.logger.debug('ANP OpenAPI validation served successfully');
                
            } catch (error) {
                this.logger.error('Failed to validate OpenAPI specs:', error);
                res.status(500).json({ 
                    error: 'Failed to validate OpenAPI specifications',
                    details: error.message 
                });
            }
        });

        // ANP Endpoint: POST /agent/openapi/validate
        this.anpApp.post('/agent/openapi/validate', async (req, res) => {
            this.logger.debug('ANP POST /agent/openapi/validate request received');
            
            try {
                const { spec, source = 'client' } = req.body;
                
                if (!spec) {
                    return res.status(400).json({ 
                        error: 'OpenAPI specification is required',
                        valid: false 
                    });
                }
                
                const validationResult = await this.validateOpenAPISpec(spec, source);
                
                res.json(validationResult);
                this.logger.debug(`ANP OpenAPI validation completed for ${source}`);
                
            } catch (error) {
                this.logger.error('Failed to validate provided OpenAPI spec:', error);
                res.status(500).json({ 
                    error: 'Failed to validate OpenAPI specification',
                    details: error.message,
                    valid: false
                });
            }
        });

        // ANP Endpoint: GET /agent/external/{agent_id}/validate
        this.anpApp.get('/agent/external/:agent_id/validate', async (req, res) => {
            const agentId = req.params.agent_id;
            this.logger.debug(`ANP GET /agent/external/${agentId}/validate request received`);
            
            try {
                const validationResults = await this.validateExternalAgentOpenAPI(agentId);
                
                res.json({
                    agent_id: agentId,
                    validated_at: new Date().toISOString(),
                    validation_results: validationResults
                });
                
                this.logger.debug(`ANP external agent validation completed for ${agentId}`);
                
            } catch (error) {
                this.logger.error(`Failed to validate external agent ${agentId}:`, error);
                res.status(500).json({ 
                    error: 'Failed to validate external agent',
                    details: error.message,
                    agent_id: agentId
                });
            }
        });

        this.logger.debug('ANP routes configured');
    }

    generateAutoWeaveAgentCard() {
        return {
            protocol_version: 'v1',
            agent_id: 'autoweave-orchestrator',
            name: 'AutoWeave',
            description: 'AutoWeave: The Self-Weaving Agent Orchestrator. Deploy, manage, and orchestrate AI agents on Kubernetes.',
            version: '0.1.0',
            author: 'AutoWeave Team',
            capabilities: {
                tools: this.getAutoWeaveToolsAsOpenAPI(),
                supported_formats: ['json', 'yaml'],
                supported_protocols: ['anp', 'mcp'],
                deployment_targets: ['kubernetes', 'kagent'],
                features: [
                    'agent-creation',
                    'workflow-orchestration',
                    'kubernetes-deployment',
                    'hybrid-memory-system',
                    'ui-integration'
                ]
            },
            endpoints: {
                tasks: '/agent/tasks',
                capabilities: '/agent/capabilities',
                health: '/health'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }

    async generateValidatedAgentCard() {
        // Generate base card
        const agentCard = this.generateAutoWeaveAgentCard();
        
        // Validate all tools' OpenAPI specs
        const validationResults = await this.validateAllToolsOpenAPI();
        
        // Add validation metadata
        agentCard.validation = {
            validated_at: new Date().toISOString(),
            tools_validated: validationResults.filter(r => r.valid).length,
            tools_total: validationResults.length,
            all_valid: validationResults.every(r => r.valid),
            validation_results: validationResults
        };
        
        return agentCard;
    }

    getAutoWeaveToolsAsOpenAPI() {
        // Generate OpenAPI specs for AutoWeave tools
        const tools = [];
        
        // Agent creation tool
        tools.push({
            name: 'create-agent',
            description: 'Create a new AI agent from natural language description',
            openapi: {
                openapi: '3.1.0',
                info: {
                    title: 'Create Agent Tool',
                    version: '1.0.0'
                },
                paths: {
                    '/create-agent': {
                        post: {
                            summary: 'Create a new agent',
                            requestBody: {
                                required: true,
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                description: {
                                                    type: 'string',
                                                    description: 'Natural language description of the agent'
                                                },
                                                user_id: {
                                                    type: 'string',
                                                    description: 'User ID for the agent'
                                                }
                                            },
                                            required: ['description']
                                        }
                                    }
                                }
                            },
                            responses: {
                                '200': {
                                    description: 'Agent created successfully',
                                    content: {
                                        'application/json': {
                                            schema: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'string' },
                                                    name: { type: 'string' },
                                                    status: { type: 'string' }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Add more tools as needed...
        
        return tools;
    }

    getAutoWeaveCapabilities() {
        return {
            protocols: ['anp', 'mcp'],
            tools: [
                {
                    name: 'create-agent',
                    description: 'Create AI agents from natural language',
                    type: 'core'
                },
                {
                    name: 'manage-agents',
                    description: 'List, get, update, and delete agents',
                    type: 'core'
                },
                {
                    name: 'deploy-to-k8s',
                    description: 'Deploy agents to Kubernetes via kagent',
                    type: 'deployment'
                },
                {
                    name: 'memory-search',
                    description: 'Search hybrid memory system',
                    type: 'memory'
                }
            ],
            integrations: [
                'kagent',
                'kubernetes',
                'openai',
                'mem0',
                'qdrant',
                'memgraph'
            ],
            features: [
                'natural-language-agent-creation',
                'kubernetes-native-deployment',
                'hybrid-memory-system',
                'ui-integration',
                'mcp-discovery',
                'openapi-validation'
            ]
        };
    }

    async processANPTask(taskId, task) {
        try {
            // Update task status
            task.status = 'processing';
            task.updated_at = new Date().toISOString();
            
            // Initialize steps
            task.steps = [];
            task.current_step = 0;
            
            // Step 1: Parse input
            task.steps.push({
                step: 1,
                name: 'parse-input',
                status: 'processing',
                started_at: new Date().toISOString()
            });
            
            // Process based on input
            if (this.autoweaveInstance && task.input.toLowerCase().includes('create')) {
                // Use AutoWeave to create agent
                const result = await this.autoweaveInstance.createAgent({
                    description: task.input,
                    user_id: task.agent_id
                });
                
                task.result = result;
                task.status = 'completed';
            } else {
                // Mock processing
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                task.result = {
                    message: 'Task processed successfully',
                    input: task.input,
                    tools_used: task.tools
                };
                task.status = 'completed';
            }
            
            // Update final step
            task.steps[0].status = 'completed';
            task.steps[0].completed_at = new Date().toISOString();
            
            task.completed_at = new Date().toISOString();
            task.updated_at = new Date().toISOString();
            
            this.logger.info(`ANP task ${taskId} completed successfully`);
            
        } catch (error) {
            this.logger.error(`ANP task ${taskId} failed:`, error);
            
            task.status = 'failed';
            task.error = error.message;
            task.updated_at = new Date().toISOString();
            
            if (task.steps && task.steps.length > 0) {
                task.steps[task.current_step].status = 'failed';
                task.steps[task.current_step].error = error.message;
                task.steps[task.current_step].completed_at = new Date().toISOString();
            }
        }
    }

    async validateOpenAPISpec(spec, source) {
        try {
            // Validate using swagger-parser
            const validated = await SwaggerParser.validate(spec);
            
            // Additional ANP-specific validation
            const anpValidation = this.validateANPCompliance(validated);
            
            return {
                valid: true,
                source: source,
                spec_version: validated.openapi || validated.swagger,
                title: validated.info?.title,
                version: validated.info?.version,
                anp_compliant: anpValidation.compliant,
                anp_issues: anpValidation.issues,
                validated_at: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                valid: false,
                source: source,
                error: error.message,
                details: error.details || [],
                validated_at: new Date().toISOString()
            };
        }
    }

    validateANPCompliance(spec) {
        const issues = [];
        
        // Check for required ANP patterns
        if (!spec.info?.title) {
            issues.push('Missing required info.title');
        }
        
        if (!spec.info?.version) {
            issues.push('Missing required info.version');
        }
        
        // Check for at least one path
        if (!spec.paths || Object.keys(spec.paths).length === 0) {
            issues.push('No paths defined');
        }
        
        // Check for proper response definitions
        for (const [path, pathItem] of Object.entries(spec.paths || {})) {
            for (const [method, operation] of Object.entries(pathItem)) {
                if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
                    if (!operation.responses || Object.keys(operation.responses).length === 0) {
                        issues.push(`No responses defined for ${method.toUpperCase()} ${path}`);
                    }
                }
            }
        }
        
        return {
            compliant: issues.length === 0,
            issues: issues
        };
    }

    async validateAllToolsOpenAPI() {
        const tools = this.getAutoWeaveToolsAsOpenAPI();
        const results = [];
        
        for (const tool of tools) {
            const validation = await this.validateOpenAPISpec(tool.openapi, tool.name);
            results.push({
                tool_name: tool.name,
                ...validation
            });
        }
        
        return results;
    }

    async validateExternalAgentOpenAPI(agentId) {
        const agent = this.externalAgents.get(agentId);
        
        if (!agent) {
            throw new Error(`External agent ${agentId} not found`);
        }
        
        const results = [];
        
        // Validate each tool's OpenAPI spec
        for (const tool of agent.tools || []) {
            if (tool.openapi) {
                const validation = await this.validateOpenAPISpec(tool.openapi, `${agentId}/${tool.name}`);
                results.push({
                    tool_name: tool.name,
                    ...validation
                });
            }
        }
        
        return results;
    }

    async initializeExternalAgentDiscovery() {
        try {
            // Get external ANP registries from config
            const registries = this.config.externalANPRegistries || [];
            
            for (const registry of registries) {
                try {
                    await this.discoverExternalAgents(registry);
                } catch (error) {
                    this.logger.warn(`Failed to discover agents from ${registry}:`, error.message);
                }
            }
            
            this.logger.info(`Discovered ${this.externalAgents.size} external agents`);
            
        } catch (error) {
            this.logger.error('Failed to initialize external agent discovery:', error);
        }
    }

    async discoverExternalAgents(registryUrl) {
        try {
            // Query registry for available agents
            const response = await fetch(`${registryUrl}/agents`);
            const agents = await response.json();
            
            for (const agent of agents) {
                // Get full agent card
                const agentResponse = await fetch(`${agent.url}/agent`);
                const agentCard = await agentResponse.json();
                
                this.externalAgents.set(agent.id, {
                    ...agentCard,
                    registry_url: registryUrl,
                    discovered_at: new Date().toISOString()
                });
                
                this.logger.debug(`Discovered external agent: ${agent.id}`);
            }
            
        } catch (error) {
            this.logger.error(`Failed to query registry ${registryUrl}:`, error);
            throw error;
        }
    }
}

module.exports = { ANPServer };