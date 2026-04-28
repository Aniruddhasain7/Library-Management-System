<<<<<<< HEAD
let role = sessionStorage.getItem("role") || null;

function showTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(t => t.style.display = "none");
    const el = document.getElementById(tabId);
    if (el) el.style.display = "block";
}
window.showTab = showTab;

async function loginRole(userRole) {
    const username = document.getElementById(`${userRole}Username`).value.trim();
    const password = document.getElementById(`${userRole}Password`).value.trim();
    if (!username || !password) return alert("Enter all fields");

    try {
        const res = await fetch(`/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, role: userRole })
        });
        const data = await res.json();
        alert(data.status);

        if (res.ok && data.status.includes("successful")) {
            role = userRole;
            sessionStorage.setItem("role", role);
            document.querySelector(".auth-section").style.display = "none";
            if (role === "admin") document.querySelector(".admin-section").style.display = "block";
            else document.querySelector(".student-section").style.display = "block";

            loadBooks();
            loadStudents();
            loadBookRequests();
            loadIssueReport();
            if (role === "student") loadMyIssuedBooks();
        }
    } catch (err) {
        alert("Error: " + err.message);
    }
}
window.loginRole = loginRole;

async function signupRole(userRole) {
    const username = document.getElementById(`${userRole}Username`).value.trim();
    const password = document.getElementById(`${userRole}Password`).value.trim();
    if (!username || !password) return alert("Enter all fields");

    try {
        const res = await fetch(`/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, role: userRole })
        });
        const data = await res.json();
        alert(data.status);
    } catch (err) {
        alert("Error: " + err.message);
    }
}
window.signupRole = signupRole;

async function logout() {
    try {
        const res = await fetch('/logout', { method: 'POST' });
        const data = await res.json();
        alert(data.status);
        sessionStorage.clear();
        location.reload();
    } catch (err) {
        alert("Logout failed: " + err.message);
    }
}
window.logout = logout;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("logoutBtn")?.addEventListener("click", logout);
    document.getElementById("logoutBtnStudent")?.addEventListener("click", logout);

    if (role) {
        document.querySelector(".auth-section").style.display = "none";
        if (role === "admin") document.querySelector(".admin-section").style.display = "block";
        else document.querySelector(".student-section").style.display = "block";
        loadBooks();
        loadStudents();
        loadBookRequests();
        loadIssueReport();
        if (role === "student") loadMyIssuedBooks();
    }
});

async function loadBooks() {
    const res = await fetch("/books");
    const data = await res.json();
    renderTable("bookReportTable", data);
    renderTable("studentBookTable", data, true);
}

async function renderTable(tableId, data, studentView = false) {
    const tbody = document.getElementById(tableId)?.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach(book => {
        const tr = document.createElement("tr");
        let actions = "";
        if (role === "admin" && tableId === "bookReportTable") {
            actions = `<button onclick="editBook(${book.id}, '${book.title}', '${book.author}', ${book.copies})">Edit</button>
                       <button onclick="deleteBook(${book.id})">Delete</button>`;
        } else if (studentView) {
            actions = `<button onclick="requestBook(${book.id})">Request</button>`;
        }
        tr.innerHTML = `<td>${book.id}</td><td>${book.title}</td><td>${book.author}</td><td>${book.copies}</td><td>${actions}</td>`;
        tbody.appendChild(tr);
    });
}

document.getElementById("addBookForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const id = document.getElementById("bookId").value;
    const title = document.getElementById("title").value.trim();
    const author = document.getElementById("author").value.trim();
    const copies = document.getElementById("copies").value.trim();
    if (!title || !author || !copies) return alert("Enter all fields");
    const method = id ? "PUT" : "POST";
    const url = id ? `/books/${id}` : "/books";
    await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, copies })
    });
    document.getElementById("addBookForm").reset();
    document.getElementById("bookId").value = "";
    loadBooks();
});

function editBook(id, title, author, copies) {
    document.getElementById("bookId").value = id;
    document.getElementById("title").value = title;
    document.getElementById("author").value = author;
    document.getElementById("copies").value = copies;
    document.getElementById("saveBtn").innerText = "Update Book";
}
window.editBook = editBook;

async function deleteBook(id) {
    if (!confirm("Delete this book?")) return;
    await fetch(`/books/${id}`, { method: "DELETE" });
    loadBooks();
}
window.deleteBook = deleteBook;

