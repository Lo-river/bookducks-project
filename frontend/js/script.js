// FIXA KOD SOM FUNGERAR + COLOR THEME 23 maj 14.45

function isUserLoggedIn() {
  return !!localStorage.getItem('bookducksJWT');
}

if (localStorage.getItem('bookducksJWT') !== null) {
  console.log('JWT finns i localStorage, kanske inloggad?');
}

if (window.location.pathname.includes('profile.html')) {
  // if not signed in, send to start page
  if (!localStorage.getItem('bookducksJWT')) {
    alert('Du måste logga in för att se din profil.');
    window.location = 'index.html';
  } else {
    loadReadingListMap().then(() => {
      fetchAndShowReadingList();
    });
  }
}

const API_URL = 'http://localhost:1337/api/books?populate=cover';
let readingListMap = {};

const showReadingListContainer = document.getElementById('show-reading-list-container');
const showReadingListBtn = document.getElementById('show-reading-list');
const readingListSection = document.getElementById('reading-list-section');

//  Fetch theme from Strapi and apply CSS-class on <body>
async function applyTheme() {
  try {
    const response = await fetch('http://localhost:1337/api/site-setting');
    const data = await response.json();
    const theme = data.data.theme;
    document.body.classList.add(`theme-${theme}`);
  } catch (error) {
    console.error('Kunde inte hämta temat från servern:', error);
  }
}
// Load reading-list map
async function loadReadingListMap() {
  const jwt = localStorage.getItem('bookducksJWT');
  const user = JSON.parse(localStorage.getItem('bookducksUser'));
  readingListMap = {};
  if (!jwt || !user) return;

  const url = `http://localhost:1337/api/reading-list-items?filters[user][id]=${user.id}&populate=book.cover`;

  console.log('Fetching reading list with URL:', url);

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${jwt}` }
  });
  const json = await res.json();

  json.data.forEach(item => {
    if (item.book && item.book.id) {
      readingListMap[item.book.id] = item.documentId;
    }
  });
}
// Fetch and render books
async function fetchBooks() {
  try {
    const res = await fetch(API_URL);
    res.json().then(json => {
      console.log('Hämtade böcker:', json.data);
      showBooks(json.data);
    });
  } catch (err) {
    console.error('Failed to fetch books:', err);
  }
}

function showBooks(books) {
  const bookList = document.getElementById('book-list');
  bookList.innerHTML = '';

  books.forEach(book => {
    const coverUrl = book.cover?.url ? `http://localhost:1337${book.cover.url}` : '';
    const inList = readingListMap.hasOwnProperty(book.id);
    const btnClass = inList ? 'remove-btn' : 'add-btn';
    const iconSvg = inList
      ? `<img src="assets/icons/heart-btn-f55454-fill.svg" alt="Remove from list" class="heart-icon">`
      : `<img src="assets/icons/heart-btn-black.svg" alt="Add to list" class="heart-icon">`;

    const card = document.createElement('article');
    card.className = 'book-card';

  
    const buttonHtml = isUserLoggedIn()
      ? `<button class="heart-btn ${btnClass}" data-bookid="${book.id}">${iconSvg}</button>`
      : '';

    card.innerHTML = `
      <div class="book-card-content">
        <div class="cover-wrapper">
          ${coverUrl ? `<img src="${coverUrl}" id="cover" alt="Omslag för ${book.title}" />` : ''}
          ${buttonHtml}
        </div>
        <div class="book-info">
          <div class="title-author">
            <p class="book-title">${book.title}</p>
            <p class="book-author">${book.author}</p>
          </div>
          <div class="pages-published">
            <p><strong>Antal sidor:</strong> ${book.pages}</p>
            <p><strong>Utgivningsdatum:</strong> ${book.published || ''}</p>
          </div>
        </div>
      </div>
    `;
    bookList.appendChild(card);
  });

  document.querySelectorAll('.add-btn').forEach(btn =>
    btn.addEventListener('click', () => toggleReadingList(btn, 'add'))
  );
  document.querySelectorAll('.remove-btn').forEach(btn =>
    btn.addEventListener('click', () => toggleReadingList(btn, 'remove'))
  );
}

// Toggle add/remove
async function toggleReadingList(button, action) {
  const bookId = Number(button.dataset.bookid);
  const jwt = localStorage.getItem('bookducksJWT');
  if (!jwt) return alert('Du måste vara inloggad!');

  console.log('Togglar läslista för:', bookId, 'med action:', action);

  if (action === 'add') {
    await saveBookToReadingList(bookId);
  } else {
    const itemDocId = readingListMap[bookId];
    if (itemDocId) {
      await removeBookFromReadingList(itemDocId);
    }
  }

  await loadReadingListMap();
  await fetchBooks();

  if (readingListSection.style.display !== 'none') {
    fetchAndShowReadingList();
  }
}
// Save a book
async function saveBookToReadingList(bookId) {
  const jwt = localStorage.getItem('bookducksJWT');
  const user = JSON.parse(localStorage.getItem('bookducksUser'));

  try {
    const res = await fetch('http://localhost:1337/api/reading-list-items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        data: {
          user: user.id,
          book: bookId
        }
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Okänt fel');
    }
  } catch (e) {
    console.error(e);
    alert(e.message || 'Det gick inte att lägga till boken.');
  }
}

