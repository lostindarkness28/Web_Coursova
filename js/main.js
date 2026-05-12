const monthNames = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
let curDate = new Date();
let curMonth = curDate.getMonth();
let curYear = curDate.getFullYear();

const API_URL = 'https://my-smart-calendar-pgwl.onrender.com';

let events = [];
let currentEventId = null;
let userData = JSON.parse(localStorage.getItem('user')) || {};
console.log("Дані користувача з пам'яті:", userData);
let isDarkTheme = localStorage.getItem('dark_theme') === 'true';
let searchQuery = '';
let filteredEvents = [];
let isLoadingEvents = false;

const monthBtn = document.getElementById('monthBtn');
const yearBtn = document.getElementById('yearBtn');
const monthPicker = document.getElementById('monthPicker');
const yearPicker = document.getElementById('yearPicker');

function initPickers() {
    const mGrid = document.getElementById('monthPickerGrid');
    const yGrid = document.getElementById('yearPickerGrid');

    mGrid.innerHTML = '';
    monthNames.forEach((m, i) => {
        const div = document.createElement('div');
        div.className = 'picker-item' + (i === curMonth ? ' active' : '');
        div.innerText = m;
        div.onclick = (e) => { e.stopPropagation(); curMonth = i; updateAll(); monthPicker.style.display = 'none'; };
        mGrid.appendChild(div);
    });

    yGrid.innerHTML = '';
    for (let y = curYear - 50; y <= curYear + 50; y++) {
        const div = document.createElement('div');
        div.className = 'picker-item' + (y === curYear ? ' active' : '');
        div.innerText = y;
        div.onclick = (e) => { e.stopPropagation(); curYear = y; updateAll(); yearPicker.style.display = 'none'; };
        yGrid.appendChild(div);
    }
}


function renderMini(month, year) {
    const mini = document.getElementById('miniGrid');
    document.getElementById('miniHeader').innerText = `${monthNames[month]} ${year}`;
    mini.innerHTML = '';
    ['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'].forEach(d => mini.innerHTML += `<div style="font-weight:bold; color:#cbd5e0">${d}</div>`);

    let firstDay = new Date(year, month, 1).getDay();
    let shift = (firstDay === 0) ? 6 : firstDay - 1;
    let days = new Date(year, month + 1, 0).getDate();

    for (let x = 0; x < shift; x++) mini.innerHTML += `<div></div>`;
    for (let i = 1; i <= days; i++) {
        let isToday = (i === curDate.getDate() && month === curDate.getMonth() && year === curDate.getFullYear());
        mini.innerHTML += `<div class="m-day ${isToday ? 'active-mini' : ''}">${i}</div>`;
    }
}

function updateAll() {
    monthBtn.innerText = monthNames[curMonth];
    yearBtn.innerText = curYear;
    renderCalendar(curMonth, curYear);
    renderMini(curMonth, curYear);
    initPickers();
}

async function loadAndInitialize() {
    events = await loadEventsFromAPI();
    updateAll();
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadAndInitialize();
});

document.getElementById('calendarGrid').onclick = async function (e) {
    if (e.target.classList.contains('ev')) {
        const eventTitle = e.target.textContent;
        const event = events.find(ev => ev.title === eventTitle);

        if (event) {
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('eventDate').value = event.date;
            document.getElementById('eventCategory').value = event.category || 'work';

            document.getElementById('deleteEventBtn').style.display = 'block';
            document.getElementById('saveEventBtn').textContent = 'Оновити';

            currentEventId = event.id;

            document.getElementById('modalOverlay').style.display = 'flex';
        }
    }
};

document.getElementById('saveEventBtn').onclick = async () => {
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    const category = document.getElementById('eventCategory').value;

    if (title && date) {
        const eventData = { title, date, category };

        let success;
        if (currentEventId) {
            success = await updateEventToAPI(currentEventId, eventData);
        } else {
            success = await saveEventToAPI(eventData);
        }

        if (success) {
            events = await loadEventsFromAPI();
            document.getElementById('modalOverlay').style.display = 'none';
            resetModal();
            updateAll();
        } else {
            alert("Помилка збереження події. Спробуйте пізніше.");
        }
    } else {
        alert("Заповніть назву та дату!");
    }
};

document.getElementById('deleteEventBtn').onclick = async () => {
    if (currentEventId && confirm(`Ви дійсно хочете видалити цю подію?`)) {
        const success = await deleteEvent(currentEventId);
        if (success) {
            events = await loadEventsFromAPI();
            document.getElementById('modalOverlay').style.display = 'none';
            resetModal();
            updateAll();
        } else {
            alert("Помилка видалення події. Спробуйте пізніше.");
        }
    }
};

