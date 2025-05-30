const openModalBtn       = document.getElementById('auth-modal-btn');
const authModal          = document.getElementById('auth-modal');
const closeAuthModalBtn  = document.getElementById('close-auth-modal');
const loginTab           = document.getElementById('show-login');
const registerTab        = document.getElementById('show-register');
const loginForm          = document.getElementById('login-form');
const registerForm       = document.getElementById('register-form');
const userInfo           = document.getElementById('user-info');
const welcomeText        = document.getElementById('welcome-text');
const logoutBtn          = document.getElementById('logout-btn');


const testEmail = 'test@example.com';

const AUTH_API_URL = 'http://localhost:1337/api';

// Modal tab switching
openModalBtn.addEventListener('click', () => {
  authModal.style.display    = 'flex';
  loginForm.style.display    = 'flex';
  registerForm.style.display = 'none';
});
closeAuthModalBtn.addEventListener('click', () => authModal.style.display = 'none');
authModal.addEventListener('click', e => {
  if (e.target === authModal) authModal.style.display = 'none';
});
loginTab.addEventListener('click', () => {
  loginForm.style.display    = 'flex';
  registerForm.style.display = 'none';
  loginTab.classList.add('active');
  registerTab.classList.remove('active');
});
registerTab.addEventListener('click', () => {
  loginForm.style.display    = 'none';
  registerForm.style.display = 'flex';
  loginTab.classList.remove('active');
  registerTab.classList.add('active');
});

// Registration
registerForm.addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('register-username').value;
  const email    = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

 
  console.log('Registrering skickad:', username, email, password);

  try {
    const res  = await fetch(`${AUTH_API_URL}/auth/local/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (data.user && data.jwt) {
      alert('Registrering lyckades! Du kan nu logga in.');
      registerForm.reset();
    } else {
      alert(data.error?.message || 'Registrering misslyckades.');
    }
  } catch {
    alert('Något gick fel vid registrering.');
  }
});

// Login 
loginForm.addEventListener('submit', e => {
  e.preventDefault();
  const identifier = document.getElementById('login-identifier').value;
  const password   = document.getElementById('login-password').value;

  fetch(`${AUTH_API_URL}/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password })
  })
    .then(res => res.json())
    .then(data => {
      console.log('Login response:', data); 
      if (data.user && data.jwt) {
        localStorage.setItem('bookducksUser', JSON.stringify(data.user));
        localStorage.setItem('bookducksJWT', data.jwt);
        showLoggedInUser();
        authModal.style.display = 'none';
      } else {
        alert('Login failed. Försök igen!');
      }
    })
    .catch(() => {
      alert('Något gick visst fel 😬');
    });
});

// Logout
logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('bookducksUser');
  localStorage.removeItem('bookducksJWT');
  showLoggedOutUser();
});

// Update UI in login state
function showLoggedInUser() {
  const user = JSON.parse(localStorage.getItem('bookducksUser'));
  if (!user) return;

  if (localStorage.getItem('bookducksJWT') !== null) {
    console.log('Användaren verkar vara inloggad redan');
  }

  logoutBtn.style.display = 'inline-block';
  openModalBtn.style.display = 'none';
  userInfo.style.display     = 'block';
  welcomeText.textContent    = `Vad vill du läsa idag, ${user.username}?`;

  if (typeof showReadingListBtn !== 'undefined') showReadingListBtn.style.display = 'inline-block';
  if (typeof showReadingListContainer !== 'undefined') showReadingListContainer.style.display = 'block';
  // if (profileLink) profileLink.style.display = 'inline-block';
}

function showLoggedOutUser() {
  logoutBtn.style.display = 'none';
  openModalBtn.style.display = 'inline-block';
  userInfo.style.display     = 'none';
  if (typeof showReadingListBtn !== 'undefined') showReadingListBtn.style.display = 'none';
  if (typeof showReadingListContainer !== 'undefined') showReadingListContainer.style.display = 'none';
  // if (profileLink) profileLink.style.display = 'none';
  if (typeof readingListSection !== 'undefined') {
    readingListSection.innerHTML = '';
    readingListSection.style.display = 'none';
  }
}

// Kontroll om användaren är inloggad
function checkLoggedInUser() {
  if (localStorage.getItem('bookducksJWT')) {
    showLoggedInUser();
  } else {
    showLoggedOutUser();
  }
}

checkLoggedInUser();
