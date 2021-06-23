//TODO: Add in firebase support
//TODO: Add in dropdown for info and storage selection
//TODO: Restructure storage to tie library to uid

let library;
var uid;
var dbLibraryRef;

//Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyCr0EwgpvxgtIvYUAiKaxD6QEcEIXXoXZQ",
    authDomain: "librarywebapp-b7c7b.firebaseapp.com",
    databaseURL: "https://librarywebapp-b7c7b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "librarywebapp-b7c7b",
    storageBucket: "librarywebapp-b7c7b.appspot.com",
    messagingSenderId: "412462863620",
    appId: "1:412462863620:web:8d7b9e3678db103e806c51"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

initApp = function() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
        // User is signed in.
        var displayName = user.displayName;
        var email = user.email;
        var emailVerified = user.emailVerified;
        var photoURL = user.photoURL;
        uid = user.uid;
        var phoneNumber = user.phoneNumber;
        var providerData = user.providerData;

        document.querySelector('#header-title').innerText = `Welcome, ${displayName}.`;
        document.querySelector('.login').classList.add('invisible');
        document.querySelector('#logout-btn').classList.remove('invisible');

        //gets 'library' object from firebase db
        dbLibraryRef = firebase.database().ref('library/' + uid);
        //syncs the data in real time based on event (value change in this case)
        dbLibraryRef.on('value', snapshot => {
            if (snapshot.val() == null){
                let library = [
                    new Book('Sapiens', 'Yuval Noah Harari', 480, true),
                    new Book('Meditations', 'Marcus Aurelius', 254, false)
                ];
                dbLibraryRef.set(library);
                displayBooks(library);
            }
            else {
                library = snapshot.val();
                for (let i = 0; i < library.length; i++) {
                    Object.setPrototypeOf(library[i], Book.prototype);
                }
                displayBooks(library);
            }
        });
        }
        else {
        // User is signed out.
        document.querySelector('#header-title').innerText = "My Library";
        document.querySelector('.login').classList.remove('invisible');
        document.querySelector('#logout-btn').classList.add('invisible');
        }
    }, function(error) {
        console.log(error);
    });

    
};

//run initApp on loading in browser
window.addEventListener('load', function() {
    initApp()
});

function saveUserLibraryFireBase() {
    dbLibraryRef.set(library);
}

library = [
    new Book('Sapiens', 'Yuval Noah Harari', 480, true),
    new Book('Meditations', 'Marcus Aurelius', 254, false)
];

function Book(title, author, pages, status) {
    //book constructor
    this.title = title;
    this.author = author;
    this.pages = pages;
    this.status = status;
}

Book.prototype.changeReadStatus = function() {
    this.status = !this.status;
};

function addBookToLibrary(title, author, pages, status){
    //creates a book and adds it to library array
    library.push(new Book(title, author, pages, status));
    saveUserLibraryFireBase();
}

//resets content area everytime function is called so that all cases (deletion and addition of books) are handled with 1 general function
function displayBooks(library) {
    let contentArea = document.querySelector('#library');
    //sets content area to just contain the table heading initially
    contentArea.innerHTML = `<tr>
                                <th>Title</th>
                                <th>Author</th>
                                <th>Pages</th>
                                <th>Status</th>
                                <th><button style="visibility: hidden;">delete</button></th>
                            </tr>`;

    //iterates over books in library array, creates elements for each property and appends them to content area
    for (let i = 0; i < library.length; i ++){
        //add to display area
        let bookRow = document.createElement('tr');
        bookRow.setAttribute('data-index', i);

        let title = document.createElement('td');
        title.innerText = `${library[i].title}`;
        bookRow.appendChild(title);

        let author = document.createElement('td');
        author.innerText = `${library[i].author}`;
        bookRow.appendChild(author);

        let pages = document.createElement('td');
        pages.innerText = `${library[i].pages}`;
        bookRow.appendChild(pages);

        let status = document.createElement('td');
        let statusButton = document.createElement('button');
        statusButton.innerText = `${library[i].status ? 'Read' : 'Not Read'}`
        statusButton.addEventListener('click', callChangeStatus);
        status.appendChild(statusButton);
        bookRow.appendChild(status);

        let deleteCell = document.createElement('td');
        let deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'Delete';
        deleteBtn.classList.add('red-bg');
        deleteBtn.addEventListener('click', deleteBook);
        deleteCell.appendChild(deleteBtn);
        bookRow.appendChild(deleteCell);

        contentArea.appendChild(bookRow);
    }
}

