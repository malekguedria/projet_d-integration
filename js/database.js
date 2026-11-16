/**
 * StageFlow - Database Layer
 * Contient les utilisateurs, leurs identifiants de connexion, et les collections de données.
 */
const Database = {
    // Initial user database
    defaultUsers: [
        {
            id: 1,
            name: "Clara Martin",
            email: "clara.martin@univ-lyon.fr",
            password: "clara123",
            role: "student",
            roleLabel: "Étudiante Master 2 Informatique",
            avatar: "CM",
            redirect: "student-offers.html"
        },
        {
            id: 2,
            name: "Antoine Leroy",
            email: "antoine.leroy@novoops.fr",
            password: "novoops123",
            role: "company",
            roleLabel: "Directeur — NovoOps",
            avatar: "AL",
            redirect: "company-offers.html"
        },
        {
            id: 3,
            name: "Sophie Moreau",
            email: "sophie.moreau@univ-lyon.fr",
            password: "sophie123",
            role: "tutor",
            roleLabel: "Enseignante-chercheuse",
            avatar: "SM",
            redirect: "tutor-dashboard.html"
        },
        {
            id: 4,
            name: "Claire Bernard",
            email: "claire.bernard@univ-lyon.fr",
            password: "secretariat123",
            role: "secretariat",
            roleLabel: "Gestionnaire scolarité",
            avatar: "CB",
            redirect: "secretariat-dossiers.html"
        },
        {
            id: 5,
            name: "Pr Marc Boissieu",
            email: "marc.boissieu@univ-lyon.fr",
            password: "boissieu123",
            role: "department",
            roleLabel: "Chef de Département Informatique",
            avatar: "MB",
            redirect: "department-supervision.html"
        },
        {
            id: 6,
            name: "Isabelle Laurent",
            email: "isabelle.laurent@univ-lyon.fr",
            password: "direction123",
            role: "executive",
            roleLabel: "Directrice Générale",
            avatar: "IL",
            redirect: "executive-direction.html"
        }
    ],

    // Initialize database in localStorage if not present
    init() {
        if (!localStorage.getItem('stageflow_db_users')) {
            localStorage.setItem('stageflow_db_users', JSON.stringify(this.defaultUsers));
        }
    },

    // Get all users
    getUsers() {
        this.init();
        try {
            return JSON.parse(localStorage.getItem('stageflow_db_users')) || this.defaultUsers;
        } catch (e) {
            return this.defaultUsers;
        }
    },

    // Find user by email and password
    authenticate(email, password) {
        const users = this.getUsers();
        const cleanEmail = (email || '').trim().toLowerCase();
        const cleanPassword = (password || '').trim();

        return users.find(u => 
            u.email.toLowerCase() === cleanEmail && 
            u.password === cleanPassword
        );
    },

    // Find user by email
    findByEmail(email) {
        const users = this.getUsers();
        return users.find(u => u.email.toLowerCase() === (email || '').trim().toLowerCase());
    }
};

// Auto initialize
Database.init();
