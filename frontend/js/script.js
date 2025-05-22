const API_URL = 'http://localhost:1337/api/books?populate=cover'; 

// Fetch books
async function fetchBooks() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        console.log("API Response:", data);
        const bookArray = data.data;
        showBooks(bookArray);
    } catch (error) {
        console.error("Kunde inte hämta böcker:", error);
    }
}

function showBooks(bookArray) {
    function isUserLoggedIn() {
        return !!localStorage.getItem('bookducksJWT');
    }

    const bookList = document.getElementById('book-list');
    bookList.innerHTML = "";

    if (!bookArray || bookArray.length === 0) {
        bookList.innerHTML = '<p>Det gick inte att hämta böcker:</p>';
        return;
    }

    bookArray.forEach(book => {
        let coverUrl = "";
        if (book.cover && book.cover.url) {
            coverUrl = `http://localhost:1337${book.cover.url}`;
        } else if (book.cover && book.cover.data && book.cover.data.attributes && book.cover.data.attributes.url) {
            coverUrl = `http://localhost:1337${book.cover.data.attributes.url}`;
        }

        const { id, title, author, pages, published } = book;

        const bookCard = document.createElement('article');
        bookCard.classList.add('book-card');
        bookCard.innerHTML = `
            <div class="book-card-container">
                <img src="${coverUrl}" alt="Omslag för ${title}" />
                <div class="title-author">
                    <h2>${title}</h2>
                    <h3>${author}</h3>
                </div>
                <div class="pages-published">
                    <p>Antal sidor: ${pages}</p>
                    <p>Utgivningsdatum:<br> ${published}</p>
                </div>
                ${isUserLoggedIn() ? `<button class="save-btn" data-bookid="${id}">Spara till läslista</button>` : ''}
            </div>
        `;
        bookList.appendChild(bookCard);
    });

    document.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', async function () {
            const bookId = this.dataset.bookid;
            await saveBookToReadingList(bookId);
        });
    });
}

fetchBooks();

async function saveBookToReadingList(bookId) {
    const jwt = localStorage.getItem('bookducksJWT');
    const user = JSON.parse(localStorage.getItem('bookducksUser'));
    if (!jwt || !user) {
        alert('Du måste vara inloggad för att lägga till i läslistan!');
        return;
    }
    try {
        const response = await fetch('http://localhost:1337/api/reading-list-items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jwt}`,
            },
            body: JSON.stringify({
                data: {
                    user: user.id,
                    book: Number(bookId)
                }
            }),
        });
        const data = await response.json();

        console.log("SaveBook response", data); 

        if (data.data) {
            alert('Bok sparad i din läslista');
        } else if (data.error) {
            alert(data.error.message);
            console.log("SaveBook ERROR:", data.error); 
            if (data.error.details) {
                console.log("Error details:", data.error.details);
            }
        } else {
            alert('Något gick fel (okänt fel)');
        }
    } catch (error) {
        alert('Det gick inte att spara boken. Försök igen senare.');
        console.error("SaveBook JS Error:", error);
    }
}



const showReadingListBtn = document.getElementById('show-reading-list');
const readingListSection = document.getElementById('reading-list-section');

showReadingListBtn.addEventListener('click', async function () {
    await fetchAndShowReadingList();
});

async function fetchAndShowReadingList() {
    const jwt = localStorage.getItem('bookducksJWT');
    const user = JSON.parse(localStorage.getItem('bookducksUser'));
    if (!jwt || !user) return;

    try {
        const response = await fetch(
            `http://localhost:1337/api/reading-list-items?filters[user][id]=${user.id}&populate=book,book.cover`,
            {
                headers: {
                    'Authorization': `Bearer ${jwt}`,
                }
            }
        );
        const data = await response.json();
        const items = data.data;

        readingListSection.innerHTML = `<h2>${user.username}s läslista</h2>`;
        if (!items.length) {
            readingListSection.innerHTML += '<p>Du har inga böcker i din läslista ännu.</p>';
        } else {
            items.forEach(item => {
                let book = item.book;
                if (book && book.data && book.data.attributes) {
                    book = { ...book.data.attributes, id: book.data.id };
                }
                let coverUrl = "";
                if (book && book.cover && book.cover.url) {
                    coverUrl = `http://localhost:1337${book.cover.url}`;
                } else if (book && book.cover && book.cover.data && book.cover.data.attributes && book.cover.data.attributes.url) {
                    coverUrl = `http://localhost:1337${book.cover.data.attributes.url}`;
                }
                readingListSection.innerHTML += `
                    <div class="reading-list-item">
                        ${coverUrl ? `<img src="${coverUrl}" alt="Omslag för ${book.title}" style="height:50px;">` : ''}
                        <span><strong>${book.title}</strong> av ${book.author}</span>
                    </div>
                `;
            });
        }
        readingListSection.style.display = 'block';
    } catch (error) {
        alert('Kunde inte hämta din läslista!');
    }
}
