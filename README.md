# ⚡ Mon Score d'Électrification

> Simulateur open source pour évaluer son niveau d'électrification et son exposition aux énergies fossiles — Logement + Mobilité.

Développé dans le contexte de la crise énergétique liée au conflit en Iran, cet outil aide les citoyens français à comprendre dans quelle mesure ils dépendent des énergies fossiles et à simuler les bénéfices (CO₂, coûts, ROI) d'une transition vers l'électrification de leurs usages.

**[🚀 Essayer en ligne →](https://electrification-score.vercel.app)**

## Fonctionnalités

- **Comparaison de scénarios** : actuel vs cible, côte à côte
- **Double score** : Électrification (A→E) + Exposition aux fossiles (A→E)
- **Émissions CO₂** : kgCO₂eq/an par poste (chauffage, ECS, cuisson, mobilité)
- **Coûts complets (TCO)** : CAPEX (amortissement) + OPEX (énergie, entretien)
- **Business case pluriannuel** : ROI, point de bascule, courbe de coûts cumulés avec inflation différenciée
- **Rénovation énergétique** : coût estimé par saut de classe DPE
- **Covoiturage** : taux d'occupation pour diviser émissions et coûts
- **Profils pré-remplis** : 4 profils types ajustables (urbain, périurbain, rural, récent)
- **Granularité véhicules** : par segment (citadine, compacte, berline/SUV) et motorisation

## Sources de données

Les facteurs d'émission sont fournis par **[Ecodex](https://getecodex.com)** (catalogue de 1M+ facteurs d'émission carbone) via le **[protocole MCP (Model Context Protocol)](https://getecodex.com/connect)** :

| Donnée | Source | Périmètre | Via |
|---|---|---|---|
| Logement (kgCO₂eq/m²) | PCAF | France 2023, Gate-to-gate | Ecodex MCP |
| Mobilité (kgCO₂eq/km) | Base Carbone ADEME | France 2020-2025, combustion + amont + fabrication | Ecodex MCP |
| Coûts énergie | SDES, CRE, Propellet | Scénario prix hauts 2026 | Web |
| Coûts véhicules (TCO) | Bornetik, Arval | TCO Scope 2024-2025 | Web |
| Rénovation (€/m²) | Travaux.com, Ithaque | France 2025 | Web |

## Périmètre

Cet outil couvre exclusivement les **usages électrifiables** :
- 🏠 **Logement** : chauffage, eau chaude sanitaire, cuisson
- 🚗 **Mobilité** : transports quotidiens et occasionnels

Il ne constitue **ni un bilan carbone complet** ni un scope 1/2 au sens du GHG Protocol. Pour un bilan individuel complet incluant alimentation, achats et services, consultez [Nos Gestes Climat](https://nosgestesclimat.fr) (ADEME).

## Stack technique

- **Framework** : [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript
- **Style** : [Tailwind CSS](https://tailwindcss.com/)
- **Graphiques** : [Recharts](https://recharts.org/)
- **Hébergement** : [Vercel](https://vercel.com/)
- **Calcul** : 100% côté client, pas de backend

## Installation locale

```bash
git clone https://github.com/guicol57/electrification-score.git
cd electrification-score
npm install
npm run dev
```

Ouvrir http://localhost:5173

## Déploiement

Le projet se déploie automatiquement sur Vercel à chaque push sur `main` :

1. Connecter le repo GitHub à Vercel
2. Framework preset : Vite
3. C'est tout — le build se fait automatiquement

## Contribuer

Les contributions sont les bienvenues ! Voici quelques pistes :

- 🐛 **Signaler un bug** : ouvrir une [issue](https://github.com/guicol57/electrification-score/issues)
- 📊 **Mettre à jour les FE** : les facteurs d'émission sont dans `src/data/`
- 💡 **Proposer une feature** : ouvrir une issue avec le tag `enhancement`
- 🌍 **Internationalisation** : adapter pour d'autres pays (FE, coûts, DPE)

## Licence

[MIT](./LICENSE) — Libre d'utilisation, modification et redistribution.

## Crédits

- Facteurs d'émission : [Ecodex](https://getecodex.com) via MCP
- Sources primaires : PCAF, Base Carbone ADEME, EEA
- Coûts : SDES, CRE, Propellet, Bornetik, Arval, Travaux.com

---

*Powered by [Ecodex](https://getecodex.com) · 1M+ facteurs d'émission carbone*
