const mongoose = require('mongoose');
const slugify = require('slugify');

const VersionSchema = new mongoose.Schema({
  title: String,
  content: String,
  tags: [String],
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const NoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, index: true },
  content: { type: String, default: '' },
  tags: { type: [String], index: true },
  versions: { type: [VersionSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// simple text index for quick search
NoteSchema.index({ title: 'text', content: 'text', tags: 'text' });

NoteSchema.pre('save', function (next) {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  this.updatedAt = Date.now();
  next();
});

// save a version before updating content
NoteSchema.methods.pushVersion = function () {
  this.versions = this.versions || [];
  this.versions.unshift({ title: this.title, content: this.content, tags: this.tags });
  // keep max 20 versions
  if (this.versions.length > 20) this.versions.length = 20;
};

module.exports = mongoose.model('Note', NoteSchema);
