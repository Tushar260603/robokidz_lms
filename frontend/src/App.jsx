import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminCoursesPage from './pages/admin/AdminCoursesPage';
import AdminCourseDetailPage from './pages/admin/AdminCourseDetailPage';

// Instructor pages
import InstructorCoursesPage from './pages/instructor/InstructorCoursesPage';
import InstructorCourseManagePage from './pages/instructor/InstructorCourseManagePage';
import InstructorStudentsProgressPage from './pages/instructor/InstructorStudentsProgressPage';

// Student pages
import StudentCatalogPage from './pages/student/StudentCatalogPage';
import StudentCourseDetailPage from './pages/student/StudentCourseDetailPage';
import StudentMyCoursesPage from './pages/student/StudentMyCoursesPage';
import StudentCoursePlayerPage from './pages/student/StudentCoursePlayerPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1, paddingBottom: '3rem' }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Navigate to="/courses" replace />} />
              <Route path="/courses" element={<StudentCatalogPage />} />
              <Route path="/courses/:id" element={<StudentCourseDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Admin Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                <Route path="/admin/courses" element={<AdminCoursesPage />} />
                <Route path="/admin/courses/:id" element={<AdminCourseDetailPage />} />
              </Route>

              {/* Instructor Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['instructor']} />}>
                <Route path="/instructor" element={<InstructorCoursesPage />} />
                <Route path="/instructor/courses/:id/manage" element={<InstructorCourseManagePage />} />
                <Route path="/instructor/courses/:id/students" element={<InstructorStudentsProgressPage />} />
              </Route>

              {/* Student Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/student/my-courses" element={<StudentMyCoursesPage />} />
                <Route path="/student/courses/:id/player" element={<StudentCoursePlayerPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/courses" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
