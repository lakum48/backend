// DOM элементы
const noteInput = document.getElementById('note-input');
const addNoteBtn = document.getElementById('add-note');
const notesList = document.getElementById('notes-list');
const offlineStatus = document.getElementById('offline-status');
const installBtn = document.getElementById('install-btn');

// Переменные
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let deferredPrompt;

// Инициализация
renderNotes();
updateOnlineStatus();

// Регистрация Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW зарегистрирован:', registration.scope);
            })
            .catch(err => {
                console.error('Ошибка регистрации SW:', err);
            });
    });
}

// Обработчики событий
addNoteBtn.addEventListener('click', addNote);
noteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addNote();
    }
});

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Обработчик установки PWA
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.classList.remove('hidden');
    
    installBtn.addEventListener('click', () => {
        installBtn.classList.add('hidden');
        deferredPrompt.prompt();
        
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Пользователь установил PWA');
            }
            deferredPrompt = null;
        });
    });
});

// Функции
function addNote() {
    const text = noteInput.value.trim();
    if (!text) return;

    const newNote = {
        id: Date.now(),
        text,
        createdAt: new Date().toISOString()
    };

    notes.unshift(newNote);
    saveNotes();
    renderNotes();
    noteInput.value = '';
    noteInput.focus();
}

function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    saveNotes();
    renderNotes();
}

function renderNotes() {
    notesList.innerHTML = '';
    
    if (notes.length === 0) {
        notesList.innerHTML = '<p>Нет заметок</p>';
        return;
    }

    notes.forEach(note => {
        const noteEl = document.createElement('div');
        noteEl.className = 'note';
        noteEl.innerHTML = `
            <p>${note.text}</p>
            <div class="note-date">${new Date(note.createdAt).toLocaleString()}</div>
            <button class="delete-note" data-id="${note.id}">Удалить</button>
        `;
        notesList.appendChild(noteEl);
    });

    document.querySelectorAll('.delete-note').forEach(btn => {
        btn.addEventListener('click', () => {
            deleteNote(Number(btn.dataset.id));
        });
    });
}

function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

function updateOnlineStatus() {
    if (navigator.onLine) {
        offlineStatus.classList.add('hidden');
    } else {
        offlineStatus.classList.remove('hidden');
    }
}