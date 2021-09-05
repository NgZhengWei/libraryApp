let library;

const Logic = (function () {
  function bookFactory(title, author, pages, status) {
    return {
      title,
      author,
      pages,
      status,
      changeReadStatus() {
        this.status = !this.status;
      },
    };
  }

  function addBookToLibrary(title, author, pages, status) {
    // creates a book and adds it to library array
    library.push(bookFactory(title, author, pages, status));
    Save.saveLibraryToLocalStorage(library);
  }

  // click event handler to delete book in question
  function deleteBook(e) {
    const parentIndex =
      e.target.parentElement.parentElement.attributes[0].value;
    if (
      !confirm(`Are you sure you want to delete ${library[parentIndex].title}?`)
    )
      return; // prompt for confirmation incase of accidental deletion
    library.splice(parentIndex, 1);
    Interface.displayBooks(library);
    Save.saveLibraryToLocalStorage(library);
  }

  // click eventlistener to change status of book in library and also the display
  function callChangeStatus(e) {
    const parentIndex =
      e.target.parentElement.parentElement.attributes[0].value;
    library[parentIndex].changeReadStatus();
    if (e.target.innerText === 'Read') {
      e.target.innerText = 'Not Read';
    } else {
      e.target.innerText = 'Read';
    }
    Save.saveLibraryToLocalStorage(library);
  }

  // checks for empty fields before adding a new book to library array and alerts the fields that are empty
  function hasEmptyFields(title, author, pages, status) {
    const emptyFields = [];
    if (title === '') {
      emptyFields.push('title');
    }
    if (author === '') {
      emptyFields.push('author');
    }
    if (pages === '') {
      emptyFields.push('pages');
    }
    // if no errors were pushed into array
    if (emptyFields.length === 0) {
      return false;
    }
    alert(
      `Book not added. Following fields not filled: ${emptyFields.join(', ')}`
    );
    return true;
  }

  function newBookFormInput(e) {
    // takes input from popup form for adding a new book
    e.preventDefault();
    // clear previous error messages
    document.querySelector('.title-error').innerText = '';
    document.querySelector('.author-error').innerText = '';
    const form = document.querySelector('#add-book-popup > form');
    const title = document.querySelector('#add-title');
    const author = document.querySelector('#add-author');
    const pages = document.querySelector('#add-pages').value;
    const status = document.querySelector('#add-status').value === 'read';

    // check if fields for author and title are empty, if so append error message into form
    let errorFlag = false;
    if (!title.checkValidity()) {
      document.querySelector('.title-error').innerText =
        title.validationMessage;
      errorFlag = true;
    }
    if (!author.checkValidity()) {
      document.querySelector('.author-error').innerText =
        author.validationMessage;
      errorFlag = true;
    }
    if (errorFlag) return;
    // if (hasEmptyFields(title, author, pages, status)) return;
    Logic.addBookToLibrary(title, author, pages, status);

    document.querySelector('#add-book-popup').classList.toggle('invisible'); // makes form go away after submission
    Interface.displayBooks(library); // repopulates booklist so new book is displayed
    form.reset();
  }

  return {
    bookFactory,
    addBookToLibrary,
    deleteBook,
    callChangeStatus,
    newBookFormInput,
  };
})();

