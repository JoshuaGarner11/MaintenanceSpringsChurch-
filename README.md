# Springs Maintenance

The Springs Church's own maintenance app, replacing MaintainX. Work orders, repeating
inspections, assets, locations, parts and checklists, built for phones first.

## What's in it

| Area | What it does |
| --- | --- |
| Today | Overdue, due today and this week; technicians see their own jobs |
| Work orders | Create from a phone with photos, checklists (Pass/Fail/Flag, number, text, checkbox), parts used, notes, time and outside costs |
| Failed checks | A failed or flagged item offers a one-tap repair work order linked to the inspection |
| Schedules | Repeat every N days/weeks/months/years; the work order is created a set number of days before it's due |
| Assets | Details, photos, full history, parent/child (e.g. Horn Strobe is part of Fire Alarms), printable QR labels |
| Locations | Areas and rooms with their history |
| Report a problem | A printable QR sign per room (Locations → Report signs). Anyone scans it, picks what's wrong, adds a photo if they like, and it becomes a work order for that room. No sign-in. Repeat reports of the same problem are added to the open order |
| Office TV | `/tv` is a full-screen board for a TV: new reports, overdue, the next 7 days, inspections coming up, low stock and Vlad's calendar. Refreshes itself every minute; the TV uses a private link (More → Office TV) instead of signing in. A painting runs across the top and changes hourly: 22 public-domain Albert Bierstadt landscapes are added on first start, and admins can upload more under More → Paintings on the TV |
| Alerts | Admins get a push notification on their phone for each new report (More → Turn on alerts), or an email if they haven't turned alerts on |
| Parts | Stock, minimums, restock and counts; stock drops when a part is logged on a work order |
| Overview | Open, overdue, done this month, low stock, failed inspections with no repair |
| People | Admin, technician, viewer; sign in with a 6-digit code emailed to them, no passwords |

A scheduler process creates due work orders every hour and emails admins a daily digest of overdue work and low stock.

## Running it on the NAS (Synology Container Manager)

1. Copy this repository to the NAS, e.g. `/volume1/docker/maintenance`.
2. Copy `.env.example` to `.env` and fill it in (database password, app address, email settings). For push alerts, run `npx web-push generate-vapid-keys` once (any computer with Node) and paste the two keys in.
3. In Container Manager → Project → Create, point it at that folder; it uses `docker-compose.yml`. Or over SSH: `docker compose up -d --build`.
4. Create the first admin: `docker compose exec app npm run create-admin -- "Vlad Lastname" vlad@example.org`
5. For the QR report signs and push alerts, the app needs a public `https://` address (people scan on their mobile data, and phones only allow alerts over HTTPS). Create a Cloudflare Tunnel to `http://app:3000`, put its token in `.env`, and run `docker compose --profile tunnel up -d`.

Data lives in `./data/postgres` and `./data/uploads`. Back up the whole folder with Hyper Backup.

## Importing from MaintainX

Put the MaintainX CSV export (Locations, Assets, Parts, Vendors, Work Orders) in `./import`, then:

```sh
docker compose exec app npm run import:maintainx -- /import
docker compose exec app npm run download:files
```

The import runs only on an empty database. It keeps MaintainX work order numbers, skips MaintainX's sample
vendors and training orders, turns the annual safety inspections into yearly schedules, and opens a repair
order for any asset whose latest inspection failed. MaintainX doesn't export email addresses, so imported
people start inactive with placeholder emails: set their real addresses on the People page.

`download:files` copies the photos and PDFs off MaintainX's servers. Run it before cancelling MaintainX.

## Developing

```sh
npm install
echo 'DATABASE_URL=postgresql://user@localhost:5432/maint' > .env
npx prisma migrate dev
npm run create-admin -- "Your Name" you@example.org
npm run dev
```

Without `SMTP_HOST` set, sign-in codes are printed to the server log. `npm test` runs the unit tests.