async function addStudent() {
    const username = document.getElementById("newStudentUsername").value.trim();
    const password = document.getElementById("newStudentPassword").value.trim();
    if (!username || !password) return alert("Enter all fields");
    await fetch("/addStudent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    alert("Student added");
    document.getElementById("newStudentUsername").value = "";
    document.getElementById("newStudentPassword").value = "";
    loadStudents();
}
window.addStudent = addStudent;

async function loadStudents() {
    const res = await fetch("/students");
    const data = await res.json();
    const tbody = document.getElementById("studentReportTable")?.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach(s => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${s.id}</td><td>${s.username}</td><td>${s.role || 'student'}</td>`;
        tbody.appendChild(tr);
    });
}

async function requestBook(bookId) {
    const res = await fetch("/requestBook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_id: bookId })
    });
    const data = await res.json();
    alert(data.status);
}
window.requestBook = requestBook;

async function loadBookRequests() {
    const res = await fetch("/bookRequests");
    const data = await res.json();
    const tbody = document.getElementById("bookRequestsTable")?.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${r.id}</td><td>${r.student}</td><td>${r.book}</td><td>${r.status}</td>
                        <td>${r.status === "pending" ? `<button onclick="approveRequest(${r.id})">Approve</button>` : ""}</td>`;
        tbody.appendChild(tr);
    });
}

async function approveRequest(requestId) {
    await fetch(`/approveRequest/${requestId}`, { method: "POST" });
    loadBookRequests();
    loadIssueReport();
}
window.approveRequest = approveRequest;

async function loadIssueReport() {
    const res = await fetch("/issueReport");
    const data = await res.json();
    const tbody = document.getElementById("issueReportTable")?.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach(i => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${i.id}</td><td>${i.student}</td><td>${i.book}</td><td>${i.issue_date || i.issueDate}</td><td>${i.status}</td>`;
        tbody.appendChild(tr);
    });
}

async function loadMyIssuedBooks() {
    const res = await fetch("/student/issued");
    const data = await res.json();
    const tbody = document.getElementById("myIssuedTable")?.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach(i => {
        const tr = document.createElement("tr");
        const action = i.status === "issued" ? `<button onclick="returnBook(${i.issue_id})">Return</button>` : "";
        tr.innerHTML = `<td>${i.book_id}</td><td>${i.title}</td><td>${i.issue_date || i.issueDate}</td><td>${i.status}</td><td>${action}</td>`;
        tbody.appendChild(tr);
    });
}

async function returnBook(issueId) {
    const res = await fetch("/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue_id: issueId })
    });
    const data = await res.json();
    alert(data.status);
    loadMyIssuedBooks();
}
window.returnBook = returnBook;

if (role) {
    document.querySelector(".auth-section").style.display = "none";
    if (role === "admin") document.querySelector(".admin-section").style.display = "block";
    else document.querySelector(".student-section").style.display = "block";
    loadBooks();
    loadStudents();
    loadBookRequests();
    loadIssueReport();
    if (role === "student") loadMyIssuedBooks();
}
=======
let role = sessionStorage.getItem("role") || null;

function showTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(t => t.style.display = "none");
    const el = document.getElementById(tabId);
    if (el) el.style.display = "block";
}
window.showTab = showTab;

async function loginRole(userRole) {
    const username = document.getElementById(`${userRole}Username`).value.trim();
    const password = document.getElementById(`${userRole}Password`).value.trim();
    if (!username || !password) return alert("Enter all fields");

    try {
        const res = await fetch(`/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, role: userRole })
        });
        const data = await res.json();
        alert(data.status);

        if (res.ok && data.status.includes("successful")) {
            role = userRole;
            sessionStorage.setItem("role", role);
            document.querySelector(".auth-section").style.display = "none";
            if (role === "admin") document.querySelector(".admin-section").style.display = "block";
            else document.querySelector(".student-section").style.display = "block";

            loadBooks();
            loadStudents();
            loadBookRequests();
            loadIssueReport();
            if (role === "student") loadMyIssuedBooks();
        }
    } catch (err) {
        alert("Error: " + err.message);
    }
}
window.loginRole = loginRole;