const Save = (function () {
  function storageAvailable(type) {
    let storage;
    try {
      storage = window[type];
      const x = '__storage_test__';
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return (
        e instanceof DOMException &&
        // everything except Firefox
        (e.code === 22 ||
          // Firefox
          e.code === 1014 ||
          // test name field too, because code might not be present
          // everything except Firefox
          e.name === 'QuotaExceededError' ||
          // Firefox
          e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
        // acknowledge QuotaExceededError only if there's something already stored
        storage &&
        storage.length !== 0
      );
    }
  }

  const saveLibraryToLocalStorage = (libraryArr) => {
    if (!storageAvailable('localStorage')) {
      console.log(storageAvailable('localStorage'));
      return;
    }
    localStorage.setObj('library', libraryArr);
  };

  const readLibraryFromLocalStorage = () => {
    if (!storageAvailable('localStorage')) {
      console.log(storageAvailable('localStorage'));
      return;
    }
    if (localStorage.getItem('library')) {
      const localStorageLibrary = localStorage.getObj('library');
      library = [];
      localStorageLibrary.forEach((lib) => {
        library.push(
          Logic.bookFactory(lib.title, lib.author, lib.pages, lib.status)
        );
      });
    } else {
      library = [
        Logic.bookFactory('Sapiens', 'Yuval Noah Harari', 480, true),
        Logic.bookFactory('Meditations', 'Marcus Aurelius', 254, false),
      ];
    }
  };

  return {
    saveLibraryToLocalStorage,
    readLibraryFromLocalStorage,
  };
})();

const Interface = (function () {
  // resets content area everytime function is called so that all cases (deletion and addition of books) are handled with 1 general function
  function displayBooks(library) {
    const contentArea = document.querySelector('#library');
    // sets content area to just contain the table heading initially
    contentArea.innerHTML = `<tr>
                                  <th>Title</th>
                                  <th>Author</th>
                                  <th>Pages</th>
                                  <th>Status</th>
                                  <th><button style="visibility: hidden;">delete</button></th>
                              </tr>`;

    // iterates over books in library array, creates elements for each property and appends them to content area
    for (let i = 0; i < library.length; i++) {
      // add to display area
      const bookRow = document.createElement('tr');
      bookRow.setAttribute('data-index', i);

      const title = document.createElement('td');
      title.innerText = `${library[i].title}`;
      bookRow.appendChild(title);

      const author = document.createElement('td');
      author.innerText = `${library[i].author}`;
      bookRow.appendChild(author);

      const pages = document.createElement('td');
      pages.innerText = `${library[i].pages}`;
      bookRow.appendChild(pages);

      const status = document.createElement('td');
      const statusButton = document.createElement('button');
      statusButton.innerText = `${library[i].status ? 'Read' : 'Not Read'}`;
      statusButton.addEventListener('click', Logic.callChangeStatus);
      status.appendChild(statusButton);
      bookRow.appendChild(status);

      const deleteCell = document.createElement('td');
      const deleteBtn = document.createElement('button');
      deleteBtn.innerText = 'Delete';
      deleteBtn.classList.add('red-bg');
      deleteBtn.addEventListener('click', Logic.deleteBook);
      deleteCell.appendChild(deleteBtn);
      bookRow.appendChild(deleteCell);

      contentArea.appendChild(bookRow);
    }
  }

  // event handler function for toggling visibility of add book popup
  function togglePopupVisibility() {
    const popup = document.querySelector('#add-book-popup');
    popup.classList.toggle('invisible');
  }

  return {
    displayBooks,
    togglePopupVisibility,
  };
})();

// UTILITIES
Storage.prototype.setObj = function (key, value) {
  this.setItem(key, JSON.stringify(value));
};
Storage.prototype.getObj = function (key) {
  return JSON.parse(this.getItem(key));
};

// initialise app
(function () {
  Save.readLibraryFromLocalStorage();
  Interface.displayBooks(library);
  // runs function to add new book into library array upon clicking submit button
  const popupSubmitButton = document.querySelector('#add-submit');
  popupSubmitButton.addEventListener('click', Logic.newBookFormInput);
  // toggles popup for adding new book's visibility on click of the plus button on bottom right
  document
    .querySelector('#add-book')
    .addEventListener('click', Interface.togglePopupVisibility);
  // toggle dropdown for project context display
  document
    .querySelector('.project-context-display')
    .addEventListener('click', () => {
      document
        .querySelector('.project-content-dropdown')
        .classList.toggle('invisible');
    });
  // toggle dropdown for project manual
  document
    .querySelector('.project-manual-display')
    .addEventListener('click', () => {
      document
        .querySelector('.project-manual-dropdown')
        .classList.toggle('invisible');
    });
})();
