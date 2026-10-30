import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  Map,
  ShieldCheck,
  Flame,
  Smartphone,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Satellite,
  QrCode,
  Download,
  Leaf,
  Globe,
  Award,
  Activity,
  WifiOff,
  Database,
  LogIn,
  UserPlus,
  LayoutDashboard,
  LogOut,
  MapPin,
  Check,
  ChevronRight,
  FileText,
  BarChart3,
  Search,
  Moon,
  Sun,
} from "lucide-react";
import logoImg from "../../assets/logo.png";

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("sig");

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (e) {
      console.error(e);
    }
  };

  const interactiveFeatures = {
    sig: {
      tag: "Cartographie Interactive",
      title: "Visualisation & Tracé Parcellaire Haute Précision",
      desc: "Cartographiez vos parcelles agricoles en quelques clics. Dessinez les contours directement sur une carte satellite interactive avec calcul instantané des superficies en hectares, ou importez simplement vos fichiers existants (KML, GeoPackage, Shapefile).",
      badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      stats: [
        { label: "Formats acceptés", value: "KML, GPKG, SHP" },
        { label: "Calcul de surface", value: "Instantané (ha)" },
        { label: "Précision", value: "Submétrique" },
      ],
      previewContent: (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Vue Cartographique Satellite</span>
            </div>
            <span className="text-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full font-medium">GPS Actif</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
              <p className="text-gray-500 dark:text-slate-400">Parcelle sélectionnée</p>
              <p className="font-semibold text-gray-800 dark:text-slate-200">Parcelle VAH-042</p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Vanille Bio • 3.42 ha</span>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
              <p className="text-gray-500 dark:text-slate-400">Producteur rattaché</p>
              <p className="font-semibold text-gray-800 dark:text-slate-200">Jean Rakoto</p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Adhérent certifié</span>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/60 dark:to-teal-950/60 border border-emerald-100 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
            <div>
              <p className="font-medium">Tracé de contour validé</p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">6 sommets géolocalisés • Prêt pour l'audit</p>
            </div>
            <span className="px-2.5 py-1 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg shadow-xs">3.42 ha</span>
          </div>
        </div>
      ),
    },
    fire: {
      tag: "Protection Proactive",
      title: "Surveillance Satellitaire des Risques d'Incendie",
      desc: "Anticipez et protégez vos cultures grâce à la détection thermique par satellite (NASA FIRMS). Le système calcule automatiquement les zones de danger autour de vos parcelles et vous alerte dès qu'un feu actif est détecté.",
      badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
      stats: [
        { label: "Surveillance", value: "Satellites 24/7" },
        { label: "Zone de sécurité", value: "Rayon 1 à 5 km" },
        { label: "Alertes", value: "Immédiates" },
      ],
      previewContent: (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Veille Satellitaire Active</span>
            </div>
            <span className="text-xs bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-medium">En continu</span>
          </div>
          <div className="p-3 bg-amber-50/70 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-900/60 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200">Alerte Proximité 1.8 km</span>
              </div>
              <span className="text-[10px] bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-semibold px-2 py-0.5 rounded">Priorité haute</span>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Départ de feu détecté à 1.8 km des parcelles de giroflier. Notification d'alerte transmise à l'équipe locale.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg">
              <span className="text-gray-500 dark:text-slate-400 block">Dernier scan satellite</span>
              <strong className="text-gray-800 dark:text-slate-200">Aujourd'hui à 09h14</strong>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg">
              <span className="text-gray-500 dark:text-slate-400 block">Statut périmètre</span>
              <strong className="text-emerald-700 dark:text-emerald-400">Zone sécurisée</strong>
            </div>
          </div>
        </div>
      ),
    },
    bio: {
      tag: "Conformité & Export",
      title: "Audits Biologiques & Traçabilité Internationale",
      desc: "Accélérez vos certifications pour les marchés d'exportation les plus exigeants. Suivi rigoureux des périodes de conversion, contrôle des intrants naturels, vérification des zones tampons et génération instantanée des rapports d'audit au format officiel PDF.",
      badgeColor: "bg-green-500/10 text-green-700 dark:text-emerald-400 border-green-500/20",
      stats: [
        { label: "Norme export", value: "Agriculture Biologique" },
        { label: "Conversion bio", value: "Suivi multi-années" },
        { label: "Rapports", value: "PDF téléchargeable" },
      ],
      previewContent: (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Audit de Conformité Bio</span>
            </div>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full">100% Conforme</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
              <span className="text-gray-600 dark:text-slate-300">Absence totale d'intrants chimiques</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium"><Check className="w-3.5 h-3.5" /> Vérifié</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
              <span className="text-gray-600 dark:text-slate-300">Haies naturelles & zones anti-dérive</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium"><Check className="w-3.5 h-3.5" /> Conforme</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
              <span className="text-gray-600 dark:text-slate-300">Registre parcellaire & récolte à jour</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium"><Check className="w-3.5 h-3.5" /> Validé</span>
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between">
            <span>Rapport d'audit prêt pour les certificateurs (Ecocert, etc.)</span>
            <FileText className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </div>
        </div>
      ),
    },
    surveys: {
      tag: "Travail Hors-Ligne",
      title: "Collecte de Terrain sur Mobile 100% Sans Connexion",
      desc: "Les agents de terrain enregistrent les parcelles, remplissent les enquêtes agricoles, prennent des photos et font signer les producteurs même sans réseau internet. Dès le retour en zone couverte, les données se synchronisent automatiquement.",
      badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      stats: [
        { label: "Connectivité", value: "100% Hors-ligne" },
        { label: "Outils terrain", value: "GPS, Photos, Signatures" },
        { label: "Synchronisation", value: "Sans perte de données" },
      ],
      previewContent: (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Mode Terrain Autonome</span>
            </div>
            <span className="text-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-medium">Prêt pour la synchro</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg">
              <Smartphone className="w-4 h-4 text-gray-600 dark:text-slate-400 mx-auto mb-1" />
              <span className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 block">Tracé GPS</span>
              <span className="text-[10px] text-gray-400 dark:text-slate-500">En marchant</span>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg">
              <QrCode className="w-4 h-4 text-gray-600 dark:text-slate-400 mx-auto mb-1" />
              <span className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 block">Fiche PDF</span>
              <span className="text-[10px] text-gray-400 dark:text-slate-500">QR Code unique</span>
            </div>
            <div className="p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg">
              <Database className="w-4 h-4 text-gray-600 dark:text-slate-400 mx-auto mb-1" />
              <span className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 block">Enquêtes</span>
              <span className="text-[10px] text-gray-400 dark:text-slate-500">Données sécurisées</span>
            </div>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-200 text-xs rounded-lg flex items-center justify-between">
            <span>Enquêtes enregistrées en attente : 18 synchronisées</span>
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          </div>
        </div>
      ),
    },
  };

  const featureCards = [
    {
      title: "Cartographie SIG & Cadastre",
      desc: "Visualisez l'ensemble de vos terroirs, regroupez vos producteurs et dessinez le contour précis de chaque parcelle avec calcul automatique des surfaces en hectares.",
      icon: Map,
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: "Surveillance des Feux en Temps Réel",
      desc: "Détectez instantanément les incendies et foyers thermiques à proximité de vos plantations grâce aux données satellitaires pour protéger vos récoltes.",
      icon: Flame,
      color: "from-amber-500 to-orange-600",
    },
    {
      title: "Certification & Audits Biologiques",
      desc: "Structurez vos audits de conformité, assurez la traçabilité des intrants et exportez vos rapports officiels pour les organismes certificateurs internationaux.",
      icon: ShieldCheck,
      color: "from-green-600 to-emerald-700",
    },
    {
      title: "Fiches Parcellaires & QR Codes",
      desc: "Chaque parcelle possède sa fiche synthétique téléchargeable avec un QR Code unique pour un contrôle rapide et infalsifiable directement sur le terrain.",
      icon: QrCode,
      color: "from-teal-600 to-cyan-700",
    },
    {
      title: "Formulaires d'Enquêtes Personnalisés",
      desc: "Créez en quelques minutes des formulaires sur-mesure (questions à choix, photos, signatures, échelles de satisfaction) sans aucune compétence technique.",
      icon: FileText,
      color: "from-blue-600 to-indigo-600",
    },
    {
      title: "Application Mobile 100% Hors-Ligne",
      desc: "Pensée pour les zones rurales sans couverture réseau : tracez les parcelles au GPS, collectez les données et synchronisez dès votre retour en ville.",
      icon: Smartphone,
      color: "from-slate-700 to-slate-900",
    },
  ];

  const audienceRoles = [
    {
      title: "Coopératives & Groupements",
      icon: Users,
      description: "Fédérez vos adhérents, valorisez vos productions agricoles et gérez vos données foncières avec une transparence exemplaire.",
      tag: "Gestion Globale",
    },
    {
      title: "Producteurs & Agriculteurs",
      icon: Leaf,
      description: "Valorisez vos cultures biologiques, protégez vos parcelles et obtenez des certifications reconnues pour vendre au juste prix.",
      tag: "Terroir & Culture",
    },
    {
      title: "Agents de Terrain & Enquêteurs",
      icon: Smartphone,
      description: "Collectez rapidement les informations directement au champ, sans vous soucier de la connexion internet, grâce à une interface fluide.",
      tag: "Outil Terrain",
    },
    {
      title: "Auditeurs & Certificateurs",
      icon: Award,
      description: "Consultez l'historique complet d'une parcelle, vérifiez les pratiques biologiques et délivrez des rapports en toute sérénité.",
      tag: "Certification",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 dark:bg-slate-950/90 border-b border-slate-200/80 dark:border-slate-800 transition-all shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 dark:from-emerald-500/30 dark:to-teal-500/20 flex items-center justify-center p-1 border border-emerald-500/20 dark:border-emerald-500/30 shadow-xs group-hover:scale-105 transition-transform duration-300">
                <img
                  src={logoImg}
                  alt="Smart Saha Bio"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                  SmartSaha<span className="text-emerald-500 dark:text-emerald-400">Bio</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                AgriTech & Traçabilité Durable
              </p>
            </div>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a
              href="#solutions"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Solutions
            </a>
            <a
              href="#demonstration"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Aperçu en direct
            </a>
            <a
              href="#utilisateurs"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Pour qui ?
            </a>
            <a
              href="#qualite"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Qualité & Traçabilité
            </a>
          </nav>

          {/* Action Buttons: Theme Toggle & Login / Dashboard */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 dark:bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-800 dark:hover:bg-emerald-700 shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Tableau de bord</span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Se déconnecter"
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Se connecter</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Background decorative glows */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-emerald-200/40 via-teal-100/20 to-transparent dark:from-emerald-900/20 dark:via-teal-900/10 blur-3xl opacity-70 dark:opacity-40"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-amber-200/30 dark:bg-amber-900/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-300/30 dark:bg-emerald-900/15 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Pill badge */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-xs">
                <span>La plateforme intelligente de référence pour les filières agricoles</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                Pilotez vos coopératives, parcelles et{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-500">
                  certifications biologiques
                </span>{" "}
                en toute sérénité.
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl font-normal leading-relaxed mx-auto lg:mx-0">
                De la cartographie parcellaire par satellite à la détection précoce des incendies, en passant par les audits de conformité pour l'export et la collecte mobile sur le terrain sans réseau internet : tout est réuni sur une interface claire et intuitive.
              </p>

              {/* Call to Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-base hover:from-emerald-700 hover:to-teal-800 shadow-lg shadow-emerald-700/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span>Accéder à mon espace</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-base hover:from-emerald-700 hover:to-teal-800 shadow-lg shadow-emerald-700/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>Créer un compte</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>

                    <Link
                      to="/login"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-base border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-600 dark:hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all shadow-xs"
                    >
                      <LogIn className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span>Se connecter</span>
                    </Link>
                  </>
                )}

                <a
                  href="#solutions"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-slate-600 dark:text-slate-400 font-semibold text-sm hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                >
                  <span>Découvrir les solutions</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>

              {/* Guarantees / Highlights */}
              <div className="pt-4 grid grid-cols-3 gap-3 border-t border-slate-200/80 dark:border-slate-800 max-w-xl mx-auto lg:mx-0">
                <div className="flex items-center gap-2 text-left">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Exportation Bio Sécurisée</span>
                </div>
                <div className="flex items-center gap-2 text-left">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Alertes Feux Satellitaires</span>
                </div>
                <div className="flex items-center gap-2 text-left">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Terrain 100% Hors-Ligne</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Mockup Card */}
            <div id="demonstration" className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Background glow behind card */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 rounded-3xl blur-lg opacity-30 dark:opacity-20"></div>

                <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
                  {/* Card Header with tabs */}
                  <div className="bg-slate-900 dark:bg-slate-950 p-4 text-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>
                        <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                        <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                        <span className="text-xs text-slate-400 font-mono ml-2">smart-saha-bio // cockpit</span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Plateforme active
                      </span>
                    </div>

                    {/* Interactive Tab Switcher */}
                    <div className="grid grid-cols-4 gap-1 bg-slate-800/90 dark:bg-slate-900 p-1 rounded-xl">
                      <button
                        onClick={() => setActiveTab("sig")}
                        className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg transition-all text-center ${activeTab === "sig"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-400 hover:text-white"
                          }`}
                      >
                        Parcelles
                      </button>
                      <button
                        onClick={() => setActiveTab("fire")}
                        className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg transition-all text-center ${activeTab === "fire"
                            ? "bg-amber-600 text-white shadow-xs"
                            : "text-slate-400 hover:text-white"
                          }`}
                      >
                        Protection Feux
                      </button>
                      <button
                        onClick={() => setActiveTab("bio")}
                        className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg transition-all text-center ${activeTab === "bio"
                            ? "bg-green-600 text-white shadow-xs"
                            : "text-slate-400 hover:text-white"
                          }`}
                      >
                        Audit Bio
                      </button>
                      <button
                        onClick={() => setActiveTab("surveys")}
                        className={`text-[11px] font-semibold py-1.5 px-2 rounded-lg transition-all text-center ${activeTab === "surveys"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-400 hover:text-white"
                          }`}
                      >
                        Terrain Mobile
                      </button>
                    </div>
                  </div>

                  {/* Card Dynamic Body */}
                  <div className="p-6">
                    <div className="mb-4">
                      <span
                        className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border mb-2 ${interactiveFeatures[activeTab].badgeColor}`}
                      >
                        {interactiveFeatures[activeTab].tag}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                        {interactiveFeatures[activeTab].title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-3">
                        {interactiveFeatures[activeTab].desc}
                      </p>
                    </div>

                    {/* Dynamic Simulated Preview */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 shadow-xs mb-4">
                      {interactiveFeatures[activeTab].previewContent}
                    </div>

                    {/* Mini Stats Bar */}
                    <div className="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-center">
                      {interactiveFeatures[activeTab].stats.map((st, idx) => (
                        <div key={idx} className="p-1.5">
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{st.label}</p>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{st.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Action in Card */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <Link
                        to={user ? "/dashboard" : "/login"}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-900 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                      >
                        <span>Accéder à l'application</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. KEY METRICS STRIP */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white py-12 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-emerald-800/60">
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400">100%</p>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">Conformité Biologique</p>
              <span className="text-[11px] text-emerald-300/80">Traçabilité complète garantie</span>
            </div>
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold text-teal-300">24h / 24</p>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">Surveillance Incendie Satellite</p>
              <span className="text-[11px] text-teal-300/80">Alertes précoces automatiques</span>
            </div>
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold text-amber-300">Haute Précision</p>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">Cartographie des Parcelles</p>
              <span className="text-[11px] text-amber-300/80">Calcul instantané des surfaces</span>
            </div>
            <div className="pt-4 md:pt-0">
              <p className="text-3xl sm:text-4xl font-extrabold text-cyan-300">Zéro Connexion</p>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">Fonctionne Sans Réseau</p>
              <span className="text-[11px] text-cyan-300/80">Synchronisation à chaud</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. LES SOLUTIONS TOUT-EN-UN POUR LES UTILISATEURS */}
      {/* ========================================================================= */}
      <section id="solutions" className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Nos Solutions Métier</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Tout ce dont vous avez besoin pour gérer vos parcelles et valoriser vos récoltes
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300 mt-4">
              Une suite complète d'outils modernes conçue pour simplifier le travail quotidien des coopératives, des producteurs et des auditeurs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featureCards.map((feat, index) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={index}
                  className="group relative bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-2xl p-7 border border-slate-200/90 dark:border-slate-700/80 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all duration-300 shadow-xs hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300 shadow-xs">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 group-hover:scale-150 transition-transform"></span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>

                  <div className="pt-5 mt-5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <span>En savoir plus</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. POUR QUI EST FAIT SMART SAHA BIO ? (LES ACTEURS) */}
      {/* ========================================================================= */}
      <section id="utilisateurs" className="py-20 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider mb-3">
              <Users className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>Conçu Pour Tous Les Acteurs de la Filière</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Une plateforme pensée pour chaque membre de votre écosystème
            </h2>
            <p className="text-base text-slate-600 dark:text-slate-300 mt-4">
              Des droits et des interfaces adaptés sur-mesure pour chaque intervenant, du champ jusqu'aux bureaux d'exportation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {audienceRoles.map((role, idx) => {
              const IconRole = role.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                        <IconRole className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {role.tag}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                      {role.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {role.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <span>Espace dédié</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TRAÇABILITÉ & ENGAGEMENT QUALITÉ */}
      {/* ========================================================================= */}
      <section id="qualite" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mb-12">
            <span className="text-emerald-400 font-mono text-xs uppercase tracking-wider block mb-2">
              Traçabilité & Qualité Certifiée
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Ouvrez les portes des marchés internationaux à forte valeur ajoutée
            </h2>
            <p className="text-slate-400 mt-3 text-base">
              Les acheteurs et les marchés mondiaux exigent une traçabilité sans faille. SmartSahaBio fournit toutes les preuves nécessaires en temps réel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                1
              </div>
              <h4 className="text-lg font-bold text-white">Traçabilité de la Parcelle à l'Assiette</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chaque lot récolté est rattaché à son producteur et à sa parcelle géolocalisée, assurant une transparence totale pour vos clients.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                2
              </div>
              <h4 className="text-lg font-bold text-white">Garantie Zéro Risque & Détection Précoce</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Surveillance continue par satellite des risques de feux et vérification des zones tampons pour éviter toute contamination chimique.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                3
              </div>
              <h4 className="text-lg font-bold text-white">Documents Officiels en 1 Clic</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Générez des fiches de parcelles claires avec QR Code et des procès-verbaux d'audit téléchargeables directement au format PDF.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. APPEL À L'ACTION (CTA FINAL) */}
      {/* ========================================================================= */}
      <section className="py-20 bg-gradient-to-br from-emerald-800 via-teal-800 to-emerald-950 text-white text-center relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          {/* <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md p-2 mx-auto border border-white/20 shadow-lg flex items-center justify-center">
            <Leaf className="w-9 h-9 text-emerald-300" />
          </div> */}

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Prêt à transformer la gestion de votre coopérative agricole ?
          </h2>

          <p className="text-base sm:text-lg text-emerald-100 max-w-2xl mx-auto font-light leading-relaxed">
            Rejoignez dès maintenant <strong>Smart Saha Bio</strong> et bénéficiez des meilleurs outils technologiques pour sécuriser et valoriser vos productions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {user ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-white text-emerald-900 font-extrabold text-base hover:bg-emerald-50 shadow-xl transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                <LayoutDashboard className="w-5 h-5 text-emerald-700" />
                <span>Ouvrir mon Tableau de bord</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-white text-emerald-900 font-extrabold text-base hover:bg-emerald-50 shadow-xl transition-all hover:scale-[1.03] active:scale-[0.98]"
                >
                  <UserPlus className="w-5 h-5 text-emerald-700" />
                  <span>Créer un compte</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-emerald-700/60 hover:bg-emerald-700 text-white font-extrabold text-base border border-emerald-400/40 backdrop-blur-md transition-all hover:scale-[1.03] active:scale-[0.98]"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Se connecter</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-900">
            <div className="flex items-center gap-3">
              <img
                src={logoImg}
                alt="Smart Saha Bio"
                className="w-9 h-9 object-contain"
              />
              <div>
                <span className="font-bold text-white text-sm">SMART SAHA BIO</span>
                <p className="text-[11px] text-slate-500">Plateforme de gestion coopérative et suivi parcellaire</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 font-medium">
              <Link to="/login" className="hover:text-white transition-colors">Connexion</Link>
              <Link to="/register" className="hover:text-white transition-colors">Inscription</Link>
              <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
              <a href="#utilisateurs" className="hover:text-white transition-colors">Acteurs</a>
              <a href="#qualite" className="hover:text-white transition-colors">Traçabilité</a>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <p>
              © {new Date().getFullYear()} Smart Saha Bio. Tous droits réservés.
            </p>
            <p className="flex items-center gap-2">
              <span>Plateforme AgriTech & Traçabilité Durable</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
