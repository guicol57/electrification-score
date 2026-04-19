import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Landing from './pages/Landing'
import ParticulierPage from './pages/Particulier'
import Entreprise from './pages/Entreprise'

/* ── SEO + analytics per route ── */
const PAGE_META: Record<string, { title: string; description: string }> = {
  '/': {
    title: "Mon Score d'Électrification · Simulateur gratuit",
    description: "Évaluez votre électrification (particulier ou entreprise) et votre exposition aux énergies fossiles. Simulateur gratuit, open source, basé sur la Base Carbone ADEME.",
  },
  '/particulier': {
    title: "Mon Score d'Électrification · Particulier",
    description: "Évaluez votre exposition aux énergies fossiles. Logement + Mobilité. Émissions CO₂, coûts complets, ROI sur 15 ans.",
  },
  '/entreprise': {
    title: "Mon Score d'Électrification · Entreprise (bientôt disponible)",
    description: "Bientôt : simulateur d'électrification pour entreprises. Bâtiments, flotte, déplacements, procédés industriels. Benchmarks sectoriels, aides tertiaires.",
  },
}

function RouteEffects() {
  const location = useLocation()

  useEffect(() => {
    const meta = PAGE_META[location.pathname] || PAGE_META['/']

    // Update document title
    document.title = meta.title

    // Update meta description
    const descTag = document.querySelector('meta[name="description"]')
    if (descTag) descTag.setAttribute('content', meta.description)

    // Track page view in GoatCounter (skip localhost, skip adblocker-friendly via <img>)
    if (window.location.hostname !== 'localhost') {
      const img = new Image()
      img.src = `https://scoreelec.goatcounter.com/count?p=${encodeURIComponent(location.pathname)}&t=${encodeURIComponent(meta.title)}&r=${encodeURIComponent(document.referrer)}&rnd=${Math.random()}`
    }

    // Scroll to top on route change (unless there's a hash)
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <RouteEffects />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/particulier" element={<ParticulierPage />} />
        <Route path="/entreprise" element={<Entreprise />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  )
}
