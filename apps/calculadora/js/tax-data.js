// Constantes fiscais Portugal 2026
const TAX = Object.freeze({
  YEAR: 2026,
  IAS: 537.13,
  MIN_WAGE: 920,

  // Seguranca Social
  SS_EMPLOYEE: 0.11,
  SS_EMPLOYER: 0.2375,
  SS_INDEPENDENT: 0.214,
  SS_IND_COEFF: 0.70,

  // Deducoes
  DEDUCAO_ESPECIFICA: 4587.09,
  MINIMO_EXISTENCIA: 12880,

  // Subsidio alimentacao (limites isentos/dia)
  MEAL_EXEMPT_CASH: 6.15,
  MEAL_EXEMPT_CARD: 10.46,

  // Dependentes (Art. 78-A CIRS)
  DEP_DEDUCTION: 600,
  DEP_UNDER3_DEDUCTION: 726,
  DEP_UNDER6_SECOND: 900,

  // IRS Jovem
  IRS_JOVEM_LIMIT: 55 * 537.13, // 29,542.15

  // Escaloes IRS 2026
  BRACKETS: Object.freeze([
    { limit: 8342,     rate: 0.125, parcela: 0 },
    { limit: 12587,    rate: 0.157, parcela: 266.94 },
    { limit: 17838,    rate: 0.212, parcela: 959.26 },
    { limit: 23089,    rate: 0.241, parcela: 1476.45 },
    { limit: 29397,    rate: 0.311, parcela: 3092.77 },
    { limit: 43090,    rate: 0.349, parcela: 4209.94 },
    { limit: 46566,    rate: 0.431, parcela: 7743.27 },
    { limit: 86634,    rate: 0.446, parcela: 8441.48 },
    { limit: Infinity, rate: 0.48,  parcela: 11387.17 },
  ]),

  // Sobretaxa de solidariedade
  SOBRETAXA: Object.freeze([
    { min: 80000,  max: 250000,   rate: 0.025 },
    { min: 250000, max: Infinity, rate: 0.05 },
  ]),

  // IRS Jovem - percentagem de isencao por ano
  JOVEM_RATES: Object.freeze({ 1: 1.0, 2: 0.75, 5: 0.50, 8: 0.25 }),

  // Regime simplificado (coeficiente de tributacao)
  SIMPLIFIED_COEFF: 0.75,
});
