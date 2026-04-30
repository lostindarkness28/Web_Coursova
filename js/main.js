const monthNames = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];
let curDate = new Date();
let curMonth = curDate.getMonth();
let curYear = curDate.getFullYear();

function updateAll() {
    renderCalendar(curMonth, curYear);
    renderMini(curMonth, curYear);
}

function renderCalendar(month, year) {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    document.querySelector('.month-display').innerText = `${monthNames[month]} ${year}`;

    ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].forEach(d => {
        grid.innerHTML += `<div class="day-name">${d}</div>`;
    });

    let firstDay = new Date(year, month, 1).getDay();
    let shift = (firstDay === 0) ? 6 : firstDay - 1;
    let daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let x = 0; x < shift; x++) grid.innerHTML += `<div class="day empty"></div>`;
    for (let i = 1; i <= daysInMonth; i++) {
        let isToday = (i === curDate.getDate() && month === curDate.getMonth());
        let ev = (i === 10 && month === 3) ? '<div class="ev ev-pink">День народження</div>' : '';
        grid.innerHTML += `<div class="day ${isToday ? 'active' : ''}"><span class="day-number">${i}</span>${ev}</div>`;
    }
}

function renderMini(month, year) {
    const mini = document.getElementById('miniGrid');
    const miniHeader = document.getElementById('miniHeader');
    mini.innerHTML = '';
    miniHeader.innerText = `${monthNames[month]} ${year}`;

    ['П', 'В', 'С', 'Ч', 'П', 'С', 'Н'].forEach(d => {
        mini.innerHTML += `<div style="font-weight:bold; color:#ccc">${d}</div>`;
    });

    let firstDay = new Date(year, month, 1).getDay();
    let shift = (firstDay === 0) ? 6 : firstDay - 1;
    let daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let x = 0; x < shift; x++) mini.innerHTML += `<div></div>`;
    for (let i = 1; i <= daysInMonth; i++) {
        let isToday = (i === curDate.getDate() && month === curDate.getMonth());
        mini.innerHTML += `<div class="m-day ${isToday ? 'active-mini' : ''}">${i}</div>`;
    }
}

document.getElementById('prevMonth').onclick = () => { curMonth--; if(curMonth < 0){curMonth=11; curYear--;} updateAll(); };
document.getElementById('nextMonth').onclick = () => { curMonth++; if(curMonth > 11){curMonth=0; curYear++;} updateAll(); };
document.getElementById('openModal').onclick = () => { document.getElementById('modalOverlay').style.display='flex'; };
document.getElementById('closeModal').onclick = () => { document.getElementById('modalOverlay').style.display='none'; };
const yearSelect = document.getElementById('yearSelect');

// Заповнюємо роки від 1980 до 2080
function initYearSelect() {
    for (let y = 1980; y <= 2080; y++) {
        let opt = document.createElement('option');
        opt.value = y;
        opt.innerText = y;
        yearSelect.appendChild(opt);
    }
    yearSelect.value = curYear; 
}

// Подія при зміні року в списку
yearSelect.onchange = () => {
    curYear = parseInt(yearSelect.value);
    updateAll();
};


function updateAll() {
    renderCalendar(curMonth, curYear);
    renderMini(curMonth, curYear);
    yearSelect.value = curYear; 
   
    document.querySelector('.month-display').innerText = monthNames[curMonth];
}

// Виклич ініціалізацію при старті
initYearSelect()

updateAll();