async function signupRole(userRole) {
    const username = document.getElementById(`${userRole}Username`).value.trim();
    const password = document.getElementById(`${userRole}Password`).value.trim();
    if (!username || !password) return alert("Enter all fields");

    try {
        const res = await fetch(`/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, role: userRole })
        });
        const data = await res.json();
        alert(data.status);
    } catch (err) {
        alert("Error: " + err.message);
    }
}
window.signupRole = signupRole;

async function logout() {
    try {
        const res = await fetch('/logout', { method: 'POST' });
        const data = await res.json();
        alert(data.status);
        sessionStorage.clear();
        location.reload();
    } catch (err) {
        alert("Logout failed: " + err.message);
    }
}
window.logout = logout;

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("logoutBtn")?.addEventListener("click", logout);
    document.getElementById("logoutBtnStudent")?.addEventListener("click", logout);

    if (role) {
        document.querySelector(".auth-section").style.display = "none";
        if (role === "admin") document.querySelector(".admin-section").style.display = "block";
        else document.querySelector(".student-section").style.display = "block";
        loadBooks();
        loadStudents();
        loadBookRequests();
        loadIssueReport();
        if (role === "student") loadMyIssuedBooks();
    }
});

async function loadBooks() {
    const res = await fetch("/books");
    const data = await res.json();
    renderTable("bookReportTable", data);
    renderTable("studentBookTable", data, true);
}

async function renderTable(tableId, data, studentView = false) {
    const tbody = document.getElementById(tableId)?.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach(book => {
        const tr = document.createElement("tr");
        let actions = "";
        if (role === "admin" && tableId === "bookReportTable") {
            actions = `<button onclick="editBook(${book.id}, '${book.title}', '${book.author}', ${book.copies})">Edit</button>
                       <button onclick="deleteBook(${book.id})">Delete</button>`;
        } else if (studentView) {
            actions = `<button onclick="requestBook(${book.id})">Request</button>`;
        }
        tr.innerHTML = `<td>${book.id}</td><td>${book.title}</td><td>${book.author}</td><td>${book.copies}</td><td>${actions}</td>`;
        tbody.appendChild(tr);
    });
}

document.getElementById("addBookForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const id = document.getElementById("bookId").value;
    const title = document.getElementById("title").value.trim();
    const author = document.getElementById("author").value.trim();
    const copies = document.getElementById("copies").value.trim();
    if (!title || !author || !copies) return alert("Enter all fields");
    const method = id ? "PUT" : "POST";
    const url = id ? `/books/${id}` : "/books";
    await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, copies })
    });
    document.getElementById("addBookForm").reset();
    document.getElementById("bookId").value = "";
    loadBooks();
});

function editBook(id, title, author, copies) {
    document.getElementById("bookId").value = id;
    document.getElementById("title").value = title;
    document.getElementById("author").value = author;
    document.getElementById("copies").value = copies;
    document.getElementById("saveBtn").innerText = "Update Book";
}
window.editBook = editBook;

async function deleteBook(id) {
    if (!confirm("Delete this book?")) return;
    await fetch(`/books/${id}`, { method: "DELETE" });
    loadBooks();
}
window.deleteBook = deleteBook;

async function addStudent() {
    const username = document.getElementById("newStudentUsername").value.trim();
    const password = document.getElementById("newStudentPassword").value.trim();
    if (!username || !password) return alert("Enter all fields");
    await fetch("/addStudent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    alert("Student added");
    document.getElementById("newStudentUsername").value = "";
    document.getElementById("newStudentPassword").value = "";
    loadStudents();
}
window.addStudent = addStudent;

async function loadStudents() {
    const res = await fetch("/students");
    const data = await res.json();
    const tbody = document.getElementById("studentReportTable")?.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach(s => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${s.id}</td><td>${s.username}</td><td>${s.role || 'student'}</td>`;
        tbody.appendChild(tr);
    });
}

async function requestBook(bookId) {
    const res = await fetch("/requestBook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book_id: bookId })
    });
    const data = await res.json();
    alert(data.status);
}
window.requestBook = requestBook;

async function loadBookRequests() {
    const res = await fetch("/bookRequests");
    const data = await res.json();
    const tbody = document.getElementById("bookRequestsTable")?.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach(r => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${r.id}</td><td>${r.student}</td><td>${r.book}</td><td>${r.status}</td>
                        <td>${r.status === "pending" ? `<button onclick="approveRequest(${r.id})">Approve</button>` : ""}</td>`;
        tbody.appendChild(tr);
    });
}

async function approveRequest(requestId) {
    await fetch(`/approveRequest/${requestId}`, { method: "POST" });
    loadBookRequests();
    loadIssueReport();
}
window.approveRequest = approveRequest;

async function loadIssueReport() {
    const res = await fetch("/issueReport");
    const data = await res.json();
    const tbody = document.getElementById("issueReportTable")?.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach(i => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${i.id}</td><td>${i.student}</td><td>${i.book}</td><td>${i.issue_date || i.issueDate}</td><td>${i.status}</td>`;
        tbody.appendChild(tr);
    });
}

async function loadMyIssuedBooks() {
    const res = await fetch("/student/issued");
    const data = await res.json();
    const tbody = document.getElementById("myIssuedTable")?.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach(i => {
        const tr = document.createElement("tr");
        const action = i.status === "issued" ? `<button onclick="returnBook(${i.issue_id})">Return</button>` : "";
        tr.innerHTML = `<td>${i.book_id}</td><td>${i.title}</td><td>${i.issue_date || i.issueDate}</td><td>${i.status}</td><td>${action}</td>`;
        tbody.appendChild(tr);
    });
}

async function returnBook(issueId) {
    const res = await fetch("/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue_id: issueId })
    });
    const data = await res.json();
    alert(data.status);
    loadMyIssuedBooks();
}
window.returnBook = returnBook;

if (role) {
    document.querySelector(".auth-section").style.display = "none";
    if (role === "admin") document.querySelector(".admin-section").style.display = "block";
    else document.querySelector(".student-section").style.display = "block";
    loadBooks();
    loadStudents();
    loadBookRequests();
    loadIssueReport();
    if (role === "student") loadMyIssuedBooks();
}
>>>>>>> 3de9a0c4b6222e4d2e10183597a42e877bd9bf2d
