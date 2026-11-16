-- ============================================================
-- RoboKidz LMS – Database Schema
-- Generated from SQLAlchemy models (Alembic initial_schema)
-- ============================================================

CREATE DATABASE IF NOT EXISTS robokidz_lms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE robokidz_lms;

-- ── users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            INT           NOT NULL AUTO_INCREMENT,
    name          VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    role          ENUM('admin','instructor','student') NOT NULL,
    bio           TEXT          NULL,
    is_active     TINYINT(1)    NOT NULL DEFAULT 1,
    created_at    TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY email (email),
    INDEX ix_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── categories ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id   INT          NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── courses ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
    id          INT           NOT NULL AUTO_INCREMENT,
    title       VARCHAR(200)  NOT NULL,
    description TEXT          NULL,
    category_id INT           NULL,
    status      ENUM('draft','published') NOT NULL DEFAULT 'draft',
    is_active   TINYINT(1)    NOT NULL DEFAULT 1,
    created_by  INT           NOT NULL,
    created_at  TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX ix_courses_category_id (category_id),
    INDEX ix_courses_created_by  (created_by),
    INDEX ix_courses_status      (status),
    INDEX ix_courses_status_active (status, is_active),
    FULLTEXT INDEX ix_courses_fulltext (title, description),
    CONSTRAINT courses_ibfk_1 FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL,
    CONSTRAINT courses_ibfk_2 FOREIGN KEY (created_by)  REFERENCES users     (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── course_instructors ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_instructors (
    course_id     INT       NOT NULL,
    instructor_id INT       NOT NULL,
    assigned_at   TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (course_id, instructor_id),
    INDEX instructor_id (instructor_id),
    CONSTRAINT course_instructors_ibfk_1 FOREIGN KEY (course_id)     REFERENCES courses (id) ON DELETE CASCADE,
    CONSTRAINT course_instructors_ibfk_2 FOREIGN KEY (instructor_id) REFERENCES users   (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── lessons ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lessons (
    id         INT           NOT NULL AUTO_INCREMENT,
    course_id  INT           NOT NULL,
    title      VARCHAR(200)  NOT NULL,
    content    LONGTEXT      NULL,
    video_url  VARCHAR(500)  NULL,
    position   INT           NOT NULL,
    status     ENUM('draft','published') NOT NULL DEFAULT 'draft',
    is_deleted TINYINT(1)    NOT NULL DEFAULT 0,
    created_at TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX ix_lessons_course_position (course_id, position),
    CONSTRAINT lessons_ibfk_1 FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── materials ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS materials (
    id            INT           NOT NULL AUTO_INCREMENT,
    lesson_id     INT           NOT NULL,
    original_name VARCHAR(255)  NOT NULL,
    stored_name   VARCHAR(255)  NOT NULL,
    mime_type     VARCHAR(100)  NOT NULL,
    size_bytes    BIGINT        NOT NULL,
    uploaded_by   INT           NULL,
    uploaded_at   TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY stored_name (stored_name),
    INDEX ix_materials_lesson_id   (lesson_id),
    INDEX ix_materials_uploaded_by (uploaded_by),
    CONSTRAINT materials_ibfk_1 FOREIGN KEY (lesson_id)   REFERENCES lessons (id) ON DELETE CASCADE,
    CONSTRAINT materials_ibfk_2 FOREIGN KEY (uploaded_by) REFERENCES users   (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── enrollments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
    id          INT       NOT NULL AUTO_INCREMENT,
    student_id  INT       NOT NULL,
    course_id   INT       NOT NULL,
    enrolled_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_enrollment_student_course (student_id, course_id),
    INDEX ix_enrollments_student_id (student_id),
    INDEX ix_enrollments_course_id  (course_id),
    -- RESTRICT: cannot delete a course that has active enrollments
    CONSTRAINT enrollments_ibfk_1 FOREIGN KEY (student_id) REFERENCES users   (id) ON DELETE CASCADE,
    CONSTRAINT enrollments_ibfk_2 FOREIGN KEY (course_id)  REFERENCES courses (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── lesson_progress ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lesson_progress (
    id           INT       NOT NULL AUTO_INCREMENT,
    student_id   INT       NOT NULL,
    lesson_id    INT       NOT NULL,
    completed_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_progress_student_lesson (student_id, lesson_id),
    INDEX ix_lesson_progress_student_id (student_id),
    INDEX ix_lesson_progress_lesson_id  (lesson_id),
    CONSTRAINT lesson_progress_ibfk_1 FOREIGN KEY (student_id) REFERENCES users   (id) ON DELETE CASCADE,
    -- RESTRICT: progress history preserved even if lesson is soft-deleted
    CONSTRAINT lesson_progress_ibfk_2 FOREIGN KEY (lesson_id)  REFERENCES lessons (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
