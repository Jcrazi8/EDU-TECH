/* ---- AUTH GUARD ---- */
  const session = requireAuth('user');
  let currentUser = null;

  if (session) {
    /* Load full user data from credentials store */
    const users = getUsers();
    currentUser = users.find(u => u.username === session.username) || {};

    document.getElementById('dashName').textContent  = session.displayName;
    document.getElementById('dashPlan').textContent  = currentUser.plan || 'Basic (Free)';
    document.getElementById('infoName').textContent  = session.displayName;
    document.getElementById('infoUser').textContent  = session.username;
    document.getElementById('infoJoined').textContent = currentUser.joined || '—';

    /* Hide upgrade card if already on a paid plan */
    if (currentUser.plan && currentUser.plan !== 'Basic (Free)') {
      document.getElementById('upgradeSection').style.display = 'none';
    }
  }

  /* ---- SUPPORT REQUEST FORM ---- */
  document.getElementById('supportForm').addEventListener('submit', function(e) {
    e.preventDefault();

    /* Clear errors */
    document.querySelectorAll('.field-error').forEach(el => el.remove());
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));

    const desc = document.getElementById('issueDesc').value.trim();
    let valid = true;

    /* Validate description */
    if (desc.length < 10) {
      const err = document.createElement('span');
      err.className   = 'field-error';
      err.textContent = 'Please describe your issue in at least 10 characters.';
      document.getElementById('issueDesc').classList.add('input-error');
      document.getElementById('issueDesc').parentNode.appendChild(err);
      valid = false;
    }
    if (!valid) return;

    const issueType     = document.getElementById('issueType').value;
    const contactMethod = document.getElementById('contactMethod').value;

    /* Log to admin activity feed (server-side, not localStorage).
       Pulls the signed-in user's email so they can also receive a
       receipt copy of their support request.                       */
    const sessionUser = (typeof getUsers === 'function')
      ? (getUsers().find(u => session && u.username === session.username) || {})
      : {};

    logActivity('support_request', {
      name:    session ? session.displayName : 'Guest',
      user:    session ? session.username : 'guest',
      email:   sessionUser.email || '',
      subject: `[${issueType}] support request`,
      message: desc,
      details: `[${issueType}] ${desc.substring(0, 80)}${desc.length > 80 ? '\u2026' : ''} | Contact via: ${contactMethod}`
    });

    const btn = this.querySelector('.btn-submit');
    btn.textContent = 'Submitting...';
    btn.disabled    = true;

    setTimeout(() => {
      btn.textContent = 'Submit Support Request';
      btn.disabled    = false;
      this.reset();
      document.getElementById('supportSuccess').style.display = 'block';
      setTimeout(() => document.getElementById('supportSuccess').style.display = 'none', 6000);
    }, 1000);
  });

  /* ---- SUBSCRIPTION ---- */
  let selectedPlan = '';

  function selectPlan(el, plan) {
    document.querySelectorAll('.sub-plan').forEach(p => p.classList.remove('selected'));
    el.classList.add('selected');
    selectedPlan = plan;
  }

  function submitSubscription() {
    if (!selectedPlan) { alert('Please select a plan first.'); return; }

    /* Log subscription attempt to the server-side activity feed. */
    const sessionUser2 = (typeof getUsers === 'function')
      ? (getUsers().find(u => session && u.username === session.username) || {})
      : {};

    logActivity('subscription_attempt', {
      name:    session ? session.displayName : 'Guest',
      user:    session ? session.username : 'guest',
      email:   sessionUser2.email || '',
      subject: `Subscription inquiry: ${selectedPlan}`,
      message: `Requested upgrade to: ${selectedPlan}`,
      details: `Requested upgrade to: ${selectedPlan}`
    });

    document.getElementById('subSuccess').style.display = 'block';
    setTimeout(() => document.getElementById('subSuccess').style.display = 'none', 6000);
  }
