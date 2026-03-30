// Motor de calculo - funcoes puras, sem DOM

function applyBrackets(rc) {
  if (rc <= 0) return 0;
  for (const b of TAX.BRACKETS) {
    if (rc <= b.limit) return rc * b.rate - b.parcela;
  }
  return 0;
}

function applySobretaxa(rc) {
  let s = 0;
  for (const t of TAX.SOBRETAXA) {
    if (rc > t.min) {
      s += (Math.min(rc, t.max) - t.min) * t.rate;
    }
  }
  return s;
}

function calcIRS(rc, familySituation) {
  if (familySituation === 'married-1') {
    return applyBrackets(rc / 2) * 2 + applySobretaxa(rc / 2) * 2;
  }
  return applyBrackets(rc) + applySobretaxa(rc);
}

function calcIRSJovemDiscount(irs, grossAnual, jovemYear) {
  if (!jovemYear) return 0;
  const rate = TAX.JOVEM_RATES[jovemYear] || 0;
  const exemptIncome = Math.min(grossAnual, TAX.IRS_JOVEM_LIMIT);
  const proportion = grossAnual > 0 ? exemptIncome / grossAnual : 0;
  return irs * proportion * rate;
}

function applyDeductions(irs, dependents, dependentsUnder3, grossAnual, irsJovemYear) {
  // Art. 78-A CIRS: 600 (>3 anos), 726 (<=3 anos)
  const depsOver3 = Math.max(0, dependents - dependentsUnder3);
  const depDeduction = depsOver3 * TAX.DEP_DEDUCTION
    + dependentsUnder3 * TAX.DEP_UNDER3_DEDUCTION;
  irs = Math.max(0, irs - depDeduction);

  const jovemDiscount = calcIRSJovemDiscount(irs, grossAnual, irsJovemYear);
  irs = Math.max(0, irs - jovemDiscount);

  return { irs, jovemDiscount, depDeduction };
}

function applyMinimoExistencia(irs, grossAnual, ssAnual) {
  const netCheck = grossAnual - ssAnual - irs;
  if (netCheck < TAX.MINIMO_EXISTENCIA && grossAnual > 0) {
    return Math.max(0, grossAnual - ssAnual - TAX.MINIMO_EXISTENCIA);
  }
  return irs;
}

// Calculo completo para Trabalho Dependente
function calcDependente(input) {
  const {
    grossMonthly, familySituation, dependents, dependentsUnder3,
    mealPerDay, mealType, workDays, transportMonthly,
    subsidyMode, irsJovemYear
  } = input;

  const grossAnual = grossMonthly * 14;

  // Seguranca Social (base)
  const ssAnualEmp = grossAnual * TAX.SS_EMPLOYEE;
  const ssAnualEntidade = grossAnual * TAX.SS_EMPLOYER;

  // Excesso do subsidio alimentacao sobre o limite isento
  const mealExempt = mealType === 'card' ? TAX.MEAL_EXEMPT_CARD : TAX.MEAL_EXEMPT_CASH;
  const mealExcessDay = Math.max(0, mealPerDay - mealExempt);
  const mealExcessAnual = mealExcessDay * workDays * 11;

  // SS total inclui excesso do subsidio alimentacao
  const ssAnualEmpTotal = ssAnualEmp + mealExcessAnual * TAX.SS_EMPLOYEE;
  const ssAnualEntidadeTotal = ssAnualEntidade + mealExcessAnual * TAX.SS_EMPLOYER;

  // Deducao especifica = max(4587.09, SS base)
  const deducaoEsp = Math.max(TAX.DEDUCAO_ESPECIFICA, ssAnualEmp);

  // Rendimento coletavel (inclui excesso do subsidio alimentacao)
  const rc = Math.max(0, grossAnual + mealExcessAnual - deducaoEsp);

  // IRS
  let irs = calcIRS(rc, familySituation);
  const deductions = applyDeductions(irs, dependents, dependentsUnder3, grossAnual, irsJovemYear);
  irs = applyMinimoExistencia(deductions.irs, grossAnual, ssAnualEmpTotal);

  // Distribuicao mensal
  const months = subsidyMode === 14 ? 14 : 12;
  const grossMonthlyEff = grossAnual / months;
  const ssMonthly = ssAnualEmpTotal / months;
  const irsMonthly = irs / months;
  const netMonthlyBase = grossMonthlyEff - ssMonthly - irsMonthly;

  // Subsidio alimentacao (11 meses)
  const mealCleanDay = Math.min(mealPerDay, mealExempt);
  const mealMonthlyClean = mealCleanDay * workDays;
  const mealMonthlyTotal = mealPerDay * workDays;
  const mealAnnualClean = mealMonthlyClean * 11;
  const mealAnnualTotal = mealMonthlyTotal * 11;

  // Subsidio transporte (11 meses)
  const transportAnnual = transportMonthly * 11;

  const totalNetMonthly = netMonthlyBase + mealMonthlyClean + transportMonthly;
  const netAnual = grossAnual - ssAnualEmpTotal - irs;
  const totalNetAnual = netAnual + mealAnnualClean + transportAnnual;

  const empCostAnual = grossAnual + ssAnualEntidadeTotal + mealAnnualTotal + transportAnnual;
  const empCostMonthly = empCostAnual / 12;

  const rSS = grossAnual > 0 ? ssAnualEmpTotal / grossAnual : 0;
  const rIRS = grossAnual > 0 ? irs / grossAnual : 0;

  return {
    grossMonthly, grossMonthlyEff, grossAnual,
    ssMonthly, ssAnualEmp: ssAnualEmpTotal, ssAnualEntidade: ssAnualEntidadeTotal,
    deducaoEsp, rc,
    irsMonthly, irs, jovemDiscount: deductions.jovemDiscount, depDeduction: deductions.depDeduction,
    netMonthlyBase, totalNetMonthly,
    mealPerDay, mealType,
    mealMonthlyClean, mealMonthlyTotal, mealAnnualClean, mealAnnualTotal,
    transportMonthly, transportAnnual,
    netAnual, totalNetAnual,
    empCostMonthly, empCostAnual,
    rSS, rIRS, rTotal: rSS + rIRS,
    subsidyMode: months,
    warnings: grossMonthly > 0 && grossMonthly < TAX.MIN_WAGE
      ? ['Salario abaixo do salario minimo nacional (' + fmt(TAX.MIN_WAGE) + ')'] : [],
  };
}