// Remove a book
async function removeBookFromReadingList(itemDocId) {
  const jwt = localStorage.getItem('bookducksJWT');
  try {
    const res = await fetch(
      `http://localhost:1337/api/reading-list-items/${itemDocId}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt}` }
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Okänt fel vid borttagning');
    }
  } catch (e) {
    console.error(e);
    alert(e.message);
  }
}

// Fetch & show reading list
// Toggle & fetch, with sorting
showReadingListBtn.addEventListener('click', async () => {
  const isHidden = readingListSection.style.display === 'none'
                || readingListSection.style.display === '';
  if (isHidden) {
    await fetchAndShowReadingList();      //open
    showReadingListBtn.textContent = 'Göm läslista';
  } else {
    readingListSection.style.display = 'none';  //close
    showReadingListBtn.textContent = 'Visa läslista';
  }
});

async function fetchAndShowReadingList(sortBy = null) {
  const jwt = localStorage.getItem('bookducksJWT');
  const user = JSON.parse(localStorage.getItem('bookducksUser'));
  if (!jwt || !user) return;

  try {
    // Fetch
    const url = `http://localhost:1337/api/reading-list-items?filters[user][id]=${user.id}&populate=book.cover`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${jwt}` } });
    const json = await res.json();
    let items = json.data;

    // sort
    if (sortBy === 'title') {
      items.sort((a, b) => a.book.title.localeCompare(b.book.title, 'sv'));
    }
    if (sortBy === 'author') {
      items.sort((a, b) => a.book.author.localeCompare(b.book.author, 'sv'));
    }
//  <h2 class="reading-list-h2">${user.username}'s läslista</h2>
    readingListSection.innerHTML = `
      <div class="reading-list-controls">
        <h2 class="reading-list-h2">Din läslista:</h2>
        <label for="sort-select"></label>
        <select id="sort-select">
          <option value="">Sortera</option>
          <option value="title">Titel A-Ö</option>
          <option value="author">Författare A-Ö</option>
        </select>
      </div>
      <div class="reading-list-wrapper"></div>
    `;

    document.getElementById('sort-select')
      .addEventListener('change', (event) => {
        const sortBy = event.target.value;
        fetchAndShowReadingList(sortBy);
      });

    const wrapper = readingListSection.querySelector('.reading-list-wrapper');
    
    const spacer = document.createElement('div');
    spacer.classList.add('scroll-spacer');
    wrapper.appendChild(spacer);

     //  "build" books and add/remove buttons
    items.forEach(item => {
      const book = item.book;
      const coverUrl = book.cover?.url ? `http://localhost:1337${book.cover.url}` : '';
      const btnClass = 'remove-btn';
       // const icon     = inList ? 'bi-suit-heart-fill' : 'bi-suit-heart';
      const iconSvg = `<img src="assets/icons/heart-btn-f55454-fill.svg" alt="Ta bort från lista" class="heart-icon">`;


      const buttonHtml = isUserLoggedIn()
        ? `<button class="heart-btn ${btnClass}" data-bookid="${book.id}">${iconSvg}</button>`
        : '';

      wrapper.innerHTML += `
        <div class="reading-list-item">
          ${coverUrl ? `<img src="${coverUrl}" alt="Omslag för ${book.title}" style="height:50px;">` : ''}
          <div class="reading-list-info">
            <span><strong class="reading-list-title">${book.title}</strong></span>
          </div>
          ${buttonHtml}
        </div>
      `;
    });

    // connect add/remove-buttons
    if (isUserLoggedIn()) {
      wrapper.querySelectorAll('.add-btn').forEach(btn =>
        btn.addEventListener('click', () => toggleReadingList(btn, 'add'))
      );
      wrapper.querySelectorAll('.remove-btn').forEach(btn =>
        btn.addEventListener('click', () => toggleReadingList(btn, 'remove'))
      );
    }

    // show list
    readingListSection.style.display = 'block';

  } catch (e) {
    console.error(e);
    alert('Kunde inte hämta din läslista!');
  }
}

// Init everything
function init() {
  applyTheme().then(() => {
      // if on profile.html only reading list appear
    if (window.location.pathname.includes('profile.html')) {
      loadReadingListMap().then(() => fetchAndShowReadingList());
    } else {
      // Otherwise index.html
      loadReadingListMap().then(() => {
        fetchBooks();
        fetchAndShowReadingList();
      });
    }
  });
}

init();



//For reading-list if I want author there: <span>av ${book.author}</span> under book.title