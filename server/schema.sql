-- UniSphere University Event Management System (UEMS)
-- Complete MySQL Database Schema

CREATE DATABASE IF NOT EXISTS `unisphere_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `unisphere_db`;

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(150),
  `role` ENUM('student', 'event_member', 'coordinator', 'designer', 'admin', 'live_agenda_controller') NOT NULL DEFAULT 'student',
  `coordinator_area` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(30) DEFAULT NULL,
  `avatar_color` VARCHAR(20) DEFAULT '#3B82F6',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Events Table
CREATE TABLE IF NOT EXISTS `events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `venue` VARCHAR(150) NOT NULL,
  `event_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `status` ENUM('planning', 'active', 'completed') DEFAULT 'planning',
  `total_budget` DECIMAL(10,2) DEFAULT 50000.00,
  `created_by_user_id` INT,
  `agenda_controller_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Event Members Table
CREATE TABLE IF NOT EXISTS `event_members` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `role` VARCHAR(50) DEFAULT 'Member',
  `department_area` VARCHAR(100) DEFAULT 'General',
  `status` ENUM('active', 'pending_approval', 'rejected') DEFAULT 'active',
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Schedules Table (FR-2.1 - FR-2.4)
CREATE TABLE IF NOT EXISTS `schedules` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `activity_title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `speaker_performer` VARCHAR(150),
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `location_venue` VARCHAR(150) NOT NULL,
  `color_tag` VARCHAR(20) DEFAULT '#3B82F6',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Committee Positions & Elections (FR-3.1 - FR-3.6)
CREATE TABLE IF NOT EXISTS `committee_positions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `position_title` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `nomination_open` BOOLEAN DEFAULT TRUE,
  `voting_open` BOOLEAN DEFAULT TRUE,
  `is_closed` BOOLEAN DEFAULT FALSE,
  `elected_winner_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `nominations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `position_id` INT NOT NULL,
  `candidate_id` INT NOT NULL,
  `candidate_name` VARCHAR(150) NOT NULL,
  `nominated_by_id` INT NOT NULL,
  `manifesto` TEXT,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`position_id`) REFERENCES `committee_positions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`candidate_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `votes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `position_id` INT NOT NULL,
  `candidate_id` INT NOT NULL,
  `voter_id` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_vote` (`position_id`, `voter_id`),
  FOREIGN KEY (`position_id`) REFERENCES `committee_positions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`candidate_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`voter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Design Uploads & Anonymous Comments (FR-4.1 - FR-4.6)
CREATE TABLE IF NOT EXISTS `designs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `designer_id` INT NOT NULL,
  `designer_name` VARCHAR(150) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `category` ENUM('Poster', 'T-shirt', 'Stage', 'Logo', 'Banner', 'Merch') NOT NULL,
  `image_url` TEXT NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`designer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `design_comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `design_id` INT NOT NULL,
  `author_id` INT NOT NULL,
  `comment_text` TEXT NOT NULL,
  `is_anonymous` BOOLEAN DEFAULT TRUE,
  `anonymous_alias` VARCHAR(100) DEFAULT 'Anonymous Student',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`design_id`) REFERENCES `designs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Contacts Table (FR-5.1 - FR-5.5)
CREATE TABLE IF NOT EXISTS `contacts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `email` VARCHAR(191),
  `category` ENUM('Transportation', 'Music Circle', 'Refreshments', 'Costume Rental', 'Coordinator', 'Technical/AV', 'General') NOT NULL,
  `notes` TEXT,
  `is_valuable` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tasks & To-Do List (FR-6.1 - FR-6.6)
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT,
  `assigned_to_user_id` INT,
  `assigned_to_name` VARCHAR(150),
  `status` ENUM('todo', 'in_progress', 'done') DEFAULT 'todo',
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `due_date` DATE,
  `category` VARCHAR(100) DEFAULT 'General',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Budgeting & Expenses (FR-7.1 - FR-7.4)
CREATE TABLE IF NOT EXISTS `budget_allocations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `allocated_amount` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `expense_date` DATE NOT NULL,
  `recorded_by_name` VARCHAR(150),
  `receipt_note` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Live Agenda (FR-9.1 - FR-9.5)
CREATE TABLE IF NOT EXISTS `live_agenda_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `order_index` INT DEFAULT 0,
  `title` VARCHAR(200) NOT NULL,
  `performer_speaker` VARCHAR(150),
  `scheduled_time` VARCHAR(20) NOT NULL,
  `duration_minutes` INT DEFAULT 15,
  `status` ENUM('upcoming', 'now_performing', 'completed', 'delayed') DEFAULT 'upcoming',
  `delay_minutes` INT DEFAULT 0,
  `notes` TEXT,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Lost and Found (FR-10.1 - FR-10.4)
CREATE TABLE IF NOT EXISTS `lost_found_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `type` ENUM('lost', 'found') NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `location` VARCHAR(150) NOT NULL,
  `collection_point` VARCHAR(150),
  `contact_info` VARCHAR(100) NOT NULL,
  `item_date` DATE NOT NULL,
  `image_url` TEXT,
  `status` ENUM('open', 'resolved') DEFAULT 'open',
  `posted_by_name` VARCHAR(150),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notifications and Broadcast Alerts (FR-8.1 - FR-8.4, FR-11.5)
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `user_id` INT DEFAULT NULL,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `type` ENUM('alert', 'schedule', 'task', 'election', 'design', 'agenda', 'system') DEFAULT 'system',
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Costume & Item Lending Tracker (P11, P12)
CREATE TABLE IF NOT EXISTS `lent_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_id` INT NOT NULL,
  `item_name` VARCHAR(150) NOT NULL,
  `category` ENUM('Costume', 'Musical Instrument', 'AV Equipment', 'Props & Decor', 'Other') DEFAULT 'Costume',
  `borrower_name` VARCHAR(150) NOT NULL,
  `borrower_phone` VARCHAR(30) NOT NULL,
  `borrowed_date` DATE NOT NULL,
  `expected_return_date` DATE NOT NULL,
  `is_returned` BOOLEAN DEFAULT FALSE,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