// Calculo completo para Trabalho Independente (regime simplificado)
function calcIndependente(input) {
  const {
    grossMonthly, familySituation, dependents, dependentsUnder3,
    firstYearExempt, irsJovemYear
  } = input;

  const grossAnual = grossMonthly * 12;

  // SS (21.4% sobre 70% do rendimento)
  const ssAnual = firstYearExempt ? 0 : grossAnual * TAX.SS_IND_COEFF * TAX.SS_INDEPENDENT;
  const ssMonthly = ssAnual / 12;

  // 75% do rendimento e tributavel
  const rendTributavel = grossAnual * TAX.SIMPLIFIED_COEFF;
  const rc = Math.max(0, rendTributavel);

  // IRS
  let irs = calcIRS(rc, familySituation);
  const deductions = applyDeductions(irs, dependents, dependentsUnder3, grossAnual, irsJovemYear);
  irs = applyMinimoExistencia(deductions.irs, grossAnual, ssAnual);

  const irsMonthly = irs / 12;
  const netMonthly = grossMonthly - ssMonthly - irsMonthly;
  const netAnual = grossAnual - ssAnual - irs;

  const rSS = grossAnual > 0 ? ssAnual / grossAnual : 0;
  const rIRS = grossAnual > 0 ? irs / grossAnual : 0;

  return {
    grossMonthly, grossAnual,
    ssMonthly, ssAnual,
    rendTributavel, rc,
    irsMonthly, irs, jovemDiscount: deductions.jovemDiscount, depDeduction: deductions.depDeduction,
    netMonthly, netAnual,
    rSS, rIRS, rTotal: rSS + rIRS,
    warnings: [],
  };
}

// Busca binaria para Liquido -> Bruto
function findGross(targetNet, calcFn, baseInput, netField) {
  let lo = 0, hi = targetNet * 4;

  let r = calcFn({ ...baseInput, grossMonthly: hi });
  while (r[netField] < targetNet && hi < 1000000) {
    hi *= 2;
    r = calcFn({ ...baseInput, grossMonthly: hi });
  }

  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    r = calcFn({ ...baseInput, grossMonthly: mid });
    if (Math.abs(r[netField] - targetNet) < 0.01) return Math.round(mid * 100) / 100;
    if (r[netField] < targetNet) lo = mid; else hi = mid;
  }
  return Math.round(((lo + hi) / 2) * 100) / 100;
}

// Formatacao
function fmt(v) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 2
  }).format(v);
}

function fmtPct(v) {
  return (v * 100).toFixed(1) + '%';
}
