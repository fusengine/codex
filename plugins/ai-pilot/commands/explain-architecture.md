---
description: Analyze and explain software architecture with ASCII diagrams and pattern detection. Creates visual representations of system design.
---

# Explain Architecture

Analyze and visualize system architecture:

1. **Use Explore Agent**:
   > Use explore-codebase to map the complete system structure

2. **Identify Patterns**:
   - **Architectural Style**: (Monolith/Microservices/Serverless/JAMstack)
   - **Design Patterns**: (MVC/MVVM/Repository/Factory/Observer/etc.)
   - **Data Flow**: (Unidirectional/Bidirectional/Event-driven)
   - **Communication**: (REST/GraphQL/gRPC/WebSockets)

3. **Map Components**:
   - Entry points
   - Controllers/Routes
   - Services/Business logic
   - Data layer
   - External integrations

4. **Generate ASCII Diagrams**:
   ```
   ┌─────────────────────────────────────────┐
   │           CLIENT (Browser)              │
   └────────────┬────────────────────────────┘
                │ HTTP/REST
   ┌────────────▼────────────────────────────┐
   │         API Gateway/Router              │
   ├─────────────────────────────────────────┤
   │  ┌───────────┐  ┌────────┐  ┌────────┐ │
   │  │Controller │  │Service │  │ Model  │ │
   │  └─────┬─────┘  └───┬────┘  └───┬────┘ │
   └────────┼───────────┼──────────┼────────┘
            │           │          │
   ┌────────▼───────────▼──────────▼────────┐
   │         Database (PostgreSQL)           │
   └─────────────────────────────────────────┘
   ```

5. **Document Flow**:
   ```markdown
   ### Request Flow
   1. Client → API Gateway → Auth Middleware
   2. Route → Controller → Service Layer
   3. Service → Repository → Database
   4. Response ← Transform ← Validate ← Data
   ```

6. **Create Architecture Report**:
   ```markdown
   ## 🏗️  Architecture: [Project Name]

   ### Overview
   **Style**: [Architecture type]
   **Patterns**: [Detected patterns]
   **Tech Stack**: [Technologies]

   ### System Diagram
   [ASCII diagram]

   ### Component Breakdown
   #### Presentation Layer
   - [Components]

   #### Business Logic Layer
   - [Services]

   #### Data Layer
   - [Models/Repositories]

   ### Data Flow
   [Flow description with diagram]

   ### Dependencies
   - External: [APIs, services]
   - Internal: [Module relationships]

   ### Strengths
   - ✅ [Good architectural decision 1]

   ### Areas for Improvement
   - ⚠️  [Architectural concern 1]
   ```

**Arguments**:
- $ARGUMENTS focuses on specific subsystem

**Example Usage**:
- `/prompts:explain-architecture auth` → Focus on auth subsystem
- `/prompts:explain-architecture` → Complete system architecture
