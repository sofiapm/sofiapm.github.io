// Motor de calculo de ajudas de custo

function getWorkingDays(month, year) {
  const holidays = new Set(TRAVEL.HOLIDAYS_2026);
  const days = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;
    const iso = date.toISOString().slice(0, 10);
    if (holidays.has(iso)) continue;
    days.push(d);
  }
  return days;
}

function getDailyRate(workerType, location) {
  return TRAVEL.DAILY_RATES[location][workerType];
}

function calcDayValue(entry, workerType, location) {
  const rate = getDailyRate(workerType, location);
  const numDays = (entry.dayTo || entry.dayFrom) - entry.dayFrom + 1;
  if (entry.fullDay) return rate * numDays;
  let pct = 0;
  if (entry.lunch) pct += TRAVEL.PERCENTAGES.lunch;
  if (entry.dinner) pct += TRAVEL.PERCENTAGES.dinner;
  if (entry.accommodation) pct += TRAVEL.PERCENTAGES.accommodation;
  return Math.round(rate * pct * 100) / 100 * numDays;
}

function calcTotal(entries, workerType, location) {
  return entries.reduce((sum, e) => sum + calcDayValue(e, workerType, location), 0);
}

function generateEntries(targetAmount, month, year, workerType, location) {
  const workingDays = getWorkingDays(month, year);
  const rate = getDailyRate(workerType, location);
  const descriptions = TRAVEL.DEFAULT_DESCRIPTIONS;

  if (workingDays.length === 0) return { entries: [], warning: null };

  let fullDaysNeeded = Math.floor(targetAmount / rate);
  let warning = null;

  if (fullDaysNeeded > workingDays.length) {
    warning = 'Valor excede os dias uteis disponiveis (' + workingDays.length +
      ' dias = ' + fmt(workingDays.length * rate) + '). Limitado ao maximo.';
    fullDaysNeeded = workingDays.length;
  }

  const entries = [];
  let descIdx = 0;
  let i = 0;

  // Agrupar dias uteis consecutivos
  while (i < fullDaysNeeded) {
    const rangeStart = workingDays[i];
    let rangeEnd = rangeStart;
    while (i + 1 < fullDaysNeeded && workingDays[i + 1] === rangeEnd + 1) {
      i++;
      rangeEnd = workingDays[i];
    }
    entries.push({
      dayFrom: rangeStart,
      dayTo: rangeEnd,
      description: descriptions[descIdx % descriptions.length],
      departure: '09:00',
      arrival: '18:00',
      fullDay: true,
      lunch: true,
      dinner: true,
      accommodation: true,
    });
    descIdx++;
    i++;
  }

  // Dia parcial para o valor restante
  let remaining = Math.round((targetAmount - fullDaysNeeded * rate) * 100) / 100;

  if (remaining > 0 && fullDaysNeeded < workingDays.length) {
    const accValue = Math.round(rate * TRAVEL.PERCENTAGES.accommodation * 100) / 100;
    const mealValue = Math.round(rate * TRAVEL.PERCENTAGES.lunch * 100) / 100;

    const entry = {
      dayFrom: workingDays[fullDaysNeeded],
      dayTo: workingDays[fullDaysNeeded],
      description: descriptions[descIdx % descriptions.length],
      departure: '09:00',
      arrival: '18:00',
      fullDay: false,
      lunch: false,
      dinner: false,
      accommodation: false,
    };

    if (remaining >= accValue) {
      entry.accommodation = true;
      remaining = Math.round((remaining - accValue) * 100) / 100;
    }
    if (remaining >= mealValue) {
      entry.lunch = true;
      remaining = Math.round((remaining - mealValue) * 100) / 100;
    }
    if (remaining >= mealValue) {
      entry.dinner = true;
      entry.arrival = '21:00';
    }

    if (entry.lunch || entry.dinner || entry.accommodation) {
      if (!entry.lunch && !entry.dinner) entry.arrival = '22:00';
      entries.push(entry);
    }
  }

  return { entries, warning };
}
