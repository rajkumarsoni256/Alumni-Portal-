# JECRC Community Platform — Backend Foundation (Phase 0)

A scalable, maintainable, and production-ready modular monolith backend for the **JECRC Community Platform** (Alumni/Student Community Platform for JECRC University).

---

## 🚀 Tech Stack

- **Java**: 21
- **Framework**: Spring Boot 3.3.4 (Spring Web, Spring Data JPA, Spring Validation, Spring Boot Actuator)
- **Database**: PostgreSQL
- **Migration Tool**: Flyway
- **Build Tool**: Apache Maven
- **Boilerplate Reduction**: Lombok
- **Testing**: JUnit 5, Spring Boot Test, H2 Database (for testing profile)

---

## 📁 Package Structure

```
com.jecrc.community
├── CommunityApplication.java      # Application main entry point
├── config                         # Global configuration (CORS, JPA, Web)
│   └── CorsConfig.java
└── common                         # Cross-cutting foundational utilities
    ├── domain                     # Base JPA audit entity (createdAt, updatedAt in UTC)
    │   └── BaseAuditEntity.java
    ├── exception                  # Centralized Exception Hierarchy & @RestControllerAdvice
    │   ├── BaseException.java
    │   ├── BadRequestException.java
    │   ├── ConflictException.java
    │   ├── ErrorCode.java
    │   ├── ForbiddenException.java
    │   ├── GlobalExceptionHandler.java
    │   ├── InternalServerErrorException.java
    │   ├── ResourceNotFoundException.java
    │   └── UnauthorizedException.java
    ├── response                   # Standardized API Wrappers
    │   ├── ApiErrorResponse.java
    │   └── ApiResponse.java
    ├── util                       # Date/Time & helper utilities
    │   └── DateTimeUtils.java
    └── validation                 # Common validation helpers
```

---

## ⚙️ Environment Variables & Configuration

The application uses Spring Boot profiles (`dev`, `test`, `prod`). Sensitive parameters are injected via environment variables and never hardcoded into source code.

| Environment Variable | Description | Default (Dev Profile) |
| :--- | :--- | :--- |
| `DB_URL` | PostgreSQL JDBC Connection URL | `jdbc:postgresql://localhost:5432/jecrc_community` |
| `DB_USERNAME` | PostgreSQL Database Username | `postgres` |
| `DB_PASSWORD` | PostgreSQL Database Password | `postgres` |
| `FRONTEND_URL` | Configurable Allowed CORS Origin | `http://localhost:5173` |
| `PORT` | Server Port | `8080` |

---

## 🛠️ PostgreSQL Setup & Migration

1. Create a local PostgreSQL database:
   ```sql
   CREATE DATABASE jecrc_community;
   ```
2. Set `spring.jpa.hibernate.ddl-auto` is locked to `validate` across all profiles. Database schema generation is strictly managed by **Flyway**.
3. Migration scripts reside under `src/main/resources/db/migration/`.

---

## 🏃 Running the Application

### 1. Development Profile (`dev`)
Set environment variables (optional if using local default postgres instance):
```bash
# Windows PowerShell
$env:DB_URL="jdbc:postgresql://localhost:5432/jecrc_community"
$env:DB_USERNAME="postgres"
$env:DB_PASSWORD="your_password"
$env:FRONTEND_URL="http://localhost:5173"

mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### 2. Running Tests (`test`)
The `test` profile uses an in-memory PostgreSQL-compatible H2 database so test suites run independently without requiring external database services:
```bash
mvn clean test
```

### 3. Production Profile (`prod`)
```bash
mvn clean package -DskipTests
java -jar target/community-backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

---

## 🏥 Health Endpoint Check

Spring Boot Actuator health endpoint is available at:

```
GET http://localhost:8080/actuator/health
```

**Response:**
```json
{
  "status": "UP"
}
```

---

## 🌐 API Guidelines & Conventions

- **API Base Path Prefix**: All business modules in subsequent phases will follow `/api/v1/...`
- **Timezone**: All internal backend timestamps use **UTC** (`java.time.Instant`).
- **Success Response Structure**:
  ```json
  {
    "success": true,
    "message": "Operation successful",
    "data": { ... },
    "timestamp": "2026-08-13T10:30:00Z"
  }
  ```
- **Error Response Structure**:
  ```json
  {
    "success": false,
    "message": "Resource not found",
    "errorCode": "RESOURCE_NOT_FOUND",
    "timestamp": "2026-08-13T10:30:00Z",
    "path": "/api/v1/example"
  }
  ```
- **Validation Error Structure**:
  ```json
  {
    "success": false,
    "message": "Validation failed",
    "errorCode": "VALIDATION_ERROR",
    "timestamp": "2026-08-13T10:30:00Z",
    "path": "/api/v1/example",
    "errors": {
      "email": "Invalid email address"
    }
  }
  ```
