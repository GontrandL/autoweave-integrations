# AutoWeave Integrations API Documentation

## Overview

This document describes all API endpoints exposed by the AutoWeave Integrations module, including MCP, ANP, and kagent protocols.

## Base URLs

- **MCP Server**: `http://localhost:3002`
- **ANP Server**: `http://localhost:8083`
- **kagent API**: `http://localhost:3000/api/kagent`

## ANP (Agent Network Protocol) API

### Get Agent Card
```http
GET /agent
```

Query Parameters:
- `validate` (optional): Set to `true` to include OpenAPI validation results

Response:
```json
{
  "protocol_version": "v1",
  "agent_id": "autoweave-orchestrator",
  "name": "AutoWeave",
  "description": "AutoWeave: The Self-Weaving Agent Orchestrator",
  "version": "0.1.0",
  "capabilities": {
    "tools": [...],
    "supported_formats": ["json", "yaml"],
    "supported_protocols": ["anp", "mcp"],
    "deployment_targets": ["kubernetes", "kagent"]
  },
  "endpoints": {
    "tasks": "/agent/tasks",
    "capabilities": "/agent/capabilities",
    "health": "/health"
  }
}
```

### Create Task
```http
POST /agent/tasks
```

Request Body:
```json
{
  "input": "Create a file processing agent",
  "tools": ["file-system", "logging"],
  "agent_id": "custom-agent-id"
}
```

Response:
```json
{
  "task_id": "autoweave-task-1234567890-abc123",
  "input": "Create a file processing agent",
  "tools": ["file-system", "logging"],
  "agent_id": "custom-agent-id",
  "status": "created",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Get Task Status
```http
GET /agent/tasks/{task_id}
```

Response:
```json
{
  "task_id": "autoweave-task-1234567890-abc123",
  "status": "completed",
  "result": {...},
  "created_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:31:00Z"
}
```

### Get Task Steps
```http
GET /agent/tasks/{task_id}/steps
```

Response:
```json
{
  "task_id": "autoweave-task-1234567890-abc123",
  "steps": [
    {
      "step": 1,
      "name": "parse-input",
      "status": "completed",
      "started_at": "2024-01-15T10:30:00Z",
      "completed_at": "2024-01-15T10:30:10Z"
    }
  ],
  "current_step": 1
}
```

### Get Capabilities
```http
GET /agent/capabilities
```

Response:
```json
{
  "protocols": ["anp", "mcp"],
  "tools": [
    {
      "name": "create-agent",
      "description": "Create AI agents from natural language",
      "type": "core"
    }
  ],
  "integrations": ["kagent", "kubernetes", "openai"],
  "features": ["natural-language-agent-creation", "kubernetes-native-deployment"]
}
```

### Validate OpenAPI Specifications
```http
GET /agent/openapi/validate
```

Response:
```json
{
  "validated_at": "2024-01-15T10:30:00Z",
  "tools_total": 4,
  "tools_valid": 4,
  "tools_invalid": 0,
  "validation_results": [...]
}
```

### Validate Custom OpenAPI
```http
POST /agent/openapi/validate
```

Request Body:
```json
{
  "spec": {
    "openapi": "3.1.0",
    "info": {
      "title": "Custom API",
      "version": "1.0.0"
    },
    "paths": {...}
  },
  "source": "custom-tool"
}
```

### Validate External Agent
```http
GET /agent/external/{agent_id}/validate
```

Response:
```json
{
  "agent_id": "external-agent-123",
  "validated_at": "2024-01-15T10:30:00Z",
  "validation_results": [...]
}
```

## MCP (Model Context Protocol) API

### List Tools
```http
GET /mcp/v1/tools
```

Response:
```json
{
  "tools": [
    {
      "name": "create-agent",
      "description": "Create AI agents from natural language descriptions",
      "inputSchema": {...}
    }
  ]
}
```

### Execute Tool
```http
POST /mcp/v1/tools/{tool_name}
```

Request Body varies by tool.

Example for `create-agent`:
```json
{
  "description": "Create a file processing agent that monitors a directory"
}
```

### List Resources
```http
GET /mcp/v1/resources
```

Response:
```json
{
  "resources": [
    {
      "uri": "file:///templates/agent-template.yaml",
      "name": "Agent Template",
      "mimeType": "application/x-yaml"
    }
  ]
}
```

### Get Resource
```http
GET /mcp/v1/resources/{resource_uri}
```

## kagent API

### Get kagent Status
```http
GET /api/kagent/status
```

Response:
```json
{
  "success": true,
  "kagent": {
    "connected": true,
    "namespace": "default",
    "version": "1.0.0",
    "agents_deployed": 5
  }
}
```

### List kagent Tools
```http
GET /api/kagent/tools
```

Response:
```json
{
  "success": true,
  "count": 10,
  "tools": [
    {
      "name": "file-processor",
      "description": "Process files in a directory",
      "type": "batch",
      "capabilities": ["read", "write", "transform"],
      "status": "active",
      "namespace": "default"
    }
  ]
}
```

### Get Tool Details
```http
GET /api/kagent/tools/{name}
```

Response:
```json
{
  "success": true,
  "tool": {
    "metadata": {
      "name": "file-processor",
      "namespace": "default"
    },
    "spec": {
      "type": "batch",
      "description": "Process files in a directory"
    },
    "status": {
      "phase": "active"
    }
  }
}
```

### Create Custom Tool
```http
POST /api/kagent/tools
```

Request Body:
```json
{
  "metadata": {
    "name": "custom-tool",
    "namespace": "default"
  },
  "spec": {
    "type": "streaming",
    "description": "Custom streaming tool",
    "image": "custom-tool:latest",
    "capabilities": ["stream", "transform"]
  }
}
```

### Delete Tool
```http
DELETE /api/kagent/tools/{name}
```

### Deploy Agent
```http
POST /api/kagent/agents
```

Request Body:
```json
{
  "metadata": {
    "name": "my-agent",
    "namespace": "default"
  },
  "spec": {
    "description": "File processing agent",
    "tools": ["file-processor", "logger"],
    "workflow": [...]
  }
}
```

### Get Agent Status
```http
GET /api/kagent/agents/{name}
```

### Get Agent Logs
```http
GET /api/kagent/agents/{name}/logs
```

Query Parameters:
- `lines` (optional): Number of log lines to return
- `follow` (optional): Stream logs in real-time

### Delete Agent
```http
DELETE /api/kagent/agents/{name}
```

## Error Responses

All APIs use consistent error response format:

```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable

## Authentication

Currently, the APIs do not require authentication in development mode. In production:

- **ANP**: Uses API key authentication via `X-API-Key` header
- **MCP**: Uses bearer token authentication
- **kagent**: Inherits Kubernetes RBAC permissions

## Rate Limiting

- **ANP**: 100 requests per minute per IP
- **MCP**: 50 requests per minute per IP
- **kagent**: No rate limiting (relies on Kubernetes limits)

## WebSocket Endpoints

### ANP Task Updates
```
ws://localhost:8083/ws/tasks/{task_id}
```

Provides real-time updates for task execution.

### kagent Agent Logs
```
ws://localhost:3000/api/kagent/agents/{name}/logs/stream
```

Streams agent logs in real-time.