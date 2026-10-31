// UniSphere API Client Service

const BASE_URL = '/api';

export const api = {
  // Auth
  async login(identifier, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async register(userData) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async planEvent(payload) {
    const res = await fetch(`${BASE_URL}/auth/plan-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to plan event');
    return data;
  },

  // Events
  async getEvents() {
    const res = await fetch(`${BASE_URL}/events`);
    return res.json();
  },

  async createEvent(payload) {
    const res = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create event');
    return data;
  },

  // Schedule
  async getSchedules(eventId = 1) {
    const res = await fetch(`${BASE_URL}/schedules?eventId=${eventId}`);
    return res.json();
  },

  async createSchedule(item) {
    const res = await fetch(`${BASE_URL}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return res.json();
  },

  async updateSchedule(id, item) {
    const res = await fetch(`${BASE_URL}/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return res.json();
  },

  async deleteSchedule(id) {
    const res = await fetch(`${BASE_URL}/schedules/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Committee & Elections
  async getElections(eventId = 1) {
    const res = await fetch(`${BASE_URL}/elections?eventId=${eventId}`);
    return res.json();
  },

  async nominate(payload) {
    const res = await fetch(`${BASE_URL}/elections/nominate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Nomination failed');
    return data;
  },

  async vote(payload) {
    const res = await fetch(`${BASE_URL}/elections/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Voting failed');
    return data;
  },

  async closeElection(positionId) {
    const res = await fetch(`${BASE_URL}/elections/${positionId}/close`, { method: 'POST' });
    return res.json();
  },

  // Designs & Comments
  async getDesigns(eventId = 1, category = 'All') {
    const res = await fetch(`${BASE_URL}/designs?eventId=${eventId}&category=${encodeURIComponent(category)}`);
    return res.json();
  },

  async uploadDesign(payload) {
    const res = await fetch(`${BASE_URL}/designs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async addComment(designId, payload) {
    const res = await fetch(`${BASE_URL}/designs/${designId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async deleteComment(commentId) {
    const res = await fetch(`${BASE_URL}/designs/comments/${commentId}`, { method: 'DELETE' });
    return res.json();
  },

  // Contacts
  async getContacts(eventId = 1, category = 'All', q = '', valuable = false) {
    const url = `${BASE_URL}/contacts?eventId=${eventId}&category=${encodeURIComponent(category)}&q=${encodeURIComponent(q)}&valuable=${valuable}`;
    const res = await fetch(url);
    return res.json();
  },

  async createContact(payload) {
    const res = await fetch(`${BASE_URL}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async toggleValuable(id) {
    const res = await fetch(`${BASE_URL}/contacts/${id}/toggle-valuable`, { method: 'PATCH' });
    return res.json();
  },

  async deleteContact(id) {
    const res = await fetch(`${BASE_URL}/contacts/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Tasks
  async getTasks(eventId = 1, userId = null) {
    let url = `${BASE_URL}/tasks?eventId=${eventId}`;
    if (userId) url += `&userId=${userId}`;
    const res = await fetch(url);
    return res.json();
  },

  async createTask(payload) {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async updateTaskStatus(id, status) {
    const res = await fetch(`${BASE_URL}/tasks/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  async deleteTask(id) {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Budget
  async getBudget(eventId = 1) {
    const res = await fetch(`${BASE_URL}/budget?eventId=${eventId}`);
    return res.json();
  },

  async addExpense(payload) {
    const res = await fetch(`${BASE_URL}/budget/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Live Agenda
  async getAgenda(eventId = 1) {
    const res = await fetch(`${BASE_URL}/agenda?eventId=${eventId}`);
    return res.json();
  },

  async updateAgendaStatus(id, status) {
    const res = await fetch(`${BASE_URL}/agenda/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  async delayAgendaItem(id, delayMinutes = 5) {
    const res = await fetch(`${BASE_URL}/agenda/${id}/delay`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delayMinutes })
    });
    return res.json();
  },

  // Lost & Found
  async getLostFound(eventId = 1, type = 'all', q = '') {
    const res = await fetch(`${BASE_URL}/lost-found?eventId=${eventId}&type=${type}&q=${encodeURIComponent(q)}`);
    return res.json();
  },

  async createLostFound(payload) {
    const res = await fetch(`${BASE_URL}/lost-found`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async resolveLostFound(id) {
    const res = await fetch(`${BASE_URL}/lost-found/${id}/resolve`, { method: 'PATCH' });
    return res.json();
  },

  // Members, Alerts & Lending
  async getMembers(eventId = 1) {
    const res = await fetch(`${BASE_URL}/members?eventId=${eventId}`);
    return res.json();
  },

  async broadcastAlert(payload) {
    const res = await fetch(`${BASE_URL}/alerts/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getNotifications(eventId = 1) {
    const res = await fetch(`${BASE_URL}/notifications?eventId=${eventId}`);
    return res.json();
  },

  async markNotificationRead(id) {
    const res = await fetch(`${BASE_URL}/notifications/${id}/read`, { method: 'PATCH' });
    return res.json();
  },

  async markAllNotificationsRead() {
    const res = await fetch(`${BASE_URL}/notifications/read-all`, { method: 'POST' });
    return res.json();
  },

  async getLending(eventId = 1) {
    const res = await fetch(`${BASE_URL}/lending?eventId=${eventId}`);
    return res.json();
  },

  async addLentItem(payload) {
    const res = await fetch(`${BASE_URL}/lending`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async returnLentItem(id) {
    const res = await fetch(`${BASE_URL}/lending/${id}/return`, { method: 'PATCH' });
    return res.json();
  }
};
