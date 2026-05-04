const monthNames = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
let curDate = new Date();
let curMonth = curDate.getMonth();
let curYear = curDate.getFullYear();

let events = JSON.parse(localStorage.getItem('calendar_events')) || [];
let userData = JSON.parse(localStorage.getItem('calendar_user')) || {
    name: "Користувач",
    email: "user@example.com"
};
let isDarkTheme = localStorage.getItem('dark_theme') === 'true';
let searchQuery = '';
let filteredEvents = [];
let notifications = JSON.parse(localStorage.getItem('calendar_notifications')) || [];
let unreadCount = 0;

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

document.getElementById('saveEventBtn').onclick = () => {
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    const category = document.getElementById('eventCategory').value;
    const reminderTime = document.getElementById('eventReminderTime').value;

    if (title && date) {
        events.push({ title, date, category, reminderTime: reminderTime || null });

        localStorage.setItem('calendar_events', JSON.stringify(events));
        document.getElementById('modalOverlay').style.display = 'none';
        document.getElementById('eventTitle').value = '';
        document.getElementById('eventReminderTime').value = '';
        updateAll();

        if (reminderTime) {
            setReminder(title, date, reminderTime);
        }
    } else {
        alert("Заповніть назву та дату!");
    }
};

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

document.getElementById('themeToggle').onclick = function() {
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

function updateProfileUI() {
    const firstLetter = userData.name ? userData.name.charAt(0).toUpperCase() : 'К';
    document.getElementById('displayUserName').innerText = firstLetter;
    document.getElementById('dropdownUserName').innerText = userData.name;
    document.getElementById('dropdownUserEmail').innerText = userData.email;
    document.getElementById('editUserName').value = userData.name;
    document.getElementById('editUserEmail').value = userData.email;

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstLetter)}&background=185eff&color=fff`;
    document.getElementById('displayAvatar').src = avatarUrl;
    document.getElementById('editAvatarPreview').src = avatarUrl;
}

document.getElementById('saveProfileBtn').onclick = () => {
    userData.name = document.getElementById('editUserName').value;
    userData.email = document.getElementById('editUserEmail').value;
    localStorage.setItem('calendar_user', JSON.stringify(userData));
    updateProfileUI();
    document.getElementById('profileModal').style.display = 'none';
};

document.querySelector('.logout').onclick = function(e) {
    e.preventDefault();
    if (confirm('Ви дійсно хочете вийти?')) {
        localStorage.removeItem('calendar_user');
        window.location.href = 'login.html';
    }
};

document.getElementById('calendarGrid').onclick = function(e) {
    if (e.target.classList.contains('ev')) {
        const eventTitle = e.target.textContent;
        if (confirm(`Видалити подію "${eventTitle}"?`)) {
            events = events.filter(event => event.title !== eventTitle);
            localStorage.setItem('calendar_events', JSON.stringify(events));
            updateAll();
        }
    }
};

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    unreadCount = notifications.filter(n => !n.read).length;
    badge.textContent = unreadCount > 0 ? unreadCount : '';
    badge.style.display = unreadCount > 0 ? 'inline-flex' : 'none';
}

function addNotification(title, date, eventDate) {
    const notification = {
        id: Date.now(),
        title: title,
        date: date,
        eventDate: eventDate,
        read: false,
        createdAt: new Date().toISOString()
    };

    notifications.unshift(notification);
    localStorage.setItem('calendar_notifications', JSON.stringify(notifications));
    updateNotificationBadge();
    renderNotifications();
}

function renderNotifications() {
    const notificationList = document.getElementById('notificationList');
    notificationList.innerHTML = '';

    if (notifications.length === 0) {
        notificationList.innerHTML = '<div class="notification-empty">Немає сповіщень</div>';
        return;
    }

    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = `notification-item ${notification.read ? '' : 'unread'}`;

        const eventDate = new Date(notification.eventDate);
        const formattedDate = `${eventDate.getDate()} ${monthNames[eventDate.getMonth()].slice(0, 3)} ${eventDate.getFullYear()}`;

        notificationItem.innerHTML = `
            <div class="notification-content">
                <div class="notification-text">
                    ${!notification.read ? '<div class="notification-dot"></div>' : ''}
                    <div>
                        <div class="notification-event-title">${notification.title}</div>
                        <div class="notification-event-date">${formattedDate}</div>
                        <div class="notification-time">Нагадування про подію</div>
                    </div>
                </div>
            </div>
        `;

        notificationItem.onclick = () => {
            notification.read = true;
            localStorage.setItem('calendar_notifications', JSON.stringify(notifications));
            updateNotificationBadge();
            renderNotifications();
        };

        notificationList.appendChild(notificationItem);
    });
}

document.getElementById('notificationBtn').onclick = function(e) {
    e.stopPropagation();
    const modal = document.getElementById('notificationModal');
    modal.style.display = modal.style.display === 'block' ? 'none' : 'block';

    if (modal.style.display === 'block') {
        notifications.forEach(n => n.read = true);
        localStorage.setItem('calendar_notifications', JSON.stringify(notifications));
        updateNotificationBadge();
        renderNotifications();
    }
};

document.getElementById('clearNotifications').onclick = function() {
    if (confirm('Очистити всі сповіщення?')) {
        notifications = [];
        localStorage.setItem('calendar_notifications', JSON.stringify(notifications));
        updateNotificationBadge();
        renderNotifications();
    }
};

document.getElementById('prevMonth').onclick = () => { curMonth--; if(curMonth < 0){curMonth=11; curYear--;} updateAll(); };
document.getElementById('nextMonth').onclick = () => { curMonth++; if(curMonth > 11){curMonth=0; curYear++;} updateAll(); };

monthBtn.onclick = (e) => { e.stopPropagation(); yearPicker.style.display='none'; monthPicker.style.display = (monthPicker.style.display==='block'?'none':'block'); };
yearBtn.onclick = (e) => { e.stopPropagation(); monthPicker.style.display='none'; yearPicker.style.display = (yearPicker.style.display==='block'?'none':'block'); };

document.getElementById('profileBtn').onclick = (e) => { e.stopPropagation(); const d = document.getElementById('profileDropdown'); d.style.display = (d.style.display==='block'?'none':'block'); };
document.getElementById('openProfileLink').onclick = (e) => { e.preventDefault(); document.getElementById('profileModal').style.display = 'flex'; document.getElementById('profileDropdown').style.display = 'none'; };
document.getElementById('closeProfileModal').onclick = () => document.getElementById('profileModal').style.display = 'none';

document.getElementById('openModal').onclick = () => {
    document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('modalOverlay').style.display = 'flex';
};
document.getElementById('closeModal').onclick = () => document.getElementById('modalOverlay').style.display = 'none';

document.querySelectorAll('.filter-item input').forEach(checkbox => {
    checkbox.onchange = () => renderCalendar(curMonth, curYear);
});

window.onclick = function(e) {
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

    if(e.target.classList.contains('modal-overlay')) {
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
document.getElementById('searchInput').onkeyup = function(e) {
    if (e.key === 'Enter') {
        searchEvents();
    }
};

updateNotificationBadge();
renderNotifications();

if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission();
}