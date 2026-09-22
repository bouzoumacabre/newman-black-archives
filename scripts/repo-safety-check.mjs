import fs from 'node:fs'
import path from 'node:path'

const contentRoots = ['src', 'supabase', 'public']
const forbiddenContent = [
  /solutionPhase/i,
  /correctAnswers/i,
  /phaseAnswers/i,
  /treasureLocation/i,
  /futureGPS/i,
  /coordinatesList/i,
  /expectedAnswer/i,
  /keywordsRequired/i,
  /answerValidation/i,
]

const secretPatterns = [
  /SUPABASE_SERVICE_ROLE_KEY/,
  /service_role\s*[:=]/i,
  /VITE_.*SERVICE.*ROLE/i,
]

const textExt = /\.(ts|tsx|js|jsx|json|sql|css|html|mjs|cjs)$/i
let failed = false

function report(message) {
  console.error(`[FAIL] ${message}`)
  failed = true
}

function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
      continue
    }
    if (!textExt.test(entry.name)) continue

    const content = fs.readFileSync(full, 'utf8')
    for (const pattern of forbiddenContent) {
      if (pattern.test(content)) report(`forbidden repository token ${pattern} in ${full}`)
    }
    for (const pattern of secretPatterns) {
      if (pattern.test(content)) report(`possible privileged Supabase key/reference ${pattern} in ${full}`)
    }
  }
}

for (const root of contentRoots) walk(root)

for (const envName of ['.env', '.env.local', '.env.production', '.env.development']) {
  if (fs.existsSync(envName)) report(`${envName} exists in repository root; keep secrets outside packaged handoffs / version control`)
}

if (failed) process.exit(1)
console.log('[OK] repository safety scan passed')
