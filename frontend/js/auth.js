const openModalBtn = document.getElementById('auth-modal-btn');
const authModal = document.getElementById('auth-modal');
const closeAuthModalBtn= document.getElementById('close-auth-modal');
const loginTab = document.getElementById('show-login');
const registerTab = document.getElementById('show-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

// NOTE: Lägg till dessa för att kunna styra läslistaknappen!
// const showReadingListBtn = document.getElementById('show-reading-list');
// const readingListSection = document.getElementById('reading-list-section');

//Open the modal
openModalBtn.addEventListener('click', () => {
    authModal.style.display = 'flex';
    showLoginForm();
});

//Close the modal
closeAuthModalBtn.addEventListener('click', () => {
    authModal.style.display = 'none';
});

//And close the modal if you click outside of the modal
authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
        authModal.style.display = 'none';
    }
});

//Show login vs register
loginTab.addEventListener('click', showLoginForm);
registerTab.addEventListener('click', showRegisterForm);

function showLoginForm(){
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
    loginTab.classList.add('active');
    registerTab.classList.remove('active')
}

function showRegisterForm() {
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
}

const AUTH_API_URL = 'http://localhost:1337/api';
const userInfo = document.getElementById('user-info');
const welcomeText = document.getElementById('welcome-text');
const logoutBtn = document.getElementById('logout-btn');

//To see if someone is logged in when page load
checkLoggedInUser();

//Register
registerForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(`${AUTH_API_URL}/auth/local/register`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username, email, password}),
        });
        const data = await response.json();

        if (data.data) {
            alert('Registrering lyckades! Du kan nu logga in.');
            registerForm.reset();
            showLoginForm();
        }   else if (data.error) {
            alert(data.error.message);
            }
      } catch (error) {
        alert('Något gick fel vid registrering.');
      }
});

//Login 
loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const identifier = document.getElementById('login-identifier').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${AUTH_API_URL}/auth/local`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ identifier, password}),
        });

        const data = await response.json();

        if (data.user && data.jwt) {
            localStorage.setItem('bookducksUser', JSON.stringify(data.user));
            localStorage.setItem('bookducksJWT', data.jwt);
            showLoggedInUser();
            loginForm.reset();
            authModal.style.display = 'none'; //closing the modal when signing in
        } else if (data.error) {
            alert(data.error.message);
        }
    } catch (error) {
        alert('Något fick fel vid inloggningen.');
    }
});

// Logout
logoutBtn.addEventListener('click', function () {
    localStorage.removeItem('bookducksUser');
    localStorage.removeItem('bookducksJWT');
    showLoggedOutUser();
});

//show logged in user
function showLoggedInUser() {
    const user = JSON.parse(localStorage.getItem('bookducksUser'));
    if (user) {
        openModalBtn.style.display = 'none';
        userInfo.style.display = 'block'
        welcomeText.textContent = `Välkommen, ${user.username}!`;
        // Show reading list button when logged in
        showReadingListBtn.style.display = 'inline-block';
    }
}

function showLoggedOutUser() {
    openModalBtn.style.display = 'inline-block';
    userInfo.style.display = 'none';
    // Hide reading list button and section when logged out
    showReadingListBtn.style.display = 'none';
    readingListSection.style.display = 'none';
}


//check login mode when load
function checkLoggedInUser() {
    const jwt = localStorage.getItem('bookducksJWT');
    if (jwt) {
        showLoggedInUser();
    } else {
        showLoggedOutUser();
    }
}