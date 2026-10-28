(function (root) {
  'use strict';
  const names = ['Sahadat', 'Nusrat', 'Marzan', 'Koushik', 'Ritesh'];
  const day = 86400000;
  const cleaningStart = Date.UTC(2026, 9, 26);
  const wasteStart = Date.UTC(2026, 9, 28);
  function berlinDay(now) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const value = type => Number(parts.find(p => p.type === type).value);
    return Date.UTC(value('year'), value('month') - 1, value('day'));
  }
  function schedule(now = new Date()) {
    const today = berlinDay(now);
    const week = Math.max(0, Math.floor((today - cleaningStart) / (7 * day)));
    return {
      weekStart: cleaningStart + week * 7 * day,
      weekEnd: cleaningStart + (week * 7 + 6) * day,
      cleaning: ['Kitchen', 'Common space', 'Balcon', 'Bath', 'Washroom'].map((task, i) => ({ task, person: names[(i + week) % 5] })),
      waste: [{ task: 'Bio waste', days: 3, offset: 0 }, { task: 'Plastics', days: 7, offset: 1 }, { task: 'Paper', days: 7, offset: 2 }].map(item => {
        const turn = Math.max(0, Math.floor((today - wasteStart) / (item.days * day)));
        return { ...item, person: names[(turn + item.offset) % 5], due: wasteStart + ((turn + 1) * item.days - 1) * day };
      })
    };
  }
  if (typeof module !== 'undefined') module.exports = { schedule, berlinDay };
  else root.WG45 = { schedule };
})(typeof window !== 'undefined' ? window : globalThis);
