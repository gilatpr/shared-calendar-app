// Global variables
let currentMonth = new Date();
let currentUser = null;
let events = [];
let selectedEvent = null;

// DOM Elements
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const authSection = document.getElementById('auth-section');
const userSection = document.getElementById('user-section');
const userNameSpan = document.getElementById('user-name');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const calendarSection = document.getElementById('calendar-section');

const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const todayBtn = document.getElementById('today-btn');
const addEventBtn = document.getElementById('add-event-btn');
const currentMonthSpan = document.getElementById('current-month');
const calendarDiv = document.getElementById('calendar');
const eventModal = document.getElementById('event-modal');

// Event Listeners
loginBtn.addEventListener('click', () => {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
});

registerBtn.addEventListener('click', () => {
    registerForm.style.display = 'block';
    loginForm.style.display = 'none';
});

logoutBtn.addEventListener('click', logout);

document.getElementById('login-submit').addEventListener('click', login);
document.getElementById('register-submit').addEventListener('click', register);

prevMonthBtn.addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
});

todayBtn.addEventListener('click', () => {
    currentMonth = new Date();
    renderCalendar();
});

addEventBtn.addEventListener('click', () => {
    openEventModal(null);
});

// Close modal when clicking outside
eventModal.addEventListener('click', (e) => {
    if (e.target === eventModal) {
        eventModal.style.display = 'none';
    }
});

document.querySelector('.close').addEventListener('click', () => {
    eventModal.style.display = 'none';
});

document.getElementById('save-event').addEventListener('click', saveEvent);
document.getElementById('delete-event').addEventListener('click', deleteEvent);

// Initialize
function init() {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        authenticateUser(token);
    }

    renderCalendar();
}

// Authentication functions
async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            authenticateUser(data.token);
            loginForm.style.display = 'none';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed');
    }
}

async function register() {
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const role = document.getElementById('register-role').value;

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('token', data.token);
            authenticateUser(data.token);
            registerForm.style.display = 'none';
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed');
    }
}

function authenticateUser(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUser = payload;

        authSection.style.display = 'none';
        userSection.style.display = 'flex';
        userNameSpan.textContent = `Welcome, ${currentUser.username}`;
        calendarSection.style.display = 'block';

        loadEvents();
    } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('token');
    }
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;

    authSection.style.display = 'flex';
    userSection.style.display = 'none';
    calendarSection.style.display = 'none';

    // Clear form fields
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-username').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
}

// Calendar functions
function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Update month display
    currentMonthSpan.textContent = `${new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })}`;

    // Clear calendar
    calendarDiv.innerHTML = '';

    // Create day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendarDiv.appendChild(header);
    });

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add empty cells for days before the first day
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day';
        calendarDiv.appendChild(emptyCell);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';

        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = day;
        dayCell.appendChild(dayNumber);

        // Add events for this day
        const dayEvents = events.filter(event => {
            const eventDate = new Date(event.startDateTime);
            return eventDate.getDate() === day &&
                   eventDate.getMonth() === month &&
                   eventDate.getFullYear() === year;
        });

        dayEvents.forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = `event event-${event.category}`;
            eventEl.textContent = event.title;
            eventEl.addEventListener('click', () => openEventModal(event));
            dayCell.appendChild(eventEl);
        });

        calendarDiv.appendChild(dayCell);
    }
}

// Event functions
async function loadEvents() {
    try {
        const response = await fetch('/api/events', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            events = await response.json();
            renderCalendar();
        } else {
            console.error('Failed to load events');
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

function openEventModal(event) {
    selectedEvent = event;

    if (event) {
        document.getElementById('modal-title').textContent = 'Edit Event';
        document.getElementById('event-title').value = event.title;
        document.getElementById('event-description').value = event.description || '';
        document.getElementById('event-start').value = new Date(event.startDateTime).toISOString().slice(0, 16);
        document.getElementById('event-end').value = new Date(event.endDateTime).toISOString().slice(0, 16);
        document.getElementById('event-category').value = event.category;
        document.getElementById('event-recurring').checked = event.isRecurring || false;
        document.getElementById('delete-event').style.display = 'inline-block';
    } else {
        document.getElementById('modal-title').textContent = 'Add Event';
        document.getElementById('event-title').value = '';
        document.getElementById('event-description').value = '';
        document.getElementById('event-start').value = '';
        document.getElementById('event-end').value = '';
        document.getElementById('event-category').value = 'general';
        document.getElementById('event-recurring').checked = false;
        document.getElementById('delete-event').style.display = 'none';
    }

    eventModal.style.display = 'block';
}

async function saveEvent() {
    const title = document.getElementById('event-title').value;
    const description = document.getElementById('event-description').value;
    const start = document.getElementById('event-start').value;
    const end = document.getElementById('event-end').value;
    const category = document.getElementById('event-category').value;
    const isRecurring = document.getElementById('event-recurring').checked;

    if (!title || !start || !end) {
        alert('Please fill in all required fields');
        return;
    }

    const eventData = {
        title,
        description,
        startDateTime: new Date(start),
        endDateTime: new Date(end),
        category,
        isRecurring
    };

    try {
        if (selectedEvent) {
            // Update existing event
            const response = await fetch(`/api/events/${selectedEvent._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });

            if (response.ok) {
                eventModal.style.display = 'none';
                loadEvents();
            } else {
                alert('Failed to update event');
            }
        } else {
            // Create new event
            const response = await fetch('/api/events', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });

            if (response.ok) {
                eventModal.style.display = 'none';
                loadEvents();
            } else {
                alert('Failed to create event');
            }
        }
    } catch (error) {
        console.error('Error saving event:', error);
        alert('Error saving event');
    }
}

async function deleteEvent() {
    if (!selectedEvent || !confirm('Are you sure you want to delete this event?')) {
        return;
    }

    try {
        const response = await fetch(`/api/events/${selectedEvent._id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            eventModal.style.display = 'none';
            loadEvents();
        } else {
            alert('Failed to delete event');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event');
    }
}

// Initialize the app
init();