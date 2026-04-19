import { Link } from 'react-router-dom'
import { EcodexLogo, GitHubLogo } from '../components/EcodexLogo'

export default function Entreprise() {
  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: 'linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)' }}>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8" style={{ maxWidth: 700, margin: '0 auto', width: '100%' }}>

        {/* Hero */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-gray-800 no-underline mb-3">← Retour à l'accueil</Link>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 border border-blue-300 text-[11px] font-semibold text-blue-800 mb-3">
            🚧 Version Entreprise — En construction
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight m-0 mb-2">
            Mon Score d'Électrification Pro
          </h1>
          <p className="text-base text-gray-600 m-0 max-w-xl mx-auto leading-relaxed">
            Bientôt : un simulateur dédié aux entreprises pour évaluer l'électrification de vos bâtiments, flotte, déplacements et procédés industriels.
          </p>
        </div>

        {/* Roadmap */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 w-full mb-6">
          <h2 className="text-base font-black text-gray-900 m-0 mb-4">🎯 Usages électrifiables couverts</h2>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🏢</span>
                <h3 className="text-[14px] font-bold text-gray-800 m-0">Bâtiments</h3>
              </div>
              <p className="text-[12px] text-gray-600 m-0 ml-7 leading-relaxed">
                Chauffage, ECS, climatisation, éclairage. Bureaux, commerces, entrepôts, ateliers.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🚐</span>
                <h3 className="text-[14px] font-bold text-gray-800 m-0">Flotte de véhicules</h3>
              </div>
              <p className="text-[12px] text-gray-600 m-0 ml-7 leading-relaxed">
                Véhicules utilitaires, voitures de société, engins. Thermiques, hybrides, électriques.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">✈️</span>
                <h3 className="text-[14px] font-bold text-gray-800 m-0">Déplacements professionnels</h3>
              </div>
              <p className="text-[12px] text-gray-600 m-0 ml-7 leading-relaxed">
                Avion, train, véhicules personnels utilisés pour des missions pro.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🚲</span>
                <h3 className="text-[14px] font-bold text-gray-800 m-0">Trajets domicile-travail</h3>
              </div>
              <p className="text-[12px] text-gray-600 m-0 ml-7 leading-relaxed">
                Estimation à partir du nombre de salariés et de la répartition modale (Insee EMD).
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚙️</span>
                <h3 className="text-[14px] font-bold text-gray-800 m-0">Procédés industriels <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider ml-1">· V2</span></h3>
              </div>
              <p className="text-[12px] text-gray-600 m-0 ml-7 leading-relaxed">
                Chaleur process (fours, séchage, vapeur), froid industriel, air comprimé. Intégration prévue dans un second temps.
              </p>
            </div>
          </div>
        </div>

        {/* Valeur */}
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-200 w-full mb-6">
          <h3 className="text-[14px] font-bold text-blue-900 m-0 mb-2">💡 Ce que proposera la version Pro</h3>
          <ul className="text-[12px] text-gray-700 m-0 pl-4 space-y-1">
            <li><strong>Diagnostic en 15 minutes</strong>, pas un bilan carbone complet de plusieurs semaines</li>
            <li><strong>Benchmarks sectoriels</strong> (tertiaire, commerce, artisanat) pour se comparer</li>
            <li><strong>Focus électrification</strong> : quels investissements prioriser, avec quel ROI</li>
            <li><strong>Aides spécifiques</strong> : CEE tertiaire, fonds chaleur ADEME, France 2030</li>
            <li><strong>Gratuit et open source</strong>, méthodologie transparente</li>
          </ul>
        </div>

        {/* CTA / Notification */}
        <div className="text-center w-full mb-4">
          <p className="text-[13px] text-gray-600 m-0 mb-3">
            Intéressé(e) ? Vous êtes dirigeant(e), responsable RSE ou AMO tertiaire ?
          </p>
          <a
            href="mailto:contact@getecodex.com?subject=Mon Score d'Électrification Pro - intérêt&body=Bonjour, je souhaite être informé(e) du lancement de la version Entreprise."
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-[13px] font-bold no-underline hover:bg-blue-700 transition-colors"
          >
            ✉️ Être notifié du lancement
          </a>
          <p className="text-[10px] text-gray-400 m-0 mt-2">
            Votre email ne sera utilisé que pour vous notifier du lancement. Pas de spam, pas de revente.
          </p>
        </div>

        <div className="text-center text-[11px] text-gray-500 max-w-xl leading-relaxed">
          <p className="m-0">
            En attendant, la version <Link to="/particulier" className="text-emerald-600 font-semibold no-underline hover:underline">Particulier</Link> est déjà disponible pour évaluer votre logement et votre mobilité personnelle.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 pb-4 border-t border-gray-200 bg-white/50">
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
