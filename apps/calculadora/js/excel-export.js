// Exportacao para Excel usando SheetJS (XLSX global do CDN)

function exportToExcel(entries, workerType, location, month, year) {
  const rate = getDailyRate(workerType, location);
  const locLabel = location === 'national' ? 'Nacional' : 'Internacional';
  const typeLabel = workerType === 'workers' ? 'Trabalhadores' : 'Administradores';
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Mapear entradas por dia (expandir ranges)
  const dayMap = {};
  entries.forEach(e => {
    for (let d = e.dayFrom; d <= e.dayTo; d++) {
      dayMap[d] = e;
    }
  });

  // Cabeçalho do documento
  const info = [
    ['MAPA DE ITINERARIO'],
    ['Periodo', monthNames[month - 1] + ' ' + year],
    ['Tipo', typeLabel + ' / ' + locLabel],
    ['Taxa Diaria', rate],
    [],
  ];

  // Tabela: uma linha por dia util do mes
  const header = ['Dia', 'Descricao', 'Partida', 'Chegada', 'Almoco', 'Jantar', 'Dormida', 'Dia Completo', 'Valor (EUR)'];
  const workingDays = getWorkingDays(month, year);
  const rows = [];
  let total = 0;

  workingDays.forEach(d => {
    const dateStr = String(d).padStart(2, '0') + '/' + String(month).padStart(2, '0') + '/' + year;
    const e = dayMap[d];
    if (e) {
      const dayRate = getDailyRate(workerType, location);
      let val;
      if (e.fullDay) {
        val = dayRate;
      } else {
        let pct = 0;
        if (e.lunch) pct += TRAVEL.PERCENTAGES.lunch;
        if (e.dinner) pct += TRAVEL.PERCENTAGES.dinner;
        if (e.accommodation) pct += TRAVEL.PERCENTAGES.accommodation;
        val = Math.round(dayRate * pct * 100) / 100;
      }
      total += val;
      rows.push([
        dateStr,
        e.description,
        e.departure,
        e.arrival,
        e.lunch ? 'Sim' : 'Nao',
        e.dinner ? 'Sim' : 'Nao',
        e.accommodation ? 'Sim' : 'Nao',
        e.fullDay ? 'Sim' : 'Nao',
        val,
      ]);
    } else {
      rows.push([dateStr, '', '', '', '', '', '', '', '']);
    }
  });

  // Linha de total
  const totalRow = ['', '', '', '', '', '', '', 'TOTAL', total];

  const data = [...info, header, ...rows, totalRow];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Larguras de coluna
  ws['!cols'] = [
    { wch: 14 }, // Dia
    { wch: 28 }, // Descricao
    { wch: 8 },  // Partida
    { wch: 8 },  // Chegada
    { wch: 8 },  // Almoco
    { wch: 8 },  // Jantar
    { wch: 8 },  // Dormida
    { wch: 14 }, // Dia Completo
    { wch: 14 }, // Valor
  ];

  // Formato moeda: Taxa Diaria (B4) e coluna Valor (col I = index 8)
  const taxaAddr = XLSX.utils.encode_cell({ r: 3, c: 1 });
  if (ws[taxaAddr]) ws[taxaAddr].z = '#,##0.00 "EUR"';

  const range = XLSX.utils.decode_range(ws['!ref']);
  const dataStartRow = info.length + 1;
  for (let r = dataStartRow; r <= range.e.r; r++) {
    const addr = XLSX.utils.encode_cell({ r, c: 8 });
    if (ws[addr] && typeof ws[addr].v === 'number') {
      ws[addr].z = '#,##0.00 "EUR"';
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mapa Itinerario');
  XLSX.writeFile(wb, 'mapa_itinerario_' + String(month).padStart(2, '0') + '_' + year + '.xlsx');
}
