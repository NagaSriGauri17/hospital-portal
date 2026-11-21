'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';

const DAY_NAMES = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const getMonths = (t) => [
  t('schedule.month.1'), t('schedule.month.2'), t('schedule.month.3'), t('schedule.month.4'),
  t('schedule.month.5'), t('schedule.month.6'), t('schedule.month.7'), t('schedule.month.8'),
  t('schedule.month.9'), t('schedule.month.10'), t('schedule.month.11'), t('schedule.month.12'),
];
const getMonthsShort = (t) => [
  t('schedule.mon.1'), t('schedule.mon.2'), t('schedule.mon.3'), t('schedule.mon.4'),
  t('schedule.mon.5'), t('schedule.mon.6'), t('schedule.mon.7'), t('schedule.mon.8'),
  t('schedule.mon.9'), t('schedule.mon.10'), t('schedule.mon.11'), t('schedule.mon.12'),
];
// Monday first
const getWeekdayInitials = (t) => [
  t('schedule.wd.1'), t('schedule.wd.2'), t('schedule.wd.3'), t('schedule.wd.4'),
  t('schedule.wd.5'), t('schedule.wd.6'), t('schedule.wd.7'),
];
// Displayed day names; the raw MONDAY..SATURDAY values are what the server gets
const dayLabel = (t, day) => {
  switch (day) {
    case 'MONDAY': return t('schedule.day.monday');
    case 'TUESDAY': return t('schedule.day.tuesday');
    case 'WEDNESDAY': return t('schedule.day.wednesday');
    case 'THURSDAY': return t('schedule.day.thursday');
    case 'FRIDAY': return t('schedule.day.friday');
    case 'SATURDAY': return t('schedule.day.saturday');
    default: return day;
  }
};
const markLabel = (t, type) => {
  switch (type) {
    case 'UNAVAILABLE': return t('schedule.notAvailable');
    case 'REMEMBER': return t('schedule.remember');
    default: return type;
  }
};

// grey = "Remember", red = "Not available"
const MARK_STYLE = {
  UNAVAILABLE: {
    cube: 'bg-red-500 text-white border-red-600',
    row: 'border-red-300 bg-red-50',
    badge: 'bg-red-100 text-red-700',
  },
  REMEMBER: {
    cube: 'bg-gray-500 text-white border-gray-600',
    row: 'border-gray-400 bg-gray-200',
    badge: 'bg-gray-300 text-gray-800',
  },
};

