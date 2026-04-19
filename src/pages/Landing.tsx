import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EcodexLogo, GitHubLogo } from '../components/EcodexLogo'

export default function Landing() {
  const [visits, setVisits] = useState(0)

  useEffect(() => {
    fetch('https://scoreelec.goatcounter.com/counter/.json')
      .then(r => r.json())
      .then(d => { if (d?.count) setVisits(parseInt(d.count.replace(/\s/g, ''), 10) || 0) })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: 'linear-gradient(180deg, #f0f9ff 0%, #f8fafc 100%)' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8" style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-400 text-[11px] font-semibold text-amber-800 mb-3">
            ⚡ Crise énergétique — Évaluez votre exposition aux fossiles
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight m-0 mb-2">
            Mon Score d'Électrification
          </h1>
          <p className="text-base text-gray-600 m-0 max-w-xl mx-auto leading-relaxed">
            Simulateur open source pour évaluer votre niveau d'électrification et les gains (CO₂, coûts, ROI) d'une transition vers des énergies décarbonées.
          </p>
        </div>

        {/* 2 cartes */}
        <div className="grid gap-5 w-full mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>

          {/* Carte Particulier */}
          <Link to="/particulier" className="no-underline group" style={{ color: 'inherit' }}>
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-emerald-500 hover:shadow-lg transition-all h-full" style={{ cursor: 'pointer' }}>
              <div className="text-4xl mb-3">👤</div>
              <h2 className="text-xl font-black text-gray-900 m-0 mb-2">Particulier</h2>
              <p className="text-[13px] text-gray-600 m-0 mb-4 leading-relaxed">
                Évaluez l'électrification de votre <strong>logement</strong> (chauffage, ECS, cuisson) et de votre <strong>mobilité</strong> personnelle (voiture, train, avion).
              </p>
              <ul className="text-[12px] text-gray-700 m-0 pl-4 mb-4 space-y-1">
                <li>Émissions CO₂ actuelles vs cibles</li>
                <li>Coûts complets (TCO) et économies</li>
                <li>Business case avec inflation différenciée</li>
                <li>Aides : MaPrimeRénov', CEE, bonus écologique...</li>
              </ul>
              <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[12px] font-bold group-hover:bg-emerald-600 transition-colors">
                Commencer →
              </div>
            </div>
          </Link>

          {/* Carte Entreprise */}
          <Link to="/entreprise" className="no-underline group" style={{ color: 'inherit' }}>
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all h-full relative" style={{ cursor: 'pointer' }}>
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold uppercase tracking-wider">
                Bientôt
              </div>
              <div className="text-4xl mb-3">🏢</div>
              <h2 className="text-xl font-black text-gray-900 m-0 mb-2">Entreprise</h2>
              <p className="text-[13px] text-gray-600 m-0 mb-4 leading-relaxed">
                Évaluez l'électrification de votre organisation : <strong>bâtiments</strong>, <strong>flotte</strong>, déplacements pro, domicile-travail et <strong>procédés industriels</strong>.
              </p>
              <ul className="text-[12px] text-gray-700 m-0 pl-4 mb-4 space-y-1">
                <li>Diagnostic simplifié en 15 min</li>
                <li>ROI et éligibilité aux aides tertiaires</li>
                <li>Benchmark vs moyenne sectorielle</li>
                <li>Adapté TPE/PME (tertiaire, commerce, industrie)</li>
              </ul>
              <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-[12px] font-bold group-hover:bg-blue-600 transition-colors">
                En savoir plus →
              </div>
            </div>
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="text-center text-[11px] text-gray-500 max-w-xl leading-relaxed">
          <p className="m-0 mb-1">
            <strong>100% gratuit · Open source · Sans collecte de données personnelles</strong>
          </p>
          <p className="m-0">
            Facteurs d'émission : Base Carbone ADEME via Ecodex · Méthodologie transparente et vérifiable
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 pb-4 border-t border-gray-200 bg-white/50">
        {visits > 0 && (
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
            <strong style={{ color: '#059669' }}>{visits.toLocaleString('fr-FR')}</strong> simulations réalisées
          </div>
        )}
        <div className="inline-flex items-center gap-1.5">
          <span className="text-[11px] text-gray-400">Powered by</span>
          <a href="https://getecodex.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 no-underline">
            <EcodexLogo size={20} />
            <span className="text-[13px] font-extrabold" style={{ color: '#4856FF' }}>Ecodex</span>
          </a>
          <span className="text-[11px] text-gray-300">·</span>
          <a href="https://github.com/guicol57/electrification-score" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 no-underline text-[11px] text-gray-500 hover:text-gray-700">
            <GitHubLogo size={12} />
            Open source
          </a>
        </div>
      </div>
    </div>
  )
}
