const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { pool, initializeDatabase } = require("../db");

dotenv.config({ path: require("path").resolve(__dirname, "../../.env") });

const app = express();
const PORT = process.env.PORT || 5000;

initializeDatabase().catch((error) => {
  console.error("Startup database setup failed:", error);
});

const allowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === "string" && emailRegex.test(email.trim());
}

function isValidStudentPayload(payload, isUpdate = false) {
  if (!payload || typeof payload !== "object") {
    return "Invalid request payload.";
  }

  const { name, age, course, email } = payload;

  if (!isUpdate && !name && name !== "") {
    return "Name is required.";
  }

  if (name !== undefined && typeof name !== "string") {
    return "Name must be a string.";
  }

  if (name !== undefined && name.trim().length < 2) {
    return "Name must be at least 2 characters long.";
  }

  if (age === undefined || age === null || age === "") {
    return "Age is required.";
  }

  if (!Number.isInteger(Number(age)) || Number(age) < 1 || Number(age) > 120) {
    return "Age must be a whole number between 1 and 120.";
  }

  if (course === undefined || course === null || course === "") {
    return "Course is required.";
  }

  if (typeof course !== "string" || course.trim().length < 2) {
    return "Course must be a valid string.";
  }

  if (email === undefined || email === null || email === "") {
    return "Email is required.";
  }

  if (!isValidEmail(email)) {
    return "Please provide a valid email address.";
  }

  return null;
}

function sendError(res, statusCode, message) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Student Management API is running",
  });
});

app.get("/api/students", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM students ORDER BY id ASC");

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("GET /api/students error:", error);
    return sendError(res, 500, "Failed to fetch students.");
  }
});

app.post("/api/students", async (req, res) => {
  try {
    const validationError = isValidStudentPayload(req.body);

    if (validationError) {
      return sendError(res, 400, validationError);
    }

    const { name, age, course, email } = req.body;

    const [result] = await pool.query(
      "INSERT INTO students (name, age, course, email) VALUES (?, ?, ?, ?)",
      [name.trim(), Number(age), course.trim(), email.trim().toLowerCase()],
    );

    return res.status(201).json({
      success: true,
      message: "Student added successfully.",
      data: {
        id: result.insertId,
        name: name.trim(),
        age: Number(age),
        course: course.trim(),
        email: email.trim().toLowerCase(),
      },
    });
  } catch (error) {
    console.error("POST /api/students error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return sendError(res, 400, "This email is already in use.");
    }

    return sendError(res, 500, "Failed to add student.");
  }
});

app.put("/api/students/:id", async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return sendError(res, 400, "Invalid student ID.");
    }

    const validationError = isValidStudentPayload(req.body, true);

    if (validationError) {
      return sendError(res, 400, validationError);
    }

    const { name, age, course, email } = req.body;

    const [result] = await pool.query(
      "UPDATE students SET name = ?, age = ?, course = ?, email = ? WHERE id = ?",
      [
        name.trim(),
        Number(age),
        course.trim(),
        email.trim().toLowerCase(),
        studentId,
      ],
    );

    if (result.affectedRows === 0) {
      return sendError(res, 404, "Student not found.");
    }

    return res.status(200).json({
      success: true,
      message: "Student updated successfully.",
      data: {
        id: studentId,
        name: name.trim(),
        age: Number(age),
        course: course.trim(),
        email: email.trim().toLowerCase(),
      },
    });
  } catch (error) {
    console.error("PUT /api/students/:id error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return sendError(res, 400, "This email is already in use.");
    }

    return sendError(res, 500, "Failed to update student.");
  }
});

app.delete("/api/students/:id", async (req, res) => {
  try {
    const studentId = Number(req.params.id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
      return sendError(res, 400, "Invalid student ID.");
    }

    const [result] = await pool.query("DELETE FROM students WHERE id = ?", [
      studentId,
    ]);

    if (result.affectedRows === 0) {
      return sendError(res, 404, "Student not found.");
    }

    return res.status(200).json({
      success: true,
      message: "Student deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/students/:id error:", error);
    return sendError(res, 500, "Failed to delete student.");
  }
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return sendError(res, 400, "Invalid JSON payload.");
  }

  console.error("Unhandled error:", err);
  return sendError(res, 500, "Something went wrong on the server.");
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
