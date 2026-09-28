const apiBaseUrl =
  (window.__APP_CONFIG__ && window.__APP_CONFIG__.API_URL) ||
  "http://localhost:5000/api";

const studentForm = document.getElementById("studentForm");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const nameInput = document.getElementById("name");
const ageInput = document.getElementById("age");
const courseInput = document.getElementById("course");
const emailInput = document.getElementById("email");
const tableBody = document.getElementById("studentTableBody");
const searchInput = document.getElementById("searchInput");
const statusMessage = document.getElementById("statusMessage");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");

let students = [];
let editingStudentId = null;

function showMessage(text, type = "success") {
  statusMessage.textContent = text;
  statusMessage.className = `status-message ${type}`;
}

function clearMessage() {
  statusMessage.textContent = "";
  statusMessage.className = "status-message";
}

function setLoading(isLoading) {
  loadingState.classList.toggle("hidden", !isLoading);
}

function renderStudents(filteredStudents) {
  tableBody.innerHTML = "";

  if (!filteredStudents.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  filteredStudents.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student.id}</td>
      <td>${student.name}</td>
      <td>${student.age}</td>
      <td>${student.course}</td>
      <td>${student.email}</td>
      <td>
        <div class="action-group">
          <button type="button" class="edit-btn" data-id="${student.id}">Edit</button>
          <button type="button" class="delete-btn" data-id="${student.id}">Delete</button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function getFilteredStudents() {
  const query = searchInput.value.trim().toLowerCase();

  if (!query) {
    return students;
  }

  return students.filter((student) => {
    return (
      student.name.toLowerCase().includes(query) ||
      student.course.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query)
    );
  });
}

async function fetchStudents() {
  setLoading(true);
  clearMessage();

  try {
    const response = await fetch(`${apiBaseUrl}/students`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to load students.");
    }

    students = Array.isArray(result.data) ? result.data : [];
    renderStudents(getFilteredStudents());
  } catch (error) {
    console.error(error);
    showMessage(error.message || "Unable to load students.", "error");
    emptyState.classList.remove("hidden");
  } finally {
    setLoading(false);
  }
}

function resetForm() {
  studentForm.reset();
  editingStudentId = null;
  formTitle.textContent = "Add Student";
  submitBtn.textContent = "Add Student";
  cancelBtn.classList.add("hidden");
}

function fillForm(student) {
  editingStudentId = student.id;
  nameInput.value = student.name;
  ageInput.value = student.age;
  courseInput.value = student.course;
  emailInput.value = student.email;
  formTitle.textContent = "Update Student";
  submitBtn.textContent = "Update Student";
  cancelBtn.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateForm() {
  const name = nameInput.value.trim();
  const age = ageInput.value.trim();
  const course = courseInput.value.trim();
  const email = emailInput.value.trim();

  if (!name || name.length < 2) {
    throw new Error("Name must be at least 2 characters long.");
  }

  const ageNumber = Number(age);
  if (!Number.isInteger(ageNumber) || ageNumber < 1 || ageNumber > 120) {
    throw new Error("Age must be a whole number between 1 and 120.");
  }

  if (!course || course.length < 2) {
    throw new Error("Course is required.");
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  return {
    name,
    age: ageNumber,
    course,
    email,
  };
}

async function createStudent(payload) {
  const response = await fetch(`${apiBaseUrl}/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to add student.");
  }

  return result;
}

async function updateStudent(studentId, payload) {
  const response = await fetch(`${apiBaseUrl}/students/${studentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to update student.");
  }

  return result;
}

async function deleteStudent(studentId) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this student?",
  );

  if (!confirmed) {
    return;
  }

  const response = await fetch(`${apiBaseUrl}/students/${studentId}`, {
    method: "DELETE",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Unable to delete student.");
  }

  return result;
}

studentForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const payload = validateForm();

    if (editingStudentId) {
      await updateStudent(editingStudentId, payload);
      showMessage("Student updated successfully.", "success");
    } else {
      await createStudent(payload);
      showMessage("Student added successfully.", "success");
    }

    resetForm();
    await fetchStudents();
  } catch (error) {
    console.error(error);
    showMessage(error.message || "Something went wrong.", "error");
  }
});

cancelBtn.addEventListener("click", () => {
  resetForm();
  clearMessage();
});

searchInput.addEventListener("input", () => {
  renderStudents(getFilteredStudents());
});

tableBody.addEventListener("click", async (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const studentId = Number(target.dataset.id);

  if (!studentId) {
    return;
  }

  const student = students.find((item) => item.id === studentId);

  if (!student) {
    return;
  }

  if (target.classList.contains("edit-btn")) {
    fillForm(student);
    return;
  }

  if (target.classList.contains("delete-btn")) {
    try {
      await deleteStudent(studentId);
      showMessage("Student deleted successfully.", "success");
      await fetchStudents();
    } catch (error) {
      console.error(error);
      showMessage(error.message || "Unable to delete student.", "error");
    }
  }
});

fetchStudents();
