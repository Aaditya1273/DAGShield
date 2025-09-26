# DAGShield Backend Setup Guide

## Required API Endpoints

### 1. Node Data Endpoint
```
GET /api/nodes/{walletAddress}
```
**Response:**
```json
{
  "nodes": [
    {
      "id": "string",
      "name": "string", 
      "status": "active|inactive|maintenance|error",
      "performance": number,
      "rewards": number,
      "location": "string",
      "uptime": number,
      "threatsDetected": number,
      "lastSeen": "ISO date string",
      "version": "string",
      "metrics": {
        "cpuUsage": number,
        "memoryUsage": number,
        "diskUsage": number,
        "networkIn": number,
        "networkOut": number,
        "responseTime": number
      },
      "publicKey": "string",
      "stakingAmount": number,
      "validatedTransactions": number,
      "earnings24h": number,
      "region": "string"
    }
  ]
}
```

### 2. Node Statistics Endpoint
```
GET /api/nodes/stats/{walletAddress}
```
**Response:**
```json
{
  "totalNodes": number,
  "activeNodes": number,
  "avgPerformance": number,
  "totalRewards": number,
  "totalStaked": number,
  "totalThreats": number,
  "networkUptime": number
}
```

## Backend Technologies You Can Use:

### Node.js + Express
```javascript
// Example Express server
app.get('/api/nodes/:address', async (req, res) => {
  const { address } = req.params;
  // Fetch user's nodes from database
  const nodes = await getUserNodes(address);
  res.json({ nodes });
});
```

### Python + FastAPI
```python
# Example FastAPI server
@app.get("/api/nodes/{address}")
async def get_nodes(address: str):
    nodes = await get_user_nodes(address)
    return {"nodes": nodes}
```

### Next.js API Routes (Easiest)
Create files in `/pages/api/` or `/app/api/` directory
```javascript
// app/api/nodes/[address]/route.ts
export async function GET(request: Request, { params }: { params: { address: string } }) {
  const nodes = await fetchUserNodes(params.address);
  return Response.json({ nodes });
}
```

## Database Integration
You'll need to store:
- User wallet addresses
- Node information
- Performance metrics
- Rewards data
- Network statistics

## Blockchain Integration
Connect to your DAG network to fetch:
- Real node status
- Transaction validation data
- Staking information
- Network performance metrics
