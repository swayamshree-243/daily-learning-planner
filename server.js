require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// DB connection
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ───── TOPICS ─────

// GET topics
app.get('/api/topics', async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM topics ORDER BY id DESC');
  res.json(rows);
});

// ADD topic
app.post('/api/topics', async (req, res) => {
  const { title, description, skill_level, weeks, hours_per_week } = req.body;

  if (!title) return res.status(400).json({ error: 'Title required' });

  const [r] = await db.execute(
    'INSERT INTO topics (title, description, skill_level, weeks, hours_per_week) VALUES (?,?,?,?,?)',
    [title, description || '', skill_level || 'beginner', weeks || 4, hours_per_week || 5]
  );

  res.json({ id: r.insertId });
});

// ───── GENERATE + SAVE PLAN ─────
app.post('/api/schedule/generate/:id', async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM topics WHERE id=?', [req.params.id]);
  if (!rows.length) return res.json([]);

  const topic = rows[0];

  // delete old
  await db.execute('DELETE FROM curriculum WHERE topic_id=?', [topic.id]);

  const hoursPerDay = (topic.hours_per_week / 7).toFixed(1);

  for (let w = 1; w <= topic.weeks; w++) {
    const [weekRes] = await db.execute(
      'INSERT INTO curriculum (topic_id, week_number, week_title, week_goal) VALUES (?,?,?,?)',
      [topic.id, w, `Week ${w}`, `Complete week ${w}`]
    );

    for (let d = 1; d <= 7; d++) {
      await db.execute(
        'INSERT INTO tasks (curriculum_id, task_title, task_description, estimated_hours) VALUES (?,?,?,?)',
        [
          weekRes.insertId,
          `Day ${d}: ${topic.title}`,
          'Study + Practice',
          hoursPerDay
        ]
      );
    }
  }

  res.json({ message: "Saved in DB" });
});

// ───── GET PLAN ─────
app.get('/api/schedule/:id', async (req, res) => {
  const [weeks] = await db.execute(
    'SELECT * FROM curriculum WHERE topic_id=? ORDER BY week_number',
    [req.params.id]
  );

  for (const w of weeks) {
    const [tasks] = await db.execute(
      'SELECT * FROM tasks WHERE curriculum_id=?',
      [w.id]
    );
    w.tasks = tasks;
  }

  res.json(weeks);
});

// serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Running at http://localhost:${PORT}`));