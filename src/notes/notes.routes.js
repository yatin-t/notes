const express = require('express');
const router = express.Router();
const Note = require('./notes.model');

// Create
router.post('/', async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    const note = new Note({ title, content, tags });
    note.pushVersion();
    await note.save();
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List with query: search, tag, limit
router.get('/', async (req, res) => {
  try {
    const { q, tag, limit = 50 } = req.query;
    const filter = {};
    if (tag) filter.tags = tag;
    let query = Note.find(filter).sort({ updatedAt: -1 }).limit(parseInt(limit, 10));
    if (q) {
      query = Note.find({ $text: { $search: q } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(parseInt(limit, 10));
    }
    const notes = await query.exec();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update (push version)
router.put('/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Not found' });
    // push current state to versions
    note.pushVersion();
    const { title, content, tags } = req.body;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;
    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Restore a version by index (0 = most recent previous)
router.post('/:id/restore', async (req, res) => {
  try {
    const { versionIndex = 0 } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Not found' });
    const v = note.versions[versionIndex];
    if (!v) return res.status(400).json({ error: 'Invalid version' });
    // push current state, then restore
    note.pushVersion();
    note.title = v.title;
    note.content = v.content;
    note.tags = v.tags;
    await note.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
