
# Expense Management System using MERN Stack



## Project Description:

    The Expense Management System is a web-based application designed to assist users in tracking and managing their daily expenses. This system is built using the MERN stack (MongoDB, Express.js, React.js, and Node.js) to create a scalable, responsive, and user-friendly application.

## Objectives:

    1. Simplify expense tracking for individuals and organizations.

    2. Provide detailed insights into spending patterns to enable better financial management.

    3. Offer a platform for users to create, update, and delete expenses and categories.

    4. Generate comprehensive reports based on user-defined time periods and categories.

## Features


- User Authentication and Authorization:

    Allow users to sign up and log in to their personal accounts using secure authentication mechanisms.
Implement role-based access control for administrative tasks.

- Expense and Category Management:

    Enable users to create, update, and delete expense entries and categories.
Track expenses by date, category, and description.
Support attaching receipts or other relevant documents to expense entries.

- Dashboard and Reporting:

    Provide a visual dashboard displaying an overview of the user's expenses, including total expenses, expenses by category, and recent transactions.

    Generate reports based on selected date ranges and categories, displaying pie charts and bar graphs to help users understand their spending patterns.
    

- Responsive User Interface:

    Design a clean, responsive user interface that works seamlessly across desktop, tablet, and mobile devices.
    
    Utilize React.js for building reusable UI components and managing state effectively.


## Technical Architecture:

- Frontend:

    Utilize React.js for building the user interface, tsparticle library for awesome background effect and used other libraries like unique-names-generator, react-datepicker, moment

    Implement responsive design using CSS frameworks like Bootstrap and Material-Icons.

- Backend:

    Use Node.js and Express.js to build a RESTful API for handling client requests and serving as the application's backend.

    Implement authentication and authorization using JSON Web Tokens (JWT) and middleware to protect endpoints.

- Database:

    Store all data, including user information, expense entries, and categories, in MongoDB, a NoSQL database.

    Implement Mongoose ORM for schema definition and validation.

- Deployment:

    Deploy the application to a cloud provider like AWS and render.
    frontend has deployed on AWS and backend on Render.

    Set up Continuous Integration and Continuous Deployment (CI/CD) pipelines for automated builds and deployments.
## Run Locally

Go to the project directory

```bash
  cd Expense-Tracker-App
```

Go to the frontend directory and Install dependencies

```bash
  cd frontend
```
```bash
  npm install
```

Go to the backend directory and Install dependencies

```bash
  cd backend
```
```bash
  npm install
```

Start the backend API in a terminal

```bash
  cd backend
  npm run dev
```

Start the frontend server in a second terminal

```bash
  cd frontend
  npm start
```

The frontend connects to `http://localhost:5000` in development. Set
`REACT_APP_API_URL` in a frontend environment file to use a different API URL.
Production builds use the existing deployed API URL unless
`REACT_APP_API_URL` is set.

## Environment Variables

The backend loads `backend/config/secrets.env` before `backend/config/config.env`.
Use the tracked `backend/.env.example` as the template for the local secrets file;
never commit real credentials.

## AI Financial Insights

The dashboard's on-demand insights use NVIDIA NIM's hosted OpenAI-compatible chat
completions endpoint with the `deepseek-ai/deepseek-v4.1-flash` model. NVIDIA's
[current model list](https://integrate.api.nvidia.com/v1/models) lists available
hosted model IDs, and the [NIM API reference](https://docs.nvidia.com/nim/large-language-models/latest/reference/api-reference.html)
documents chat completions. The server requests a JSON response and validates the exact
`summary`, `observations`, `suggestions`, and `positivePoints` response shape.
Availability, quotas, and pricing depend on NVIDIA's current offering and your
account; verify them before deployment and do not assume every hosted endpoint is
free. The feature sends only aggregated income, expense, category, and trend totals,
not transaction titles, descriptions, account IDs, or credentials.

### Local setup and testing

1. Create an NVIDIA API key in your NVIDIA developer account.
2. Set `NVIDIA_API_KEY` and `NVIDIA_MODEL_ID` in `backend/config/config.env` or
   `backend/config/secrets.env`. Both files are ignored by Git; the secrets file is
   loaded first. The backend reads the key from the environment and never exposes it
   to the frontend:

   ```env
   NVIDIA_API_KEY=your-server-side-nvidia-api-key
   NVIDIA_MODEL_ID=deepseek-ai/deepseek-v4.1-flash
   MONGO_URL=your-mongodb-connection-string
   PORT=5000
   JWT_SECRET=replace-with-at-least-32-random-characters
   ```

   Set `NVIDIA_MODEL_ID` to a text-generation model currently listed by NVIDIA that
   supports JSON mode. Never commit an API key or expose it through a `REACT_APP_`
   variable. Generate a strong JWT secret with
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
3. Start the backend with `cd backend && npm run dev`, then start the frontend in
   another terminal with `cd frontend && npm start`. For local development the
   frontend uses `http://localhost:5000`; set `REACT_APP_API_URL` in the frontend
   environment if the backend is elsewhere.
4. Sign in to receive a JWT, then test the protected endpoint using that token:

   ```bash
   curl -X POST http://localhost:5000/api/v1/ai/insights \
     -H "Authorization: Bearer YOUR_LOGIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"frequency":"30"}'
   ```

   The endpoint accepts `frequency` values `7`, `30`, `365`, or `custom`; custom
   requests also require `startDate` and `endDate` in `YYYY-MM-DD` format.
5. The current repository uses a separate React frontend and Express backend
   (README deployment notes reference AWS for the frontend and Render for the API);
   it does not contain Vercel deployment configuration. If hosting the frontend on
   Vercel, set `REACT_APP_API_URL` to the public backend URL in the Vercel frontend
   project's environment settings and redeploy the frontend. Set `NVIDIA_API_KEY`,
   `NVIDIA_MODEL_ID`, `JWT_SECRET`, `MONGO_URL`, and `PORT` only in the backend service's environment
   settings—never in Vercel's frontend variables or a `REACT_APP_` variable. The
   existing long-running Express server is not configured as a Vercel Function;
   keep it on a compatible backend host or separately adapt it to Vercel's
   serverless runtime before moving the API there.
6. After configuring the backend secret, redeploy/restart the backend, sign in
   again to get a fresh token, and request insights from the dashboard. Provider
   requests time out after 25 seconds and retry transient 502/503/504 responses at
   most twice with exponential backoff and jitter; quota, authentication, and
   malformed-request errors are not automatically retried. Successful insights are
   cached in backend memory for up to 15 minutes by user, period, and aggregated-data
   hash; changed data invalidates the prior entry. Fresh provider requests have a
   per-user 60-second cooldown, while valid cache hits remain available. Concurrent
   identical requests are coalesced. The bounded in-memory cache clears on backend
   restart and is not shared across multiple backend instances.

Run backend unit tests with `cd backend && npm test`. A successful live AI response
requires a valid server-side NVIDIA API key, an available selected model, and an
authenticated account with transactions.


## Tech Stack

**Client:** React, Redux, react-bootstrap, Material Icons, tsparticles

**Server:** Node, Express

**Database:** MongoDB







## Demo

Insert gif or link to demo