function resetModal() {
    document.getElementById('eventTitle').value = '';
    document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('eventCategory').value = 'work';
    document.getElementById('saveEventBtn').textContent = 'Зберегти';
    document.getElementById('deleteEventBtn').style.display = 'none';
    currentEventId = null;
}

// Add update function
async function updateEventToAPI(eventId, eventData) {
    if (!userData.user || !userData.user.id) {
        console.error("Cannot update event: no user ID available");
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: eventData.title,
                event_date: eventData.date,
                category: eventData.category || 'work'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Event updated in API:", result);
        return true;
    } catch (error) {
        console.error("Error updating event:", error);
        return false;
    }
}

function setReminder(title, date, time) {
    const eventDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const timeUntilEvent = eventDateTime - now;

    if (timeUntilEvent > 0) {
        setTimeout(() => {
            showNotification(title, eventDateTime);
        }, timeUntilEvent);
    }
}

function showNotification(title, eventTime) {
    addNotification(title, new Date().toISOString(), eventTime);

    if (Notification.permission === 'granted') {
        new Notification('Нагадування про подію', {
            body: `Час події "${title}" настав!`,
            icon: 'https://cdn-icons-png.flaticon.com/512/1945/1945910.png'
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('Нагадування про подію', {
                    body: `Час події "${title}" настав!`,
                    icon: 'https://cdn-icons-png.flaticon.com/512/1945/1945910.png'
                });
            }
        });
    }
}

function searchEvents() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    searchQuery = query;

    if (query === '') {
        filteredEvents = [...events];
    } else {
        filteredEvents = events.filter(event =>
            event.title.toLowerCase().includes(query)
        );
    }

    renderCalendar(curMonth, curYear);
}

document.getElementById('themeToggle').onclick = function () {
    isDarkTheme = !isDarkTheme;
    document.body.classList.toggle('dark-theme', isDarkTheme);
    localStorage.setItem('dark_theme', isDarkTheme);
    updateThemeIcon();
};

function updateThemeIcon() {
    const themeBtn = document.getElementById('themeToggle');
    themeBtn.innerHTML = isDarkTheme ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function renderCalendar(month, year) {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].forEach(d => grid.innerHTML += `<div class="day-name">${d}</div>`);

    let firstDay = new Date(year, month, 1).getDay();
    let shift = (firstDay === 0) ? 6 : firstDay - 1;
    let daysInMonth = new Date(year, month + 1, 0).getDate();

    const activeFilters = Array.from(document.querySelectorAll('.filter-item input:checked')).map(i => i.dataset.category);

    for (let x = 0; x < shift; x++) grid.innerHTML += `<div class="day empty"></div>`;
    for (let i = 1; i <= daysInMonth; i++) {
        let dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        let isToday = (i === curDate.getDate() && month === curDate.getMonth() && year === curDate.getFullYear());

        let dayEvents = events.filter(e =>
            e.date === dateString &&
            activeFilters.includes(e.category) &&
            (searchQuery === '' || e.title.toLowerCase().includes(searchQuery))
        );
        let eventsHtml = dayEvents.map(e => `<div class="ev ${e.category}">${e.title}</div>`).join('');

        grid.innerHTML += `
            <div class="day ${isToday ? 'active' : ''}">
                <span class="day-number">${i}</span>
                <div class="day-events-container">${eventsHtml}</div>
            </div>`;
    }
}

