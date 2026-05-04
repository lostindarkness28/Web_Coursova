const monthNames = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
let curDate = new Date();
let curMonth = curDate.getMonth();
let curYear = curDate.getFullYear();

// Сховище подій та профілю
let events = JSON.parse(localStorage.getItem('calendar_events')) || [];
let userData = JSON.parse(localStorage.getItem('calendar_user')) || {
    name: "Олександр Коваль",
    email: "alex@example.com"
};

const monthBtn = document.getElementById('monthBtn');
const yearBtn = document.getElementById('yearBtn');
const monthPicker = document.getElementById('monthPicker');
const yearPicker = document.getElementById('yearPicker');

// Ініціалізація вибору
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

// Рендер головної сітки
function renderCalendar(month, year) {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].forEach(d => grid.innerHTML += `<div class="day-name">${d}</div>`);

    let firstDay = new Date(year, month, 1).getDay();
    let shift = (firstDay === 0) ? 6 : firstDay - 1;
    let daysInMonth = new Date(year, month + 1, 0).getDate();

    // Фільтри категорій
    const activeFilters = Array.from(document.querySelectorAll('.filter-item input:checked')).map(i => i.dataset.category);

    for (let x = 0; x < shift; x++) grid.innerHTML += `<div class="day empty"></div>`;
    for (let i = 1; i <= daysInMonth; i++) {
        let dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        let isToday = (i === curDate.getDate() && month === curDate.getMonth() && year === curDate.getFullYear());
        
        // Відображаємо події для цього дня
        let dayEvents = events.filter(e => e.date === dateString && activeFilters.includes(e.category));
        let eventsHtml = dayEvents.map(e => `<div class="ev ${e.category}">${e.title}</div>`).join('');

        grid.innerHTML += `
            <div class="day ${isToday ? 'active' : ''}">
                <span class="day-number">${i}</span>
                <div class="day-events-container">${eventsHtml}</div>
            </div>`;
    }
}

// Міні календар
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

// Оновлення всього контенту
function updateAll() {
    monthBtn.innerText = monthNames[curMonth];
    yearBtn.innerText = curYear;
    renderCalendar(curMonth, curYear);
    renderMini(curMonth, curYear);
    initPickers(); // Оновлюємо активні класи в пікерах
}

// Робота з подіями
document.getElementById('saveEventBtn').onclick = () => {
    const title = document.getElementById('eventTitle').value;
    const date = document.getElementById('eventDate').value;
    const category = document.getElementById('eventCategory').value;

    if (title && date) {
        events.push({ title, date, category });
        localStorage.setItem('calendar_events', JSON.stringify(events));
        document.getElementById('modalOverlay').style.display = 'none';
        document.getElementById('eventTitle').value = '';
        updateAll();
    } else {
        alert("Заповніть назву та дату!");
    }
};

// Робота з профілем
function updateProfileUI() {
    document.getElementById('displayUserName').innerText = userData.name;
    document.getElementById('dropdownUserName').innerText = userData.name;
    document.getElementById('dropdownUserEmail').innerText = userData.email;
    document.getElementById('editUserName').value = userData.name;
    document.getElementById('editUserEmail').value = userData.email;
    
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=185eff&color=fff`;
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

// Обробники відкриття/закриття
document.getElementById('prevMonth').onclick = () => { curMonth--; if(curMonth < 0){curMonth=11; curYear--;} updateAll(); };
document.getElementById('nextMonth').onclick = () => { curMonth++; if(curMonth > 11){curMonth=0; curYear++;} updateAll(); };

monthBtn.onclick = (e) => { e.stopPropagation(); yearPicker.style.display='none'; monthPicker.style.display = (monthPicker.style.display==='block'?'none':'block'); };
yearBtn.onclick = (e) => { e.stopPropagation(); monthPicker.style.display='none'; yearPicker.style.display = (yearPicker.style.display==='block'?'none':'block'); };

document.getElementById('profileBtn').onclick = (e) => { e.stopPropagation(); const d = document.getElementById('profileDropdown'); d.style.display = (d.style.display==='block'?'none':'block'); };
document.getElementById('openProfileLink').onclick = (e) => { e.preventDefault(); document.getElementById('profileModal').style.display = 'flex'; document.getElementById('profileDropdown').style.display = 'none'; };
document.getElementById('closeProfileModal').onclick = () => document.getElementById('profileModal').style.display = 'none';

document.getElementById('openModal').onclick = () => {
    // Встановлюємо сьогоднішню дату в інпут за замовчуванням
    document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('modalOverlay').style.display = 'flex';
};
document.getElementById('closeModal').onclick = () => document.getElementById('modalOverlay').style.display = 'none';

// Фільтрація при кліку на чекбокси
document.querySelectorAll('.filter-item input').forEach(checkbox => {
    checkbox.onchange = () => renderCalendar(curMonth, curYear);
});

window.onclick = (e) => {
    monthPicker.style.display = 'none';
    yearPicker.style.display = 'none';
    document.getElementById('profileDropdown').style.display = 'none';
    if(e.target.classList.contains('modal-overlay')) e.target.style.display = 'none';
};

// Старт
updateProfileUI();
updateAll();