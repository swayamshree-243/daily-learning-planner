CREATE DATABASE IF NOT EXISTS learning_journey;
USE learning_journey;

CREATE TABLE IF NOT EXISTS topics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  skill_level ENUM('beginner','intermediate','advanced') DEFAULT 'beginner',
  weeks INT DEFAULT 4,
  hours_per_week INT DEFAULT 5
);

CREATE TABLE IF NOT EXISTS curriculum (
  id INT AUTO_INCREMENT PRIMARY KEY,
  topic_id INT,
  week_number INT,
  week_title VARCHAR(200),
  week_goal TEXT,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  curriculum_id INT,
  task_title VARCHAR(300),
  task_description TEXT,
  estimated_hours DECIMAL(4,1),
  FOREIGN KEY (curriculum_id) REFERENCES curriculum(id) ON DELETE CASCADE
);