// API Functions
async function loadEventsFromAPI() {
    if (!userData.user || !userData.user.id) {
        console.log("No user ID available, using empty events array");
        return [];
    }

    try {
        const response = await fetch(`${API_URL}/events/${userData.user.id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Loaded events from API:", data);

        return data.map(event => ({
            id: event.id,
            title: event.title,
            date: event.event_date,
            category: event.category || 'work'
        }));
    } catch (error) {
        console.error("Error loading events:", error);
        return [];
    }
}

async function saveEventToAPI(eventData) {
    if (!userData.user || !userData.user.id) {
        console.error("Cannot save event: no user ID available");
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userData.user.id,
                title: eventData.title,
                description: eventData.description || '',
                event_date: eventData.date,
                category: eventData.category || 'work'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Event saved to API:", result);
        return true;
    } catch (error) {
        console.error("Error saving event:", error);
        return false;
    }
}

async function deleteEvent(eventId) {
    try {
        const response = await fetch(`${API_URL}/events/${eventId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Event deleted from API:", result);
        return true;
    } catch (error) {
        console.error("Error deleting event:", error);
        return false;
    }
}

async function deleteEventFromAPI(eventTitle) {
    if (!userData.user || !userData.user.id) {
        console.error("Cannot delete event: no user ID available");
        return false;
    }

    try {
        const allEvents = await loadEventsFromAPI();
        const eventToDelete = allEvents.find(e => e.title === eventTitle);

        if (!eventToDelete) {
            console.log("Event not found for deletion");
            return false;
        }

        const success = await deleteEvent(eventToDelete.id);
        if (success) {
            events = await loadEventsFromAPI();
            currentEventId = null;
            updateAll();
        }
        return success;
    } catch (error) {
        console.error("Error deleting event:", error);
        return false;
    }
}

function updateProfileUI() {
  
    const name = (userData.user && userData.user.name) || userData.name || "Гість";
    const email = userData.email || (userData.user && userData.user.email) || "Не вказано";

    if (document.getElementById('userNameDisplay')) {
        document.getElementById('userNameDisplay').innerText = name;
    }
    if (document.getElementById('dropdownUserName')) {
        document.getElementById('dropdownUserName').innerText = name;
    }
    if (document.getElementById('dropdownUserEmail')) {
        document.getElementById('dropdownUserEmail').innerText = email;
    }

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=185eff&color=fff`;
    if (document.getElementById('displayAvatar')) {
        document.getElementById('displayAvatar').src = avatarUrl;
    }
}

document.getElementById('saveProfileBtn').onclick = () => {
    if (!userData.user) {
        userData.user = {};
    }
    userData.user.name = document.getElementById('editUserName').value;
    localStorage.setItem('user', JSON.stringify(userData));
    updateProfileUI();
    document.getElementById('profileModal').style.display = 'none';
};

document.querySelector('.logout').onclick = function (e) {
    e.preventDefault();
    if (confirm('Ви дійсно хочете вийти?')) {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
};
document.getElementById('prevMonth').onclick = () => { curMonth--; if (curMonth < 0) { curMonth = 11; curYear--; } updateAll(); };
document.getElementById('nextMonth').onclick = () => { curMonth++; if (curMonth > 11) { curMonth = 0; curYear++; } updateAll(); };

monthBtn.onclick = (e) => { e.stopPropagation(); yearPicker.style.display = 'none'; monthPicker.style.display = (monthPicker.style.display === 'block' ? 'none' : 'block'); };
yearBtn.onclick = (e) => { e.stopPropagation(); monthPicker.style.display = 'none'; yearPicker.style.display = (yearPicker.style.display === 'block' ? 'none' : 'block'); };

document.getElementById('profileBtn').onclick = (e) => { e.stopPropagation(); const d = document.getElementById('profileDropdown'); d.style.display = (d.style.display === 'block' ? 'none' : 'block'); };
document.getElementById('openProfileLink').onclick = (e) => {
    e.preventDefault();
    document.getElementById('editUserName').value = (userData.user && userData.user.name) || userData.name || "";
    document.getElementById('editUserEmail').value = userData.email || (userData.user && userData.user.email) || "";
    document.getElementById('editUserEmail').readOnly = true;
    document.getElementById('profileModal').style.display = 'flex';
    document.getElementById('profileDropdown').style.display = 'none';
};
document.getElementById('closeProfileModal').onclick = () => document.getElementById('profileModal').style.display = 'none';

document.getElementById('openModal').onclick = () => {
    document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('modalOverlay').style.display = 'flex';
};
document.getElementById('closeModal').onclick = () => document.getElementById('modalOverlay').style.display = 'none';

document.querySelectorAll('.filter-item input').forEach(checkbox => {
    checkbox.onchange = () => renderCalendar(curMonth, curYear);
});

window.onclick = function (e) {
    const monthPicker = document.getElementById('monthPicker');
    const yearPicker = document.getElementById('yearPicker');
    const profileDropdown = document.getElementById('profileDropdown');
    const notificationModal = document.getElementById('notificationModal');

    if (!e.target.closest('.month-wrapper')) {
        monthPicker.style.display = 'none';
        yearPicker.style.display = 'none';
    }

    if (!e.target.closest('.avatar-container')) {
        profileDropdown.style.display = 'none';
    }

    if (!e.target.closest('.notification-btn')) {
        notificationModal.style.display = 'none';
    }

    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
    }
};

updateProfileUI();
updateAll();

if (isDarkTheme) {
    document.body.classList.add('dark-theme');
}
updateThemeIcon();

document.getElementById('searchButton').onclick = searchEvents;
document.getElementById('searchInput').onkeyup = function (e) {
    if (e.key === 'Enter') {
        searchEvents();
    }
};

updateNotificationBadge();
