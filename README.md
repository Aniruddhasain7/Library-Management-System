# 📚 Library Management System

A comprehensive web-based Library Management System built with Python, Flask, and MySQL. This system facilitates efficient management of books, students, and book circulation through a user-friendly interface.

## 🚀 Features

### Admin Dashboard

- **Book Management**: Add, update, delete, and view books in the library inventory.
- **Student Management**: Register new students and view existing student records.
- **Request Handling**: Review and approve book requests from students.
- **Reports**: Access detailed reports on book inventory, student lists, and book issue history.

### Student Dashboard

- **Book Catalog**: Browse through available books in the library.
- **Book Issuance**: Directly issue available books.
- **Book Requests**: Request books that might be currently unavailable or require approval.
- **Return Tracking**: Keep track of issued books and return them once finished.
- **Personal History**: View a history of all issued and returned books.

## 🛠️ Tech Stack

- **Backend**: Python 3.x, Flask
- **Database**: MySQL (PyMySQL)
- **Frontend**: HTML5, CSS3, JavaScript

## 📊 System Workflow & Use Case Diagram

```mermaid
graph LR
    subgraph Users
        Admin((Admin))
        Student((Student))
    end

    subgraph "Library Management System"
        direction TB
        UC1([Login / Signup])
        UC2([Manage Book Inventory])
        UC3([Manage Student Records])
        UC4([Process Book Requests])
        UC5([View Inventory Reports])
        UC6([Browse & Search Books])
        UC7([Issue/Request Book])
        UC8([Return Issued Book])
    end

    subgraph Storage
        DB[(MySQL Database)]
    end

    %% Admin Workflow
    Admin -- "Authenticates" --> UC1
    Admin -- "Adds/Updates Books" --> UC2
    Admin -- "Registers Students" --> UC3
    Admin -- "Approves Requests" --> UC4
    Admin -- "Analyzes Data" --> UC5

    %% Student Workflow
    Student -- "Authenticates" --> UC1
    Student -- "Searches Catalog" --> UC6
    Student -- "Borrows Books" --> UC7
    Student -- "Returns Books" --> UC8

    %% Database Interactions
    UC1 -- "Verifies Credentials" --> DB
    UC2 -- "Updates Book Table" --> DB
    UC3 -- "Saves User Data" --> DB
    UC4 -- "Updates Request Status" --> DB
    UC5 -- "Fetches History" --> DB
    UC6 -- "Reads Book Info" --> DB
    UC7 -- "Logs Issue Record" --> DB
    UC8 -- "Updates Availability" --> DB

    %% Styling
    style Admin fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#fff
    style Student fill:#1e293b,stroke:#4ade80,stroke-width:2px,color:#fff
    style DB fill:#1e293b,stroke:#f59e0b,stroke-width:2px,color:#fff
    style UC1 fill:#334155,stroke:#94a3b8,color:#fff
    style UC2 fill:#334155,stroke:#94a3b8,color:#fff
    style UC3 fill:#334155,stroke:#94a3b8,color:#fff
    style UC4 fill:#334155,stroke:#94a3b8,color:#fff
    style UC5 fill:#334155,stroke:#94a3b8,color:#fff
    style UC6 fill:#334155,stroke:#94a3b8,color:#fff
    style UC7 fill:#334155,stroke:#94a3b8,color:#fff
    style UC8 fill:#334155,stroke:#94a3b8,color:#fff
```

## 📁 Project Structure

```
Library Management System/
├── app.py              # Main Flask application & API routes
├── db.py               # Database connection & configuration
├── index.html          # Frontend UI structure (HTML5)
├── style.css           # UI styling and layout (CSS3)
├── script.js           # Frontend logic & API integration (JS)
└── README.md           # Project documentation
```
