# RoboKidz Learning Management System (LMS)

A full-stack web-based Learning Management System designed for **RoboKidz**, built using **React.js**, **Python FastAPI**, and **MySQL**. The system provides tailored role-based workflows for **Admin**, **Instructor**, and **Student**, with secure JWT authentication, lesson ordering, material upload/download, YouTube integration, and automatic course progress tracking.

---

## 📹 Video Demonstration & Walkthrough

> **Important Note:** The demonstration video size is approximately **1.2 GB**. Please download it first to view it in full HD resolution without streaming compression.

- 📥 **Video Walkthrough Link:** [Google Drive Demo Video (1.2 GB)](https://drive.google.com/file/d/1e4w2y44ukJ8qzUlErRT2uTiHYdmZ60NM/view)

### What the Video Covers:
1. **Running the Application Locally**: Starting FastAPI backend & React Vite frontend.
2. **Database Verification**: MySQL schema, tables, relationships, and data consistency.
3. **Admin Workflow**:
   - Admin secure login.
   - User Management (CRUD on Students/Instructors, pagination, activation/deactivation, admin protection).
   - Category Management (domain organization, pagination, delete conflict protection).
   - Course Creation, Publishing, and Instructor Assignment with real-time search.
   - Analytics Dashboard (Avg. progress percentage, completed student counts, enrollment stats).
4. **Instructor Workflow**:
   - Instructor login and Assigned Courses overview.
   - Lesson Creation & Management (Title, Rich text description, YouTube video embed).
   - Lesson Reordering with immediate sequence update.
   - Learning Material Uploads (PDF, documents, images) with extension/MIME validation.
   - Student Roster & Individual Student Progress Inspection.
5. **Student Workflow**:
   - Registration and Login.
   - Course Catalog with Domain Filter Pills and Search.
   - Course Detail with Course Curriculum Preview (lock icons before enrollment).
   - Course Enrollment (duplicate enrollment prevention).
   - Interactive Course Player (YouTube video player, lesson content, authenticated blob PDF download).
   - "Mark as Complete" action and real-time progress bar recalculation.
   - Resume learning from the last incomplete lesson.
6. **Role-Based Access Control**:
   - Unauthorized access blocks (401/403).
   - Catalog isolation (Instructors automatically redirected to `/instructor`).

---

## 🏛️ Database ER Diagram & Architecture

The database is built on MySQL with 8 relational tables linked by strict foreign keys, composite primary keys, and unique constraints.

- 🖼️ **ER Diagram File:** Located in repository root as [`ER diagram.png`](./ER%20diagram.png).
- 💾 **SQL Database Dump:** Located in repository root as [`robokidz_lms.sql`](./robokidz_lms.sql).

```mermaid
erDiagram
    users {
        int id PK
        varchar name
        varchar email UK
        varchar password_hash
        enum role "admin, instructor, student"
        text bio
        tinyint is_active
        timestamp created_at
        timestamp updated_at
    }

    categories {
        int id PK
        varchar name UK
    }

    courses {
        int id PK
        varchar title
        text description
        int category_id FK
        enum status "draft, published"
        tinyint is_active
        int created_by FK
        timestamp created_at
        timestamp updated_at
    }

    course_instructors {
        int course_id PK,FK
        int instructor_id PK,FK
        timestamp assigned_at
    }

    lessons {
        int id PK
        int course_id FK
        varchar title
        longtext content
        varchar video_url
        int position
        enum status "draft, published"
        tinyint is_deleted
        timestamp created_at
        timestamp updated_at
    }

    materials {
        int id PK
        int lesson_id FK
        varchar original_name
        varchar stored_name UK
        varchar mime_type
        bigint size_bytes
        int uploaded_by FK
        timestamp uploaded_at
    }

    enrollments {
        int id PK
        int student_id FK
        int course_id FK
        timestamp enrolled_at
    }

    lesson_progress {
        int id PK
        int student_id FK
        int lesson_id FK
        timestamp completed_at
    }

    users ||--o{ courses : "creates (created_by)"
    categories ||--o{ courses : "categorizes (category_id)"
    courses ||--o{ course_instructors : "assigned to (course_id)"
    users ||--o{ course_instructors : "instructs (instructor_id)"
    courses ||--o{ lessons : "contains (course_id)"
    lessons ||--o{ materials : "has attachments (lesson_id)"
    users ||--o{ materials : "uploads (uploaded_by)"
    users ||--o{ enrollments : "enrolls (student_id)"
    courses ||--o{ enrollments : "enrolled in (course_id)"
    users ||--o{ lesson_progress : "completes (student_id)"
    lessons ||--o{ lesson_progress : "tracked for (lesson_id)"
```

---

## 🚀 Features & Role Capabilities

### 1. 🛡️ Admin Capabilities
- **Authentication**: Secure JWT-based login with hashed password comparison (bcrypt).
- **User Management**:
  - Add Students and Instructors via interactive modal popup.
  - Edit user names, emails, and passwords.
  - Activate/Deactivate users (protected: Admin cannot deactivate or delete themselves).
  - Search and filter users by role with **pagination** (10 per page).
- **Course Categories**:
  - Full CRUD operations with **pagination**.
  - Conflict prevention: Cannot delete categories linked to existing courses.
- **Course Administration**:
  - Create, update, soft-delete, and toggle course status (`draft` / `published`).
  - Searchable instructor assignment modal: Multi-select with real-time search and removable pill tags.
- **Analytics Dashboard**:
  - Overview cards: Total Users, Total Courses, Total Enrollments, Completed Students.
  - Course-by-course monitoring table showing **Published Lessons**, **Total Enrolled**, **Avg. Student Progress %**, and **Completed (100%)** counts.

### 2. 👨‍🏫 Instructor Capabilities
- **Assigned Courses**:
  - Instructors only access courses explicitly assigned to them by the Admin.
  - Catalog and course exploration pages are hidden and blocked for instructors.
- **Lesson Management**:
  - Create, edit, and delete lessons.
  - Embed YouTube lectures (supports `youtube.com/watch?v=`, `youtu.be/`, and embed URLs).
  - Organize lesson sequence with one-click **Move Up / Move Down** reordering in a single transaction.
- **Learning Materials Upload**:
  - Upload PDFs, documents (DOC/DOCX, PPT/PPTX, TXT), and images.
  - Validates file extensions and MIME types with file size limits (default 10 MB).
- **Student Progress Monitoring**:
  - View students enrolled in assigned courses.
  - Inspect individual student lesson-by-lesson progress.

### 3. 🎓 Student Capabilities
- **Registration & Login**:
  - Student registration forces role as `student` server-side.
- **Course Exploration & Catalog**:
  - Real-time title search and interactive domain category filter pills.
  - Only **Published** and **Active** courses are displayed.
- **Curriculum Preview**:
  - Course details display lesson count, instructor info, and full syllabus.
  - Individual lessons show 🔒 **Locked** status before enrollment with lesson indicators (Video Lesson, Material count).
- **Enrollment**:
  - Instant enrollment with duplicate enrollment prevention (`409 Conflict`).
- **Interactive Course Player**:
  - Stream embedded YouTube video lessons.
  - Download learning materials securely via authenticated blob streaming with original filenames.
  - "Mark as Complete" toggle automatically updates course progress bar.
  - Automatic resume: loads the first incomplete lesson upon returning.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React 18, Vite, React Router v6 | Single Page Application styled with RoboKidz Brand System |
| **API Client** | Axios | Configured with Bearer token interceptor and blob response handling |
| **Backend** | Python 3.11+, FastAPI, Pydantic v2 | High-performance asynchronous REST API framework |
| **Database & ORM** | MySQL 8.0, SQLAlchemy 2.0 | Relational database with PyMySQL driver and transactions |
| **Migrations** | Alembic | Version-controlled database migrations |
| **Authentication** | OAuth2 Bearer, Python-Jose, Passlib | JWT tokens with bcrypt password hashing |

---

## 📦 Installation & Setup Guide

### Prerequisites
- **Node.js** (v18 or v20+)
- **Python** (3.11 or 3.12)
- **MySQL Server** (v8.0+) running locally on port `3306`
- **Git**

---

### Step 1: Database Setup & SQL Dump Import

You can set up the database using the provided **`robokidz_lms.sql`** dump file in the root directory.

#### Option A: Using MySQL Command Line
1. Open terminal / PowerShell and log in to MySQL:
   ```bash
   mysql -u root -p
   ```
2. Create database and import dump:
   ```sql
   CREATE DATABASE robokidz_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   EXIT;
   ```
3. Import the SQL dump:
   ```bash
   mysql -u root -p robokidz_lms < robokidz_lms.sql
   ```

#### Option B: Using MySQL Workbench
1. Open MySQL Workbench and connect to your local MySQL server.
2. Go to **Server** → **Data Import**.
3. Choose **Import from Self-Contained File** and select `robokidz_lms.sql`.
4. Set Target Schema to `robokidz_lms` (create it if not present).
5. Click **Start Import**.

---

### Step 2: Backend Setup (FastAPI)

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   # Windows
   python -m venv .venv
   .venv\Scripts\activate

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` to match your local MySQL credentials:
   ```ini
   # If your MySQL password has special characters like '@', URL-encode them (e.g. '@' becomes '%40')
   DATABASE_URL=mysql+pymysql://root:your_password@localhost:3306/robokidz_lms
   SECRET_KEY=robokidz-super-secret-jwt-key-2026-production-ready
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   UPLOAD_DIR=uploads
   MAX_UPLOAD_MB=10
   CORS_ORIGINS=http://localhost:5173,http://localhost:5174
   ```

5. Run the FastAPI server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   - API Server: [http://127.0.0.1:8000](http://127.0.0.1:8000)
   - Interactive Swagger API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - System Health Check: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

### Step 3: Frontend Setup (React + Vite)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Verify environment configuration:
   Ensure `.env` exists in `/frontend`:
   ```ini
   VITE_API_URL=http://localhost:8000
   ```

4. Run the frontend development server:
   ```bash
   npm run dev
   ```
   - Application URL: [http://localhost:5173/](http://localhost:5173/) (or `http://localhost:5174/`)

---

## 🔑 Default Seed Credentials

If you imported `robokidz_lms.sql` or ran seed data, use the following credentials to test each role:

| Role | Email | Password | Primary Dashboard |
|---|---|---|---|
| **Admin** | `admin@gmail.com` | `Admin@1234` | `/admin` |
| **Instructor** | `inst1@gmail.com` | `Inst@1234` | `/instructor` |
| **Student** | `student1@gmail.com` | `Student@1234` | `/courses` / `/student/my-courses` |

*(You can also freely register new student accounts on `/register` or create new instructors via the Admin **Users Management** page).*

---

## 🔒 Security & Business Rules Implemented
- **Access Control**: Role guards applied on backend routes via FastAPI dependencies (`require_role`) and on frontend routes via `<ProtectedRoute>`.
- **Download Protection**: Materials are served via authenticated `GET /materials/{id}/download` and streamed as blob files; the `uploads/` directory is never exposed statically.
- **Double-Enrollment Prevention**: Database unique constraint + service check returns `409 Conflict` if a student attempts duplicate enrollment.
- **Progress Preservation**: Deactivating a course preserves all existing enrollments and student lesson completion history.
- **Safe Admin Isolation**: Admins cannot deactivate or delete their own accounts, ensuring the platform always has an active superuser.

---

## 📄 License
This project was developed for the **RoboKidz Technical Assessment**. All rights reserved.
