-- University Event Management System - Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) DEFAULT 'Student' CHECK (role IN ('Student', 'Event Member', 'Coordinator', 'Designer', 'Admin', 'Live Agenda Controller')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  venue VARCHAR(200),
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Event members table
CREATE TABLE IF NOT EXISTS event_members (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'Member',
  area VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Schedule activities table
CREATE TABLE IF NOT EXISTS schedule_activities (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  speaker VARCHAR(200),
  location VARCHAR(200),
  color VARCHAR(7) DEFAULT '#3b82f6',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add new schedule columns to databases created before they existed
ALTER TABLE schedule_activities ADD COLUMN IF NOT EXISTS speaker VARCHAR(200);
ALTER TABLE schedule_activities ADD COLUMN IF NOT EXISTS location VARCHAR(200);
ALTER TABLE schedule_activities ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3b82f6';

-- Election / nomination period table
CREATE TABLE IF NOT EXISTS elections (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  nomination_start TIMESTAMP NOT NULL,
  nomination_end TIMESTAMP NOT NULL,
  voting_start TIMESTAMP NOT NULL,
  voting_end TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'nominating', 'voting', 'closed')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Committee positions table
CREATE TABLE IF NOT EXISTS committee_positions (
  id SERIAL PRIMARY KEY,
  election_id INTEGER REFERENCES elections(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT
);

-- Nominations table
CREATE TABLE IF NOT EXISTS nominations (
  id SERIAL PRIMARY KEY,
  position_id INTEGER REFERENCES committee_positions(id) ON DELETE CASCADE,
  nominee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  nominated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(position_id, nominee_id)
);

-- Votes table (confidential - no direct link to voter exposed in queries)
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  position_id INTEGER REFERENCES committee_positions(id) ON DELETE CASCADE,
  nominee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  voter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(position_id, voter_id)
);

-- Committee members table (auto-populated after election)
CREATE TABLE IF NOT EXISTS committee_members (
  id SERIAL PRIMARY KEY,
  election_id INTEGER REFERENCES elections(id) ON DELETE CASCADE,
  position_id INTEGER REFERENCES committee_positions(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Design uploads table
CREATE TABLE IF NOT EXISTS designs (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  designer_id INTEGER REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('poster', 't-shirt', 'stage', 'logo', 'social media flyer', 'other')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Design comments table (supports anonymous)
CREATE TABLE IF NOT EXISTS design_comments (
  id SERIAL PRIMARY KEY,
  design_id INTEGER REFERENCES designs(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  comment_text TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  notes TEXT,
  category VARCHAR(50) CHECK (category IN ('Transportation', 'Music Circle', 'Refreshments', 'Costume Rental', 'Coordinator', 'Other')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  assignee_id INTEGER REFERENCES users(id),
  due_date DATE,
  section VARCHAR(20) DEFAULT 'todo' CHECK (section IN ('todo', 'in_progress', 'done')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Budget table
CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  total_budget DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Budget category allocations table
CREATE TABLE IF NOT EXISTS budget_categories (
  id SERIAL PRIMARY KEY,
  budget_id INTEGER REFERENCES budgets(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  allocated_amount DECIMAL(12, 2) NOT NULL DEFAULT 0
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  budget_id INTEGER REFERENCES budgets(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES budget_categories(id),
  amount DECIMAL(12, 2) NOT NULL,
  description VARCHAR(255),
  expense_date DATE NOT NULL,
  recorded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('schedule_change', 'new_task', 'deadline', 'election_result', 'agenda_change', 'alert', 'general')),
  title VARCHAR(200) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, type)
);

-- Agenda table
CREATE TABLE IF NOT EXISTS agendas (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(id),
  controller_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Agenda items table
CREATE TABLE IF NOT EXISTS agenda_items (
  id SERIAL PRIMARY KEY,
  agenda_id INTEGER REFERENCES agendas(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  performer VARCHAR(200),
  scheduled_time TIME,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'now_performing', 'completed', 'delayed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Lost and found table
CREATE TABLE IF NOT EXISTS lost_found_posts (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(10) NOT NULL CHECK (type IN ('lost', 'found')),
  description TEXT NOT NULL,
  photo_url VARCHAR(500),
  location VARCHAR(200),
  collection_point VARCHAR(200),
  post_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id),
  message TEXT NOT NULL,
  target_group VARCHAR(50) DEFAULT 'all',
  created_at TIMESTAMP DEFAULT NOW()
);
