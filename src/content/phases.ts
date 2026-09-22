import type { PhaseDefinition } from '../types'

export const PHASES: PhaseDefinition[] = [
  {
    no: 1,
    roman: 'I',
    code: 'PH-I',
    name: 'ROXWOOD',
    documents: '01 → 12',
    subtitle: "Quelque chose ne correspond pas à l'histoire officielle",
    sector: 'R-0',
    flavor: 'bank',
  },
  {
    no: 2,
    roman: 'II',
    code: 'PH-II',
    name: "L'ÉCHIQUIER",
    documents: '13 → 31',
    subtitle: "Ceux qui semblaient ennemis ne l'étaient peut-être pas",
    sector: 'E-1',
    flavor: 'intel',
  },
  {
    no: 3,
    roman: 'III',
    code: 'PH-III',
    name: 'CANAAN',
    documents: '32 → 43',
    subtitle: 'Qui se trouve au-dessus ?',
    sector: 'C-7',
    flavor: 'oac',
  },
  {
    no: 4,
    roman: 'IV',
    code: 'PH-IV',
    name: 'LA FIN',
    documents: '44 → 50',
    subtitle: "Roxwood n'a jamais été destiné à survivre",
    sector: 'Ω',
    flavor: 'collapse',
  },
]

export function getPhase(no: number) {
  return PHASES.find((phase) => phase.no === no)
}
