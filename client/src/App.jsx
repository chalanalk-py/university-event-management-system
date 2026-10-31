import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import EventDetail from './pages/EventDetail';
import Schedule from './pages/Schedule';
import Members from './pages/Members';
import Tasks from './pages/Tasks';
import MyTasks from './pages/MyTasks';
import Budget from './pages/Budget';
import Designs from './pages/Designs';
import Elections from './pages/Elections';
import Agenda from './pages/Agenda';
import Contacts from './pages/Contacts';
import LostFound from './pages/LostFound';
import Notifications from './pages/Notifications';
import Alerts from './pages/Alerts';
import './App.css';

// Protected route wrapper
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

// Navigation bar
function NavBar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <nav className="navbar">
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/tasks/my">My Tasks</Link>
      <Link to="/notifications">Notifications</Link>
      <span>{user.username} ({user.role})</span>
      <button onClick={logout}>Logout</button>
    </nav>
  );
}

function AppRoutes() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/events/create" element={<PrivateRoute><CreateEvent /></PrivateRoute>} />
        <Route path="/events/:id" element={<PrivateRoute><EventDetail /></PrivateRoute>} />
        <Route path="/events/:eventId/schedule" element={<PrivateRoute><Schedule /></PrivateRoute>} />
        <Route path="/events/:eventId/members" element={<PrivateRoute><Members /></PrivateRoute>} />
        <Route path="/events/:eventId/tasks" element={<PrivateRoute><Tasks /></PrivateRoute>} />
        <Route path="/events/:eventId/budget" element={<PrivateRoute><Budget /></PrivateRoute>} />
        <Route path="/events/:eventId/designs" element={<PrivateRoute><Designs /></PrivateRoute>} />
        <Route path="/events/:eventId/elections" element={<PrivateRoute><Elections /></PrivateRoute>} />
        <Route path="/events/:eventId/agenda" element={<PrivateRoute><Agenda /></PrivateRoute>} />
        <Route path="/events/:eventId/contacts" element={<PrivateRoute><Contacts /></PrivateRoute>} />
        <Route path="/events/:eventId/lost-found" element={<PrivateRoute><LostFound /></PrivateRoute>} />
        <Route path="/events/:eventId/alerts" element={<PrivateRoute><Alerts /></PrivateRoute>} />
        <Route path="/tasks/my" element={<PrivateRoute><MyTasks /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
