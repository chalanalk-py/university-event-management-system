import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import NotificationBanner from './components/NotificationBanner';
import AuthModal from './components/AuthModal';
import LoginPage from './components/LoginPage';
import EventSelectPage from './components/EventSelectPage';

import ScheduleView from './components/ScheduleView';
import LiveAgendaView from './components/LiveAgendaView';
import TasksView from './components/TasksView';
import BudgetView from './components/BudgetView';
import VotingView from './components/VotingView';
import DesignsView from './components/DesignsView';
import ContactsView from './components/ContactsView';
import LostFoundView from './components/LostFoundView';
import MembersAndAlertsView from './components/MembersAndAlertsView';

import { api } from './services/api';

export default function App() {
  // Step 1: Check if user is logged in (from localStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('unisphere_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return null; // No default user — require login
  });

  // Step 2: Check if an event is selected (from localStorage)
  const [selectedEvent, setSelectedEvent] = useState(() => {
    const saved = localStorage.getItem('unisphere_selected_event');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return null; // No default event — require selection
  });

  const [activeTab, setActiveTab] = useState('schedule');
  const [activeEventId, setActiveEventId] = useState(() => {
    const saved = localStorage.getItem('unisphere_selected_event');
    if (saved) {
      try { return JSON.parse(saved).id; } catch (e) { /* ignore */ }
    }
    return 1;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState('signin');
  const [dismissBanner, setDismissBanner] = useState(false);

  // Data states
  const [events, setEvents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [agendaData, setAgendaData] = useState({ items: [], nowPerforming: null, nextUp: null });
  const [tasksData, setTasksData] = useState({ tasks: [], stats: {} });
  const [budgetData, setBudgetData] = useState({});
  const [elections, setElections] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [lostFoundItems, setLostFoundItems] = useState([]);
  const [members, setMembers] = useState([]);
  const [lendingItems, setLendingItems] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Fetch all active event data
  const loadAllData = useCallback(async () => {
    try {
      const [
        evList,
        schList,
        agData,
        tskData,
        bgData,
        elecList,
        desList,
        conList,
        lfList,
        memList,
        lendList,
        notifList
      ] = await Promise.all([
        api.getEvents().catch(() => []),
        api.getSchedules(activeEventId).catch(() => []),
        api.getAgenda(activeEventId).catch(() => ({ items: [], nowPerforming: null, nextUp: null })),
        api.getTasks(activeEventId).catch(() => ({ tasks: [], stats: {} })),
        api.getBudget(activeEventId).catch(() => ({})),
        api.getElections(activeEventId).catch(() => []),
        api.getDesigns(activeEventId).catch(() => []),
        api.getContacts(activeEventId).catch(() => []),
        api.getLostFound(activeEventId).catch(() => []),
        api.getMembers(activeEventId).catch(() => []),
        api.getLending(activeEventId).catch(() => []),
        api.getNotifications(activeEventId).catch(() => [])
      ]);

      if (evList && evList.length) setEvents(evList);
      if (schList) setSchedules(schList);
      if (agData) setAgendaData(agData);
      if (tskData) setTasksData(tskData);
      if (bgData) setBudgetData(bgData);
      if (elecList) setElections(elecList);
      if (desList) setDesigns(desList);
      if (conList) setContacts(conList);
      if (lfList) setLostFoundItems(lfList);
      if (memList) setMembers(memList);
      if (lendList) setLendingItems(lendList);
      if (notifList) setNotifications(notifList);
    } catch (err) {
      console.error('Error fetching event data:', err);
    }
  }, [activeEventId]);

  useEffect(() => {
    // Only load data when user is logged in and an event is selected
    if (currentUser && selectedEvent) {
      loadAllData();
      // Real-time synchronization timer (SRS NFR-2)
      const interval = setInterval(loadAllData, 5000);
      return () => clearInterval(interval);
    }
  }, [loadAllData, currentUser, selectedEvent]);

  // === STEP 1: Login handler ===
  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    localStorage.setItem('unisphere_user', JSON.stringify(user));
    if (token) localStorage.setItem('unisphere_token', token);
    // Reset selected event so user picks one after login
    setSelectedEvent(null);
    localStorage.removeItem('unisphere_selected_event');
  };

  // === STEP 2: Event selection handler ===
  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setActiveEventId(event.id);
    localStorage.setItem('unisphere_selected_event', JSON.stringify(event));
    setActiveTab('schedule');
  };

  // === Plan new event from event select page ===
  const handlePlanEvent = (event) => {
    setSelectedEvent(event);
    setActiveEventId(event.id);
    localStorage.setItem('unisphere_selected_event', JSON.stringify(event));
    setActiveTab('schedule');
    loadAllData();
  };

  const handleAuthSuccess = (user, token, createdEvent) => {
    setCurrentUser(user);
    localStorage.setItem('unisphere_user', JSON.stringify(user));
    if (token) localStorage.setItem('unisphere_token', token);
    if (createdEvent) {
      handleEventSelect(createdEvent);
    }
    loadAllData();
  };

  const handleLogout = () => {
    localStorage.removeItem('unisphere_user');
    localStorage.removeItem('unisphere_token');
    localStorage.removeItem('unisphere_selected_event');
    setCurrentUser(null);
    setSelectedEvent(null);
  };

  // Go back to event selection (from dashboard)
  const handleBackToEvents = () => {
    setSelectedEvent(null);
    localStorage.removeItem('unisphere_selected_event');
  };



  const handleOpenAuth = (tabName = 'signin') => {
    setAuthInitialTab(tabName);
    setShowAuthModal(true);
  };

  const handleMarkNotificationRead = async (id) => {
    await api.markNotificationRead(id);
    loadAllData();
  };

  const handleMarkAllNotificationsRead = async () => {
    await api.markAllNotificationsRead();
    loadAllData();
  };

  // =============================================
  // STEP 1: If no user is logged in, show LoginPage
  // =============================================
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // =============================================
  // STEP 2: If user is logged in but no event selected, show EventSelectPage
  // =============================================
  if (!selectedEvent) {
    return (
      <EventSelectPage
        currentUser={currentUser}
        onSelectEvent={handleEventSelect}
        onLogout={handleLogout}
        onPlanEvent={handlePlanEvent}
      />
    );
  }

  // =============================================
  // STEP 3: Full Dashboard with selected event
  // =============================================
  const activeEvent = events.find(e => e.id === Number(activeEventId)) || selectedEvent;

  return (
    <div className="app-container">
      {/* Top Real-Time Notification & Live Status Banner (FR-8.1, FR-9.4) */}
      {!dismissBanner && (
        <NotificationBanner
          notifications={notifications}
          liveAgenda={agendaData}
          onSelectTab={setActiveTab}
          onDismiss={() => setDismissBanner(true)}
        />
      )}

      {/* Main Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        events={events}
        activeEventId={activeEventId}
        onSelectEvent={setActiveEventId}
        onBackToEvents={handleBackToEvents}
      />

      {/* Main Page Content */}
      <main className="main-wrapper">
        {activeTab === 'schedule' && (
          <ScheduleView
            schedules={schedules}
            onRefresh={loadAllData}
            currentUser={currentUser}
            activeEvent={activeEvent}
          />
        )}

        {activeTab === 'agenda' && (
          <LiveAgendaView
            agendaData={agendaData}
            onRefresh={loadAllData}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            tasksData={tasksData}
            onRefresh={loadAllData}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetView
            budgetData={budgetData}
            onRefresh={loadAllData}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'voting' && (
          <VotingView
            elections={elections}
            onRefresh={loadAllData}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'designs' && (
          <DesignsView
            designs={designs}
            onRefresh={loadAllData}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'contacts' && (
          <ContactsView
            contacts={contacts}
            onRefresh={loadAllData}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'lostfound' && (
          <LostFoundView
            items={lostFoundItems}
            onRefresh={loadAllData}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'members' && (
          <MembersAndAlertsView
            members={members}
            lendingItems={lendingItems}
            onRefresh={loadAllData}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Login / Sign Up / Plan New Event Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
        initialTab={authInitialTab}
      />
    </div>
  );
}
