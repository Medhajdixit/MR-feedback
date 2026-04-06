# API Reference - CampusFeedback+ 2.0

Complete API documentation for backend services.

**Base URL**: `http://localhost:3001/api`

---

## Authentication

### Get Nonce

Get a nonce for wallet signature.

```http
POST /auth/nonce
```

**Request Body:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response:**
```json
{
  "nonce": "Sign this message to authenticate with CampusFeedback+\nNonce: 1702901234567"
}
```

### Login

Login with wallet signature.

```http
POST /auth/login
```

**Request Body:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x...",
  "message": "Sign this message..."
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "profile": { ... },
    "preferences": { ... }
  }
}
```

### Verify Token

Verify JWT token validity.

```http
GET /auth/verify
Authorization: Bearer <token>
```

**Response:**
```json
{
  "valid": true,
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

---

## Feedback

### Submit Feedback

Submit new campus feedback.

```http
POST /feedback
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "The library needs more study spaces and better lighting...",
  "category": "Infrastructure",
  "isAnonymous": false,
  "image": "<base64_image_data>" // optional
}
```

**Response (Approved):**
```json
{
  "success": true,
  "feedback": {
    "id": 123,
    "txHash": "0x...",
    "status": "approved",
    "qualityBonus": 25
  }
}
```

**Response (Rejected):**
```json
{
  "success": false,
  "decision": "REJECT",
  "reason": "Content contains toxic language",
  "suggestions": [
    "Remove personal attacks",
    "Focus on constructive criticism"
  ]
}
```

### Get All Feedbacks

Retrieve feedbacks with filters.

```http
GET /feedback?category=Infrastructure&status=approved&limit=20&skip=0
```

**Query Parameters:**
- `category` (optional): Filter by category
- `status` (optional): Filter by status (approved, pending, implemented)
- `limit` (optional): Number of results (default: 20)
- `skip` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "feedbacks": [
    {
      "feedbackId": 123,
      "author": "0x...",
      "category": "Infrastructure",
      "contentHash": "Qm...",
      "aiScores": {
        "toxicity": 0.05,
        "sentiment": "positive",
        "constructiveness": 85,
        "qualityBonus": 25
      },
      "status": "approved",
      "isAnonymous": false,
      "votes": {
        "upvotes": 15,
        "downvotes": 2
      },
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150,
  "limit": 20,
  "skip": 0
}
```

### Get Feedback by ID

Retrieve specific feedback with full content.

```http
GET /feedback/:id
```

**Response:**
```json
{
  "feedbackId": 123,
  "author": "0x...",
  "category": "Infrastructure",
  "contentHash": "Qm...",
  "fullContent": "The library needs more study spaces...",
  "aiScores": { ... },
  "status": "approved",
  "votes": { ... },
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### Vote on Feedback

Upvote or downvote feedback.

```http
POST /feedback/:id/vote
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "support": true  // true = upvote, false = downvote
}
```

---

## Rating

### Submit Rating

Submit faculty or infrastructure rating.

```http
POST /rating
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "type": "faculty",
  "facultyAddress": "0x...",
  "dimensions": [8, 9, 7, 8, 9],  // 5 dimensions, 1-10 scale
  "comment": "Excellent teaching methodology...",
  "isAnonymous": false
}
```

**Response:**
```json
{
  "success": true,
  "rating": {
    "id": 456,
    "txHash": "0x...",
    "averageRating": 8.2
  }
}
```

### Get Faculty Ratings

Retrieve all ratings for a faculty member.

```http
GET /rating/faculty/:address
```

**Response:**
```json
{
  "faculty": "0x...",
  "averageRating": 8.2,
  "totalRatings": 45,
  "dimensionAverages": [8.1, 8.5, 7.9, 8.0, 8.3],
  "ratings": [
    {
      "ratingId": 456,
      "dimensions": [8, 9, 7, 8, 9],
      "comment": "...",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## User

### Get User Profile

Retrieve user profile and stats.

```http
GET /user/:address
Authorization: Bearer <token>
```

**Response:**
```json
{
  "address": "0x...",
  "profile": {
    "bio": "Computer Science student",
    "avatar": "https://...",
    "isPublic": true
  },
  "stats": {
    "totalFeedbacks": 25,
    "totalRatings": 10,
    "points": 5000,
    "badges": 5,
    "reputation": 850
  }
}
```

### Update Profile

Update user profile information.

```http
PUT /user/profile
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "bio": "Updated bio",
  "isPublic": true,
  "preferences": {
    "notifications": true,
    "emailUpdates": false
  }
}
```

### Get User Stats

Get detailed user statistics.

```http
GET /user/:address/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalFeedbacks": 25,
  "approvedFeedbacks": 23,
  "totalRatings": 10,
  "points": 5000,
  "badges": 5,
  "reputation": 850,
  "rank": 15,
  "consecutiveDays": 12
}
```

### Get User Points

Get user point balance and history.

```http
GET /user/:address/points
Authorization: Bearer <token>
```

**Response:**
```json
{
  "balance": 5000,
  "totalEarned": 6500,
  "totalSpent": 1500,
  "recentTransactions": [
    {
      "type": "earned",
      "amount": 150,
      "reason": "Quality feedback submission",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## Moderation

### Get Moderation History

Retrieve moderation history for user's content.

```http
GET /moderation/history?limit=20&skip=0
Authorization: Bearer <token>
```

**Response:**
```json
{
  "history": [
    {
      "contentId": 123,
      "contentType": "feedback",
      "decision": "APPROVE",
      "scores": {
        "toxicity": 0.05,
        "sentiment": 0.85,
        "constructiveness": 85
      },
      "reason": "High quality constructive feedback",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 50
}
```

### Submit Appeal

Appeal a moderation decision.

```http
POST /moderation/appeal
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "contentId": 123,
  "reason": "I believe this decision was incorrect because..."
}
```

---

## Governance

### Get Proposals

Retrieve governance proposals.

```http
GET /governance/proposals?status=Active&limit=20
```

**Query Parameters:**
- `status` (optional): Filter by status (Active, Passed, Rejected, Executed)
- `limit` (optional): Number of results

**Response:**
```json
{
  "proposals": [
    {
      "id": 1,
      "proposalType": "Feature Request",
      "title": "Add mobile app support",
      "description": "...",
      "proposer": "0x...",
      "status": "Active",
      "forVotes": 150,
      "againstVotes": 20,
      "abstainVotes": 5,
      "votingEndsAt": "2024-01-20T00:00:00Z",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Create Proposal

Create a new governance proposal.

```http
POST /governance/proposals
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "proposalType": 1,  // 0-5 (PolicyChange, FeatureRequest, etc.)
  "title": "Add mobile app support",
  "description": "Detailed proposal description..."
}
```

### Vote on Proposal

Cast vote on a proposal.

```http
POST /governance/proposals/:id/vote
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "support": true,  // true = for, false = against
  "reason": "I support this because..."
}
```

---

## Error Responses

All endpoints may return these error responses:

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "details": ["Field 'content' is required"]
}
```

### 401 Unauthorized
```json
{
  "error": "Access token required"
}
```

### 403 Forbidden
```json
{
  "error": "Verified student status required",
  "message": "Please complete student verification first"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error"
}
```

---

## Rate Limiting

- **Rate Limit**: 100 requests per 15 minutes per IP
- **Headers**:
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: 95
  - `X-RateLimit-Reset`: 1702901234

---

## Pagination

All list endpoints support pagination:

```http
GET /endpoint?limit=20&skip=40
```

- `limit`: Items per page (max: 100)
- `skip`: Number of items to skip

---

## Webhooks

Coming soon: Real-time event notifications via webhooks.

---

For more information, see the [main documentation](README.md).
