const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./lib/store');

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = __dirname;
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'database', 'uploads');
const sessions = new Map();
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

function safeUser(row) {
    const roleLabels = {
        student: 'Étudiant',
        company: 'Entreprise',
        tutor: 'Enseignant',
        secretariat: 'Secrétaire',
        department: 'Département',
        executive: 'Direction'
    };
    const redirects = {
        student: 'student-offers.html',
        company: 'company-offers.html',
        tutor: 'tutor-dashboard.html',
        secretariat: 'secretariat-dossiers.html',
        department: 'department-supervision.html',
        executive: 'executive-direction.html'
    };
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        roleLabel: row.role === 'company' ? row.company_name : roleLabels[row.role],
        companyName: row.company_name,
        avatar: row.name.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase(),
        redirect: redirects[row.role]
    };
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const derived = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${derived}`;
}

function verifyPassword(password, encoded) {
    const [salt, expectedHex] = encoded.split(':');
    const expected = Buffer.from(expectedHex || '', 'hex');
    const actual = crypto.scryptSync(password, salt, 64);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function sendJson(res, status, data, headers = {}) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', ...headers });
    res.end(JSON.stringify(data));
}

function readJson(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        let size = 0;
        let tooLarge = false;
        req.on('data', chunk => {
            size += chunk.length;
            if (size > 1024 * 1024) {
                if (!tooLarge) {
                    tooLarge = true;
                    reject(Object.assign(new Error('La requête est trop volumineuse.'), { status: 413 }));
                }
                return;
            }
            body += chunk;
        });
        req.on('end', () => {
            if (tooLarge) return;
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch {
                reject(Object.assign(new Error('Corps JSON invalide.'), { status: 400 }));
            }
        });
        req.on('error', reject);
    });
}

function readMultipart(req) {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!contentType.toLowerCase().startsWith('multipart/form-data') || !boundaryMatch) {
        return Promise.reject(Object.assign(new Error('Le formulaire de dépôt est invalide.'), { status: 400 }));
    }
    const boundary = Buffer.from(`--${(boundaryMatch[1] || boundaryMatch[2]).trim()}`);
    return new Promise((resolve, reject) => {
        const chunks = [];
        let size = 0;
        let tooLarge = false;
        req.on('data', chunk => {
            size += chunk.length;
            if (size > MAX_DOCUMENT_SIZE + 64 * 1024) {
                tooLarge = true;
                chunks.length = 0;
            } else if (!tooLarge) {
                chunks.push(chunk);
            }
        });
        req.on('end', () => {
            if (tooLarge) {
                reject(Object.assign(new Error('Le fichier dépasse la limite de 10 Mo.'), { status: 413 }));
                return;
            }
            const body = Buffer.concat(chunks);
            const fields = {};
            let file = null;
            let cursor = body.indexOf(boundary);
            while (cursor !== -1) {
                cursor += boundary.length;
                if (body.subarray(cursor, cursor + 2).toString() === '--') break;
                if (body.subarray(cursor, cursor + 2).toString() === '\r\n') cursor += 2;
                const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), cursor);
                if (headerEnd === -1) break;
                const headers = body.subarray(cursor, headerEnd).toString('utf8');
                const contentStart = headerEnd + 4;
                const nextBoundary = body.indexOf(Buffer.concat([Buffer.from('\r\n'), boundary]), contentStart);
                if (nextBoundary === -1) break;
                const disposition = headers.match(/content-disposition:\s*form-data;[^\r\n]*/i);
                const nameMatch = disposition && disposition[0].match(/(?:^|;)\s*name="([^"]*)"/i);
                const filenameMatch = disposition && disposition[0].match(/(?:^|;)\s*filename="((?:\\.|[^"])*)"/i);
                const content = body.subarray(contentStart, nextBoundary);
                if (nameMatch && filenameMatch) {
                    file = {
                        filename: filenameMatch[1].replace(/\\"/g, '"'),
                        contentType: (headers.match(/content-type:\s*([^\r\n]+)/i) || [])[1] || 'application/octet-stream',
                        buffer: content
                    };
                } else if (nameMatch) {
                    fields[nameMatch[1]] = content.toString('utf8');
                }
                cursor = nextBoundary + 2;
            }
            resolve({ fields, file });
        });
        req.on('error', reject);
    });
}

function sessionUser(req) {
    const cookie = (req.headers.cookie || '').split(';').map(value => value.trim())
        .find(value => value.startsWith('stageflow_session='));
    if (!cookie) return null;
    const token = cookie.slice('stageflow_session='.length);
    const session = sessions.get(token);
    if (!session || session.expiresAt < Date.now()) {
        sessions.delete(token);
        return null;
    }
    return db.prepare('SELECT * FROM users WHERE id = ?').get(session.userId) || null;
}

function requireRole(user, roles) {
    if (!user) throw Object.assign(new Error('Authentification requise.'), { status: 401 });
    if (roles && !roles.includes(user.role)) {
        throw Object.assign(new Error('Vous n’avez pas les droits nécessaires.'), { status: 403 });
    }
}

function createSession(user, res) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { userId: user.id, expiresAt: Date.now() + SESSION_TTL_MS });
    res.setHeader('Set-Cookie', `stageflow_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`);
}

function validateString(value, label, maxLength) {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
        throw Object.assign(new Error(`${label} est obligatoire (maximum ${maxLength} caractères).`), { status: 400 });
    }
    return value.trim();
}

function validatePassword(value) {
    if (typeof value !== 'string' || value.length < 6 || value.length > 200) {
        throw Object.assign(new Error('Le mot de passe doit contenir entre 6 et 200 caractères.'), { status: 400 });
    }
    return value;
}

function mapOffer(row) {
    return { ...row, skills: JSON.parse(row.skills) };
}

function mapApplication(row) {
    return row;
}

async function handleApi(req, res, url) {
    const user = sessionUser(req);

    if (req.method === 'POST' && url.pathname === '/api/auth/register') {
        const body = await readJson(req);
        const name = validateString(body.name, 'Le nom', 100);
        const email = validateString(body.email, 'L’adresse e-mail', 254).toLowerCase();
        const password = validatePassword(body.password);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw Object.assign(new Error('Adresse e-mail invalide.'), { status: 400 });
        }
        const staffRoles = ['tutor', 'secretariat', 'department'];
        if (!['student', 'company', ...staffRoles].includes(body.role)) {
            throw Object.assign(new Error('Type de compte invalide.'), { status: 400 });
        }
        const isStaffRegistration = ['secretariat', 'department'].includes(body.role);
        const inviteToken = isStaffRegistration
            ? validateString(body.inviteToken, 'Le code d’invitation', 200)
            : null;
        const companyName = body.role === 'company' ? validateString(body.companyName, 'Le nom de l’entreprise', 120) : null;
        try {
            let result;
            if (isStaffRegistration) {
                const tokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
                db.exec('BEGIN IMMEDIATE');
                try {
                    const invite = db.prepare(`
                        SELECT token_hash FROM registration_invites
                        WHERE token_hash = ? AND role = ? AND expires_at > ? AND used_at IS NULL
                    `).get(tokenHash, body.role, Date.now());
                    if (!invite) {
                        throw Object.assign(new Error('Code d’invitation invalide, expiré ou déjà utilisé.'), { status: 403 });
                    }
                    result = db.prepare(`
                        INSERT INTO users (name, email, password_hash, role, company_name)
                        VALUES (?, ?, ?, ?, NULL)
                    `).run(name, email, hashPassword(password), body.role);
                    const consumed = db.prepare(`
                        UPDATE registration_invites SET used_at = ?
                        WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?
                    `).run(Date.now(), tokenHash, Date.now());
                    if (consumed.changes !== 1) {
                        throw Object.assign(new Error('Code d’invitation invalide, expiré ou déjà utilisé.'), { status: 403 });
                    }
                    db.exec('COMMIT');
                } catch (error) {
                    db.exec('ROLLBACK');
                    throw error;
                }
            } else {
                result = db.prepare(`
                    INSERT INTO users (name, email, password_hash, role, company_name)
                    VALUES (?, ?, ?, ?, ?)
                `).run(name, email, hashPassword(password), body.role, companyName);
            }
            const created = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(result.lastInsertRowid));
            createSession(created, res);
            return sendJson(res, 201, { user: safeUser(created) });
        } catch (error) {
            if (String(error.message).includes('UNIQUE constraint failed')) {
                throw Object.assign(new Error('Un compte existe déjà pour cette adresse e-mail.'), { status: 409 });
            }
            throw error;
        }
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/login') {
        const body = await readJson(req);
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';
        const account = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (!account || !verifyPassword(password, account.password_hash)) {
            throw Object.assign(new Error('Adresse e-mail ou mot de passe incorrect.'), { status: 401 });
        }
        createSession(account, res);
        return sendJson(res, 200, { user: safeUser(account) });
    }

    if (req.method === 'PATCH' && url.pathname === '/api/auth/password') {
        requireRole(user);
        const body = await readJson(req);
        const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : '';
        const newPassword = validatePassword(body.newPassword);
        if (!verifyPassword(currentPassword, user.password_hash)) {
            throw Object.assign(new Error('Le mot de passe actuel est incorrect.'), { status: 400 });
        }
        if (currentPassword === newPassword) {
            throw Object.assign(new Error('Choisissez un mot de passe différent de l’actuel.'), { status: 400 });
        }
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
            .run(hashPassword(newPassword), user.id);
        return sendJson(res, 200, { success: true });
    }

    if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
        const cookie = (req.headers.cookie || '').split(';').map(value => value.trim())
            .find(value => value.startsWith('stageflow_session='));
        if (cookie) sessions.delete(cookie.slice('stageflow_session='.length));
        return sendJson(res, 200, { success: true }, {
            'Set-Cookie': 'stageflow_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'
        });
    }

    if (req.method === 'GET' && url.pathname === '/api/me') {
        requireRole(user);
        return sendJson(res, 200, { user: safeUser(user) });
    }

    if (req.method === 'GET' && url.pathname === '/api/offers') {
        requireRole(user);
        const offers = user.role === 'company'
            ? db.prepare(`
                SELECT offers.*, users.company_name
                FROM offers JOIN users ON users.id = offers.company_id
                WHERE offers.status = 'published' AND offers.company_id = ?
                ORDER BY offers.created_at DESC
            `).all(user.id).map(mapOffer)
            : db.prepare(`
                SELECT offers.*, users.company_name
                FROM offers JOIN users ON users.id = offers.company_id
                WHERE offers.status = 'published'
                ORDER BY offers.created_at DESC
            `).all().map(mapOffer);
        return sendJson(res, 200, { offers });
    }

    if (req.method === 'POST' && url.pathname === '/api/offers') {
        requireRole(user, ['company']);
        const body = await readJson(req);
        const title = validateString(body.title, 'L’intitulé', 160);
        const domain = validateString(body.domain, 'Le domaine', 80);
        const city = validateString(body.city, 'La ville', 100);
        const startDate = validateString(body.startDate, 'La date de début', 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || Number.isNaN(Date.parse(startDate))) {
            throw Object.assign(new Error('Date de début invalide.'), { status: 400 });
        }
        const duration = Number(body.durationMonths);
        const salary = Number(body.salaryEur);
        if (!Number.isInteger(duration) || duration < 1 || duration > 12) {
            throw Object.assign(new Error('La durée doit être comprise entre 1 et 12 mois.'), { status: 400 });
        }
        if (!Number.isInteger(salary) || salary < 0 || salary > 100000) {
            throw Object.assign(new Error('La gratification mensuelle doit être un montant valide.'), { status: 400 });
        }
        const workMode = validateString(body.workMode, 'Le mode de travail', 80);
        const description = validateString(body.description, 'La description', 5000);
        const skills = Array.isArray(body.skills)
            ? body.skills.slice(0, 20).map(value => validateString(value, 'Une compétence', 60))
            : [];
        const result = db.prepare(`
            INSERT INTO offers (company_id, title, domain, city, start_date, duration_months,
                salary_eur, work_mode, skills, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(user.id, title, domain, city, startDate, duration, salary, workMode, JSON.stringify(skills), description);
        const offer = db.prepare('SELECT offers.*, users.company_name FROM offers JOIN users ON users.id = offers.company_id WHERE offers.id = ?')
            .get(Number(result.lastInsertRowid));
        return sendJson(res, 201, { offer: mapOffer(offer) });
    }

    if (req.method === 'GET' && url.pathname === '/api/applications') {
        requireRole(user, ['student', 'company']);
        const applications = user.role === 'student'
            ? db.prepare(`
                SELECT applications.*, offers.title, offers.city, users.company_name
                FROM applications
                JOIN offers ON offers.id = applications.offer_id
                JOIN users ON users.id = offers.company_id
                WHERE applications.student_id = ?
                ORDER BY applications.created_at DESC
            `).all(user.id)
            : db.prepare(`
                SELECT applications.*, offers.title, offers.city, users.name AS student_name, users.email AS student_email
                FROM applications
                JOIN offers ON offers.id = applications.offer_id
                JOIN users ON users.id = applications.student_id
                WHERE offers.company_id = ?
                ORDER BY applications.created_at DESC
            `).all(user.id);
        return sendJson(res, 200, { applications: applications.map(mapApplication) });
    }

    if (req.method === 'GET' && url.pathname === '/api/tutors') {
        requireRole(user, ['student']);
        const tutors = db.prepare(`
            SELECT id, name, email
            FROM users
            WHERE role = 'tutor'
            ORDER BY name COLLATE NOCASE
        `).all();
        return sendJson(res, 200, { tutors });
    }

    if (req.method === 'POST' && url.pathname === '/api/supervision-requests') {
        requireRole(user, ['student']);
        const body = await readJson(req);
        const tutorId = Number(body.tutorId);
        const tutor = db.prepare("SELECT id, name FROM users WHERE id = ? AND role = 'tutor'").get(tutorId);
        if (!tutor) throw Object.assign(new Error('Enseignant introuvable.'), { status: 404 });
        const existing = db.prepare(`
            SELECT status FROM supervision_requests
            WHERE student_id = ? AND status IN ('pending', 'accepted')
            LIMIT 1
        `).get(user.id);
        if (existing) {
            throw Object.assign(new Error(existing.status === 'accepted'
                ? 'Un enseignant vous encadre déjà.'
                : 'Une demande d’encadrement est déjà en attente.'), { status: 409 });
        }
        let transactionStarted = false;
        try {
            db.exec('BEGIN IMMEDIATE');
            transactionStarted = true;
            const result = db.prepare(`
                INSERT INTO supervision_requests (student_id, tutor_id)
                VALUES (?, ?)
            `).run(user.id, tutor.id);
            db.prepare(`
                INSERT INTO notifications (user_id, type, message, supervision_request_id)
                VALUES (?, 'supervision_request', ?, ?)
            `).run(tutor.id, `${user.name} demande un encadrement.`, Number(result.lastInsertRowid));
            db.exec('COMMIT');
            transactionStarted = false;
            return sendJson(res, 201, { requestId: Number(result.lastInsertRowid) });
        } catch (error) {
            if (transactionStarted) db.exec('ROLLBACK');
            if (String(error.message).includes('UNIQUE constraint failed')) {
                throw Object.assign(new Error('Une demande d’encadrement est déjà en attente.'), { status: 409 });
            }
            throw error;
        }
    }

    const supervisionDecisionMatch = url.pathname.match(/^\/api\/supervision-requests\/(\d+)\/decision$/);
    if (req.method === 'PATCH' && supervisionDecisionMatch) {
        requireRole(user, ['tutor']);
        const body = await readJson(req);
        if (!['accepted', 'rejected'].includes(body.status)) {
            throw Object.assign(new Error('Décision invalide.'), { status: 400 });
        }
        const requestId = Number(supervisionDecisionMatch[1]);
        const supervisionRequest = db.prepare(`
            SELECT supervision_requests.*, students.name AS student_name
            FROM supervision_requests
            JOIN users AS students ON students.id = supervision_requests.student_id
            WHERE supervision_requests.id = ? AND supervision_requests.tutor_id = ?
                AND supervision_requests.status = 'pending'
        `).get(requestId, user.id);
        if (!supervisionRequest) {
            throw Object.assign(new Error('Demande introuvable ou déjà traitée.'), { status: 404 });
        }
        db.exec('BEGIN IMMEDIATE');
        try {
            if (body.status === 'accepted') {
                const assignment = db.prepare(`
                    SELECT id FROM supervision_requests
                    WHERE student_id = ? AND status = 'accepted' AND id != ?
                `).get(supervisionRequest.student_id, requestId);
                if (assignment) {
                    throw Object.assign(new Error('Cet étudiant est déjà suivi par un autre enseignant.'), { status: 409 });
                }
            }
            const result = db.prepare(`
                UPDATE supervision_requests
                SET status = ?, responded_at = CURRENT_TIMESTAMP
                WHERE id = ? AND tutor_id = ? AND status = 'pending'
            `).run(body.status, requestId, user.id);
            if (result.changes !== 1) {
                throw Object.assign(new Error('Demande introuvable ou déjà traitée.'), { status: 404 });
            }
            const decisionText = body.status === 'accepted' ? 'acceptée' : 'refusée';
            db.prepare(`
                INSERT INTO notifications (user_id, type, message, supervision_request_id)
                VALUES (?, 'supervision_decision', ?, ?)
            `).run(supervisionRequest.student_id,
                `Votre demande d’encadrement a été ${decisionText} par ${user.name}.`, requestId);
            db.exec('COMMIT');
        } catch (error) {
            db.exec('ROLLBACK');
            throw error;
        }
        return sendJson(res, 200, { success: true });
    }

    if (req.method === 'GET' && url.pathname === '/api/notifications') {
        requireRole(user);
        const notifications = db.prepare(`
            SELECT notifications.id, notifications.type, notifications.message,
                   notifications.supervision_request_id, notifications.created_at,
                   notifications.read_at, supervision_requests.status AS request_status
            FROM notifications
            LEFT JOIN supervision_requests ON supervision_requests.id = notifications.supervision_request_id
            WHERE notifications.user_id = ?
            ORDER BY notifications.read_at IS NULL DESC, notifications.created_at DESC, notifications.id DESC
            LIMIT 100
        `).all(user.id);
        return sendJson(res, 200, { notifications });
    }

    if (req.method === 'PATCH' && url.pathname === '/api/notifications/read') {
        requireRole(user);
        db.prepare(`
            UPDATE notifications SET read_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND read_at IS NULL
        `).run(user.id);
        return sendJson(res, 200, { success: true });
    }

    if (req.method === 'POST' && url.pathname === '/api/student/documents') {
        requireRole(user, ['student']);
        const { fields, file } = await readMultipart(req);
        if (!file || file.buffer.length === 0) {
            throw Object.assign(new Error('Sélectionnez un document à déposer.'), { status: 400 });
        }
        if (file.buffer.length > MAX_DOCUMENT_SIZE) {
            throw Object.assign(new Error('Le fichier dépasse la limite de 10 Mo.'), { status: 413 });
        }
        const filename = path.basename(file.filename.replace(/\\/g, '/')).trim();
        const extension = path.extname(filename).toLowerCase();
        if (!filename || filename.length > 255 || !['.pdf', '.docx'].includes(extension)) {
            throw Object.assign(new Error('Seuls les fichiers PDF et DOCX sont acceptés.'), { status: 400 });
        }
        const documentType = validateString(fields.documentType, 'Le type de document', 100);
        const storedName = `${crypto.randomBytes(24).toString('hex')}${extension}`;
        const mimeType = extension === '.pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        await fs.promises.writeFile(path.join(UPLOAD_DIR, storedName), file.buffer, { flag: 'wx' });
        try {
            const result = db.prepare(`
                INSERT INTO stage_documents (student_id, document_type, filename, stored_name, mime_type, size)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(user.id, documentType, filename, storedName, mimeType, file.buffer.length);
            return sendJson(res, 201, { documentId: Number(result.lastInsertRowid) });
        } catch (error) {
            await fs.promises.unlink(path.join(UPLOAD_DIR, storedName));
            throw error;
        }
    }

    const documentDownloadMatch = url.pathname.match(/^\/api\/student\/documents\/(\d+)\/download$/);
    if (req.method === 'GET' && documentDownloadMatch) {
        requireRole(user);
        const document = db.prepare('SELECT * FROM stage_documents WHERE id = ?')
            .get(Number(documentDownloadMatch[1]));
        if (!document) throw Object.assign(new Error('Document introuvable.'), { status: 404 });
        const authorized = user.role === 'student'
            ? document.student_id === user.id
            : Boolean(db.prepare(`
                SELECT id FROM supervision_requests
                WHERE student_id = ? AND tutor_id = ? AND status = 'accepted'
            `).get(document.student_id, user.id));
        if (!authorized) throw Object.assign(new Error('Vous ne pouvez pas accéder à ce document.'), { status: 403 });
        let content;
        try {
            content = await fs.promises.readFile(path.join(UPLOAD_DIR, document.stored_name));
        } catch (error) {
            if (error.code === 'ENOENT') throw Object.assign(new Error('Le fichier du document est introuvable.'), { status: 404 });
            throw error;
        }
        res.writeHead(200, {
            'Content-Type': document.mime_type,
            'Content-Length': content.length,
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.filename)}`,
            'X-Content-Type-Options': 'nosniff'
        });
        res.end(content);
        return;
    }

    if (req.method === 'GET' && url.pathname === '/api/student/dashboard') {
        requireRole(user, ['student']);
        const applications = db.prepare(`
            SELECT applications.*, offers.title, offers.city, offers.duration_months,
                   offers.start_date, users.company_name
            FROM applications
            JOIN offers ON offers.id = applications.offer_id
            JOIN users ON users.id = offers.company_id
            WHERE applications.student_id = ?
            ORDER BY applications.created_at DESC
        `).all(user.id);
        const meetings = db.prepare(`
            SELECT meetings.*, users.name AS tutor_name
            FROM meetings JOIN users ON users.id = meetings.tutor_id
            WHERE meetings.student_id = ? AND meetings.status != 'cancelled'
            ORDER BY meetings.meeting_date, meetings.meeting_time
        `).all(user.id);
        const supervision = db.prepare(`
            SELECT supervision_requests.id AS request_id, supervision_requests.status,
                   users.id AS tutor_id, users.name AS tutor_name, users.email AS tutor_email
            FROM supervision_requests
            JOIN users ON users.id = supervision_requests.tutor_id
            WHERE supervision_requests.student_id = ?
            ORDER BY supervision_requests.created_at DESC, supervision_requests.id DESC
            LIMIT 1
        `).get(user.id) || null;
        const documents = db.prepare(`
            SELECT id, document_type, filename, mime_type, size, created_at
            FROM stage_documents WHERE student_id = ?
            ORDER BY created_at DESC, id DESC
        `).all(user.id);
        return sendJson(res, 200, { applications, meetings, supervision, documents });
    }

    const tutorStudentDetailsMatch = url.pathname.match(/^\/api\/tutor\/students\/(\d+)$/);
    if (req.method === 'GET' && tutorStudentDetailsMatch) {
        requireRole(user);
        const studentId = Number(tutorStudentDetailsMatch[1]);
        const student = db.prepare(`
            SELECT students.id, students.name, students.email,
                   tutors.name AS supervisor_name, assignments.created_at AS assigned_at
            FROM users AS students
            JOIN supervision_requests AS assignments
                ON assignments.student_id = students.id
                AND assignments.tutor_id = ? AND assignments.status = 'accepted'
            JOIN users AS tutors ON tutors.id = assignments.tutor_id
            WHERE students.id = ? AND students.role = 'student'
        `).get(user.id, studentId);
        if (!student) {
            throw Object.assign(new Error('Étudiant encadré introuvable.'), { status: 404 });
        }
        const applications = db.prepare(`
            SELECT applications.id, applications.status, applications.created_at,
                   applications.cover_letter,
                   offers.title, offers.domain, offers.city, offers.start_date,
                   offers.duration_months, companies.company_name
            FROM applications
            JOIN offers ON offers.id = applications.offer_id
            JOIN users AS companies ON companies.id = offers.company_id
            WHERE applications.student_id = ?
            ORDER BY applications.created_at DESC, applications.id DESC
        `).all(studentId);
        const documents = db.prepare(`
            SELECT id, document_type, filename, mime_type, size, created_at
            FROM stage_documents
            WHERE student_id = ?
            ORDER BY created_at DESC, id DESC
        `).all(studentId);
        const meetings = db.prepare(`
            SELECT id, title, meeting_date, meeting_time, format, status, created_at
            FROM meetings
            WHERE tutor_id = ? AND student_id = ? AND status != 'cancelled'
            ORDER BY meeting_date DESC, meeting_time DESC
        `).all(user.id, studentId);
        return sendJson(res, 200, { student, applications, documents, meetings });
    }

    if (req.method === 'GET' && url.pathname === '/api/tutor/students') {
        requireRole(user, ['tutor']);
        const students = db.prepare(`
            SELECT students.id, students.name, students.email,
                   tutors.name AS supervisor_name
            FROM users AS students
            JOIN supervision_requests AS assignments
                ON assignments.student_id = students.id AND assignments.status = 'accepted'
            JOIN users AS tutors ON tutors.id = assignments.tutor_id
            WHERE students.role = 'student' AND assignments.tutor_id = ?
            ORDER BY students.name COLLATE NOCASE
        `).all(user.id);
        const applications = db.prepare(`
            SELECT applications.*, offers.title, offers.domain, offers.city,
                   offers.start_date, offers.duration_months, users.name AS student_name,
                   users.email AS student_email, companies.company_name,
                   tutors.name AS supervisor_name
            FROM applications
            JOIN offers ON offers.id = applications.offer_id
            JOIN users ON users.id = applications.student_id
            JOIN users AS companies ON companies.id = offers.company_id
            JOIN supervision_requests AS assignments
                ON assignments.student_id = applications.student_id
                AND assignments.tutor_id = ? AND assignments.status = 'accepted'
            JOIN users AS tutors ON tutors.id = assignments.tutor_id
            WHERE applications.status = 'accepted'
            ORDER BY applications.created_at DESC
        `).all(user.id);
        const meetings = db.prepare(`
            SELECT meetings.*, users.name AS student_name
            FROM meetings JOIN users ON users.id = meetings.student_id
            JOIN supervision_requests AS assignments
                ON assignments.student_id = meetings.student_id
                AND assignments.tutor_id = meetings.tutor_id
                AND assignments.status = 'accepted'
            WHERE meetings.tutor_id = ? AND meetings.status != 'cancelled'
            ORDER BY meetings.meeting_date, meetings.meeting_time
        `).all(user.id);
        const supervisionRequests = db.prepare(`
            SELECT supervision_requests.id, supervision_requests.status, supervision_requests.created_at,
                   users.id AS student_id, users.name AS student_name, users.email AS student_email
            FROM supervision_requests
            JOIN users ON users.id = supervision_requests.student_id
            WHERE supervision_requests.tutor_id = ? AND supervision_requests.status = 'pending'
            ORDER BY supervision_requests.created_at ASC, supervision_requests.id ASC
        `).all(user.id);
        return sendJson(res, 200, { students, applications, meetings, supervisionRequests });
    }

    if (req.method === 'POST' && url.pathname === '/api/meetings') {
        requireRole(user, ['tutor']);
        const body = await readJson(req);
        const studentId = Number(body.studentId);
        const title = validateString(body.title, 'L’objet', 160);
        const meetingDate = validateString(body.date, 'La date', 10);
        const meetingTime = validateString(body.time, 'L’heure', 5);
        const format = validateString(body.format, 'Le format', 100);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(meetingDate) || Number.isNaN(Date.parse(meetingDate))) {
            throw Object.assign(new Error('Date de réunion invalide.'), { status: 400 });
        }
        if (!/^\d{2}:\d{2}$/.test(meetingTime)) {
            throw Object.assign(new Error('Heure de réunion invalide.'), { status: 400 });
        }
        const student = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'student'").get(studentId);
        if (!student) throw Object.assign(new Error('Étudiant introuvable.'), { status: 404 });
        const assignedStudent = db.prepare(`
            SELECT id FROM supervision_requests
            WHERE tutor_id = ? AND student_id = ? AND status = 'accepted'
        `).get(user.id, student.id);
        if (!assignedStudent) {
            throw Object.assign(new Error('Vous ne pouvez planifier une réunion qu’avec un étudiant que vous encadrez.'), { status: 403 });
        }
        const result = db.prepare(`
            INSERT INTO meetings (tutor_id, student_id, title, meeting_date, meeting_time, format)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(user.id, student.id, title, meetingDate, meetingTime, format);
        return sendJson(res, 201, { meetingId: Number(result.lastInsertRowid) });
    }

    if (req.method === 'POST' && url.pathname === '/api/applications') {
        requireRole(user, ['student']);
        const body = await readJson(req);
        const offerId = Number(body.offerId);
        if (!Number.isInteger(offerId) || offerId < 1) {
            throw Object.assign(new Error('Offre invalide.'), { status: 400 });
        }
        const offer = db.prepare("SELECT id FROM offers WHERE id = ? AND status = 'published'").get(offerId);
        if (!offer) throw Object.assign(new Error('Cette offre n’est plus disponible.'), { status: 404 });
        const coverLetter = typeof body.coverLetter === 'string' ? body.coverLetter.trim().slice(0, 3000) : '';
        try {
            const result = db.prepare(`
                INSERT INTO applications (offer_id, student_id, cover_letter)
                VALUES (?, ?, ?)
            `).run(offerId, user.id, coverLetter);
            return sendJson(res, 201, { applicationId: Number(result.lastInsertRowid) });
        } catch (error) {
            if (String(error.message).includes('UNIQUE constraint failed')) {
                throw Object.assign(new Error('Vous avez déjà postulé à cette offre.'), { status: 409 });
            }
            throw error;
        }
    }

    const decisionMatch = url.pathname.match(/^\/api\/applications\/(\d+)\/decision$/);
    if (req.method === 'PATCH' && decisionMatch) {
        requireRole(user, ['company']);
        const body = await readJson(req);
        if (!['accepted', 'rejected'].includes(body.status)) {
            throw Object.assign(new Error('Décision invalide.'), { status: 400 });
        }
        const result = db.prepare(`
            UPDATE applications
            SET status = ?
            WHERE id = ? AND status = 'pending'
                AND offer_id IN (SELECT id FROM offers WHERE company_id = ?)
        `).run(body.status, Number(decisionMatch[1]), user.id);
        if (result.changes === 0) {
            throw Object.assign(new Error('Candidature introuvable ou déjà traitée.'), { status: 404 });
        }
        return sendJson(res, 200, { success: true });
    }

    throw Object.assign(new Error('Route API introuvable.'), { status: 404 });
}

async function handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname.startsWith('/api/')) {
        try {
            await handleApi(req, res, url);
        } catch (error) {
            if (res.headersSent) return res.destroy();
            const status = error.status || 500;
            if (status === 500) console.error(error);
            sendJson(res, status, { error: status === 500 ? 'Erreur interne du serveur.' : error.message });
        }
        return;
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD' });
        return res.end('Méthode non autorisée');
    }

    if (url.pathname === '/favicon.ico') {
        res.writeHead(204, { 'Cache-Control': 'public, max-age=86400' });
        return res.end();
    }

    let pathname;
    try {
        pathname = decodeURIComponent(url.pathname);
    } catch {
        res.writeHead(400);
        return res.end('URL invalide');
    }
    if (pathname === '/') pathname = '/index.html';
    const filePath = path.resolve(PUBLIC_DIR, `.${pathname}`);
    const relativePath = path.relative(PUBLIC_DIR, filePath);
    const publicAsset = relativePath === 'index.html'
        || (/^[^\\/]+\.html$/i.test(relativePath))
        || (/^css[\\/].+\.(?:css|png|jpe?g|svg|ico)$/i.test(relativePath))
        || (/^js[\\/](?:app|auth|database)\.js$/i.test(relativePath));
    if (!filePath.startsWith(`${PUBLIC_DIR}${path.sep}`) || !publicAsset) {
        res.writeHead(403);
        return res.end('Accès refusé');
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end(error.code === 'ENOENT' ? '404 Non trouvé' : 'Erreur serveur');
        }
        res.writeHead(200, {
            'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
            'X-Content-Type-Options': 'nosniff'
        });
        res.end(req.method === 'HEAD' ? undefined : content);
    });
}

http.createServer(handleRequest).listen(PORT, () => {
    console.log(`StageFlow est disponible sur http://localhost:${PORT}`);
    console.log(`Base SQLite : ${process.env.DB_PATH || path.join(__dirname, 'database', 'stageflow.sqlite')}`);
});
