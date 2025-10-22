const api = path => `/api/notes${path || ''}`;

const $ = id => document.getElementById(id);

const searchInput = $('search');
const tagFilter = $('tagFilter');
const notesList = $('notesList');
const newBtn = $('newBtn');

const titleIn = $('title');
const contentIn = $('content');
const tagsIn = $('tags');
const saveBtn = $('saveBtn');
const deleteBtn = $('deleteBtn');
const versionsSel = $('versions');
const restoreBtn = $('restoreBtn');
const charCount = $('charCount');
const wordCount = $('wordCount');

let current = null;

async function list(q, tag) {
  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  if (tag) qs.set('tag', tag);
  const res = await fetch(api(`?${qs.toString()}`));
  const notes = await res.json();
  notesList.innerHTML = '';
  
  if (notes.length === 0) {
    notesList.innerHTML = '<li style="opacity:0.5;cursor:default;text-align:center;padding:20px;">No notes found</li>';
    return;
  }
  
  for (const n of notes) {
    const li = document.createElement('li');
    
    const titleDiv = document.createElement('div');
    titleDiv.style.fontWeight = '600';
    titleDiv.style.marginBottom = '4px';
    titleDiv.textContent = n.title || 'Untitled';
    
    const metaDiv = document.createElement('div');
    metaDiv.style.fontSize = '12px';
    metaDiv.style.color = 'var(--text-muted)';
    metaDiv.style.display = 'flex';
    metaDiv.style.gap = '8px';
    metaDiv.style.flexWrap = 'wrap';
    
    if (n.tags && n.tags.length) {
      n.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.textContent = '#' + tag;
        tagSpan.style.background = 'linear-gradient(135deg, #eef2ff, #fae8ff)';
        tagSpan.style.padding = '2px 8px';
        tagSpan.style.borderRadius = '6px';
        tagSpan.style.color = '#6366f1';
        tagSpan.style.fontWeight = '600';
        tagSpan.style.border = '1px solid #e0e7ff';
        metaDiv.appendChild(tagSpan);
      });
    }
    
    li.appendChild(titleDiv);
    li.appendChild(metaDiv);
    li.onclick = () => select(n);
    
    if (current && current._id === n._id) {
      li.classList.add('active');
    }
    
    notesList.appendChild(li);
  }
}

async function select(n) {
  current = n;
  titleIn.value = n.title || '';
  contentIn.value = n.content || '';
  tagsIn.value = n.tags ? n.tags.join(', ') : '';
  updateCounts();
  
  // populate versions
  versionsSel.innerHTML = '<option value="">Version History</option>';
  if (n.versions && n.versions.length) {
    n.versions.forEach((v, i) => {
      const o = document.createElement('option');
      o.value = i;
      const date = new Date(v.createdAt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      o.textContent = `${date} - ${v.title || 'Untitled'}`;
      versionsSel.appendChild(o);
    });
  }
  
  // refresh list to show active state
  list(searchInput.value, tagFilter.value);
}

function updateCounts() {
  const text = contentIn.value;
  charCount.textContent = `${text.length} characters`;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  wordCount.textContent = `${words} words`;
}

newBtn.onclick = () => {
  current = null;
  titleIn.value = '';
  contentIn.value = '';
  tagsIn.value = '';
  versionsSel.innerHTML = '<option value="">Version History</option>';
  updateCounts();
  titleIn.focus();
  
  // Remove active state from list
  document.querySelectorAll('#notesList li').forEach(li => li.classList.remove('active'));
};

saveBtn.onclick = async () => {
  const payload = {
    title: titleIn.value.trim() || 'Untitled',
    content: contentIn.value,
    tags: tagsIn.value.split(',').map(s => s.trim()).filter(Boolean)
  };
  
  try {
    if (current && current._id) {
      const res = await fetch(api(`/${current._id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      current = await res.json();
      select(current);
      showNotification('Note updated successfully!', 'success');
    } else {
      const res = await fetch(api(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      current = await res.json();
      select(current);
      showNotification('Note created successfully!', 'success');
    }
    list(searchInput.value, tagFilter.value);
  } catch (err) {
    showNotification('Error saving note', 'error');
  }
};

deleteBtn.onclick = async () => {
  if (!current || !current._id) return showNotification('Please select a note to delete', 'error');
  if (!confirm('Delete this note? This action cannot be undone.')) return;
  
  try {
    await fetch(api(`/${current._id}`), { method: 'DELETE' });
    current = null;
    titleIn.value = contentIn.value = tagsIn.value = '';
    versionsSel.innerHTML = '<option value="">Version History</option>';
    updateCounts();
    list(searchInput.value, tagFilter.value);
    showNotification('Note deleted', 'success');
  } catch (err) {
    showNotification('Error deleting note', 'error');
  }
};

restoreBtn.onclick = async () => {
  if (!current || !current._id) return showNotification('Please select a note', 'error');
  const idx = parseInt(versionsSel.value, 10);
  if (isNaN(idx)) return showNotification('Please select a version to restore', 'error');
  
  try {
    await fetch(api(`/${current._id}/restore`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionIndex: idx })
    });
    const res = await fetch(api(`/${current._id}`));
    current = await res.json();
    select(current);
    list(searchInput.value, tagFilter.value);
    showNotification('Version restored!', 'success');
  } catch (err) {
    showNotification('Error restoring version', 'error');
  }
};

let searchTimeout;
searchInput.oninput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => list(searchInput.value, tagFilter.value), 300);
};

tagFilter.oninput = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => list(searchInput.value, tagFilter.value), 300);
};

contentIn.oninput = updateCounts;

function showNotification(message, type = 'info') {
  const notif = document.createElement('div');
  notif.textContent = message;
  notif.style.position = 'fixed';
  notif.style.bottom = '24px';
  notif.style.right = '24px';
  notif.style.padding = '12px 20px';
  notif.style.borderRadius = '8px';
  notif.style.color = 'white';
  notif.style.fontWeight = '500';
  notif.style.fontSize = '14px';
  notif.style.zIndex = '1000';
  notif.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  notif.style.animation = 'slideIn 0.3s ease';
  
  if (type === 'success') notif.style.background = '#10b981';
  else if (type === 'error') notif.style.background = '#ef4444';
  else notif.style.background = '#667eea';
  
  document.body.appendChild(notif);
  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + S to save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveBtn.click();
  }
  // Ctrl/Cmd + N to new note
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault();
    newBtn.click();
  }
});

// Initial load
list();
updateCounts();
