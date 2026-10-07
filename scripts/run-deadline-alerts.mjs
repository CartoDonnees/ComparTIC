/**
 * Déclenche les alertes de délai réglementaire depuis la ligne de commande.
 *
 *   node --env-file=.env scripts/run-deadline-alerts.mjs [--dry-run] [--days 2]
 *
 * Utile pour une planification cron sur le serveur :
 *   0 7 * * * cd /chemin/vers/CompareTIC && node --env-file=.env scripts/run-deadline-alerts.mjs >> logs/deadlines.log 2>&1
 *
 * L'appel passe par l'API (mêmes règles, même journal d'audit) : le serveur
 * doit donc être démarré. `APP_URL` permet de viser une autre adresse.
 */

const base = process.env.APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";
const secret = process.env.CRON_SECRET;
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const daysIndex = args.indexOf("--days");
const thresholdDays = daysIndex > -1 ? Number(args[daysIndex + 1]) : undefined;

if (!secret) {
  console.error("CRON_SECRET absent : renseignez-le dans .env avant de planifier la tâche.");
  process.exit(1);
}

const res = await fetch(`${base}/api/cron/deadline-alerts`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-cron-secret": secret },
  body: JSON.stringify({ dryRun, ...(Number.isFinite(thresholdDays) ? { thresholdDays } : {}) }),
}).catch((error) => {
  console.error("Serveur injoignable :", error.message);
  process.exit(1);
});

const payload = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`Échec (${res.status}) :`, payload.error || "erreur inconnue");
  process.exit(1);
}

console.log(
  `[${new Date().toISOString()}] offres examinées : ${payload.checked}, alertes émises : ${payload.alerted}, ignorées : ${payload.skipped}${dryRun ? " (simulation)" : ""}`,
);
payload.details?.filter((d) => d.sent).forEach((d) => console.log(`  - ${d.offer} (${d.level}) → ${d.recipients} destinataire(s)`));
