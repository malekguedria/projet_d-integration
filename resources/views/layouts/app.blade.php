<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'StageFlow — Gestion des Stages')</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #2563EB;
            --primary-hover: #1D4ED8;
            --primary-light: #EFF6FF;
            --navy-dark: #0F172A;
            --text-main: #0F172A;
            --text-muted: #64748B;
            --bg-app: #F8FAFC;
            --bg-card: #FFFFFF;
            --border-color: #E2E8F0;
            --success: #10B981;
            --warning: #F59E0B;
            --danger: #EF4444;
            --radius-md: 10px;
            --radius-lg: 14px;
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07);
        }
        * { margin:0; padding:0; box-sizing:border-box; font-family:'Plus Jakarta Sans', sans-serif; }
        body { background:var(--bg-app); color:var(--text-main); min-height:100vh; display:flex; flex-direction:column; }
        .sf-app { display:flex; flex:1; min-height:100vh; }
        .sf-sidebar { width:260px; background:#FFF; border-right:1px solid var(--border-color); display:flex; flex-direction:column; flex-shrink:0; }
        .sf-brand { padding:20px 24px; display:flex; align-items:center; gap:12px; border-bottom:1px solid #F1F5F9; }
        .sf-logo { width:36px; height:36px; background:linear-gradient(135deg, #2563EB, #1D4ED8); border-radius:10px; display:flex; align-items:center; justify-content:center; color:#FFF; font-weight:800; }
        .sf-menu { padding:16px 14px; display:flex; flex-direction:column; gap:4px; flex:1; }
        .sf-nav-item { display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:var(--radius-md); color:var(--text-muted); text-decoration:none; font-size:14px; font-weight:500; }
        .sf-nav-item:hover { background:#F1F5F9; color:var(--text-main); }
        .sf-nav-item.active { background:var(--primary-light); color:var(--primary); font-weight:600; }
        .sf-nav-item svg { width:18px; height:18px; }
        .sf-nav-badge { margin-left:auto; background:#E2E8F0; color:#475569; font-size:11px; font-weight:700; padding:2px 7px; border-radius:999px; }
        .sf-nav-item.active .sf-nav-badge { background:var(--primary); color:#FFF; }
        .sf-main { flex:1; display:flex; flex-direction:column; }
        .sf-header { height:64px; background:#FFF; border-bottom:1px solid var(--border-color); display:flex; align-items:center; justify-content:space-between; padding:0 32px; }
        .sf-content { padding:32px; flex:1; }
        .sf-card { background:#FFF; border:1px solid var(--border-color); border-radius:var(--radius-lg); box-shadow:var(--shadow-sm); }
        .sf-card-header { padding:16px 20px; border-bottom:1px solid var(--border-color); display:flex; align-items:center; justify-content:space-between; }
        .sf-card-title { font-size:15px; font-weight:700; }
        .sf-card-body { padding:20px; }
        .sf-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:8px 16px; border-radius:var(--radius-md); font-size:13px; font-weight:600; cursor:pointer; text-decoration:none; border:1px solid transparent; }
        .sf-btn-primary { background:var(--primary); color:#FFF; }
        .sf-btn-primary:hover { background:var(--primary-hover); }
        .sf-btn-secondary { background:#FFF; border-color:var(--border-color); color:var(--text-main); }
        .sf-btn-sm { padding:6px 12px; font-size:12px; }
        .sf-badge { display:inline-flex; align-items:center; padding:3px 8px; font-size:11px; font-weight:600; border-radius:999px; }
        .sf-badge-green { background:#ECFDF5; color:#059669; }
        .sf-badge-yellow { background:#FFFBEB; color:#D97706; }
        .sf-badge-blue { background:#EFF6FF; color:#2563EB; }
        .sf-badge-red { background:#FEF2F2; color:#DC2626; }
        .sf-grid-2 { display:grid; grid-template-columns:repeat(2, 1fr); gap:20px; }
        .sf-grid-3 { display:grid; grid-template-columns:repeat(3, 1fr); gap:20px; }
        .sf-mb-6 { margin-bottom:24px; }
    </style>
    @yield('styles')
</head>
<body>
    <div class="sf-app">
        <aside class="sf-sidebar">
            <div class="sf-brand">
                <div class="sf-logo">S</div>
                <div>
                    <div style="font-weight:700;font-size:18px;">StageFlow</div>
                    <div style="font-size:10px;color:#64748B;">GESTION DES STAGES</div>
                </div>
            </div>
            <nav class="sf-menu">
                @yield('sidebar')
            </nav>
            <div style="padding:16px;border-top:1px solid #F1F5F9;background:#FAFAFC;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;border-radius:50%;background:#E0E7FF;color:#3730A3;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">
                        @yield('user-initials', 'SF')
                    </div>
                    <div>
                        <div style="font-size:13px;font-weight:600;">@yield('user-name', 'Utilisateur')</div>
                        <div style="font-size:11px;color:#64748B;">@yield('user-role', 'Espace Institutionnel')</div>
                    </div>
                </div>
            </div>
        </aside>

        <main class="sf-main">
            <header class="sf-header">
                <div style="font-size:13px;color:#64748B;">
                    Rechercher dans StageFlow...
                </div>
                <div>
                    <a href="/" class="sf-btn sf-btn-secondary sf-btn-sm">Accéder à la maquette interactive complète</a>
                </div>
            </header>

            <div class="sf-content">
                @yield('content')
            </div>
        </main>
    </div>
    @yield('scripts')
</body>
</html>
