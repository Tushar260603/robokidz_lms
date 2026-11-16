import client from './client';

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }),
  register: (name, email, password) => client.post('/auth/register', { name, email, password }),
  getMe: () => client.get('/auth/me'),
};

export const adminApi = {
  // Users
  getUsers: (params) => client.get('/admin/users', { params }),
  createUser: (data) => client.post('/admin/users', data),
  updateUser: (id, data) => client.put(`/admin/users/${id}`, data),
  setUserStatus: (id, is_active) => client.patch(`/admin/users/${id}/status`, { is_active }),
  deleteUser: (id) => client.delete(`/admin/users/${id}`),

  // Categories
  getCategories: () => client.get('/admin/categories'),
  createCategory: (name) => client.post('/admin/categories', { name }),
  updateCategory: (id, name) => client.put(`/admin/categories/${id}`, { name }),
  deleteCategory: (id) => client.delete(`/admin/categories/${id}`),

  // Courses
  getCourses: (params) => client.get('/admin/courses', { params }),
  createCourse: (data) => client.post('/admin/courses', data),
  getCourse: (id) => client.get(`/admin/courses/${id}`),
  updateCourse: (id, data) => client.put(`/admin/courses/${id}`, data),
  setCourseStatus: (id, is_active) => client.patch(`/admin/courses/${id}/status`, { is_active }),
  deleteCourse: (id) => client.delete(`/admin/courses/${id}`),
  assignInstructors: (courseId, instructorIds) =>
    client.put(`/admin/courses/${courseId}/instructors`, { instructor_ids: instructorIds }),

  // Stats
  getStats: () => client.get('/admin/stats'),
};

export const instructorApi = {
  getCourses: () => client.get('/instructor/courses'),
  getCourse: (id) => client.get(`/instructor/courses/${id}`),
  updateCoursePublish: (id, status) => client.patch(`/instructor/courses/${id}/publish`, { status }),
  getCourseStudents: (id) => client.get(`/instructor/courses/${id}/students`),
  getStudentProgress: (courseId, studentId) =>
    client.get(`/instructor/courses/${courseId}/students/${studentId}/progress`),

  // Lessons
  getLessons: (courseId) => client.get(`/instructor/courses/${courseId}/lessons`),
  createLesson: (courseId, data) => client.post(`/instructor/courses/${courseId}/lessons`, data),
  updateLesson: (courseId, lessonId, data) =>
    client.put(`/instructor/courses/${courseId}/lessons/${lessonId}`, data),
  deleteLesson: (courseId, lessonId) =>
    client.delete(`/instructor/courses/${courseId}/lessons/${lessonId}`),
  reorderLessons: (courseId, lessonIds) =>
    client.put(`/instructor/courses/${courseId}/lessons/reorder`, { lesson_ids: lessonIds }),

  // Materials
  uploadMaterial: (lessonId, formData) =>
    client.post(`/instructor/lessons/${lessonId}/materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteMaterial: (materialId) => client.delete(`/instructor/materials/${materialId}`),
};

export const studentApi = {
  getCourses: (params) => client.get('/courses', { params }),
  getCourseDetail: (id) => client.get(`/courses/${id}`),
  enroll: (courseId) => client.post(`/student/courses/${courseId}/enroll`),
  getMyCourses: () => client.get('/student/my-courses'),
  getCoursePlayer: (courseId) => client.get(`/student/courses/${courseId}/player`),
  markLessonComplete: (lessonId) => client.post(`/student/lessons/${lessonId}/complete`),
  downloadMaterialUrl: (materialId) => `${client.defaults.baseURL}/materials/${materialId}/download`,
};
