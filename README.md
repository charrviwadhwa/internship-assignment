
# Finance Dashboard Backend

A role-based backend system built with Node.js (ESM), Express, and Neon PostgreSQL. This system manages financial transactions, user roles, and real-time dashboard analytics with a focus on data integrity and security.

## Key Features
* **Role-Based Access Control (RBAC)**: Custom middleware to enforce ADMIN, ANALYST, and VIEWER permissions.
* **Real-time Aggregation**: Dashboard summaries using SQL-level grouping and summation.
* **Data Reliability**: Soft-delete functionality and decimal-string precision for financial records.
* **Security**: JWT-based authentication, Bcrypt password hashing, and API Rate Limiting.
* **Modern Stack**: Fully asynchronous ESM implementation with Drizzle ORM.

## Tech Stack
* **Runtime**: Node.js (v18+)
* **Framework**: Express.js
* **Database**: Neon PostgreSQL (Serverless)
* **ORM**: Drizzle ORM
* **Security**: JSON Web Tokens (JWT), Bcrypt.js, Express-Rate-Limit

## Logical Assumptions and Trade-offs

### 1. Data Visibility Model
**Decision**: Implemented a Shared Visibility Model for read operations.
* **Reasoning**: In a corporate dashboard, Analysts and Viewers audit the organization's health. While only Admins can modify data, all authorized roles can view the global summary.
* **Trade-off**: This prioritizes organizational transparency over individual user silos.

### 2. Soft Deletion
**Decision**: Transactions are marked with a `deleted_at` timestamp rather than being hard-deleted.
* **Reasoning**: Financial records require an audit trail. Soft deletion prevents accidental data loss and allows for administrative recovery.

### 3. Financial Precision
**Decision**: Storing amounts as Decimal (mapped to Strings in JS).
* **Reasoning**: Using standard JavaScript Number (Float) for currency leads to rounding errors. String-based decimals ensure mathematical accuracy for balance calculations.

## Setup and Installation

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Environment Variables**: Create a `.env` file in the root:
    ```env
    DATABASE_URL=your_neon_postgresql_url
    JWT_SECRET=your_secure_random_string
    PORT=3000
    ```
3.  **Database Migration**: Sync the schema to the Neon instance:
    ```bash
    npx drizzle-kit push
    ```
4.  **Run Server**:
    ```bash
    node src/index.js
    ```

## API Documentation

### Authentication
| Endpoint | Method | Body | Description |
| :--- | :--- | :--- | :--- |
| `/auth/register` | POST | `{email, password, role}` | Create a new user account |
| `/auth/login` | POST | `{email, password}` | Returns JWT and user role |

### Finance Records
| Endpoint | Method | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `/api/transactions` | POST | ADMIN | Create a new financial entry |
| `/api/transactions` | GET | ANY | List records (Supports `?page=1&search=X`) |
| `/api/dashboard` | GET | ANY | Get Income/Expense/Balance summary |
| `/api/transactions/:id` | DELETE | ADMIN | Soft-delete a specific record |

## Project Structure
```text
├── src/
│   ├── controllers/   # Business logic (Auth & Finance)
│   ├── db/            # Database connection & Drizzle Schema
│   ├── middleware/    # Auth & Role-based guards
│   └── index.js       # Entry point & Route definitions
├── .env               # Configuration
├── drizzle.config.js  # ORM configuration
└── package.json       # Dependencies & Scripts
```