const session = requireAuth('admin');
if (session) {
  document.getElementById('adminWelcome').textContent = `Welcome back, ${session.displayName}.`;
}

let currentFilter = 'all';
let aiConversationLog = [];
let activityLog = [];        // newest-first array fetched from the server

function showPanel(name, event) {
  document.querySelectorAll('.admin-panel').forEach(panel => panel.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));
  document.getElementById(`panel-${name}`).classList.add('active');
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('active');
  }
  refreshData();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatLogTime(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

async function fetchAiLogs() {
  const statusEl = document.getElementById('aiLogStatusText');
  try {
    const response = await fetch('/.netlify/functions/ai-logs?limit=100', {
      headers: { 'Cache-Control': 'no-store' }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Unable to load AI conversation logs.');
    }
    if (statusEl) {
      statusEl.textContent = `Showing ${Array.isArray(data.logs) ? data.logs.length : 0} most recent shared AI conversations.`;
    }
    return Array.isArray(data.logs) ? data.logs : [];
  } catch (error) {
    if (statusEl) {
      statusEl.textContent = `${error.message} Shared guest moderation logs require the Netlify Functions backend and Blobs storage.`;
    }
    return [];
  }
}

async function refreshData() {
  // getActivityLog() is now async — it fetches from the Netlify Function
  // (server-side store) instead of reading localStorage on this device.
  const [log, aiLogs] = await Promise.all([
    getActivityLog(),
    fetchAiLogs()
  ]);
  activityLog = log;
  aiConversationLog = aiLogs;
  const users = getUsers();

  document.getElementById('statSupport').textContent = log.filter(entry => entry.type === 'support_request').length;
  document.getElementById('statSub').textContent = log.filter(entry => entry.type === 'subscription_attempt').length;
  document.getElementById('statContact').textContent = log.filter(entry => entry.type === 'contact_form').length;
  document.getElementById('statUsers').textContent = users.length;
  document.getElementById('statAi').textContent = aiConversationLog.length;

  document.getElementById('activityBadge').textContent = log.length || '';
  document.getElementById('aiBadge').textContent = aiConversationLog.length || '';

  renderActivityTable('recentActivityTable', log.slice(0, 5));
  renderActivityTable('activityTable', currentFilter === 'all' ? log : log.filter(entry => entry.type === currentFilter));
  renderAiLogTable(aiConversationLog);
  renderUsersTable(users);

  const select = document.getElementById('editUserSelect');
  if (select) {
    select.innerHTML = users.map(user => `<option value="${escapeHtml(user.username)}">${escapeHtml(user.displayName)} (${escapeHtml(user.username)})</option>`).join('');
  }
}

function renderActivityTable(tbodyId, data) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><i class="fas fa-inbox"></i>No activity yet. Activity appears when users submit the contact form, request support, or attempt to subscribe.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(entry => `
    <tr>
      <td style="color:var(--muted);font-size:0.8rem;white-space:nowrap;">${escapeHtml(entry.timestamp || 'Unknown')}</td>
      <td>${typeBadge(entry.type)}</td>
      <td style="font-weight:600;">${escapeHtml(entry.name || entry.user || '-')}</td>
      <td style="color:var(--muted);font-size:0.85rem;">${escapeHtml(entry.details || '-')}</td>
    </tr>
  `).join('');
}

function renderAiLogTable(data) {
  const tbody = document.getElementById('aiLogTable');
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i class="fas fa-robot"></i>No AI conversations logged yet.</div></td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(entry => `
    <tr>
      <td style="color:var(--muted);font-size:0.8rem;white-space:nowrap;">${escapeHtml(formatLogTime(entry.createdAt))}</td>
      <td style="font-weight:600;">${escapeHtml(entry.actorLabel || 'Guest Visitor')}</td>
      <td style="color:var(--muted);font-size:0.82rem;">${escapeHtml(entry.page || 'Unknown')}</td>
      <td style="font-size:0.85rem;line-height:1.5;">${escapeHtml(entry.prompt || '-')}</td>
      <td style="color:var(--muted);font-size:0.85rem;line-height:1.5;">${escapeHtml(entry.reply || '-')}</td>
    </tr>
  `).join('');
}

function typeBadge(type) {
  if (type === 'support_request') return '<span class="badge-support">Support Request</span>';
  if (type === 'subscription_attempt') return '<span class="badge-sub">Subscription</span>';
  if (type === 'contact_form') return '<span class="badge-contact">Contact Form</span>';
  if (type === 'certification_request') return '<span class="badge-support">Certification</span>';
  return `<span>${escapeHtml(type || 'event')}</span>`;
}

function filterActivity(type, btn) {
  currentFilter = type;
  document.querySelectorAll('.filter-btn').forEach(button => button.classList.remove('active'));
  btn.classList.add('active');
  // Filter the cached server log, no extra round-trip needed.
  renderActivityTable('activityTable', type === 'all' ? activityLog : activityLog.filter(entry => entry.type === type));
}

async function clearActivity() {
  if (!confirm('Clear all activity logs from the server? This cannot be undone.')) return;
  try {
    const cleared = await clearActivityLog();
    console.log(`[EduTech] Cleared ${cleared} activity entries.`);
  } catch (err) {
    alert(`Could not clear activity: ${err.message}`);
  }
  refreshData();
}

async function clearAiLogs() {
  if (!confirm('Clear all shared AI conversation logs? This cannot be undone.')) return;
  const statusEl = document.getElementById('aiLogStatusText');
  try {
    const response = await fetch('/.netlify/functions/ai-logs', { method: 'DELETE' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Unable to clear AI logs.');
    }
    if (statusEl) {
      statusEl.textContent = `Cleared ${data.cleared || 0} AI conversation log entries.`;
    }
    refreshData();
  } catch (error) {
    if (statusEl) {
      statusEl.textContent = error.message;
    }
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTable');
  if (!tbody) return;
  tbody.innerHTML = users.map(user => `
    <tr>
      <td style="font-weight:600;">${escapeHtml(user.displayName)}</td>
      <td style="font-family:var(--font-mono);font-size:0.82rem;color:var(--accent);">${escapeHtml(user.username)}</td>
      <td style="color:var(--muted);font-size:0.85rem;">${escapeHtml(user.email || '-')}</td>
      <td>${user.plan === 'Subscriber ($9.99/mo)' ? '<span class="badge-premium">Subscriber</span>' : '<span class="badge-basic">Basic</span>'}</td>
      <td style="color:var(--muted);font-size:0.82rem;">${escapeHtml(user.joined || '-')}</td>
    </tr>
  `).join('');
}

function addUser() {
  const displayName = document.getElementById('newDisplayName').value.trim();
  const email = document.getElementById('newEmail').value.trim();
  const username = document.getElementById('newUsername').value.trim();
  const password = document.getElementById('newPassword').value.trim();
  const plan = document.getElementById('newPlan').value;

  if (!displayName || !username || !password) { alert('Display name, username and password are required.'); return; }
  if (password.length < 8) { alert('Password must be at least 8 characters.'); return; }

  const users = getUsers();
  if (users.find(user => user.username.toLowerCase() === username.toLowerCase())) {
    alert('A user with that username already exists.');
    return;
  }

  users.push({
    username,
    password,
    role: 'user',
    displayName,
    email,
    plan,
    joined: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  });
  saveUsers(users);

  ['newDisplayName', 'newEmail', 'newUsername', 'newPassword'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('addUserToast').style.display = 'block';
  setTimeout(() => document.getElementById('addUserToast').style.display = 'none', 3000);
  refreshData();
}

function changeAdminCreds() {
  const curUser = document.getElementById('adminCurrentUser').value.trim();
  const curPass = document.getElementById('adminCurrentPass').value;
  const newUser = document.getElementById('adminNewUser').value.trim();
  const newPass = document.getElementById('adminNewPass').value;

  if (!curUser || !curPass) { alert('Enter your current credentials first.'); return; }
  const admins = getAdmins();
  const idx = admins.findIndex(admin => admin.username.toLowerCase() === curUser.toLowerCase() && admin.password === curPass);
  if (idx === -1) { alert('Current credentials are incorrect.'); return; }
  if (!newUser && !newPass) { alert('Enter at least a new username or new password.'); return; }
  if (newPass && newPass.length < 8) { alert('New password must be at least 8 characters.'); return; }

  if (newUser) admins[idx].username = newUser;
  if (newPass) admins[idx].password = newPass;
  if (newUser) admins[idx].displayName = 'Admin - EduTech';
  saveAdmins(admins);

  document.getElementById('adminCredToast').style.display = 'block';
  setTimeout(() => { logout(); }, 2500);
}

function changeUserCreds() {
  const selected = document.getElementById('editUserSelect').value;
  const newUser = document.getElementById('editUserNewUsername').value.trim();
  const newPass = document.getElementById('editUserNewPassword').value;

  if (!newUser && !newPass) { alert('Enter at least a new username or password.'); return; }
  if (newPass && newPass.length < 8) { alert('Password must be at least 8 characters.'); return; }

  const users = getUsers();
  const idx = users.findIndex(user => user.username === selected);
  if (idx === -1) { alert('User not found.'); return; }

  if (newUser) users[idx].username = newUser;
  if (newPass) users[idx].password = newPass;
  saveUsers(users);

  document.getElementById('editUserNewUsername').value = '';
  document.getElementById('editUserNewPassword').value = '';
  document.getElementById('userCredToast').style.display = 'block';
  setTimeout(() => document.getElementById('userCredToast').style.display = 'none', 3000);
  refreshData();
}

function deleteSelectedUser() {
  const selected = document.getElementById('editUserSelect').value;
  if (!confirm(`Delete user "${selected}"? This cannot be undone.`)) return;
  saveUsers(getUsers().filter(user => user.username !== selected));
  refreshData();
}

refreshData();
setInterval(refreshData, 10000);
