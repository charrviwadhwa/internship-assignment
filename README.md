

# Finance Dashboard Backend

This is a clean, role-based backend designed to handle financial data without the headaches. I built it using **Node.js**, **Express**, and **Neon PostgreSQL** to ensure it's fast, secure, and actually handles real-world scenarios like rounding errors and accidental deletions.

## What it actually does

* **Smart Permissions**: Access is strictly controlled. I set up three tiers: `ADMIN` (Full control), `ANALYST` (Can see data and insights), and `VIEWER` (Read-only access to the dashboard).
* **Deep Analytics**: The dashboard isn't just a list; it’s an engine. It automatically calculates total income vs. expenses, breaks down spending by category, shows recent activity snapshots, and tracks monthly trends.
* **Safety First (Soft Deletes)**: In finance, deleting data permanently is risky. If an Admin "deletes" a transaction, it’s just hidden from the app via a `deleted_at` timestamp. This keeps a permanent audit trail for peace of mind.
* **Math Accuracy**: JavaScript is notoriously bad at math with decimals (like 0.1 + 0.2). To fix this, I stored all currency values as high-precision strings so the totals are always 100% accurate.
* **Speed & Scalability**: 
    * **Parallel Queries**: The dashboard uses `Promise.all` to fetch totals, categories, and trends simultaneously, making it feel instant.
    * **Pagination**: To prevent the app from slowing down as the database grows, I added `limit` and `offset` logic to all record listings.
    * **Search**: Built-in search lets you filter through transactions by category or description in seconds.

## The Tech Behind It

* **Language**: Node.js 
* **Database**: Neon PostgreSQL (Serverless & fast)
* **ORM**: Drizzle (Keeps the code clean and SQL-like)
* **Security**: JWT for stateless logins, Bcrypt for password hashing, and **Rate Limiting** to stop bots from spamming the auth or API endpoints.

## Why I made these choices

### 1. Shared Visibility
I decided that Viewers and Analysts should see the "big picture." Even if they didn't create the records, they can see the organization's total health and trends. Admins remain the only ones allowed to actually change the numbers.

### 2. Defensive Engineering
By using Soft Deletes and Rate Limiting, the system is protected against both accidental human error (deleting important data) and malicious intent (brute-force login attempts).

---

## Setup and Installation

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Set your Secrets**: Create a `.env` file in the root:
    ```env
    DATABASE_URL=your_neon_postgresql_url
    JWT_SECRET=your_secure_random_string
    PORT=3000
    ```
3.  **Sync the Database**: Push the schema structure to Neon:
    ```bash
    npx drizzle-kit push
    ```
4.  **Run Server**:
    ```bash
    node src/index.js
    ```

---

## API Documentation
[Click here to view the API Documentation](https://documenter.getpostman.com/view/37710462/2sBXiqE8cX)

### Authentication
| Endpoint | Method | Body | Description |
| :--- | :--- | :--- | :--- |
| `/auth/register` | POST | `{email, password, role}` | Create a new user account |
| `/auth/login` | POST | `{email, password}` | Returns JWT and user role |

### Finance Records
| Endpoint | Method | Role Required | Description |
| :--- | :--- | :--- | :--- |
| `/api/transactions` | POST | ADMIN | Create a new financial entry |
| `/api/transactions` | GET | ANY | List records (Supports `?page=1&limit=10&search=X`) |
| `/api/transactions/:id`| PATCH | ADMIN | Update an existing record |
| `/api/transactions/:id`| DELETE | ADMIN | Soft-delete a specific record |
| `/api/dashboard` | GET | ANY | Get Totals, Categories, Recent Activity, and Trends |

---

## Project Structure
```text
├── src/
│   ├── controllers/   # The "brains" (Auth, CRUD, & Dashboard Aggregation)
│   ├── db/            # Database connection & Drizzle Schema
│   ├── middleware/    # Security guards (JWT & Role-based checks)
│   └── index.js       # Main entry point, Rate limiting, & Route definitions
├── .env               # Configuration
├── drizzle.config.js  # ORM configuration
└── package.json       # Dependencies & Scripts
```