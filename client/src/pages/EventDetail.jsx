import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function EventDetail() {
  const { id } = useParams();
  const { user, hasRole } = useAuth();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    api.get(`/events/${id}`).then(r => setEvent(r.data)).catch(() => {});
  }, [id]);

  if (!event) return <p>Loading...</p>;

  return (
    <div className="page">
      <h2>{event.title}</h2>
      <p>{event.description}</p>
      <p><strong>Venue:</strong> {event.venue} | <strong>Date:</strong> {new Date(event.event_date).toLocaleDateString()} | <strong>Time:</strong> {event.event_time}</p>

      <h3>Event Modules</h3>
      <nav className="module-links">
        <Link to={`/events/${id}/schedule`}>Schedule</Link>
        <Link to={`/events/${id}/members`}>Members</Link>
        <Link to={`/events/${id}/tasks`}>Tasks</Link>
        <Link to={`/events/${id}/budget`}>Budget</Link>
        <Link to={`/events/${id}/designs`}>Designs</Link>
        <Link to={`/events/${id}/contacts`}>Contacts</Link>
        <Link to={`/events/${id}/elections`}>Elections</Link>
        <Link to={`/events/${id}/agenda`}>Live Agenda</Link>
        <Link to={`/events/${id}/lost-found`}>Lost & Found</Link>
        <Link to={`/events/${id}/alerts`}>Alerts</Link>
      </nav>
    </div>
  );
}
