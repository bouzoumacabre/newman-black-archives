export const SYSTEM_LOGS: Record<number, string[]> = {
  1: [
    '[SYS] BNW BLACK ARCHIVES ONLINE',
    '[SYS] archive integrity ........ 71%',
    '[SYS] remote connection ....... accepted',
    '[SYS] אמת',
    '[SYS] A.N. .................... UNKNOWN',
    '[SYS] G-7 signal .............. WEAK',
    '[SYS] סוד',
  ],
  2: [
    '[INTEL] SSR fragment recovered',
    '[INTEL] foreign signature detected',
    '[INTEL] צפון',
    '[INTEL] ברית',
    '[INTEL] source mismatch',
    '[INTEL] classified channel ..... open',
  ],
  3: [
    '[OAC] archive C-7 responding',
    '[OAC] שער',
    '[!!] S.F. SESSION TRACE DETECTED',
    '[OAC] authorization modified',
    '[??] operator unknown',
    '[OAC] ירושה',
  ],
  4: [
    '[SYSTEM] archive integrity ...... 14%',
    '[SYSTEM] ROXWOOD ............... LOST',
    '[SYSTEM] SANDY SHORES .......... OFFLINE',
    '[SYSTEM] TEL-AVIV .............. NO RESPONSE',
    '[SYSTEM] G-7 ................... ACTIVE',
    '[SYSTEM] GALAPAGOS ............. ACTIVE',
    '[SYSTEM] סוף',
  ],
}

export const R0_INTRO = [
  "Je ne suis pas de ceux qui ont écrit ces documents. Je les ai sortis.",
  "Cinquante pièces. Quatre paquets. Je ne les lâche pas d'un coup.",
  "Si je vous donne tout maintenant, vous irez droit à l'argent et vous ne comprendrez rien, et dans six mois ils recommenceront ailleurs sous un autre nom.",
  "Alors ça se passe comme ça : vous lisez, et à la fin de chaque phase vous me dites ce que vous avez compris. Pas un résumé. Ce que vous avez compris.",
  "Je lis. Si ça tient, je vous envoie ce qu'il faut pour continuer.",
  "Une dernière chose. Quelqu'un d'autre est déjà sur cette archive. Je ne sais pas encore pour qui il travaille.",
]

export const R0_PHASE_MESSAGES: Record<number, string[]> = {
  1: ["R-0 exige une reconstruction des faits.", "Ce que vous avez lu ne correspond pas entièrement à ce qui a été raconté."],
  2: ["Les frontières comptent moins que ceux qui les traversent.", "Reconstituez les liens. Pas les apparences."],
  3: ["Je n'ai pas ouvert ce canal.", "Si vous voyez S.F., ne supposez rien. Continuez de lire."],
  4: ["Le réseau se désagrège.", "Il reste assez de signal pour une dernière transmission."],
}
