const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // Get auth token from local storage
  _getAuthHeader() {
    const token = localStorage.getItem('notes_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Common request handler
  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Inject auth headers
    const headers = {
      ...options.headers,
      ...this._getAuthHeader(),
    };

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle unauthorized (expired token)
      if (response.status === 401) {
        localStorage.removeItem('notes_token');
        localStorage.removeItem('notes_user');
        if (!window.location.pathname.includes('/auth') && window.location.pathname !== '/') {
          window.location.href = '/auth';
        }
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Something went wrong.');
      }
      return data;
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error);
      throw error;
    }
  }

  // ==========================================
  // AUTH SERVICE
  // ==========================================

  async register(email, password, fullName) {
    return this._request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
  }

  async login(email, password) {
    const data = await this._request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    if (data.access_token) {
      localStorage.setItem('notes_token', data.access_token);
      // Fetch user details immediately to save in cache
      const user = await this.getMe();
      localStorage.setItem('notes_user', JSON.stringify(user));
      return { token: data.access_token, user };
    }
    return data;
  }

  async getMe() {
    return this._request('/api/auth/me', { method: 'GET' });
  }

  logout() {
    localStorage.removeItem('notes_token');
    localStorage.removeItem('notes_user');
    window.location.href = '/';
  }

  isAuthenticated() {
    return !!localStorage.getItem('notes_token');
  }

  getCurrentUser() {
    const cached = localStorage.getItem('notes_user');
    return cached ? JSON.parse(cached) : null;
  }

  // ==========================================
  // NOTES SERVICE
  // ==========================================

  async uploadFile(file, language = 'en', onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    // Using standard XMLHttpRequest to track upload progress accurately
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.baseUrl}/api/notes/upload`);
      
      // Inject Authorization token
      const token = localStorage.getItem('notes_token');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        const responseData = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(responseData);
        } else {
          reject(new Error(responseData.detail || 'Upload failed.'));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload.'));
      xhr.send(formData);
    });
  }

  async listNotes() {
    return this._request('/api/notes', { method: 'GET' });
  }

  async getNote(id) {
    return this._request(`/api/notes/${id}`, { method: 'GET' });
  }

  async deleteNote(id) {
    return this._request(`/api/notes/${id}`, { method: 'DELETE' });
  }

  // ==========================================
  // STUDY SERVICE (FLASHCARDS & QUIZZES)
  // ==========================================

  async getFlashcards(noteId, difficulty = 'medium') {
    return this._request(`/api/study/flashcards/${noteId}?difficulty=${difficulty}`, { method: 'GET' });
  }

  async getQuiz(noteId, difficulty = 'medium') {
    return this._request(`/api/study/quizzes/${noteId}?difficulty=${difficulty}`, { method: 'GET' });
  }

  async submitQuiz(quizId, answers) {
    return this._request(`/api/study/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
  }

  // ==========================================
  // CHAT SERVICE (RAG)
  // ==========================================

  async sendChatMessage(noteId, message) {
    return this._request('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note_id: noteId, message }),
    });
  }

  async getChatHistory(noteId) {
    return this._request(`/api/chat/session/${noteId}`, { method: 'GET' });
  }

  // ==========================================
  // DASHBOARD SERVICE
  // ==========================================

  async getDashboardStats() {
    return this._request('/api/dashboard/stats', { method: 'GET' });
  }

  // ==========================================
  // PROMPT-TO-NOTES SERVICE
  // ==========================================

  async enhancePrompt(prompt) {
    return this._request('/api/v1/notes/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
  }

  async generateNotesFromPrompt(prompt, mode, length, language) {
    return this._request('/api/v1/notes/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, generation_mode: mode, note_length: length, language }),
    });
  }

  async generateFollowup(noteId, followupQuery) {
    return this._request('/api/v1/notes/followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note_id: noteId, followup_query: followupQuery }),
    });
  }

  async getPromptHistory() {
    return this._request('/api/v1/notes/history', { method: 'GET' });
  }
}

export const api = new ApiService();
