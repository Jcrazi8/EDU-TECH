/* ---- TAB SWITCHER ---- */
  let currentRole = 'user';

  function setTab(role) {
    currentRole = role;
    document.getElementById('tabUser').classList.toggle('active', role === 'user');
    document.getElementById('tabAdmin').classList.toggle('active', role === 'admin');
    const tabSignup = document.getElementById('tabSignup');
    if (tabSignup) tabSignup.classList.toggle('active', role === 'signup');
    document.getElementById('loginError').style.display = 'none';

    /* Show login form OR signup form */
    const loginForm  = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    if (role === 'signup') {
      loginForm.style.display  = 'none';
      if (signupForm) signupForm.style.display = 'block';
    } else {
      loginForm.style.display  = 'block';
      if (signupForm) signupForm.style.display = 'none';
    }

    /* Update demo hint based on selected tab */
    const hint = document.getElementById('demoHint');
    if (!hint) return;
    if (role === 'admin') {
      hint.innerHTML = '<strong>Demo Admin:</strong> username: <code>admin</code> &nbsp;|&nbsp; password: <code>EduAdmin2026!</code><br/>These demo accounts are public and stored only in your browser for classroom use.';
    } else if (role === 'signup') {
      hint.innerHTML = '<strong>Sign Up:</strong> create your own EduTech account in seconds. No admin approval needed — your credentials live in your browser only.';
    } else {
      hint.innerHTML = '<strong>Demo User:</strong> username: <code>user1</code> &nbsp;|&nbsp; password: <code>EduUser2026!</code><br/>These demo accounts are public and stored only in your browser for classroom use.';
    }
  }

  /* ---- FORM SUBMIT — validate then authenticate ---- */
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    /* Clear previous errors */
    document.querySelectorAll('.field-error').forEach(el => el.remove());
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    document.getElementById('loginError').style.display = 'none';

    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    let valid = true;

    /* Validate username not empty */
    if (!username) {
      const err = document.createElement('span');
      err.className   = 'field-error';
      err.textContent = 'Please enter your username.';
      document.getElementById('loginUsername').classList.add('input-error');
      document.getElementById('loginUsername').parentNode.appendChild(err);
      valid = false;
    }

    /* Validate password not empty */
    if (!password) {
      const err = document.createElement('span');
      err.className   = 'field-error';
      err.textContent = 'Please enter your password.';
      document.getElementById('loginPassword').classList.add('input-error');
      document.getElementById('loginPassword').parentNode.appendChild(err);
      valid = false;
    }

    if (!valid) return;

    /* Authenticate against the credentials store in auth.js */
    const result = authenticate(username, password, currentRole);

    if (result.success) {
      /* Save session info to sessionStorage */
      sessionStorage.setItem('edutech_user', JSON.stringify({
        username: result.username,
        role: result.role,
        displayName: result.displayName
      }));

      const btn = document.getElementById('loginBtn');
      btn.textContent = 'Signing in...';
      btn.disabled = true;

      /* Redirect to the correct dashboard */
      setTimeout(() => {
        if (result.role === 'admin') {
          window.location.href = edutechUrl('admin.html');
        } else {
          window.location.href = edutechUrl('dashboard.html');
        }
      }, 800);
    } else {
      document.getElementById('loginError').style.display = 'block';
    }
  });

  /* ---- SIGNUP FORM SUBMIT ---- */
  document.addEventListener('DOMContentLoaded', function () {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;

    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      document.querySelectorAll('.field-error').forEach(el => el.remove());
      document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
      document.getElementById('loginError').style.display = 'none';

      const result = registerUser({
        username:    document.getElementById('signupUsername').value,
        password:    document.getElementById('signupPassword').value,
        displayName: document.getElementById('signupName').value,
        email:       document.getElementById('signupEmail').value
      });

      if (!result.success) {
        const errBox = document.getElementById('loginError');
        errBox.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + result.error;
        errBox.style.display = 'block';
        return;
      }

      /* Auto sign in the new account */
      sessionStorage.setItem('edutech_user', JSON.stringify({
        username:    result.user.username,
        role:        'user',
        displayName: result.user.displayName
      }));

      const btn = document.getElementById('signupBtn');
      btn.innerHTML = '<i class="fas fa-check"></i> Account created!';
      btn.disabled  = true;

      setTimeout(() => { window.location.href = edutechUrl('dashboard.html'); }, 800);
    });
  });

  /* ---- FORGOT PASSWORD ---- */
  function showForgot() {
    alert('To reset your password, contact the admin at hello@edutech.io\n\nAdmin: change passwords in the Admin Panel under "Manage Users".');
  }