//click event handler to delete book in question
function deleteBook(e) {
    const parentIndex = e.target.parentElement.parentElement.attributes[0].value;
    if (!(confirm(`Are you sure you want to delete ${library[parentIndex].title}?`))) return; //prompt for confirmation incase of accidental deletion
    library.splice(parentIndex, 1);
    displayBooks(library);
    saveUserLibraryFireBase();
}

//click eventlistener to change status of book in library and also the display
function callChangeStatus(e) {
    const parentIndex = e.target.parentElement.parentElement.attributes[0].value;
    library[parentIndex].changeReadStatus();
    if (e.target.innerText === 'Read') {
        e.target.innerText = 'Not Read';
    }
    else {
        e.target.innerText = 'Read';
    }
    saveUserLibraryFireBase();
}

//toggles popup for adding new book's visibility on click of the plus button on bottom right
document.querySelector('#add-book').addEventListener('click', togglePopupVisibility);

//event handler function for toggling visibility of add book popup
function togglePopupVisibility(e) {
    const popup = document.querySelector('#add-book-popup');
    popup.classList.toggle('invisible');
}

//runs function to add new book into library array upon clicking submit button
const popupSubmitButton = document.querySelector('#add-submit');
popupSubmitButton.addEventListener('click', newBookFormInput);
function newBookFormInput(e) {
    //takes input from popup form for adding a new book
    e.preventDefault();
    const form = document.querySelector('#add-book-popup > form');
    const title = document.querySelector('#add-title').value;
    const author = document.querySelector('#add-author').value;
    const pages = document.querySelector('#add-pages').value;
    const status = document.querySelector('#add-status').value === 'read' ? true : false;

    if (hasEmptyFields(title, author, pages, status)) return;
    //TODO: add checks for empty fields
    addBookToLibrary(title, author, pages, status);

    document.querySelector('#add-book-popup').classList.toggle('invisible'); //makes form go away after submission
    displayBooks(library); //repopulates booklist so new book is displayed
    form.reset();
}

//checks for empty fields before adding a new book to library array and alerts the fields that are empty
function hasEmptyFields(title, author, pages, status) {
    let emptyFields = [];
    if (title === '') {
        emptyFields.push('title');
    }
    if (author === '') {
        emptyFields.push('author');
    }
    if (pages === '') {
        emptyFields.push('pages');
    }
    
    if (emptyFields.length === 0) {
        return false;
    }
    else {
        alert('Book not added. Following fields not filled: ' + emptyFields.join(', '));
        return true;
    }
}

//UTILITIES
Storage.prototype.setObj = function(key, value) {
    this.setItem(key, JSON.stringify(value));
};
Storage.prototype.getObj = function(key) {
    return JSON.parse(this.getItem(key));
}

function storageAvailable(type) {
    var storage;
    try {
        storage = window[type];
        var x = '__storage_test__';
        storage.setItem(x, x);
        storage.removeItem(x);
        return true;
    }
    catch(e) {
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22 ||
            // Firefox
            e.code === 1014 ||
            // test name field too, because code might not be present
            // everything except Firefox
            e.name === 'QuotaExceededError' ||
            // Firefox
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
            // acknowledge QuotaExceededError only if there's something already stored
            (storage && storage.length !== 0);
    }
}

function saveLibraryToLocalStorage(library) {
    if (!storageAvailable('localStorage')) {
        console.log(storageAvailable('localStorage'));
        return;
    }
    localStorage.setObj('library', library);
}

function readLibraryFromLocalStorage() {
    if (!storageAvailable('localStorage')) {
        console.log(storageAvailable('localStorage'));
        return;
    }
    if (localStorage.getItem('library')) {
        library = localStorage.getObj('library');
        for (let i = 0; i < library.length; i++) {
            Object.setPrototypeOf(library[i], Book.prototype);
        }
    }
}

document.querySelector('#logout-btn').addEventListener('click', e => {
    firebase.auth().signOut().then(() => {
        // Sign-out successful.
        alert('Successfully signed out.');
    }).catch((error) => {
        // An error happened.
        console.log(error);
    });      
})