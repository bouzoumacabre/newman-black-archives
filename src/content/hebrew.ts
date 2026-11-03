// Single words only, used as atmosphere. Never a sentence.
export const HEBREW = [
  'סודי', 'פקודה', 'משימה', 'גישה', 'אושר', 'נדחה', 'הצפנה', 'רשת', 'צל', 'שקט',
  'חשאי', 'מפתח', 'אות', 'עורב', 'לילה', 'שער', 'קוד', 'נאמן', 'ציות', 'הסוואה',
]

export const pickHebrew = () => HEBREW[Math.floor(Math.random() * HEBREW.length)]
