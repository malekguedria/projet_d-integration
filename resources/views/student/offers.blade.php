@extends('layouts.app')
@section('title', 'Offres de stage')
@section('page-title', 'Offres de stage')

@section('sidebar')
<a href="/student/dashboard" class="sf-nav-item">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/></svg>
    Tableau de bord
</a>
<a href="/student/offers" class="sf-nav-item active">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2h-2M9 5a2 2 0 002 2 2 2 0 002-2M9 5a2 2 0 012-2 2 2 0 012 2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    Candidatures <span class="sf-nav-badge">3</span>
</a>
<a href="/student/stage" class="sf-nav-item">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3 7H7l3-7z"/><path d="M4 17h12M4 17l2-5h8l2 5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    Mon stage
</a>
<a href="/student/documents" class="sf-nav-item">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2h8l4 4v12a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z" stroke-linecap="round" stroke-linejoin="round"/></svg>
    Documents
</a>
<a href="/student/resume" class="sf-nav-item">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 10a3 3 0 100-6 3 3 0 000 6z"/><path d="M4 18a6 6 0 0112 0" stroke-linecap="round"/></svg>
    Mon profil
</a>
<a href="/student/notifications" class="sf-nav-item">
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2a6 6 0 00-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 00-6-6z" stroke-linecap="round"/></svg>
    Notifications
</a>
@endsection

@section('content')
<div class="sf-page-header" style="display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
        <h1 class="sf-page-title">Offres de stage</h1>
        <p class="sf-page-subtitle">Découvrez les offres qui correspondent à votre profil et vos ambitions</p>
    </div>
    <button class="sf-btn sf-btn-primary">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M3 4a1 1 0 011-1h2.586a1 1 0 01.707.293L9 5h8a1 1 0 011 1v9a2 2 0 01-2 2H4a2 2 0 01-2-2V5a1 1 0 011-1z"/></svg>
        Mes candidatures
    </button>
</div>

<!-- Filters -->
<div class="sf-card sf-mb-6">
    <div class="sf-card-body" style="display:flex;gap:10px;flex-wrap:wrap;padding:14px 20px;">
        <div style="display:flex;gap:6px;flex-wrap:wrap;flex:1;">
            @foreach(['Tous les types','Temps plein','Temps partiel','À 4 ou 5 mois','Hybride','100% sur site','100% distanciel'] as $f)
            <button class="sf-btn sf-btn-secondary sf-btn-sm {{ $loop->first ? 'sf-btn-primary' : '' }}">{{ $f }}</button>
            @endforeach
        </div>
        <button class="sf-btn sf-btn-primary sf-btn-sm">Réinitialiser</button>
    </div>
</div>

<!-- Recommended -->
<h2 style="font-size:14px;font-weight:600;margin-bottom:12px;color:#1E293B;">Offres recommandées <span style="font-size:12px;color:#64748B;font-weight:400;">— Basées sur vos compétences et vos ambitions</span></h2>

<div class="sf-grid-auto sf-mb-6">
    @php
    $offers = [
        ['company'=>'NéoVide','logo'=>'NV','title'=>'Data analyste — Mobilité urbaine','tags'=>['Python','Pandas','SQL'],'duration'=>'6 mois','location'=>'Lyon','match'=>'97%','type'=>'match'],
        ['company'=>'RoboPolis','logo'=>'RP','title'=>'Développeur IA — Plateformes pédagogiques','tags'=>['Python','TensorFlow','NLP'],'duration'=>'5 mois','location'=>'Paris','match'=>'94%','type'=>'match'],
        ['company'=>'Axion Finance','logo'=>'AF','title'=>'Data analyste / Scala / React / Scale','tags'=>['Scala','React','BI'],'duration'=>'6 mois','location'=>'Bordeaux','match'=>'89%','type'=>'match'],
        ['company'=>'Chris Martin','logo'=>'CM','title'=>'Data ingénieur — Données de santé','tags'=>['Spark','SQL','AWS'],'duration'=>'4 mois','location'=>'Toulouse','match'=>'85%','type'=>'detail'],
        ['company'=>'MacNova','logo'=>'MN','title'=>'Data ingénieur — Données de qualité','tags'=>['Python','Kafka','PostgreSQL'],'duration'=>'5 mois','location'=>'Nantes','match'=>'82%','type'=>'detail'],
        ['company'=>'OfferLab','logo'=>'OL','title'=>'UX chercheur — Services publics','tags'=>['UX','Figma','Tests'],'duration'=>'6 mois','location'=>'Rennes','match'=>'79%','type'=>'detail'],
    ];
    @endphp

    @foreach($offers as $offer)
    <div class="sf-offer-card">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div style="width:36px;height:36px;border-radius:8px;background:#EFF6FF;color:#2563EB;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;flex-shrink:0;">{{ $offer['logo'] }}</div>
            <div>
                <div class="sf-offer-company">{{ $offer['company'] }}</div>
                <div class="sf-offer-title">{{ $offer['title'] }}</div>
            </div>
        </div>
        <div class="sf-offer-tags">
            @foreach($offer['tags'] as $tag)
            <span class="sf-offer-tag">{{ $tag }}</span>
            @endforeach
        </div>
        <div class="sf-offer-meta">
            <span>⏱ {{ $offer['duration'] }}</span>
            <span>📍 {{ $offer['location'] }}</span>
            <span class="sf-offer-match">{{ $offer['match'] }} compatibilité</span>
        </div>
        <div class="sf-offer-actions">
            @if($offer['type']==='match')
            <a href="#" class="sf-btn sf-btn-primary sf-btn-sm">Consulter</a>
            @else
            <a href="#" class="sf-btn sf-btn-secondary sf-btn-sm">Voir le détail</a>
            <a href="#" class="sf-btn sf-btn-primary sf-btn-sm">Postuler</a>
            @endif
        </div>
    </div>
    @endforeach
</div>
@endsection
