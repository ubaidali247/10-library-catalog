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

// Seed data if empty
function seedIfEmpty() {
  const db = readDB();
  if (db.books.length === 0) {
    db.books = [
    {
        "id": "seed-1",
        "title": "The Great Gatsby",
        "description": "Sample description for The Great Gatsby. This is test data for the flaky test detection research study.",
        "category": "Fiction",
        "createdAt": "2026-07-21T00:21:18.652Z",
        "status": "available",
        "author": "J.K. Rowling",
        "isbn": "978-8811707957",
        "year": "1950",
        "genre": "Fiction"
    },
    {
        "id": "seed-2",
        "title": "1984",
        "description": "Sample description for 1984. This is test data for the flaky test detection research study.",
        "category": "Non-Fiction",
        "createdAt": "2026-07-20T00:21:18.652Z",
        "status": "borrowed",
        "author": "George Orwell",
        "isbn": "978-1100855168",
        "year": "1957",
        "genre": "Non-Fiction"
    },
    {
        "id": "seed-3",
        "title": "Pride and Prejudice",
        "description": "Sample description for Pride and Prejudice. This is test data for the flaky test detection research study.",
        "category": "Science",
        "createdAt": "2026-07-19T00:21:18.652Z",
        "status": "reserved",
        "author": "Jane Austen",
        "isbn": "978-9248149146",
        "year": "1964",
        "genre": "Science"
    },
    {
        "id": "seed-4",
        "title": "The Hobbit",
        "description": "Sample description for The Hobbit. This is test data for the flaky test detection research study.",
        "category": "History",
        "createdAt": "2026-07-18T00:21:18.652Z",
        "status": "available",
        "author": "Tolkien",
        "isbn": "978-5521470986",
        "year": "1971",
        "genre": "History"
    },
    {
        "id": "seed-5",
        "title": "The Old Man and the Sea",
        "description": "Sample description for The Old Man and the Sea. This is test data for the flaky test detection research study.",
        "category": "Biography",
        "createdAt": "2026-07-17T00:21:18.652Z",
        "status": "borrowed",
        "author": "Hemingway",
        "isbn": "978-3499310444",
        "year": "1978",
        "genre": "Biography"
    },
    {
        "id": "seed-6",
        "title": "Harry Potter",
        "description": "Sample description for Harry Potter. This is test data for the flaky test detection research study.",
        "category": "Technology",
        "createdAt": "2026-07-16T00:21:18.652Z",
        "status": "reserved",
        "author": "J.K. Rowling",
        "isbn": "978-2904707371",
        "year": "1985",
        "genre": "Technology"
    },
    {
        "id": "seed-7",
        "title": "Dune",
        "description": "Sample description for Dune. This is test data for the flaky test detection research study.",
        "category": "Fiction",
        "createdAt": "2026-07-15T00:21:18.652Z",
        "status": "available",
        "author": "George Orwell",
        "isbn": "978-1704951472",
        "year": "1992",
        "genre": "Fiction"
    },
    {
        "id": "seed-8",
        "title": "To Kill a Mockingbird",
        "description": "Sample description for To Kill a Mockingbird. This is test data for the flaky test detection research study.",
        "category": "Non-Fiction",
        "createdAt": "2026-07-14T00:21:18.652Z",
        "status": "borrowed",
        "author": "Jane Austen",
        "isbn": "978-8473529061",
        "year": "1999",
        "genre": "Non-Fiction"
    },
    {
        "id": "seed-9",
        "title": "The Alchemist",
        "description": "Sample description for The Alchemist. This is test data for the flaky test detection research study.",
        "category": "Science",
        "createdAt": "2026-07-13T00:21:18.652Z",
        "status": "reserved",
        "author": "Tolkien",
        "isbn": "978-6341748365",
        "year": "2006",
        "genre": "Science"
    },
    {
        "id": "seed-10",
        "title": "Brave New World",
        "description": "Sample description for Brave New World. This is test data for the flaky test detection research study.",
        "category": "History",
        "createdAt": "2026-07-12T00:21:18.652Z",
        "status": "available",
        "author": "Hemingway",
        "isbn": "978-4589403071",
        "year": "2013",
        "genre": "History"
    }
];
    writeDB(db);
  }
}
seedIfEmpty();

// GET all
app.get('/api/books', (req, res) => {
  const db = readDB();
  let items = db.books;
  if (req.query.search) {
    const q = req.query.search.toLowerCase();
    items = items.filter(i => i.title && i.title.toLowerCase().includes(q) || (i.name && i.name.toLowerCase().includes(q)));
  }
  if (req.query.category) {
    items = items.filter(i => i.category === req.query.category);
  }
  res.json(items);
});

// GET one
app.get('/api/books/:id', (req, res) => {
  const db = readDB();
  const item = db.books.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// POST create
app.post('/api/books', (req, res) => {
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

// Reset endpoint for testing
app.post('/api/reset', (req, res) => {
  const initial = { books: [] };
  writeDB(initial);
  seedIfEmpty();
  res.json({ message: 'Database reset' });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', project: 'Library Catalog' }));

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.listen(PORT, () => console.log('Library Catalog server running on http://localhost:3010'));
