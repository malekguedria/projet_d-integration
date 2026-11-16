@extends('layouts.app')
@section('title', 'Tableau de bord étudiant')
@section('page-title', 'Tableau de bord étudiant')

@section('sidebar')
<a href="/student/dashboard" class="sf-nav-item active">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/></svg>
    Tableau de bord
</a>
<a href="/student/offers" class="sf-nav-item">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2h-2M9 5a2 2 0 002 2 2 2 0 002-2M9 5a2 2 0 012-2 2 2 0 012 2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    Candidatures
    <span class="sf-nav-badge">3</span>
</a>
<a href="/student/stage" class="sf-nav-item">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 7H7l3-7z"/><path d="M4 17h12M4 17l2-5h8l2 5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    Mon stage
</a>
<a href="/student/documents" class="sf-nav-item">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h8l4 4v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2v4h4M8 13h4M8 9h4" stroke-linecap="round"/></svg>
    Documents
</a>
<a href="/student/resume" class="sf-nav-item">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 10a3 3 0 100-6 3 3 0 000 6z"/><path d="M4 18a6 6 0 0112 0" stroke-linecap="round"/></svg>
    Mon profil
</a>
<a href="/student/notifications" class="sf-nav-item">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 00-6-6z" stroke-linecap="round"/><path d="M8.5 17a1.5 1.5 0 003 0" stroke-linecap="round"/></svg>
    Notifications
    <span class="sf-nav-badge">2</span>
</a>
@endsection

@section('content')
<div class="sf-page-header">
    <h1 class="sf-page-title">Tableau de bord</h1>
    <p class="sf-page-subtitle">Bonjour {{ session('user.name') }}, voici l'état de votre parcours de stage.</p>
</div>

<!-- Workflow complet -->
<div class="sf-card sf-mb-6">
    <div class="sf-card-header">
        <span class="sf-card-title">Workflow complet</span>
        <a href="/student/stage" style="font-size:12px;color:#2563EB;text-decoration:none;">Page du stage →</a>
    </div>
    <div class="sf-card-body">
        <div class="sf-workflow">
            @foreach([['Recherche','done'],['Candidature','done'],['Entretien','done'],['Convention','active'],['Signature','pending'],['Début','pending'],['Mi-parcours','pending'],['Soutenance','pending']] as $s)
            <div class="sf-workflow-step {{ $s[1] }}">
                <div class="sf-workflow-dot">{{ $loop->iteration }}</div>
                <span class="sf-workflow-label">{{ $s[0] }}</span>
            </div>
            @endforeach
        </div>
    </div>
</div>

<div class="sf-grid-2 sf-mb-6">
    <!-- Stage actuel -->
    <div class="sf-card">
        <div class="sf-card-header"><span class="sf-card-title">Stage avec NéoVide</span> <span class="sf-badge sf-badge-yellow">En cours</span></div>
        <div class="sf-card-body">
            <p style="font-size:13px;color:#64748B;margin-bottom:12px;">Data analyste — Mobilité urbaine</p>
            <ul class="sf-checklist">
                <li><span class="sf-check-icon ok">✓</span> Convention signée</li>
                <li><span class="sf-check-icon ok">✓</span> Mise en point de cadrage</li>
                <li><span class="sf-check-icon pending">!</span> Fiche de poste validée</li>
                <li><span class="sf-check-icon pending">!</span> Tableau de bord 42 pdf</li>
                <li><span class="sf-check-icon ko">✗</span> Résolution encodage</li>
            </ul>
        </div>
    </div>

    <!-- Documents + Réunions -->
    <div class="sf-flex sf-flex-col" style="gap:16px;">
        <div class="sf-card">
            <div class="sf-card-header"><span class="sf-card-title">Documents</span> <span class="sf-badge sf-badge-yellow">1 À déposer</span></div>
            <div class="sf-card-body" style="padding:12px 16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;font-size:13px;border-bottom:1px solid #E2E8F0;">
                    <span>Convention signée.pdf</span> <span class="sf-badge sf-badge-green">Validé</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;font-size:13px;border-bottom:1px solid #E2E8F0;">
                    <span>Attestation 42.pdf</span> <span class="sf-badge sf-badge-green">Validé</span>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;font-size:13px;">
                    <span>Journal de bord.pdf</span> <span class="sf-badge sf-badge-yellow">En attente</span>
                </div>
            </div>
        </div>
        <div class="sf-card">
            <div class="sf-card-header"><span class="sf-card-title">Réunions</span> <span class="sf-badge sf-badge-blue">Prochaine</span></div>
            <div class="sf-card-body" style="padding:12px 16px;font-size:13px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span>Point de suivi semestriel</span>
                    <a href="#" class="sf-btn sf-btn-secondary sf-btn-sm">Rejoindre</a>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span>Dépôt administratif — <strong>80%</strong></span>
                    <span class="sf-badge sf-badge-yellow">⚠ Lecture déontologie requise</span>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Notifications -->
<div class="sf-card">
    <div class="sf-card-header"><span class="sf-card-title">Notifications</span></div>
    <div class="sf-card-body" style="padding:0;">
        <div style="padding:12px 16px;border-bottom:1px solid #E2E8F0;font-size:13px;">
            • Votre convention a été signée par TechCorp
        </div>
        <div style="padding:12px 16px;font-size:13px;">
            • Votre encadrant a ajouté un commentaire sur le rapport
        </div>
    </div>
</div>
@endsection