const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfToday = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
};
const prettyDate = (ds, locale) => {
  const [y, m, d] = ds.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(locale, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
};
const listToText = (arr, andWord) =>
  arr.length <= 1 ? arr.join('') : `${arr.slice(0, -1).join(', ')} ${andWord} ${arr[arr.length - 1]}`;

// ───────────────────────── Calendar popup ─────────────────────────
function CalendarModal({ doctorId, doctorName, marks, loadYear, onSave, onClear, onClose }) {
  const { t, locale } = useLanguage();
  const months = getMonths(t);
  const weekdayInitials = getWeekdayInitials(t);
  const [year, setYear] = useState(new Date().getFullYear());
  const [picked, setPicked] = useState(null); // 'YYYY-MM-DD'
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }
  const today = startOfToday();
  const thisYear = today.getFullYear();

  useEffect(() => {
    loadYear(doctorId, year);
  }, [year, doctorId]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (picked) setPicked(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [picked, onClose]);

  const pickDate = (ds) => {
    setPicked(ds);
    setNote(marks[ds]?.note || '');
    setMsg(null);
  };

  const choose = async (type) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await onSave(picked, type, note.trim());
      const warn = res?.bookedSlots > 0
        ? ` ${t('schedule.bookedWarn', { n: res.bookedSlots })}`
        : '';
      setMsg({ ok: true, text: `${t('schedule.marked', { date: prettyDate(picked, locale), label: markLabel(t, type) })}${warn}` });
      setPicked(null);
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.message || t('schedule.saveFailedMark') });
    }
    setBusy(false);
  };

  const clear = async () => {
    setBusy(true);
    setMsg(null);
    try {
      await onClear(picked);
      setMsg({ ok: true, text: t('schedule.markRemoved', { date: prettyDate(picked, locale) }) });
      setPicked(null);
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.message || t('schedule.removeFailedMark') });
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl my-6" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-bold text-gray-800">📅 {t('schedule.calendarTitle', { name: doctorName || t('schedule.doctorFallback') })}</h3>
            <p className="text-xs text-gray-500">{t('schedule.calendarHint')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setYear((y) => y - 1)} disabled={year <= thisYear}
              className="w-8 h-8 rounded-lg border text-gray-600 hover:bg-gray-100 disabled:opacity-30">‹</button>
            <span className="w-14 text-center font-semibold text-gray-800">{year}</span>
            <button onClick={() => setYear((y) => y + 1)}
              className="w-8 h-8 rounded-lg border text-gray-600 hover:bg-gray-100">›</button>
            <button onClick={onClose} className="ml-2 w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 text-lg" aria-label={t('schedule.close')}>✕</button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 px-6 py-3 text-xs text-gray-600 border-b bg-gray-50">
          <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-gray-500 inline-block" /> {t('schedule.remember')}</span>
          <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-red-500 inline-block" /> {t('schedule.notAvailable')}</span>
          <span className="flex items-center gap-2"><span className="w-4 h-4 rounded border-2 border-blue-500 inline-block" /> {t('schedule.today')}</span>
        </div>

        {msg && (
          <div className={`mx-6 mt-4 px-4 py-3 rounded-lg text-sm ${
            msg.ok ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        {/* 12 months */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {months.map((monthName, m) => {
            const lead = (new Date(year, m, 1).getDay() + 6) % 7; // Monday first
            const count = new Date(year, m + 1, 0).getDate();
            return (
              <div key={monthName}>
                <h4 className="font-semibold text-gray-800 mb-2">{monthName}</h4>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-gray-400 mb-1">
                  {weekdayInitials.map((d, i) => <span key={i}>{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: lead }).map((_, i) => <span key={`b${i}`} />)}
                  {Array.from({ length: count }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(year, m, day);
                    const ds = fmt(date);
                    const mark = marks[ds];
                    const past = date < today;
                    const isToday = ds === fmt(today);
                    let cls = 'h-8 rounded-md text-xs font-medium border transition-colors ';
                    if (mark) cls += MARK_STYLE[mark.type].cube + (past ? ' opacity-50 cursor-not-allowed' : ' hover:opacity-80');
                    else if (past) cls += 'text-gray-300 border-transparent cursor-not-allowed';
                    else cls += 'bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300';
                    if (isToday) cls += ' ring-2 ring-blue-500';
                    if (picked === ds) cls += ' ring-2 ring-offset-1 ring-blue-600';
                    return (
                      <button key={day} disabled={past} onClick={() => pickDate(ds)}
                        title={mark ? `${markLabel(t, mark.type)}${mark.note ? ` — ${mark.note}` : ''}` : undefined}
                        className={cls}>
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Small dialog when a date is clicked */}
      {picked && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" onClick={(e) => { e.stopPropagation(); setPicked(null); }}>
          <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-gray-800">{prettyDate(picked, locale)}</h4>
            {marks[picked] ? (
              <p className="text-sm mt-1">
                {t('schedule.currently')} <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${MARK_STYLE[marks[picked].type].badge}`}>
                  {markLabel(t, marks[picked].type)}</span>
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">{t('schedule.notMarked')}</p>
            )}

            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} maxLength={120}
              placeholder={t('schedule.notePlaceholder')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <div className="flex gap-2 mt-4">
              <button disabled={busy} onClick={() => choose('REMEMBER')}
                className="flex-1 bg-gray-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-600 disabled:opacity-50">
                {t('schedule.remember')}
              </button>
              <button disabled={busy} onClick={() => choose('UNAVAILABLE')}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                {t('schedule.notAvailable')}
              </button>
            </div>
            {marks[picked] && (
              <button disabled={busy} onClick={clear}
                className="w-full mt-2 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
                {t('schedule.removeMark')}
              </button>
            )}
            <button onClick={() => setPicked(null)} className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700">{t('schedule.cancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Page ─────────────────────────
export default function SchedulePage() {
  const router = useRouter();
  const { t, locale } = useLanguage();
  const monthsShort = getMonthsShort(t);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDays, setSelectedDays] = useState({
    MONDAY: { enabled: false, start: '09:00', end: '13:00', slotMinutes: 15 },
    TUESDAY: { enabled: false, start: '09:00', end: '13:00', slotMinutes: 15 },
    WEDNESDAY: { enabled: false, start: '09:00', end: '13:00', slotMinutes: 15 },
    THURSDAY: { enabled: false, start: '09:00', end: '13:00', slotMinutes: 15 },
    FRIDAY: { enabled: false, start: '09:00', end: '13:00', slotMinutes: 15 },
    SATURDAY: { enabled: false, start: '09:00', end: '13:00', slotMinutes: 15 },
  });

  // Date marks for the selected doctor: { 'YYYY-MM-DD': { type, note } }
  const [marks, setMarks] = useState({});
  const loadedYears = useRef(new Set());
  const currentDoctor = useRef('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Choosing a doctor (or the first load) starts the calendar state fresh
  const selectDoctor = (id) => {
    currentDoctor.current = id;
    loadedYears.current = new Set();
    setMarks({});
    setWeekOffset(0);
    setSelectedDoctorId(id);
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { router.push('/'); return; }
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    const hospitalId = localStorage.getItem('hospitalId');
    if (!hospitalId) return;
    try {
      const res = await api.get(`/api/hospital/${hospitalId}/doctors`);
      setDoctors(res.data || []);
      if (res.data && res.data.length > 0) {
        selectDoctor(res.data[0].id.toString());
      }
    } catch (err) {
      console.error('Error loading doctors:', err);
    }
  };

  const loadYear = async (doctorId, year) => {
    const key = `${doctorId}-${year}`;
    if (loadedYears.current.has(key)) return;
    loadedYears.current.add(key);
    try {
      const res = await api.get(`/api/schedule/doctor/${doctorId}/marks`, { params: { year } });
      if (currentDoctor.current !== String(doctorId)) return; // doctor changed meanwhile
      setMarks((prev) => {
        const next = { ...prev };
        (res.data || []).forEach((m) => { next[m.date] = { type: m.type, note: m.note || '' }; });
        return next;
      });
    } catch (err) {
      loadedYears.current.delete(key);
      console.error('Error loading calendar marks:', err);
    }
  };

  // Week being shown (Monday → Saturday), shifted by the ‹ › arrows
  const today = startOfToday();
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7);
  const weekDates = DAY_NAMES.map((_, i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
  const weekLabel = `${weekDates[0].getDate()} ${monthsShort[weekDates[0].getMonth()]} – ${weekDates[5].getDate()} ${monthsShort[weekDates[5].getMonth()]}`;

  // Make sure the marks for the year(s) of the shown week are loaded
  useEffect(() => {
    if (!selectedDoctorId) return;
    new Set(weekDates.map((d) => d.getFullYear())).forEach((y) => loadYear(selectedDoctorId, y));
  }, [selectedDoctorId, weekOffset]);

  const saveMark = async (dateStr, type, note) => {
    const res = await api.post(`/api/schedule/doctor/${selectedDoctorId}/marks`, { date: dateStr, type, note });
    setMarks((prev) => ({ ...prev, [dateStr]: { type, note } }));
    return res.data;
  };

  const clearMark = async (dateStr) => {
    await api.delete(`/api/schedule/doctor/${selectedDoctorId}/marks`, { params: { date: dateStr } });
    setMarks((prev) => {
      const next = { ...prev };
      delete next[dateStr];
      return next;
    });
  };

  const toggleDay = (day) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled }
    }));
  };

  const updateDay = (day, field, value) => {
    setSelectedDays(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const saveSchedule = async () => {
    if (!selectedDoctorId) {
      setMessage(`❌ ${t('schedule.selectDoctorErr')}`);
      return;
    }

    const days = Object.entries(selectedDays).filter(([_, v]) => v.enabled);

    if (days.length === 0) {
      setMessage(`❌ ${t('schedule.selectDayErr')}`);
      return;
    }

    setLoading(true);
    try {
      // Backend expects ONE day per call — loop through each selected day
      for (const [day, config] of days) {
        await api.post('/api/schedule/set', {
          doctorId: parseInt(selectedDoctorId),
          dayOfWeek: day,
          startTime: config.start,
          endTime: config.end,
          slotDurationMinutes: config.slotMinutes
        });
      }

      // Then regenerate slots once, for the whole schedule
      await api.post(`/api/schedule/regenerate/${selectedDoctorId}`);

      const names = days.map(([day]) => dayLabel(t, day));
      const daysText = listToText(names, t('schedule.and'));
      setMessage(`✅ ${names.length === 1 ? t('schedule.savedOne', { days: daysText }) : t('schedule.savedMany', { days: daysText })}`);
    } catch (err) {
      console.error('Schedule save error:', err);
      setMessage(`❌ ${t('schedule.saveFailed', { error: err.response?.data?.message || err.message || t('schedule.unknownError') })}`);
    }
    setLoading(false);
    setTimeout(() => setMessage(''), 6000);
  };

  const selectedDoctor = doctors.find(d => d.id.toString() === selectedDoctorId);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">{t('schedule.back')}</Link>
        <h1 className="text-xl font-bold text-gray-800">🗓 {t('schedule.title')}</h1>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {message && (
          <div className={`px-4 py-3 rounded-lg mb-6 ${
            message.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' :
            'bg-red-50 border border-red-200 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('schedule.selectDoctor')}</label>
          <select
            value={selectedDoctorId}
            onChange={(e) => selectDoctor(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {doctors.length === 0 ? (
              <option value="">{t('schedule.noDoctors')}</option>
            ) : (
              doctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.specialty ? `— ${d.specialty.name}` : ''}
                </option>
              ))
            )}
          </select>

          {/* Title row: week arrows + calendar icon sit on the same line */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedDoctor ? t('schedule.weeklyTitle', { name: selectedDoctor.name }) : t('schedule.weekly')}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setWeekOffset((w) => Math.max(0, w - 1))} disabled={weekOffset === 0}
                title={t('schedule.prevWeek')}
                className="w-8 h-8 rounded-lg border text-gray-600 hover:bg-gray-100 disabled:opacity-30">‹</button>
              <span className="text-xs text-gray-600 whitespace-nowrap min-w-[90px] text-center">
                {weekOffset === 0 ? t('schedule.thisWeek') : weekLabel}
              </span>
              <button onClick={() => setWeekOffset((w) => w + 1)} title={t('schedule.nextWeek')}
                className="w-8 h-8 rounded-lg border text-gray-600 hover:bg-gray-100">›</button>
              <button onClick={() => setCalendarOpen(true)} disabled={!selectedDoctorId}
                title={t('schedule.openCalendar')} aria-label={t('schedule.openCalendar')}
                className="w-9 h-9 rounded-lg border border-blue-200 bg-blue-50 text-lg hover:bg-blue-100 disabled:opacity-40">
                📅
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            {t('schedule.weeklyHint')}
          </p>

          <div className="space-y-4">
            {Object.entries(selectedDays).map(([day, config], idx) => {
              const date = weekDates[idx];
              const mark = marks[fmt(date)];
              const style = mark ? MARK_STYLE[mark.type] : null;
              return (
                <div key={day} className={`border rounded-xl p-4 transition-colors ${
                  mark ? style.row : config.enabled ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-4">
                    <input type="checkbox" checked={mark ? false : config.enabled}
                      disabled={!!mark}
                      onChange={() => toggleDay(day)}
                      className="w-5 h-5 text-blue-600 disabled:cursor-not-allowed" />
                    <div className="w-28">
                      <span className="font-medium text-gray-800 uppercase">{dayLabel(t, day)}</span>
                      <span className="block text-xs text-gray-500">{date.getDate()} {monthsShort[date.getMonth()]}</span>
                    </div>

                    {mark && (
                      <div className="flex items-center gap-2 flex-1 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${style.badge}`}>{markLabel(t, mark.type)}</span>
                        {mark.note && <span className="text-sm text-gray-600">{mark.note}</span>}
                      </div>
                    )}

                    {!mark && config.enabled && (
                      <div className="flex gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">{t('schedule.start')}</label>
                          <input type="time" value={config.start}
                            onChange={(e) => updateDay(day, 'start', e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">{t('schedule.end')}</label>
                          <input type="time" value={config.end}
                            onChange={(e) => updateDay(day, 'end', e.target.value)}
                            className="border border-gray-300 rounded px-2 py-1 text-sm" />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600">{t('schedule.slot')}</label>
                          <select value={config.slotMinutes}
                            onChange={(e) => updateDay(day, 'slotMinutes', parseInt(e.target.value))}
                            className="border border-gray-300 rounded px-2 py-1 text-sm">
                            <option value={10}>{t('schedule.minutes', { n: 10 })}</option>
                            <option value={15}>{t('schedule.minutes', { n: 15 })}</option>
                            <option value={20}>{t('schedule.minutes', { n: 20 })}</option>
                            <option value={30}>{t('schedule.minutes', { n: 30 })}</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={saveSchedule} disabled={loading}
            className="w-full mt-6 bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? t('schedule.saving') : `💾 ${t('schedule.save')}`}
          </button>
        </div>
      </div>

      {calendarOpen && (
        <CalendarModal
          doctorId={selectedDoctorId}
          doctorName={selectedDoctor?.name}
          marks={marks}
          loadYear={loadYear}
          onSave={saveMark}
          onClear={clearMark}
          onClose={() => setCalendarOpen(false)}
        />
      )}
    </div>
  );
}
