# Student Management System

A complete full-stack Student Management System built with HTML, CSS, JavaScript, Node.js, Express.js, mysql2, and Aiven MySQL. The frontend is a static Vercel site, and the backend is a Vercel serverless Express app.

## Technologies

- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js + Express.js
- Database: Aiven MySQL
- ORM/driver: mysql2
- Environment variables: dotenv
- Deployment: Vercel + Aiven MySQL
- Version control: Git + GitHub

## Project structure

```text
student-management-system/
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── build-config.js
│   ├── package.json
│   └── config.example.js
├── backend/
│   ├── api/
│   │   └── index.js
│   ├── db.js
│   ├── package.json
│   └── vercel.json
├── sql/
│   └── database.sql
├── .env.example
├── .gitignore
├── README.md
├── package.json
└── .vercel/
```

## Aiven database setup

1. Create a MySQL service in Aiven.
2. Copy the database host, port, username, password, and database name.
3. Create the table using the SQL in [sql/database.sql](sql/database.sql).
4. Use the database name as `DB_NAME`.

Example SQL:

```sql
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  course VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL
);
```

## Environment variables

Create a root `.env` file locally using the template in [.env.example](.env.example):

```env
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
FRONTEND_URL=http://localhost:3000
```

For deployment on Vercel, add these to the backend project:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `FRONTEND_URL`

For the frontend project, add:

- `API_URL=https://your-backend-project.vercel.app/api`

## Local setup

1. Open a terminal in the project root.
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root from the example.
4. Fill in your Aiven values.
5. Start the backend:

```bash
npm run dev:backend
```

The backend runs on:

- `http://localhost:5000`

6. Start the frontend locally:

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs on:

- `http://localhost:3000`

## GitHub setup

1. Initialize Git:

```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a repository on GitHub.
3. Connect it:

```bash
git branch -M main
git remote add origin <your-github-url>
git push -u origin main
```

## Vercel backend deployment

1. Create a new Vercel project.
2. Import this repository.
3. Set the project root to the backend folder if using a monorepo setup, or deploy the backend folder as its own project.
4. Add the backend environment variables from your Aiven database and frontend origin.
5. Vercel will deploy the backend and expose a project URL like:

```text
https://your-backend-project.vercel.app
```

6. The API endpoints will be available at:

- `https://your-backend-project.vercel.app/api/health`
- `https://your-backend-project.vercel.app/api/students`

## Vercel frontend deployment

1. Create a second Vercel project.
2. Import the same repository, but set the project root to the `frontend` folder.
3. Create a Vercel environment variable named `API_URL`.
4. Set `API_URL` to your deployed backend URL ending in `/api`.

Example:

```text
API_URL=https://your-backend-project.vercel.app/api
```

5. Deploy the frontend project.
6. The frontend will read `API_URL` during the build and generate `config.js` automatically.

This approach avoids hardcoding localhost in production and avoids manual JavaScript edits after deployment.

## Connecting frontend to backend

The frontend uses a generated `config.js` file created during build time. The file contains:

```js
window.__APP_CONFIG__ = {
  API_URL: "https://your-backend-project.vercel.app/api",
};
```

The frontend reads this value and sends every request to the backend API.

## Testing

### Health check

```bash
curl http://localhost:5000/api/health
```

### Get students

```bash
curl http://localhost:5000/api/students
```

### Add student

```bash
curl -X POST http://localhost:5000/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","age":20,"course":"Computer Science","email":"alice@example.com"}'
```

### Update student

```bash
curl -X PUT http://localhost:5000/api/students/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Updated","age":21,"course":"Computer Science","email":"alice.updated@example.com"}'
```

### Delete student

```bash
curl -X DELETE http://localhost:5000/api/students/1
```

## Common errors

### Database connection errors

- Check that `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` are correct.
- Ensure the Aiven firewall allows your connection.
- Confirm the database service is running in Aiven.

### CORS errors

- Make sure `FRONTEND_URL` is set correctly in the backend environment.
- Ensure the frontend uses the deployed backend URL, not localhost in production.

### 404 API errors

- Confirm the backend route is `/api/students` and not `/students`.
- Check that the Vercel rewrite is configured correctly.

### Invalid input

- Ensure `name`, `age`, `course`, and `email` are all present and valid.
- `age` should be a whole number between 1 and 120.
- Email must match a valid email pattern.

## Production architecture

```text
Browser
↓
Vercel Frontend
↓
fetch()
↓
Vercel Backend
↓
Aiven MySQL
```

The user's laptop is not used as the production server. The app remains available as long as the Vercel projects and Aiven database are running.

## Security notes

- Never expose DB credentials in the frontend.
- Never commit `.env` files.
- Use parameterized SQL queries.
- Validate all incoming user input on the backend.
- Do not expose database connection details in API responses.
