# 🎓 StageFlow — Plateforme Intégrée de Gestion des Stages

Plateforme web institutionnelle moderne, modulaire et interactive reproduisant fidèlement les 8 écrans de conception avec **l'ensemble des boutons, formulaires, modales, workflows et filtres pleinement interactifs et fonctionnels**.

---

## 🏗️ Architecture Modulaire du Projet

L'interface a été entièrement **décortiquée et découpée en fichiers spécialisés et modulaires** :

```
projet_d-integration/
│
├── index.html                   # Page d'accueil / Portail de connexion sécurisé
├── student-offers.html          # Écran 2 : Recherche et consultation des offres
├── student-dashboard.html       # Écran 3 : Tableau de bord étudiant & parcours (7 jalons)
├── company-offers.html          # Écran 4 : Espace entreprise (KPIs, publication, candidatures)
├── tutor-dashboard.html         # Écran 5 : Espace tuteur / encadrant pédagogique
├── secretariat-dossiers.html    # Écran 6 : Gestion des dossiers et conventions
├── department-supervision.html  # Écran 7 : Supervision du département & plan d'urgence
├── executive-direction.html     # Écran 8 : Vue exécutive de la direction
│
├── database/
│   └── users.json               # Base de données JSON des utilisateurs et identifiants
│
├── js/
│   ├── database.js              # Gestionnaire d'accès aux données utilisateurs (Local/Storage)
│   ├── auth.js                  # Contrôleur d'authentification et gestion de session
│   └── app.js                   # Composants interactifs globaux (Modales, Toasts, Cloche, etc.)
│
├── css/
│   └── style.css                # Feuille de styles unifiée (Police Inter, espacements aérés)
│
├── server.js                    # Serveur HTTP local autonome Node.js (zéro dépendance)
└── package.json                 # Configuration du projet Node
```

---

## 👥 Base de Données des Utilisateurs & Identifiants

Chaque utilisateur dispose désormais de son propre compte sécurisé avec **identifiant et mot de passe** dans `database/users.json` :

| Rôle | Nom | Identifiant (Email) | Mot de passe | Page de redirection |
| :--- | :--- | :--- | :--- | :--- |
| **Étudiante** | Clara Martin | `clara.martin@univ-lyon.fr` | `clara123` | `student-offers.html` |
| **Entreprise** | Antoine Leroy | `antoine.leroy@novoops.fr` | `novoops123` | `company-offers.html` |
| **Encadrante** | Sophie Moreau | `sophie.moreau@univ-lyon.fr` | `sophie123` | `tutor-dashboard.html` |
| **Secrétariat** | Claire Bernard | `claire.bernard@univ-lyon.fr` | `secretariat123` | `secretariat-dossiers.html` |
| **Chef Dépt** | Pr Marc Boissieu | `marc.boissieu@univ-lyon.fr` | `boissieu123` | `department-supervision.html` |
| **Direction** | Isabelle Laurent | `isabelle.laurent@univ-lyon.fr` | `direction123` | `executive-direction.html` |

> 💡 **Sur la page de connexion (`index.html`)** :
> - Vous pouvez taper manuellement l'un des comptes ci-dessus.
> - Vous pouvez également cliquer sur l'un des badges de test en bas de page pour **remplir automatiquement le formulaire en 1 clic**.
> - La barre de filtre/sélection démo présente auparavant a été **intégralement supprimée** pour respecter une expérience utilisateur authentique.

---

## 🚀 Comment lancer la plateforme ?

### Option 1 : Avec le serveur local Node.js (Recommandé)
Ouvrez un terminal PowerShell ou Invite de commandes dans le dossier du projet :
```bash
npm start
# ou directement :
node server.js
```
Ouvrez ensuite votre navigateur sur : **`http://localhost:3000`**

### Option 2 : Ouverture directe dans le navigateur
Double-cliquez simplement sur **[`index.html`](file:///c:/Users/LENOVO/Desktop/projet_integration/projet_d-integration/index.html)** dans l'explorateur Windows. Tous les fichiers fonctionnent en relatif et ne nécessitent aucun serveur externe.

---

## 🎨 Design & Typographie Modernisés

1. **Typographie moderne** : Intégration de la police professionnelle **Inter** (avec fallback Segoe UI / SF Pro Display) pour un rendu visuel net, élégant et institutionnel.
2. **Espacements aérés** :
   - Les sections (notamment la bannière rouge et les cartes de la vue Direction) disposent d'un dégagement optimal (`padding: 44px 48px 64px 48px`, marges de titres `32px`).
   - Fin de la sensation de compression sous la barre de navigation.

---

## 🌟 Fonctionnalités Interactives Clés

- **Authentification & Session dynamique** : Chaque page vérifie l'identité active et affiche dynamiquement l'avatar, le nom et le rôle de l'utilisateur connecté dans la barre latérale.
- **Bouton Déconnexion** : Présent en bas de la barre latérale de chaque page pour retourner sur la page de connexion.
- **Tiroir latéral et Modales dynamiques** : Vérification de dossiers, validation d'offres, dépôt de documents et générateur de convention officielle.
- **Système de Toasts & Cloche de notifications** : Chaque bouton (candidature, validation, export, reprogrammation) déclenche un feedback visuel immédiat.
