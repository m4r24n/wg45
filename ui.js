'use strict';
const dateLabel = value => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(value));
let selectedPerson = null;
const flatmates = ['Sahadat', 'Nusrat', 'Marzan', 'Koushik', 'Ritesh'];
let focusSignature = '';
let typingTimer = null;
function syncFocus() {
  const panel = document.getElementById('focus');
  const data = WG45.schedule();
  const tasks = [...data.cleaning.map(item => ({ ...item, due: data.weekEnd })), ...data.waste].filter(item => item.person === selectedPerson);
  const signature = JSON.stringify([selectedPerson, tasks]);
  if (signature === focusSignature) return;
  focusSignature = signature;
  clearInterval(typingTimer);
  panel.hidden = selectedPerson === null;
  if (!selectedPerson) { document.getElementById('focus-tasks').replaceChildren(); return; }
  document.getElementById('focus-name').textContent = selectedPerson;
  document.getElementById('focus-portrait').src = `./avatars/${selectedPerson.toLowerCase()}.webp`;
  const typing = [];
  document.getElementById('focus-tasks').replaceChildren(...tasks.map(item => {
    const row = document.createElement('li');
    const label = document.createElement('span');
    label.className = 'typed-task';
    label.setAttribute('aria-label', item.task);
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    label.append(visual);
    const counter = document.createElement('span');
    counter.className = 'countdown';
    counter.dataset.deadline = berlinMidnight(item.due + 86400000);
    row.append(label, counter);
    typing.push({ element: visual, text: item.task });
    return row;
  }));
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (const item of typing) item.element.textContent = item.text;
  } else {
    let line = 0, character = 0;
    typingTimer = setInterval(() => {
      const item = typing[line];
      if (!item) { clearInterval(typingTimer); return; }
      item.element.classList.add('typing');
      item.element.textContent = item.text.slice(0, ++character);
      if (character >= item.text.length) { item.element.classList.remove('typing'); line++; character = 0; }
    }, 55);
  }
}
function berlinMidnight(calendarDay) {
  let instant = calendarDay;
  const format = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(format.formatToParts(new Date(instant)).map(p => [p.type, p.value]));
    const wallTime = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    instant += calendarDay - wallTime;
  }
  return instant;
}
function updateCountdowns() {
  for (const counter of document.querySelectorAll('.is-selected .countdown, #focus:not([hidden]) .countdown')) {
    const remaining = Math.max(0, Math.ceil((Number(counter.dataset.deadline) - Date.now()) / 1000));
    const days = Math.floor(remaining / 86400);
    const hours = String(Math.floor(remaining % 86400 / 3600)).padStart(2, '0');
    const minutes = String(Math.floor(remaining % 3600 / 60)).padStart(2, '0');
    const seconds = String(remaining % 60).padStart(2, '0');
    counter.textContent = `${days ? days + 'd ' : ''}${hours}h ${minutes}m ${seconds}s`;
    counter.setAttribute('aria-label', `Time remaining: ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`);
  }
}
function applySelection() {
  document.body.classList.toggle('has-selection', selectedPerson !== null);
  for (const row of document.querySelectorAll('.boards li')) {
    row.classList.toggle('is-selected', row.dataset.person === selectedPerson);
    row.classList.toggle('is-dimmed', selectedPerson !== null && row.dataset.person !== selectedPerson);
  }
  for (const button of document.querySelectorAll('#people button')) button.setAttribute('aria-pressed', String(button.dataset.person === selectedPerson));
  syncFocus();
  updateCountdowns();
}
document.getElementById('focus-close').addEventListener('click', () => {
  const person = selectedPerson;
  selectedPerson = null;
  applySelection();
  document.querySelector(`#people button[data-person="${person}"]`)?.focus();
});
for (const person of flatmates) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.person = person;
  button.setAttribute('aria-pressed', 'false');
  const avatar = document.createElement('img');
  avatar.src = `./avatars/${person.toLowerCase()}.webp`;
  avatar.alt = '';
  avatar.width = avatar.height = 34;
  button.append(avatar, document.createTextNode(person));
  button.addEventListener('click', () => { selectedPerson = selectedPerson === person ? null : person; applySelection(); });
  document.getElementById('people').append(button);
}
document.addEventListener('keydown', event => { if (event.key === 'Escape') { selectedPerson = null; applySelection(); } });
function render() {
  const data = WG45.schedule();
  document.getElementById('week').textContent = `${dateLabel(data.weekStart)} – ${dateLabel(data.weekEnd)}`;
  for (const key of ['cleaning', 'waste']) {
    document.getElementById(key).replaceChildren(...data[key].map(item => {
      const row = document.createElement('li');
      row.dataset.person = item.person;
      const task = document.createElement('span');
      task.className = 'task';
      task.textContent = item.task;
      if (key === 'waste') {
        const due = document.createElement('span');
        due.className = 'due';
        due.textContent = `Due ${dateLabel(item.due)}`;
        task.append(due);
      }
      const countdown = document.createElement('span');
      countdown.className = 'countdown';
      countdown.dataset.deadline = berlinMidnight((key === 'waste' ? item.due : data.weekEnd) + 86400000);
      task.append(countdown);
      const name = document.createElement('span');
      name.className = 'person';
      name.textContent = item.person;
      row.append(task, name);
      return row;
    }));
  }
  applySelection();
}
render();
setInterval(updateCountdowns, 1000);
setInterval(render, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
window.addEventListener('pageshow', render);
