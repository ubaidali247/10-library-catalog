const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3010;
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ============================================================
// FLAKINESS INJECTION LAYER v2
// MSc Dissertation - AI-Assisted Flaky Test Detection
// Probabilities tuned for ~30-40% failure rate
// ============================================================
const FLAKY_CONFIG = {
  enabled: true,
  slowProbability: 0.30,   // 30% chance of slow GET response
  errorProbability: 0.20,  // 20% chance of 500 on POST
  slowDelayMs: { min: 2000, max: 4500 }  // Below Cypress 8s timeout but enough to cause issues
};

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shouldBeFlaky(prob) {
  return FLAKY_CONFIG.enabled && Math.random() < prob;
}

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = { books: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function seedIfEmpty() {
  const db = readDB();
  if (db.books.length === 0) {
    db.books = [
    {
        "id": "seed-1",
        "title": "The Great Gatsby",
        "description": "Sample description for research study item 1.",
        "category": "Fiction",
        "createdAt": "2024-01-01T10:00:00.000Z",
        "author": "J.K. Rowling",
        "isbn": "978-1000000000",
        "year": "1950"
    },
    {
        "id": "seed-2",
        "title": "1984",
        "description": "Sample description for research study item 2.",
        "category": "Non-Fiction",
        "createdAt": "2024-02-02T10:00:00.000Z",
        "author": "George Orwell",
        "isbn": "978-1000000001",
        "year": "1957"
    },
    {
        "id": "seed-3",
        "title": "Pride and Prejudice",
        "description": "Sample description for research study item 3.",
        "category": "Science",
        "createdAt": "2024-03-03T10:00:00.000Z",
        "author": "Jane Austen",
        "isbn": "978-1000000002",
        "year": "1964"
    },
    {
        "id": "seed-4",
        "title": "The Hobbit",
        "description": "Sample description for research study item 4.",
        "category": "History",
        "createdAt": "2024-04-04T10:00:00.000Z",
        "author": "Tolkien",
        "isbn": "978-1000000003",
        "year": "1971"
    },
    {
        "id": "seed-5",
        "title": "The Old Man and the Sea",
        "description": "Sample description for research study item 5.",
        "category": "Fiction",
        "createdAt": "2024-05-05T10:00:00.000Z",
        "author": "Hemingway",
        "isbn": "978-1000000004",
        "year": "1978"
    },
    {
        "id": "seed-6",
        "title": "Harry Potter",
        "description": "Sample description for research study item 6.",
        "category": "Non-Fiction",
        "createdAt": "2024-06-06T10:00:00.000Z",
        "author": "J.K. Rowling",
        "isbn": "978-1000000005",
        "year": "1985"
    },
    {
        "id": "seed-7",
        "title": "Dune",
        "description": "Sample description for research study item 7.",
        "category": "Science",
        "createdAt": "2024-07-07T10:00:00.000Z",
        "author": "George Orwell",
        "isbn": "978-1000000006",
        "year": "1992"
    },
    {
        "id": "seed-8",
        "title": "To Kill a Mockingbird",
        "description": "Sample description for research study item 8.",
        "category": "History",
        "createdAt": "2024-08-08T10:00:00.000Z",
        "author": "Jane Austen",
        "isbn": "978-1000000007",
        "year": "1999"
    }
];
    writeDB(db);
  }
}
seedIfEmpty();

// GET all - 30% chance of slow response
app.get('/api/books', (req, res) => {
  const handler = () => {
    const db = readDB();
    let items = db.books;
    if (req.query.search) {
      const q = req.query.search.toLowerCase();
      items = items.filter(i => (i.title && i.title.toLowerCase().includes(q)) || (i.name && i.name.toLowerCase().includes(q)));
    }
    if (req.query.category) items = items.filter(i => i.category === req.query.category);
    res.json(items);
  };
  if (shouldBeFlaky(FLAKY_CONFIG.slowProbability)) {
    const delay = randomDelay(FLAKY_CONFIG.slowDelayMs.min, FLAKY_CONFIG.slowDelayMs.max);
    console.log(`[FLAKY] Slow GET /api/books +${delay}ms`);
    setTimeout(handler, delay);
  } else { handler(); }
});

// GET one
app.get('/api/books/:id', (req, res) => {
  const db = readDB();
  const item = db.books.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// POST - 20% chance of 500 error
app.post('/api/books', (req, res) => {
  if (shouldBeFlaky(FLAKY_CONFIG.errorProbability)) {
    console.log(`[FLAKY] 500 error on POST /api/books`);
    return res.status(500).json({ error: 'Flaky server error - injected for research' });
  }
  const db = readDB();
  const item = { id: uuidv4(), ...req.body, createdAt: new Date().toISOString() };
  db.books.push(item);
  writeDB(db);
  res.status(201).json(item);
});

// PUT update
app.put('/api/books/:id', (req, res) => {
  const db = readDB();
  const idx = db.books.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.books[idx] = { ...db.books[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeDB(db);
  res.json(db.books[idx]);
});

// DELETE
app.delete('/api/books/:id', (req, res) => {
  const db = readDB();
  const idx = db.books.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  db.books.splice(idx, 1);
  writeDB(db);
  res.json({ message: 'Deleted successfully' });
});

app.post('/api/reset', (req, res) => {
  writeDB({ books: [] });
  seedIfEmpty();
  res.json({ message: 'Reset complete' });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', project: 'Library Catalog', flakyEnabled: FLAKY_CONFIG.enabled }));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => console.log('Library Catalog running on http://localhost:3010 [FLAKY v2]'));
