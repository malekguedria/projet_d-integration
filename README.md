# StageFlow

StageFlow is a web app for managing internship offers and applications. User accounts, offers, and application decisions are stored in a server-side SQLite database; the browser is not used as a database.

## Requirements

- Node.js 22.13 or later (`node:sqlite` is provided by Node)
- npm

## Run locally

```powershell
npm start
```

Open [http://localhost:3000](http://localhost:3000). On first run, StageFlow creates `database/stageflow.sqlite`. No demo accounts or sample offers are seeded. Register an account from the login page as a student or company, then publish offers and apply with those accounts.

The database persists when the server stops. Set `DB_PATH` to store it elsewhere; for example:

```powershell
$env:DB_PATH = "C:\stageflow-data\stageflow.sqlite"
npm start
```

Back up the SQLite database file regularly. Do not copy it while the app is writing to it unless SQLite's backup API or a coordinated shutdown is used.

## Staff accounts

Public registration is limited to student and company accounts. Create institutional accounts from a terminal with:

```powershell
npm run create-user -- tutor "Sophie Moreau" sophie@example.edu "use-a-long-unique-password"
npm run create-user -- secretariat "Claire Bernard" claire@example.edu "use-a-long-unique-password"
npm run create-user -- department "Marc Boissieu" marc@example.edu "use-a-long-unique-password"
npm run create-user -- executive "Isabelle Laurent" isabelle@example.edu "use-a-long-unique-password"
```

Use unique passwords and avoid putting production credentials in shell history. Supported staff roles are `tutor`, `secretariat`, `department`, and `executive`.

Teacher accounts can be created directly from the registration form. Secrétaire and Département accounts require a single-use invitation code. Generate one (valid for 24 hours by default) with:

```powershell
npm run create-invite -- secretariat 48
npm run create-invite -- department
```

Give the generated code only to the intended staff member. Codes are stored as hashes and consumed after one successful registration.

## Data-backed workflows

- Passwords are stored as salted scrypt hashes.
- Every account role can change its password from the profile menu; new passwords must contain at least 6 characters.
- Sessions use an HTTP-only, same-site cookie; the server controls authentication and role checks.
- Companies can publish offers and review applications to their own offers.
- Students can browse published offers and submit one application per offer.
- Company decisions (accepted/rejected) are stored with each application.
- Students can request supervision from a teacher account; the teacher can accept or refuse, and both roles receive persistent notifications.
- Teachers can view and schedule meetings only with students assigned to them through an accepted supervision request.
- Students can upload PDF or DOCX internship documents (up to 10 MB) and download their original files. Files are stored privately in `database/uploads/`; set `UPLOAD_DIR` to change this location.

The main data API is under `/api`. The database schema is initialized automatically by `lib/store.js`.

## Project layout

```text
server.js              HTTP server and API
lib/store.js           SQLite schema and connection
database/              Local SQLite data (ignored by Git)
js/database.js         Browser API client
js/auth.js             Browser authentication/session helpers
scripts/create-user.js Create institutional staff accounts
```

Teacher dashboards also support the persisted supervision-request workflow. Department, secretariat, and executive dashboards remain presentation prototypes.
