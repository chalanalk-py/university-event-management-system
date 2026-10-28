require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDB, isUsingMySQL, getStore, saveStore } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'unisphere_super_secret_jwt_key_2026';

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Helper token generator
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Optional Auth Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ----------------------------------------------------
// Health & Diagnostic Endpoint
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'UniSphere API',
    database: isUsingMySQL() ? 'MySQL' : 'Persistent Storage (JSON)',
    timestamp: new Date().toISOString()
  });
});

// ----------------------------------------------------
// 1. AUTH & EVENT PLANNING REGISTRATION
// ----------------------------------------------------

// Standard Sign Up
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password, fullName, role, phone, coordinatorArea } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }

    const store = getStore();
    const existing = store.users.find(
      u => u.email.toLowerCase() === email.toLowerCase() || u.username.toLowerCase() === username.toLowerCase()
    );
    if (existing) {
      return res.status(400).json({ error: 'A user with that email or username already exists' });
    }

    const password_hash = bcrypt.hashSync(password, 8);
    const newUser = {
      id: store.users.length ? Math.max(...store.users.map(u => u.id)) + 1 : 1,
      email: email.trim(),
      username: username.trim(),
      password_hash,
      full_name: fullName || username,
      role: role || 'student',
      coordinator_area: coordinatorArea || null,
      phone: phone || null,
      avatar_color: '#3B82F6',
      created_at: new Date().toISOString()
    };

    store.users.push(newUser);
    saveStore(store);

    const token = generateToken(newUser);
    const { password_hash: _, ...safeUser } = newUser;
    res.status(201).json({ user: safeUser, token, message: 'Account created successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Standard Login (Sign In)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please provide email/username and password' });
    }

    const store = getStore();
    const user = store.users.find(
      u => u.email.toLowerCase() === identifier.toLowerCase() || u.username.toLowerCase() === identifier.toLowerCase()
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials. User not found' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const token = generateToken(user);
    const { password_hash: _, ...safeUser } = user;
    res.json({ user: safeUser, token, message: 'Logged in successfully' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// SPECIFIC REQUIREMENT: "to plan a new event should register again with new username and password"
app.post('/api/auth/plan-event', async (req, res) => {
  try {
    const {
      email,
      username,
      password,
      fullName,
      phone,
      eventTitle,
      eventDescription,
      venue,
      eventDate,
      startTime,
      endTime,
      totalBudget
    } = req.body;

    if (!email || !username || !password || !eventTitle || !venue || !eventDate) {
      return res.status(400).json({ error: 'Please complete required fields for both event & new admin credentials' });
    }

    const store = getStore();
    const existing = store.users.find(
      u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
    );
    if (existing) {
      return res.status(400).json({ error: 'This username or email is already registered. Use new event organizer credentials.' });
    }

    // 1. Create New Event Organizer Admin User
    const password_hash = bcrypt.hashSync(password, 8);
    const newAdmin = {
      id: store.users.length ? Math.max(...store.users.map(u => u.id)) + 1 : 1,
      email: email.trim(),
      username: username.trim(),
      password_hash,
      full_name: fullName || `${username} (Event Head)`,
      role: 'admin',
      coordinator_area: 'Event Management Board',
      phone: phone || null,
      avatar_color: '#111827',
      created_at: new Date().toISOString()
    };
    store.users.push(newAdmin);

    // 2. Create the New Event
    const newEvent = {
      id: store.events.length ? Math.max(...store.events.map(e => e.id)) + 1 : 1,
      title: eventTitle.trim(),
      description: eventDescription || 'University event organized with UniSphere.',
      venue: venue.trim(),
      event_date: eventDate,
      start_time: startTime || '09:00',
      end_time: endTime || '18:00',
      status: 'active',
      total_budget: Number(totalBudget) || 30000,
      created_by_user_id: newAdmin.id,
      agenda_controller_id: null,
      created_at: new Date().toISOString()
    };
    store.events.push(newEvent);

    // 3. Add default budget allocations
    const categories = [
      { category: 'Venue & Logistics', ratio: 0.35 },
      { category: 'Refreshments & Food', ratio: 0.25 },
      { category: 'Stage, Sound & Lights', ratio: 0.20 },
      { category: 'Design & Marketing', ratio: 0.10 },
      { category: 'Costumes & Props', ratio: 0.10 }
    ];
    categories.forEach(c => {
      store.budget_allocations.push({
        id: store.budget_allocations.length + 1,
        event_id: newEvent.id,
        category: c.category,
        allocated_amount: Math.round(newEvent.total_budget * c.ratio)
      });
    });

    // 4. Add notification for new event
    store.notifications.unshift({
      id: store.notifications.length + 1,
      event_id: newEvent.id,
      user_id: null,
      title: `Event Created: ${newEvent.title}`,
      message: `New event "${newEvent.title}" has been created by ${newAdmin.full_name}. Schedule and nominations are now open!`,
      type: 'system',
      is_read: false,
      created_at: new Date().toISOString()
    });

    saveStore(store);

    const token = generateToken(newAdmin);
    const { password_hash: _, ...safeAdmin } = newAdmin;

    res.status(201).json({
      message: 'New event planned successfully! You are now logged in as the Event Admin.',
      user: safeAdmin,
      event: newEvent,
      token
    });
  } catch (err) {
    console.error('Plan event error:', err);
    res.status(500).json({ error: 'Internal server error while planning new event' });
  }
});

// ----------------------------------------------------
// 2. EVENTS
// ----------------------------------------------------
app.get('/api/events', (req, res) => {
  const store = getStore();
  const eventsWithStats = store.events.map(ev => {
    const tasks = store.tasks.filter(t => t.event_id === ev.id);
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const taskRate = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;
    const expenses = store.expenses.filter(ex => ex.event_id === ev.id);
    const spent = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

    return {
      ...ev,
      taskCount: tasks.length,
      taskCompletionRate: taskRate,
      totalSpent: spent,
      remainingBudget: (ev.total_budget || 0) - spent
    };
  });
  res.json(eventsWithStats);
});

// Create a new event (for already-logged-in admin users)
app.post('/api/events', (req, res) => {
  try {
    const {
      userId,
      eventTitle,
      eventDescription,
      venue,
      eventDate,
      startTime,
      endTime,
      totalBudget
    } = req.body;

    if (!eventTitle || !venue || !eventDate) {
      return res.status(400).json({ error: 'Event title, venue, and date are required' });
    }

    const store = getStore();

    const newEvent = {
      id: store.events.length ? Math.max(...store.events.map(e => e.id)) + 1 : 1,
      title: eventTitle.trim(),
      description: eventDescription || '',
      venue: venue.trim(),
      event_date: eventDate,
      start_time: startTime || '09:00',
      end_time: endTime || '18:00',
      status: 'active',
      total_budget: Number(totalBudget) || 0,
      created_by_user_id: userId || null,
      agenda_controller_id: null,
      created_at: new Date().toISOString()
    };
    store.events.push(newEvent);

    // Do not add dummy budget allocations - new events start completely empty
    // Notifications for event creation
    store.notifications.unshift({
      id: store.notifications.length + 1,
      event_id: newEvent.id,
      user_id: null,
      title: `Event Created: ${newEvent.title}`,
      message: `New event "${newEvent.title}" has been created. Schedule and nominations are now open!`,
      type: 'system',
      is_read: false,
      created_at: new Date().toISOString()
    });

    saveStore(store);

    res.status(201).json({
      message: 'Event created successfully!',
      event: newEvent
    });
  } catch (err) {
    console.error('Create event error:', err);
    res.status(500).json({ error: 'Internal server error while creating event' });
  }
});

// ----------------------------------------------------
// 3. SCHEDULE (FR-2.1 - FR-2.4) with Conflict Detection
// ----------------------------------------------------
app.get('/api/schedules', (req, res) => {
  const store = getStore();
  const eventId = Number(req.query.eventId) || 1;
  const items = store.schedules
    .filter(s => s.event_id === eventId)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  res.json(items);
});

// Helper for time overlap check
function checkTimeOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

app.post('/api/schedules', (req, res) => {
  try {
    const { eventId, title, description, speaker, startTime, endTime, venue, colorTag } = req.body;
    if (!title || !startTime || !endTime || !venue) {
      return res.status(400).json({ error: 'Title, start time, end time, and venue are required' });
    }

    const store = getStore();
    const evId = Number(eventId) || 1;

    // FR-2.3: Overlap/conflict warning
    const conflicting = store.schedules.find(s => {
      if (s.event_id !== evId) return false;
      const venueSame = s.location_venue.toLowerCase().trim() === venue.toLowerCase().trim();
      const timeOverlaps = checkTimeOverlap(startTime, endTime, s.start_time, s.end_time);
      return venueSame && timeOverlaps;
    });

    let warning = null;
    if (conflicting) {
      warning = `Warning: This slot conflicts with "${conflicting.activity_title}" (${conflicting.start_time} - ${conflicting.end_time}) at "${conflicting.location_venue}".`;
    }

    const newItem = {
      id: store.schedules.length ? Math.max(...store.schedules.map(s => s.id)) + 1 : 1,
      event_id: evId,
      activity_title: title.trim(),
      description: description || '',
      speaker_performer: speaker || '',
      start_time: startTime,
      end_time: endTime,
      location_venue: venue.trim(),
      color_tag: colorTag || '#3B82F6'
    };

    store.schedules.push(newItem);

    // Notification
    store.notifications.unshift({
      id: store.notifications.length + 1,
      event_id: evId,
      user_id: null,
      title: 'Schedule Updated',
      message: `New activity added: "${newItem.activity_title}" at ${newItem.start_time}`,
      type: 'schedule',
      is_read: false,
      created_at: new Date().toISOString()
    });

    saveStore(store);
    res.status(201).json({ item: newItem, warning });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create schedule item' });
  }
});

app.put('/api/schedules/:id', (req, res) => {
  const store = getStore();
  const id = Number(req.params.id);
  const idx = store.schedules.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Schedule item not found' });

  const { title, description, speaker, startTime, endTime, venue, colorTag } = req.body;
  const current = store.schedules[idx];

  // Overlap check
  const conflicting = store.schedules.find(s => {
    if (s.id === id || s.event_id !== current.event_id) return false;
    const venueSame = s.location_venue.toLowerCase().trim() === (venue || current.location_venue).toLowerCase().trim();
    const timeOverlaps = checkTimeOverlap(startTime || current.start_time, endTime || current.end_time, s.start_time, s.end_time);
    return venueSame && timeOverlaps;
  });

  let warning = null;
  if (conflicting) {
    warning = `Time conflict detected with "${conflicting.activity_title}" at ${conflicting.location_venue}.`;
  }

  store.schedules[idx] = {
    ...current,
    activity_title: title !== undefined ? title.trim() : current.activity_title,
    description: description !== undefined ? description : current.description,
    speaker_performer: speaker !== undefined ? speaker : current.speaker_performer,
    start_time: startTime || current.start_time,
    end_time: endTime || current.end_time,
    location_venue: venue !== undefined ? venue.trim() : current.location_venue,
    color_tag: colorTag || current.color_tag
  };

  saveStore(store);
  res.json({ item: store.schedules[idx], warning });
});

app.delete('/api/schedules/:id', (req, res) => {
  const store = getStore();
  const id = Number(req.params.id);
  store.schedules = store.schedules.filter(s => s.id !== id);
  saveStore(store);
  res.json({ message: 'Activity removed successfully' });
});

// ----------------------------------------------------
// 4. COMMITTEE NOMINATION & VOTING (FR-3.1 - FR-3.6)
// ----------------------------------------------------
app.get('/api/elections', (req, res) => {
  const store = getStore();
  const eventId = Number(req.query.eventId) || 1;
  const positions = store.committee_positions.filter(p => p.event_id === eventId);

  const results = positions.map(pos => {
    const nominees = store.nominations
      .filter(n => n.position_id === pos.id)
      .map(nom => {
        const voteCount = store.votes.filter(v => v.position_id === pos.id && v.candidate_id === nom.candidate_id).length;
        const candidateUser = store.users.find(u => u.id === nom.candidate_id);
        return {
          ...nom,
          voteCount,
          candidateAvatar: candidateUser?.avatar_color || '#3B82F6',
          candidateEmail: candidateUser?.email || ''
        };
      });

    const totalVotes = store.votes.filter(v => v.position_id === pos.id).length;
    const winnerUser = pos.elected_winner_id ? store.users.find(u => u.id === pos.elected_winner_id) : null;

    return {
      ...pos,
      nominees,
      totalVotes,
      winner: winnerUser ? { id: winnerUser.id, name: winnerUser.full_name, email: winnerUser.email } : null
    };
  });

  res.json(results);
});

// Nominate
app.post('/api/elections/nominate', (req, res) => {
  const { positionId, candidateId, candidateName, nominatedById, manifesto } = req.body;
  if (!positionId || (!candidateId && !candidateName)) {
    return res.status(400).json({ error: 'Position and candidate details are required' });
  }

  const store = getStore();
  const pos = store.committee_positions.find(p => p.id === Number(positionId));
  if (!pos || pos.is_closed) {
    return res.status(400).json({ error: 'Nominations are closed for this position' });
  }

  // Find or create candidate
  let candId = Number(candidateId);
  let candName = candidateName;
  if (candId) {
    const user = store.users.find(u => u.id === candId);
    if (user) candName = user.full_name;
  } else {
    candId = store.users.length ? Math.max(...store.users.map(u => u.id)) + 1 : 1;
    store.users.push({
      id: candId,
      username: `student_${candId}`,
      email: `${candName.toLowerCase().replace(/\s+/g, '')}@unisphere.edu`,
      password_hash: bcrypt.hashSync('student123', 8),
      full_name: candName,
      role: 'student',
      avatar_color: '#3B82F6',
      created_at: new Date().toISOString()
    });
  }

  // Check duplicate nomination
  const dup = store.nominations.find(n => n.position_id === Number(positionId) && n.candidate_id === candId);
  if (dup) {
    return res.status(400).json({ error: 'This candidate is already nominated for this position' });
  }

  const newNomination = {
    id: store.nominations.length ? Math.max(...store.nominations.map(n => n.id)) + 1 : 1,
    position_id: Number(positionId),
    candidate_id: candId,
    candidate_name: candName,
    nominated_by_id: Number(nominatedById) || 1,
    manifesto: manifesto || 'Dedicated to serving the student committee and delivering excellence.',
    status: 'approved',
    created_at: new Date().toISOString()
  };

  store.nominations.push(newNomination);
  saveStore(store);
  res.status(201).json(newNomination);
});

// Vote (1 vote per user per position)
app.post('/api/elections/vote', (req, res) => {
  const { positionId, candidateId, voterId } = req.body;
  if (!positionId || !candidateId || !voterId) {
    return res.status(400).json({ error: 'Position, candidate, and voter must be provided' });
  }

  const store = getStore();
  const pos = store.committee_positions.find(p => p.id === Number(positionId));
  if (!pos || pos.is_closed) {
    return res.status(400).json({ error: 'Voting is currently closed for this position' });
  }

  // FR-3.3 & FR-3.6: Check secret 1 vote rule
  const existingVote = store.votes.find(
    v => v.position_id === Number(positionId) && v.voter_id === Number(voterId)
  );
  if (existingVote) {
    return res.status(400).json({ error: 'You have already voted for this committee position' });
  }

  const newVote = {
    id: store.votes.length ? Math.max(...store.votes.map(v => v.id)) + 1 : 1,
    position_id: Number(positionId),
    candidate_id: Number(candidateId),
    voter_id: Number(voterId),
    created_at: new Date().toISOString()
  };

  store.votes.push(newVote);
  saveStore(store);
  res.json({ message: 'Vote recorded successfully with confidential ballot' });
});

// Close voting & auto-elect winner (FR-3.4, FR-3.5)
app.post('/api/elections/:id/close', (req, res) => {
  const store = getStore();
  const posId = Number(req.params.id);
  const pos = store.committee_positions.find(p => p.id === posId);
  if (!pos) return res.status(404).json({ error: 'Position not found' });

  // Calculate winner
  const candidates = store.nominations.filter(n => n.position_id === posId);
  let highestVotes = -1;
  let winnerCandidateId = null;
  let winnerName = '';

  candidates.forEach(cand => {
    const count = store.votes.filter(v => v.position_id === posId && v.candidate_id === cand.candidate_id).length;
    if (count > highestVotes) {
      highestVotes = count;
      winnerCandidateId = cand.candidate_id;
      winnerName = cand.candidate_name;
    }
  });

  pos.is_closed = true;
  pos.voting_open = false;
  pos.nomination_open = false;
  pos.elected_winner_id = winnerCandidateId;

  // FR-3.5: Elected student is added automatically to committee with Coordinator/Lead role
  if (winnerCandidateId) {
    const user = store.users.find(u => u.id === winnerCandidateId);
    if (user) {
      user.role = 'coordinator';
      user.coordinator_area = pos.position_title;
    }
  }

  // Broadcast alert
  store.notifications.unshift({
    id: store.notifications.length + 1,
    event_id: pos.event_id,
    user_id: null,
    title: `Election Results: ${pos.position_title}`,
    message: `Voting has concluded! ${winnerName || 'Winner'} has been officially elected with ${highestVotes} votes.`,
    type: 'election',
    is_read: false,
    created_at: new Date().toISOString()
  });

  saveStore(store);
  res.json({ message: 'Voting closed and winner elected!', winnerName, votes: highestVotes });
});

// ----------------------------------------------------
// 5. DESIGN UPLOAD & ANONYMOUS COMMENTS (FR-4.1 - FR-4.6)
// ----------------------------------------------------
app.get('/api/designs', (req, res) => {
  const store = getStore();
  const eventId = Number(req.query.eventId) || 1;
  const category = req.query.category;

  let designs = store.designs.filter(d => d.event_id === eventId);
  if (category && category !== 'All') {
    designs = designs.filter(d => d.category.toLowerCase() === category.toLowerCase());
  }

  // Include comment counts and recent comments
  const enriched = designs.map(d => {
    const comments = store.design_comments
      .filter(c => c.design_id === d.id)
      .map(c => ({
        id: c.id,
        design_id: c.design_id,
        comment_text: c.comment_text,
        // FR-4.4: Anonymous comments mask author from everyone
        display_author: c.is_anonymous ? (c.anonymous_alias || 'Anonymous Student') : (store.users.find(u => u.id === c.author_id)?.full_name || 'Student'),
        is_anonymous: c.is_anonymous,
        created_at: c.created_at
      }));

    return {
      ...d,
      commentCount: comments.length,
      comments
    };
  });

  res.json(enriched);
});

// Upload design
app.post('/api/designs', (req, res) => {
  const { eventId, designerId, designerName, title, category, imageUrl, description } = req.body;
  if (!title || !category || !imageUrl) {
    return res.status(400).json({ error: 'Title, category, and image URL are required' });
  }

  const store = getStore();
  const newDesign = {
    id: store.designs.length ? Math.max(...store.designs.map(d => d.id)) + 1 : 1,
    event_id: Number(eventId) || 1,
    designer_id: Number(designerId) || 4,
    designer_name: designerName || 'Designer',
    title: title.trim(),
    category: category,
    image_url: imageUrl,
    description: description || '',
    created_at: new Date().toISOString()
  };

  store.designs.unshift(newDesign);

  // Notify event members
  store.notifications.unshift({
    id: store.notifications.length + 1,
    event_id: newDesign.event_id,
    user_id: null,
    title: 'New Design Proposal Uploaded',
    message: `${newDesign.designer_name} submitted a new ${newDesign.category} concept: "${newDesign.title}". Feedback welcome!`,
    type: 'design',
    is_read: false,
    created_at: new Date().toISOString()
  });

  saveStore(store);
  res.status(201).json(newDesign);
});

// Add comment (anonymous by default)
app.post('/api/designs/:id/comments', (req, res) => {
  const designId = Number(req.params.id);
  const { authorId, commentText, isAnonymous } = req.body;
  if (!commentText) {
    return res.status(400).json({ error: 'Comment text is required' });
  }

  const store = getStore();
  const design = store.designs.find(d => d.id === designId);
  if (!design) return res.status(404).json({ error: 'Design proposal not found' });

  const randomNum = Math.floor(100 + Math.random() * 900);
  const newComment = {
    id: store.design_comments.length ? Math.max(...store.design_comments.map(c => c.id)) + 1 : 1,
    design_id: designId,
    author_id: Number(authorId) || 2,
    comment_text: commentText.trim(),
    is_anonymous: isAnonymous !== false,
    anonymous_alias: `Anonymous Student #${randomNum}`,
    created_at: new Date().toISOString()
  };

  store.design_comments.push(newComment);

  // FR-4.6: Notify designer
  store.notifications.unshift({
    id: store.notifications.length + 1,
    event_id: design.event_id,
    user_id: design.designer_id,
    title: 'New Anonymous Feedback on Your Design',
    message: `Someone commented on "${design.title}": "${commentText.slice(0, 60)}..."`,
    type: 'design',
    is_read: false,
    created_at: new Date().toISOString()
  });

  saveStore(store);

  res.status(201).json({
    ...newComment,
    display_author: newComment.is_anonymous ? newComment.anonymous_alias : 'Student'
  });
});

// Admin moderate/remove comment (FR-4.5)
app.delete('/api/designs/comments/:id', (req, res) => {
  const commentId = Number(req.params.id);
  const store = getStore();
  store.design_comments = store.design_comments.filter(c => c.id !== commentId);
  saveStore(store);
  res.json({ message: 'Comment moderated and removed' });
});

// ----------------------------------------------------
// 6. CONTACTS (FR-5.1 - FR-5.5)
// ----------------------------------------------------
app.get('/api/contacts', (req, res) => {
  const store = getStore();
  const eventId = Number(req.query.eventId) || 1;
  const category = req.query.category;
  const query = req.query.q ? req.query.q.toLowerCase() : '';
  const onlyValuable = req.query.valuable === 'true';

  let list = store.contacts.filter(c => c.event_id === eventId);
  if (category && category !== 'All') {
    list = list.filter(c => c.category === category);
  }
  if (onlyValuable) {
    list = list.filter(c => c.is_valuable);
  }
  if (query) {
    list = list.filter(
      c => c.name.toLowerCase().includes(query) ||
           c.phone.includes(query) ||
           (c.email && c.email.toLowerCase().includes(query)) ||
           (c.notes && c.notes.toLowerCase().includes(query))
    );
  }

  res.json(list);
});

app.post('/api/contacts', (req, res) => {
  const { eventId, name, phone, email, category, notes, isValuable } = req.body;
  if (!name || !phone || !category) {
    return res.status(400).json({ error: 'Name, phone, and category are required' });
  }

  const store = getStore();
  const newContact = {
    id: store.contacts.length ? Math.max(...store.contacts.map(c => c.id)) + 1 : 1,
    event_id: Number(eventId) || 1,
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : '',
    category: category,
    notes: notes || '',
    is_valuable: !!isValuable,
    created_at: new Date().toISOString()
  };

  store.contacts.push(newContact);
  saveStore(store);
  res.status(201).json(newContact);
});

app.patch('/api/contacts/:id/toggle-valuable', (req, res) => {
  const store = getStore();
  const id = Number(req.params.id);
  const contact = store.contacts.find(c => c.id === id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });

  contact.is_valuable = !contact.is_valuable;
  saveStore(store);
  res.json(contact);
});

app.delete('/api/contacts/:id', (req, res) => {
  const store = getStore();
  const id = Number(req.params.id);
  store.contacts = store.contacts.filter(c => c.id !== id);
  saveStore(store);
  res.json({ message: 'Contact deleted' });
});

// ----------------------------------------------------
// 7. TO-DO LIST & PROGRESS (FR-6.1 - FR-6.6)
// ----------------------------------------------------
app.get('/api/tasks', (req, res) => {
  const store = getStore();
  const eventId = Number(req.query.eventId) || 1;
  const userId = req.query.userId ? Number(req.query.userId) : null;

  let tasks = store.tasks.filter(t => t.event_id === eventId);
  if (userId) {
    tasks = tasks.filter(t => t.assigned_to_user_id === userId);
  }

  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  const progressPercent = total ? Math.round((done / total) * 100) : 0;

  res.json({
    tasks,
    stats: { total, done, inProgress, todo, progressPercent }
  });
});

app.post('/api/tasks', (req, res) => {
  const { eventId, title, description, assignedToUserId, assignedToName, priority, dueDate, category } = req.body;
  if (!title) return res.status(400).json({ error: 'Task title is required' });

  const store = getStore();
  const newTask = {
    id: store.tasks.length ? Math.max(...store.tasks.map(t => t.id)) + 1 : 1,
    event_id: Number(eventId) || 1,
    title: title.trim(),
    description: description || '',
    assigned_to_user_id: assignedToUserId ? Number(assignedToUserId) : null,
    assigned_to_name: assignedToName || 'Unassigned',
    status: 'todo',
    priority: priority || 'medium',
    due_date: dueDate || null,
    category: category || 'General',
    created_at: new Date().toISOString()
  };

  store.tasks.unshift(newTask);

  if (newTask.assigned_to_user_id) {
    store.notifications.unshift({
      id: store.notifications.length + 1,
      event_id: newTask.event_id,
      user_id: newTask.assigned_to_user_id,
      title: 'New Task Assigned to You',
      message: `You were assigned: "${newTask.title}" (Due: ${newTask.due_date || 'TBD'})`,
      type: 'task',
      is_read: false,
      created_at: new Date().toISOString()
    });
  }

  saveStore(store);
  res.status(201).json(newTask);
});

app.patch('/api/tasks/:id/status', (req, res) => {
  const store = getStore();
  const id = Number(req.params.id);
  const { status } = req.body;
  if (!['todo', 'in_progress', 'done'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const task = store.tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  task.status = status;
  saveStore(store);
  res.json(task);
});

app.delete('/api/tasks/:id', (req, res) => {
  const store = getStore();
  const id = Number(req.params.id);
  store.tasks = store.tasks.filter(t => t.id !== id);
  saveStore(store);
  res.json({ message: 'Task deleted' });
});

// ----------------------------------------------------
// 8. BUDGETING & DONUT CHART (FR-7.1 - FR-7.4)
// ----------------------------------------------------
app.get('/api/budget', (req, res) => {
  const store = getStore();
  const eventId = Number(req.query.eventId) || 1;
  const event = store.events.find(e => e.id === eventId) || { total_budget: 45000 };

  const allocations = store.budget_allocations.filter(b => b.event_id === eventId);
  const expenses = store.expenses.filter(e => e.event_id === eventId);

  const totalSpent = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const remaining = Number(event.total_budget) - totalSpent;

  // Donut chart category grouping
  const categoryMap = {};
  allocations.forEach(a => {
    categoryMap[a.category] = {
      category: a.category,
      allocated: Number(a.allocated_amount),
      spent: 0
    };
  });

  expenses.forEach(ex => {
    if (!categoryMap[ex.category]) {
      categoryMap[ex.category] = { category: ex.category, allocated: 0, spent: 0 };
    }
    categoryMap[ex.category].spent += Number(ex.amount);
  });

  // Calculate percentages and warning flags
  const chartData = Object.values(categoryMap).map(c => {
    const isOverBudget = c.allocated > 0 && c.spent > c.allocated;
    const percentOfTotal = totalSpent > 0 ? Math.round((c.spent / totalSpent) * 100) : 0;
    return {
      ...c,
      percentOfTotal,
      isOverBudget,
      remaining: c.allocated - c.spent
    };
  });

  res.json({
    totalBudget: Number(event.total_budget),
    totalSpent,
    remainingBudget: remaining,
    isOverBudget: remaining < 0,
    categories: chartData,
    expenses: expenses.sort((a, b) => b.expense_date.localeCompare(a.expense_date))
  });
});

app.post('/api/budget/expenses', (req, res) => {
  const { eventId, category, title, amount, expenseDate, recordedByName, receiptNote } = req.body;
  if (!title || !category || !amount) {
    return res.status(400).json({ error: 'Title, category, and amount are required' });
  }

  const store = getStore();
  const newExpense = {
    id: store.expenses.length ? Math.max(...store.expenses.map(e => e.id)) + 1 : 1,
    event_id: Number(eventId) || 1,
    category,
    title: title.trim(),
    amount: Number(amount),
    expense_date: expenseDate || new Date().toISOString().split('T')[0],
    recorded_by_name: recordedByName || 'Finance Member',
    receipt_note: receiptNote || '',
    created_at: new Date().toISOString()
  };

  store.expenses.unshift(newExpense);

  // Check if category is now over budget
  const alloc = store.budget_allocations.find(a => a.event_id === newExpense.event_id && a.category === category);
  if (alloc) {
    const totalCatSpent = store.expenses
      .filter(e => e.event_id === newExpense.event_id && e.category === category)
      .reduce((sum, e) => sum + Number(e.amount), 0);

    if (totalCatSpent > alloc.allocated_amount) {
      store.notifications.unshift({
        id: store.notifications.length + 1,
        event_id: newExpense.event_id,
        user_id: null,
        title: `Budget Alert: ${category} Exceeded`,
        message: `Category "${category}" has exceeded its allocation of $${alloc.allocated_amount} (Current spent: $${totalCatSpent}).`,
        type: 'alert',
        is_read: false,
        created_at: new Date().toISOString()
      });
    }
  }

  saveStore(store);
  res.status(201).json(newExpense);
});

// ----------------------------------------------------
// 9. LIVE AGENDA (FR-9.1 - FR-9.5)
// ----------------------------------------------------
app.get('/api/agenda', (req, res) => {
  const store = getStore();
  const eventId = Number(req.query.eventId) || 1;
  const items = store.live_agenda_items
    .filter(a => a.event_id === eventId)
    .sort((a, b) => a.order_index - b.order_index);

  const nowPerforming = items.find(a => a.status === 'now_performing');
  const nowIndex = nowPerforming ? items.indexOf(nowPerforming) : -1;
  const nextUp = nowIndex !== -1 && nowIndex + 1 < items.length ? items[nowIndex + 1] : null;

  res.json({
    items,
    nowPerforming: nowPerforming || null,
    nextUp: nextUp || null
  });
});

// Controller changes status (Now Performing, Completed, Delayed)
app.patch('/api/agenda/:id/status', (req, res) => {
  const store = getStore();
  const id = Number(req.params.id);
  const { status } = req.body;

  const item = store.live_agenda_items.find(a => a.id === id);
  if (!item) return res.status(404).json({ error: 'Agenda item not found' });

  // If setting to now_performing, mark previous now_performing as completed
  if (status === 'now_performing') {
    store.live_agenda_items.forEach(a => {
      if (a.event_id === item.event_id && a.status === 'now_performing' && a.id !== id) {
        a.status = 'completed';
      }
    });

    // Notify all attendees in real time
    store.notifications.unshift({
      id: store.notifications.length + 1,
      event_id: item.event_id,
      user_id: null,
      title: 'Live Agenda: Now Performing',
      message: `"${item.title}" by ${item.performer_speaker} is NOW performing on stage!`,
      type: 'agenda',
      is_read: false,
      created_at: new Date().toISOString()
    });
  }

  item.status = status;
  saveStore(store);
  res.json(item);
});

// Controller adds delay minutes
app.patch('/api/agenda/:id/delay', (req, res) => {
  const store = getStore();
  const id = Number(req.params.id);
  const { delayMinutes } = req.body;

  const item = store.live_agenda_items.find(a => a.id === id);
  if (!item) return res.status(404).json({ error: 'Agenda item not found' });

  item.delay_minutes = (item.delay_minutes || 0) + Number(delayMinutes || 5);
  item.status = 'delayed';

  store.notifications.unshift({
    id: store.notifications.length + 1,
    event_id: item.event_id,
    user_id: null,
    title: 'Live Agenda Delay Notice',
    message: `"${item.title}" has been delayed by ${delayMinutes || 5} minutes.`,
    type: 'agenda',
    is_read: false,
    created_at: new Date().toISOString()
  });

  saveStore(store);
  res.json(item);
});

// ----------------------------------------------------
// 10. LOST AND FOUND (FR-10.1 - FR-10.4)
// ----------------------------------------------------
app.get('/api/lost-found', (req, res) => {
  const store = getStore();
  const eventId = Number(req.query.eventId) || 1;
  const type = req.query.type;
  const query = req.query.q ? req.query.q.toLowerCase() : '';

  let list = store.lost_found_items.filter(item => item.event_id === eventId);
  if (type && type !== 'all') {
    list = list.filter(item => item.type === type);
  }
  if (query) {
    list = list.filter(
      item => item.title.toLowerCase().includes(query) ||
              item.description.toLowerCase().includes(query) ||
              item.location.toLowerCase().includes(query)
    );
  }

  res.json(list.sort((a, b) => b.id - a.id));
});

app.post('/api/lost-found', (req, res) => {
  const { eventId, type, title, description, location, collectionPoint, contactInfo, imageUrl, postedByName } = req.body;
  if (!type || !title || !description || !location || !contactInfo) {
    return res.status(400).json({ error: 'Type, title, description, location, and contact are required' });
  }

  const store = getStore();
  const newItem = {
    id: store.lost_found_items.length ? Math.max(...store.lost_found_items.map(i => i.id)) + 1 : 1,
    event_id: Number(eventId) || 1,
    type,
    title: title.trim(),
    description: description.trim(),
    location: location.trim(),
    collection_point: collectionPoint || 'Helpdesk',
    contact_info: contactInfo.trim(),
    item_date: new Date().toISOString().split('T')[0],
    image_url: imageUrl || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=500&auto=format&fit=crop&q=80',
    status: 'open',
    posted_by_name: postedByName || 'Student',
    created_at: new Date().toISOString()
  };

  store.lost_found_items.unshift(newItem);
  saveStore(store);
  res.status(201).json(newItem);
});

app.patch('/api/lost-found/:id/resolve', (req, res) => {
  const store = getStore();
  const id = Number(req.params.id);
  const item = store.lost_found_items.find(i => i.id === id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  item.status = 'resolved';
  saveStore(store);
  res.json(item);
});

// ----------------------------------------------------
// 11. MEMBERS, ALERTS & LENDING TRACKER (FR-11.1 - FR-11.5 + P11, P12)
// ----------------------------------------------------
app.get('/api/members', (req, res) => {
  const store = getStore();
  const members = store.users.map(u => ({
    id: u.id,
    name: u.full_name,
    username: u.username,
    email: u.email,
    role: u.role,
    departmentArea: u.coordinator_area || 'General Volunteer',
    phone: u.phone,
    avatarColor: u.avatar_color
  }));
  res.json(members);
});

// Send Urgent Broadcast Alert (FR-11.5)
app.post('/api/alerts/broadcast', (req, res) => {
  const { eventId, title, message, targetGroup, senderName } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Alert title and message are required' });
  }

  const store = getStore();
  const alertNotification = {
    id: store.notifications.length ? Math.max(...store.notifications.map(n => n.id)) + 1 : 1,
    event_id: Number(eventId) || 1,
    user_id: null, // Broadcast to all
    title: `URGENT ALERT: ${title.trim()}`,
    message: `${message.trim()} (Sent by ${senderName || 'OC Admin'}${targetGroup ? ` to ${targetGroup}` : ''})`,
    type: 'alert',
    is_read: false,
    created_at: new Date().toISOString()
  };

  store.notifications.unshift(alertNotification);
  saveStore(store);
  res.status(201).json(alertNotification);
});

// Notifications list & read toggle
app.get('/api/notifications', (req, res) => {
  const store = getStore();
  const eventId = Number(req.query.eventId) || 1;
  const list = store.notifications.filter(n => n.event_id === eventId || !n.event_id);
  res.json(list.sort((a, b) => b.id - a.id));
});

app.patch('/api/notifications/:id/read', (req, res) => {
  const store = getStore();
  const id = Number(req.params.id);
  const notif = store.notifications.find(n => n.id === id);
  if (notif) notif.is_read = true;
  saveStore(store);
  res.json({ message: 'Marked as read' });
});

app.post('/api/notifications/read-all', (req, res) => {
  const store = getStore();
  store.notifications.forEach(n => (n.is_read = true));
  saveStore(store);
  res.json({ message: 'All notifications marked as read' });
});

// Costume & Item Lending Tracker (P11, P12)
app.get('/api/lending', (req, res) => {
  const store = getStore();
  const eventId = Number(req.query.eventId) || 1;
  const items = store.lent_items.filter(i => i.event_id === eventId);
  res.json(items);
});

app.post('/api/lending', (req, res) => {
  const { eventId, itemName, category, borrowerName, borrowerPhone, borrowedDate, expectedReturnDate, notes } = req.body;
  if (!itemName || !borrowerName || !borrowerPhone) {
    return res.status(400).json({ error: 'Item name, borrower name, and phone are required' });
  }

  const store = getStore();
  const newLent = {
    id: store.lent_items.length ? Math.max(...store.lent_items.map(l => l.id)) + 1 : 1,
    event_id: Number(eventId) || 1,
    item_name: itemName.trim(),
    category: category || 'Costume',
    borrower_name: borrowerName.trim(),
    borrower_phone: borrowerPhone.trim(),
    borrowed_date: borrowedDate || new Date().toISOString().split('T')[0],
    expected_return_date: expectedReturnDate || new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    is_returned: false,
    notes: notes || '',
    created_at: new Date().toISOString()
  };

  store.lent_items.unshift(newLent);
  saveStore(store);
  res.status(201).json(newLent);
});

app.patch('/api/lending/:id/return', (req, res) => {
  const store = getStore();
  const id = Number(req.params.id);
  const item = store.lent_items.find(l => l.id === id);
  if (!item) return res.status(404).json({ error: 'Lent item not found' });

  item.is_returned = true;
  saveStore(store);
  res.json(item);
});

// Start Server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[UniSphere API] Server listening on http://localhost:${PORT}`);
  });
});
