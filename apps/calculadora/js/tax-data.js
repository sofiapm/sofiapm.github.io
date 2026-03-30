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

// Tabelas de retencao na fonte 2026 (Despacho SEAF 2026-01-05-XXV)
// Formula: Retencao = max(0, R x Taxa - Parcela - ParcelaDep x nDeps)
const WITHHOLDING = {
  // Tabela I: Nao casado sem dependentes ou casado dois titulares
  TABLE_I: [
    { limit: 920,      rate: 0,      parcela: 0,       parcelaDep: 0,     formula: null },
    { limit: 1042,     rate: 0.125,  parcela: 0,       parcelaDep: 21.43, formula: R => 0.125 * 2.6 * (1273.85 - R) },
    { limit: 1108,     rate: 0.157,  parcela: 0,       parcelaDep: 21.43, formula: R => 0.157 * 1.35 * (1554.83 - R) },
    { limit: 1154,     rate: 0.157,  parcela: 94.71,   parcelaDep: 21.43, formula: null },
    { limit: 1212,     rate: 0.212,  parcela: 158.18,  parcelaDep: 21.43, formula: null },
    { limit: 1819,     rate: 0.241,  parcela: 193.33,  parcelaDep: 21.43, formula: null },
    { limit: 2119,     rate: 0.311,  parcela: 320.66,  parcelaDep: 21.43, formula: null },
    { limit: 2499,     rate: 0.349,  parcela: 401.19,  parcelaDep: 21.43, formula: null },
    { limit: 3305,     rate: 0.3836, parcela: 487.66,  parcelaDep: 21.43, formula: null },
    { limit: 5547,     rate: 0.3969, parcela: 531.62,  parcelaDep: 21.43, formula: null },
    { limit: 20221,    rate: 0.4495, parcela: 823.40,  parcelaDep: 21.43, formula: null },
    { limit: Infinity, rate: 0.4717, parcela: 1272.31, parcelaDep: 21.43, formula: null },
  ],
  // Tabela II: Nao casado com um ou mais dependentes
  TABLE_II: [
    { limit: 920,      rate: 0,      parcela: 0,       parcelaDep: 0,     formula: null },
    { limit: 1042,     rate: 0.125,  parcela: 0,       parcelaDep: 34.29, formula: R => 0.125 * 2.6 * (1273.85 - R) },
    { limit: 1108,     rate: 0.157,  parcela: 0,       parcelaDep: 34.29, formula: R => 0.157 * 1.35 * (1554.83 - R) },
    { limit: 1154,     rate: 0.157,  parcela: 94.71,   parcelaDep: 34.29, formula: null },
    { limit: 1212,     rate: 0.212,  parcela: 158.18,  parcelaDep: 34.29, formula: null },
    { limit: 1819,     rate: 0.241,  parcela: 193.33,  parcelaDep: 34.29, formula: null },
    { limit: 2119,     rate: 0.311,  parcela: 320.66,  parcelaDep: 34.29, formula: null },
    { limit: 2499,     rate: 0.349,  parcela: 401.19,  parcelaDep: 34.29, formula: null },
    { limit: 3305,     rate: 0.3836, parcela: 487.66,  parcelaDep: 34.29, formula: null },
    { limit: 5547,     rate: 0.3969, parcela: 531.62,  parcelaDep: 34.29, formula: null },
    { limit: 20221,    rate: 0.4495, parcela: 823.40,  parcelaDep: 34.29, formula: null },
    { limit: Infinity, rate: 0.4717, parcela: 1272.31, parcelaDep: 34.29, formula: null },
  ],
  // Tabela III: Casado, unico titular
  TABLE_III: [
    { limit: 991,      rate: 0,      parcela: 0,        parcelaDep: 0,     formula: null },
    { limit: 1042,     rate: 0.125,  parcela: 0,        parcelaDep: 42.86, formula: R => 0.125 * 2.6 * (1372.15 - R) },
    { limit: 1108,     rate: 0.125,  parcela: 0,        parcelaDep: 42.86, formula: R => 0.125 * 1.35 * (1677.85 - R) },
    { limit: 1119,     rate: 0.125,  parcela: 96.17,    parcelaDep: 42.86, formula: null },
    { limit: 1432,     rate: 0.1272, parcela: 98.64,    parcelaDep: 42.86, formula: null },
    { limit: 1962,     rate: 0.157,  parcela: 141.32,   parcelaDep: 42.86, formula: null },
    { limit: 2240,     rate: 0.1938, parcela: 213.53,   parcelaDep: 42.86, formula: null },
    { limit: 2773,     rate: 0.2277, parcela: 289.47,   parcelaDep: 42.86, formula: null },
    { limit: 3389,     rate: 0.257,  parcela: 370.72,   parcelaDep: 42.86, formula: null },
    { limit: 5965,     rate: 0.2881, parcela: 476.12,   parcelaDep: 42.86, formula: null },
    { limit: 20265,    rate: 0.3843, parcela: 1049.96,  parcelaDep: 42.86, formula: null },
    { limit: Infinity, rate: 0.4717, parcela: 2821.13,  parcelaDep: 42.86, formula: null },
  ],
};
