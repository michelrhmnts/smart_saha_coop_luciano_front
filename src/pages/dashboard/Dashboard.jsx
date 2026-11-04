import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDashboardReports, downloadReportsCsv } from "../../api/reports";
import { getCooperatives } from "../../api/cooperatives";
import { getMyParcels } from "../../api/parcels";
import { downloadParcelsReportPdf } from "../../utils/parcelsMapPdf";
import bannerImg from "../../assets/dashboard-banner.jpg";
import toast from "react-hot-toast";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Building2,
  Users,
  MapPin,
  Layers,
  ShieldCheck,
  Flame,
  FileSpreadsheet,
  Download,
  Loader2,
  Map as MapIcon,
  ClipboardCheck,
  Filter,
  Sprout,
  BarChart3,
  PieChart as PieChartIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Award,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  X,
} from "lucide-react";

// ============================================================================
// COMPOSANT 1 : DIAGRAMME EN ANNEAU / DONUT CHART SVG (Cercle interactif)
// ============================================================================
const DonutChart = ({
  data = [],
  size = 170,
  strokeWidth = 22,
  centerValue,
  centerLabel,
  showLegend = true,
  valueSuffix = "",
}) => {
  const total = useMemo(
    () => data.reduce((acc, item) => acc + (Number(item.value) || 0), 0),
    [data]
  );

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
          />
        </svg>
        <p className="mt-2 text-xs text-gray-400">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Cercle SVG Donut */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 transform"
        >
          {/* Cercle de fond */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            className="text-gray-100 dark:text-slate-800"
            strokeWidth={strokeWidth}
          />

          {data.map((item, index) => {
            const val = Number(item.value) || 0;
            if (val === 0) return null;
            const pct = val / total;
            const strokeDasharray = `${pct * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedPercent * circumference;
            accumulatedPercent += pct;

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color || "#10b981"}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-700 ease-out hover:opacity-80"
              />
            );
          })}
        </svg>

        {/* Valeur & Titre au centre du cercle */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
            {centerValue !== undefined ? centerValue : total}
          </span>
          {centerLabel && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              {centerLabel}
            </span>
          )}
        </div>
      </div>

      {/* Légende détaillée */}
      {showLegend && (
        <div className="flex-1 space-y-2.5 w-full">
          {data.map((item, idx) => {
            const val = Number(item.value) || 0;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return (
              <div
                key={idx}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-gray-700 truncate">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-2 shrink-0">
                  <span className="font-bold text-gray-900">
                    {val}
                    {valueSuffix}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400">
                    ({pct}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// COMPOSANT 2 : JAUGE EN DEMI-CERCLE (Speedometer / Gauge SVG)
// ============================================================================
const SemiCircleGauge = ({ value = 0, label = "Taux de conformité" }) => {
  const percentage = Math.min(100, Math.max(0, Math.round(value)));
  const radius = 56;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  let strokeColor = "#10b981"; // Émeraude
  let badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let statusText = "Excellente conformité";

  if (percentage < 50) {
    strokeColor = "#ef4444";
    badgeBg = "bg-red-50 text-red-700 border-red-200";
    statusText = "Action requise";
  } else if (percentage < 80) {
    strokeColor = "#f59e0b";
    badgeBg = "bg-amber-50 text-amber-700 border-amber-200";
    statusText = "Sous réserve";
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-40 h-24 overflow-hidden flex justify-center">
        <svg width="160" height="80" viewBox="0 0 160 80">
          {/* Arc de fond gris */}
          <path
            d="M 16 80 A 64 64 0 0 1 144 80"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {/* Arc de progression coloré */}
          <path
            d="M 16 80 A 64 64 0 0 1 144 80"
            fill="none"
            stroke={strokeColor}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute bottom-1 text-center">
          <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {percentage}%
          </span>
        </div>
      </div>

      <span className="mt-2 text-xs font-semibold text-gray-600 dark:text-slate-300">{label}</span>
      <span
        className={`mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeBg}`}
      >
        <Award className="w-3 h-3" />
        {statusText}
      </span>
    </div>
  );
};

// Palette harmonieuse pour les cultures
const CROP_COLORS = [
  "#10b981", // Émeraude (Vanille)
  "#f59e0b", // Ambre (Girofle)
  "#8b5cf6", // Violet (Cacao)
  "#06b6d4", // Cyan (Café)
  "#ec4899", // Rose (Poivre)
  "#f97316", // Orange (Fruits)
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#84cc16", // Lime
];

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Filtres multicritères
  const [selectedCooperative, setSelectedCooperative] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [showGrowth, setShowGrowth] = useState(true);

  // État des données
  const [cooperativesList, setCooperativesList] = useState([]);
  const [parcelsList, setParcelsList] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Onglet d'analyse actif : "overview" | "bio" | "fires"
  const [activeTab, setActiveTab] = useState("overview");

  // Modal de rapport imprimable / PDF
  const [showPrintModal, setShowPrintModal] = useState(false);

  const email = user?.email || "Utilisateur";

  const roleLabels = {
    admin: "Administrateur",
    cooperative_manager: "Gestionnaire de coopérative",
    field_agent: "Agent de terrain / Enquêteur",
    bio_auditor: "Auditeur bio",
    consultant: "Consultant",
  };

  const role = roleLabels[user?.role] || "Gestionnaire";

  // Chargement des coopératives pour le filtre
  useEffect(() => {
    const fetchCoops = async () => {
      try {
        const res = await getCooperatives();
        const list = Array.isArray(res) ? res : res?.data || [];
        setCooperativesList(list);
      } catch (err) {
        console.error("❌ Erreur chargement coopératives :", err);
      }
    };
    fetchCoops();
  }, []);

  // Chargement des parcelles pour la cartographie
  useEffect(() => {
    const fetchParcels = async () => {
      try {
        const res = await getMyParcels();
        const list = Array.isArray(res) ? res : res?.data || [];
        setParcelsList(list);
      } catch (err) {
        console.error("❌ Erreur chargement parcelles :", err);
      }
    };
    fetchParcels();
  }, []);

  // Filtrage des parcelles selon la coopérative et la culture sélectionnées
  const filteredParcels = useMemo(() => {
    let result = [...parcelsList];
    if (selectedCooperative) {
      result = result.filter(
        (p) =>
          String(p.cooperative_id) === String(selectedCooperative) ||
          String(p.cooperative?.uuid) === String(selectedCooperative) ||
          String(p.cooperative?.id) === String(selectedCooperative)
      );
    }
    if (selectedCrop) {
      result = result.filter(
        (p) =>
          p.crop_type?.toLowerCase() === selectedCrop.toLowerCase() ||
          p.crop?.toLowerCase() === selectedCrop.toLowerCase()
      );
    }
    if (selectedStatus) {
      result = result.filter((p) => p.status === selectedStatus);
    }
    return result;
  }, [parcelsList, selectedCooperative, selectedCrop, selectedStatus]);

  // Téléchargement DIRECT du rapport PDF avec la carte des parcelles (sans imprimer)
  const handleDownloadDashboardPdf = async () => {
    try {
      setDownloadingPdf(true);
      toast.loading("Génération du rapport PDF avec cartographie des parcelles...", { id: "dash-pdf" });

      const selectedCoopObj = cooperativesList.find(
        (c) => String(c.uuid || c.id) === String(selectedCooperative)
      );
      const coopName = selectedCooperative
        ? selectedCoopObj?.name || "Coopérative sélectionnée"
        : "Toutes les coopératives";

      const parcelsToExport = filteredParcels.length > 0 ? filteredParcels : parcelsList;

      await downloadParcelsReportPdf({
        title: "Rapport d'Activité & Cartographie des Parcelles",
        cooperativeName: coopName,
        period: selectedPeriod === "30d" ? "Derniers 30 jours" : selectedPeriod === "90d" ? "Dernier trimestre" : selectedPeriod === "year" ? "Année en cours" : "Période globale",
        cropName: selectedCrop || "Toutes cultures",
        summary: reportData?.summary || {},
        parcels: parcelsToExport,
        cooperativesSummary: reportData?.cooperatives_summary || [],
        fileName: `Rapport_SmartSahaBio_${coopName.replace(/[^a-zA-Z0-9_-]/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`,
      });

      toast.success("Rapport PDF téléchargé avec succès !", { id: "dash-pdf" });
    } catch (err) {
      console.error("❌ Erreur téléchargement PDF Dashboard :", err);
      toast.error("Échec du téléchargement du PDF.", { id: "dash-pdf" });
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Chargement des statistiques
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        period: selectedPeriod,
      };
      if (selectedCooperative) params.cooperative_id = selectedCooperative;
      if (selectedCrop) params.crop = selectedCrop;
      if (selectedStatus) params.status = selectedStatus;

      const res = await getDashboardReports(params);
      setReportData(res.data);
    } catch (err) {
      console.error("❌ Erreur chargement rapports dashboard :", err);
      setError(
        err.response?.data?.error ||
          "Impossible de charger les statistiques du tableau de bord."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedCooperative, selectedPeriod, selectedCrop, selectedStatus]);

  // Export CSV / Excel
  const handleExportCsv = async () => {
    try {
      setExporting(true);
      await downloadReportsCsv({
        period: selectedPeriod,
        cooperative_id: selectedCooperative || undefined,
        crop: selectedCrop || undefined,
        status: selectedStatus || undefined,
      });
    } catch (err) {
      console.error("❌ Erreur export CSV :", err);
      alert("Erreur lors du téléchargement du rapport Excel / CSV.");
    } finally {
      setExporting(false);
    }
  };

  // Liste unique des cultures trouvées dans les coopératives
  const availableCrops = useMemo(() => {
    const crops = new Set();
    cooperativesList.forEach((c) => {
      if (c.main_crop && c.main_crop.trim()) crops.add(c.main_crop.trim());
      if (c.second_crop && c.second_crop.trim()) crops.add(c.second_crop.trim());
      if (c.third_crop && c.third_crop.trim()) crops.add(c.third_crop.trim());
    });
    (reportData?.crops_distribution || []).forEach((cd) => {
      if (cd.crop && cd.crop !== "Non spécifié" && cd.crop.trim()) {
        crops.add(cd.crop.trim());
      }
    });
    return Array.from(crops).sort();
  }, [cooperativesList, reportData?.crops_distribution]);

  const summary = reportData?.summary;
  const growth = reportData?.growth;

  const renderGrowthBadge = (value) => {
    if (!showGrowth || value === undefined || value === null) return null;
    const isPositive = value >= 0;
    return (
      <span
        className={`ml-2 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${
          isPositive
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-red-50 text-red-700 border border-red-200"
        }`}
      >
        {isPositive ? (
          <TrendingUp className="w-3 h-3 text-emerald-600" />
        ) : (
          <TrendingDown className="w-3 h-3 text-red-600" />
        )}
        {isPositive ? "+" : ""}
        {value}%
      </span>
    );
  };

  // Données préparées pour les diagrammes circulaires
  const bioAuditDonutData = useMemo(() => {
    return [
      {
        label: "Conformes",
        value: summary?.bio_audits?.compliant ?? 0,
        color: "#10b981", // Émeraude
      },
      {
        label: "Sous réserve",
        value: summary?.bio_audits?.compliant_with_reservations ?? 0,
        color: "#f59e0b", // Ambre
      },
      {
        label: "Non conformes",
        value: summary?.bio_audits?.non_compliant ?? 0,
        color: "#ef4444", // Rouge
      },
    ];
  }, [summary]);

  const bioConversionDonutData = useMemo(() => {
    return [
      {
        label: "Certifiées bio",
        value: summary?.bio_audits?.certified ?? 0,
        color: "#059669", // Vert foncé
      },
      {
        label: "En conversion",
        value: summary?.bio_audits?.in_conversion ?? 0,
        color: "#3b82f6", // Bleu
      },
      {
        label: "Non démarré",
        value: summary?.bio_audits?.not_started ?? 0,
        color: "#9ca3af", // Gris
      },
    ];
  }, [summary]);

  const cropsDonutData = useMemo(() => {
    const list = reportData?.crops_distribution || [];
    return list.slice(0, 6).map((c, idx) => ({
      label: c.crop ? c.crop.charAt(0).toUpperCase() + c.crop.slice(1) : "Autre",
      value: Number(c.total_area_ha.toFixed(1)),
      color: CROP_COLORS[idx % CROP_COLORS.length],
    }));
  }, [reportData]);

  const fireAlertsDonutData = useMemo(() => {
    return [
      {
        label: "Transmises",
        value: summary?.fire_alerts?.sent ?? 0,
        color: "#10b981", // Vert
      },
      {
        label: "En attente",
        value: summary?.fire_alerts?.pending ?? 0,
        color: "#f59e0b", // Ambre
      },
    ];
  }, [summary]);

  return (
    <div className="min-h-screen bg-transparent dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-1">
      {/* 1. Bandeau supérieur d'accueil avec fond image clair & Actions d'export */}
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm sm:p-8">
        {/* Image de fond claire */}
        <img
          src={bannerImg}
          alt="Paysage agricole"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />

        {/* Voile lumineux dégradé pour garantir une netteté et une lisibilité parfaite des textes */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/88 to-white/70 dark:from-slate-950/95 dark:via-slate-900/90 dark:to-slate-950/80 backdrop-blur-[1px]" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 shadow-2xs">
                {role}
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{email}</span>
            </div>

            <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-white sm:text-3xl tracking-tight">
              Tableau de bord & Reporting
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
              Vision consolidée de l'activité agricole, conformité aux critères
              d'agriculture biologique (UE 2018/848) et surveillance des parcelles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/audits/report")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition"
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-100" />
              <span>Rapport d'audit</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/95 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition border border-slate-300 dark:border-slate-700 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>
                {exporting ? "Génération..." : "Exporter Excel / CSV"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 dark:bg-emerald-700 dark:hover:bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition"
              title="Télécharger le rapport officiel avec la carte des parcelles"
            >
              <Download className="w-4 h-4 text-emerald-200" />
              <span>Télécharger PDF</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Barre des filtres multicritères */}
      <section className="mb-8 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-800 dark:text-slate-100">
            <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Filtres de reporting multicritères</span>
          </h2>
          <div className="flex items-center gap-4">
            {(selectedCooperative || selectedCrop || selectedStatus || selectedPeriod !== "30d") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCooperative("");
                  setSelectedCrop("");
                  setSelectedStatus("");
                  setSelectedPeriod("30d");
                }}
                className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Réinitialiser les filtres</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="growthToggle"
                checked={showGrowth}
                onChange={(e) => setShowGrowth(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 dark:bg-slate-800"
              />
              <label
                htmlFor="growthToggle"
                className="cursor-pointer text-xs font-medium text-gray-600 dark:text-slate-300"
              >
                Comparer avec période précédente
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Filtre Coopérative */}
          <div>
            <label
              htmlFor="coopSelect"
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400"
            >
              Coopérative
            </label>
            <select
              id="coopSelect"
              value={selectedCooperative}
              onChange={(e) => setSelectedCooperative(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-gray-800 dark:text-slate-100 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden"
            >
              <option value="" className="dark:bg-slate-800">Toutes les coopératives</option>
              {cooperativesList.map((c) => (
                <option key={c.uuid} value={c.uuid} className="dark:bg-slate-800">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Période */}
          <div>
            <label
              htmlFor="periodSelect"
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400"
            >
              Période temporelle
            </label>
            <select
              id="periodSelect"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-gray-800 dark:text-slate-100 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden"
            >
              <option value="7d" className="dark:bg-slate-800">7 derniers jours</option>
              <option value="30d" className="dark:bg-slate-800">30 derniers jours (1 mois)</option>
              <option value="90d" className="dark:bg-slate-800">90 derniers jours (Trimestre)</option>
              <option value="1y" className="dark:bg-slate-800">1 an écoulé</option>
              <option value="all" className="dark:bg-slate-800">Historique complet</option>
            </select>
          </div>

          {/* Filtre Culture */}
          <div>
            <label
              htmlFor="cropSelect"
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400"
            >
              Filière / Culture
            </label>
            <select
              id="cropSelect"
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-gray-800 dark:text-slate-100 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden capitalize"
            >
              <option value="" className="dark:bg-slate-800">Toutes les cultures</option>
              {availableCrops.map((cr) => (
                <option key={cr} value={cr} className="dark:bg-slate-800">
                  {cr}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre Statut Bio */}
          <div>
            <label
              htmlFor="statusSelect"
              className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400"
            >
              Statut de certification bio
            </label>
            <select
              id="statusSelect"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-gray-800 dark:text-slate-100 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden"
            >
              <option value="" className="dark:bg-slate-800">Tous les statuts</option>
              <option value="certified" className="dark:bg-slate-800">Certifié biologique</option>
              <option value="in_conversion" className="dark:bg-slate-800">En cours de conversion</option>
              <option value="not_started" className="dark:bg-slate-800">Non démarré</option>
            </select>
          </div>
        </div>
      </section>

      {/* Message d'erreur avec bouton de réessai */}
      {error && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                if (logout) await logout();
              } catch (e) {
                console.warn("Erreur déconnexion:", e);
              }
              navigate("/login", { replace: true });
            }}
            className="ml-4 rounded-xl cursor-pointer bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-red-700 shrink-0"
          >
            Me reconnecter
          </button>
        </div>
      )}

      {/* 3. Cartes d'indicateurs clés (KPIs) avec Icônes Lucide */}
      <section className="mb-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* Coopératives */}
          <div className="group rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100/60 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 transition group-hover:scale-105">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Coopératives
              </span>
            </div>
            <p className="mt-4 text-xs font-medium text-gray-500 dark:text-slate-400">
              Total gérées
            </p>
            <div className="mt-1 flex items-baseline">
              <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {loading ? "..." : summary?.cooperatives?.total ?? 0}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">
              {summary?.cooperatives?.active ?? 0} actives
            </p>
          </div>

          {/* Producteurs */}
          <div className="group rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100/60 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 transition group-hover:scale-105">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Adhérents
              </span>
            </div>
            <p className="mt-4 text-xs font-medium text-gray-500 dark:text-slate-400">
              Producteurs
            </p>
            <div className="mt-1 flex items-baseline">
              <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {loading ? "..." : summary?.farmers?.total ?? 0}
              </span>
              {renderGrowthBadge(growth?.farmers)}
            </div>
            <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">
              {summary?.farmers?.female_percentage ?? 0}% femmes
            </p>
          </div>

          {/* Parcelles */}
          <div className="group rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100/60 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 transition group-hover:scale-105">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Parcelles
              </span>
            </div>
            <p className="mt-4 text-xs font-medium text-gray-500 dark:text-slate-400">
              Géolocalisées
            </p>
            <div className="mt-1 flex items-baseline">
              <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {loading ? "..." : summary?.parcels?.total ?? 0}
              </span>
              {renderGrowthBadge(growth?.parcels)}
            </div>
            <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">
              Moy. {summary?.parcels?.avg_area_ha ?? 0} ha/parcelle
            </p>
          </div>

          {/* Superficie Totale */}
          <div className="group rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition hover:border-teal-300 dark:hover:border-teal-600 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100/60 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400 transition group-hover:scale-105">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Superficie
              </span>
            </div>
            <p className="mt-4 text-xs font-medium text-gray-500 dark:text-slate-400">
              Surface totale
            </p>
            <div className="mt-1 flex items-baseline">
              <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {loading ? "..." : `${summary?.parcels?.total_area_ha ?? 0} ha`}
              </span>
              {renderGrowthBadge(growth?.area)}
            </div>
            <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">
              Cartographiée SIG
            </p>
          </div>

          {/* Conformité Bio */}
          <div className="group rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100/60 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 transition group-hover:scale-105">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Audit Bio
              </span>
            </div>
            <p className="mt-4 text-xs font-medium text-gray-500 dark:text-slate-400">
              Conformité UE
            </p>
            <div className="mt-1 flex items-baseline">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">
                {loading ? "..." : `${summary?.bio_audits?.compliance_rate ?? 0}%`}
              </span>
              {renderGrowthBadge(growth?.audits)}
            </div>
            <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">
              {summary?.bio_audits?.compliant ?? 0} conformes / {summary?.bio_audits?.total ?? 0}
            </p>
          </div>

          {/* Si Auditeur Bio : Carte dédiée Volume d'Audits, sinon Carte Alertes Feux */}
          {user?.role === "bio_auditor" ? (
            <div className="group rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100/60 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 transition group-hover:scale-105">
                  <Award className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Audits
                </span>
              </div>
              <p className="mt-4 text-xs font-medium text-gray-500 dark:text-slate-400">
                Total réalisés
              </p>
              <div className="mt-1 flex items-baseline">
                <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {loading ? "..." : summary?.bio_audits?.total ?? 0}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">
                {summary?.bio_audits?.compliant ?? 0} conformes certifiés
              </p>
            </div>
          ) : (
            <div className="group rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition hover:border-red-300 dark:hover:border-red-600 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-100/60 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400 transition group-hover:scale-105">
                  <Flame className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  Veille Feux
                </span>
              </div>
              <p className="mt-4 text-xs font-medium text-gray-500 dark:text-slate-400">
                Menaces actives
              </p>
              <div className="mt-1 flex items-baseline">
                <span
                  className={`text-2xl font-black tracking-tight ${
                    (summary?.fire_alerts?.threatened_parcels ?? 0) > 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {loading
                    ? "..."
                    : summary?.fire_alerts?.threatened_parcels ?? 0}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">
                {summary?.fire_alerts?.pending ?? 0} alertes en attente
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 4. Onglets d'analyse approfondie avec Lucide Icons */}
      <section className="mb-8">
        <div className="mb-6 flex border-b border-gray-200 dark:border-slate-800 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 transition ${
              activeTab === "overview"
                ? "border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold"
                : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Vue d'ensemble & Répartition cultures</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bio")}
            className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 transition ${
              activeTab === "bio"
                ? "border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold"
                : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Rapport dédié Audit Bio (UE 2018/848)</span>
          </button>

          {user?.role !== "bio_auditor" && (
            <button
              type="button"
              onClick={() => setActiveTab("fires")}
              className={`inline-flex items-center gap-2 border-b-2 px-5 py-3 transition ${
                activeTab === "fires"
                  ? "border-emerald-600 dark:border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold"
                  : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Veille Incendie & Alertes territoriales</span>
            </button>
          )}
        </div>

        {/* ------------------------------------------------------------------
            ONGLET 1 : Vue d'ensemble & Cultures (Diagramme circulaire + Liste)
        ------------------------------------------------------------------ */}
        {activeTab === "overview" && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Diagramme circulaire Répartition par culture */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm lg:col-span-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-700 dark:text-emerald-400">
                    <PieChartIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Répartition par culture
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">
                      Surfaces cumulées (hectares)
                    </p>
                  </div>
                </div>
              </div>

              {/* Diagramme Donut SVG */}
              <div className="py-2">
                <DonutChart
                  data={cropsDonutData}
                  centerValue={`${summary?.parcels?.total_area_ha ?? 0}`}
                  centerLabel="Hectares"
                  valueSuffix=" ha"
                  size={150}
                  strokeWidth={20}
                />
              </div>

              {/* Détails par filière */}
              <div className="mt-6 border-t border-gray-100 dark:border-slate-800 pt-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                  Détail par parcelle
                </h4>
                {(reportData?.crops_distribution || []).map((item, idx) => {
                  const totalArea = summary?.parcels?.total_area_ha || 1;
                  const pct = Math.min(
                    100,
                    Math.round((item.total_area_ha / totalArea) * 100)
                  );
                  return (
                    <div key={item.crop} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-slate-300">
                        <span className="capitalize flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                            style={{
                              backgroundColor:
                                CROP_COLORS[idx % CROP_COLORS.length],
                            }}
                          />
                          {item.crop}
                        </span>
                        <span>
                          {item.total_area_ha.toFixed(1)} ha ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              CROP_COLORS[idx % CROP_COLORS.length],
                          }}
                        />
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-slate-500">
                        {item.parcels_count} parcelle(s) réparties sur{" "}
                        {item.cooperatives_count} coopérative(s)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bilan par coopérative */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-700 dark:text-emerald-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Activité consolidée par coopérative
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">
                      Détail des parcelles, producteurs et conformité biologique.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/cooperatives")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline"
                >
                  <span>Gérer</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50/75 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                      <th className="px-3.5 py-3">Coopérative</th>
                      <th className="px-3.5 py-3">Culture</th>
                      <th className="px-3.5 py-3">Producteurs</th>
                      <th className="px-3.5 py-3">Parcelles</th>
                      <th className="px-3.5 py-3">Surface</th>
                      <th className="px-3.5 py-3">Conformité Bio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {(reportData?.cooperatives_summary || []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-xs text-gray-400 dark:text-slate-500"
                        >
                          Aucune coopérative trouvée pour ces filtres.
                        </td>
                      </tr>
                    ) : (
                      (reportData?.cooperatives_summary || []).map((c) => (
                        <tr
                          key={c.uuid}
                          className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-3.5 py-3 font-semibold text-gray-800 dark:text-slate-200">
                            {c.name}
                            <div className="text-[11px] font-normal text-gray-400 dark:text-slate-500">
                              {c.president_name}
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-gray-600 dark:text-slate-400 capitalize">
                            {c.main_crop || "—"}
                          </td>
                          <td className="px-3.5 py-3 font-medium text-gray-700 dark:text-slate-300">
                            {c.farmers_count}
                          </td>
                          <td className="px-3.5 py-3 font-medium text-gray-700 dark:text-slate-300">
                            {c.parcels_count}
                          </td>
                          <td className="px-3.5 py-3 font-bold text-emerald-800 dark:text-emerald-400">
                            {c.total_area_ha} ha
                          </td>
                          <td className="px-3.5 py-3">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                c.compliance_rate >= 80
                                  ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                  : c.compliance_rate >= 50
                                  ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                  : "bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                              }`}
                            >
                              {c.compliance_rate}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            ONGLET 2 : Rapport d'Audit Bio avec Diagrammes Circulaires
        ------------------------------------------------------------------ */}
        {activeTab === "bio" && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Carte 1 : Diagramme circulaire des Résultats d'audit + Jauge */}
              <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        Résultats des audits
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">
                        Répartition par statut de conformité
                      </p>
                    </div>
                  </div>
                </div>

                {/* Donut Chart des résultats */}
                <div className="py-2">
                  <DonutChart
                    data={bioAuditDonutData}
                    centerValue={`${summary?.bio_audits?.compliance_rate ?? 0}%`}
                    centerLabel="Conforme"
                    size={140}
                    strokeWidth={18}
                  />
                </div>

                {/* Jauge semi-circulaire */}
                <div className="mt-4 border-t border-gray-100 dark:border-slate-800 pt-4">
                  <SemiCircleGauge
                    value={summary?.bio_audits?.compliance_rate ?? 0}
                    label="Taux de conformité global UE"
                  />
                </div>
              </div>

              {/* Carte 2 : Diagramme circulaire Stades de conversion */}
              <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-700 dark:text-blue-400">
                      <Sprout className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        Stades de conversion bio
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">
                        Cycle de transition (UE 2018/848)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <DonutChart
                    data={bioConversionDonutData}
                    centerValue={`${summary?.bio_audits?.certified ?? 0}`}
                    centerLabel="Certifiées"
                    size={140}
                    strokeWidth={18}
                  />
                </div>

                <div className="mt-6 border-t border-gray-100 dark:border-slate-800 pt-4 text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>
                      Période de conversion réglementaire : 2 ans pour cultures
                      annuelles, 3 ans pour cultures pérennes.
                    </span>
                  </div>
                </div>
              </div>

              {/* Carte 3 : Graphique de gravité des non-conformités */}
              <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-red-50 dark:bg-red-950/60 rounded-xl text-red-700 dark:text-red-400">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                          Non-conformités relevées
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">
                          Classification par niveau d'impact
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mt-4">
                    {/* Critiques */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                          Critiques
                        </span>
                        <span className="font-extrabold text-red-700 dark:text-red-400">
                          {summary?.bio_audits?.severities?.critical ?? 0}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-red-100 dark:bg-red-950/60 overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              ((summary?.bio_audits?.severities?.critical ?? 0) /
                                (summary?.bio_audits?.total || 1)) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Majeures */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                          Majeures
                        </span>
                        <span className="font-extrabold text-amber-700 dark:text-amber-400">
                          {summary?.bio_audits?.severities?.major ?? 0}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-amber-100 dark:bg-amber-950/60 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              ((summary?.bio_audits?.severities?.major ?? 0) /
                                (summary?.bio_audits?.total || 1)) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Mineures */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
                          Mineures
                        </span>
                        <span className="font-extrabold text-yellow-700 dark:text-yellow-400">
                          {summary?.bio_audits?.severities?.minor ?? 0}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-yellow-100 dark:bg-yellow-950/60 overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              ((summary?.bio_audits?.severities?.minor ?? 0) /
                                (summary?.bio_audits?.total || 1)) *
                                100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-100 dark:border-slate-800 pt-4 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate("/audits")}
                    className="w-full sm:flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600 dark:border-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                  >
                    <span>Consulter tous les audits bio</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/audits/new")}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 dark:bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 dark:hover:bg-emerald-700 transition shadow-xs"
                  >
                    <span>+ Nouvel audit</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Échéances d'actions correctives */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-700 dark:text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Échéances de mise en conformité & renouvellement
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    Plans d'actions correctives en cours avec date limite fixée par l'auditeur.
                  </p>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50/75 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                      <th className="px-4 py-3">Date limite</th>
                      <th className="px-4 py-3">Parcelle</th>
                      <th className="px-4 py-3">Gravité</th>
                      <th className="px-4 py-3">Plan d'action correctif</th>
                      <th className="px-4 py-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {(reportData?.upcoming_deadlines || []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-6 text-center text-xs text-gray-400 dark:text-slate-500"
                        >
                          Aucune échéance corrective en attente.
                        </td>
                      </tr>
                    ) : (
                      (reportData?.upcoming_deadlines || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-red-700 dark:text-red-400">
                            {item.deadline}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-gray-600 dark:text-slate-400">
                            {item.parcel_id}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-red-100 dark:bg-red-950/80 px-2.5 py-0.5 text-[10px] font-bold uppercase text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                              {item.severity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-slate-300">
                            {item.corrective_action_plan || "—"}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-slate-400">
                            {item.overall_status}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------
            ONGLET 3 : Veille Feux & Alertes avec Diagramme Circulaire
        ------------------------------------------------------------------ */}
        {activeTab === "fires" && (
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-gray-100 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-red-50 dark:bg-red-950/60 rounded-2xl text-red-600 dark:text-red-400">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Synthèse de surveillance incendie (NASA FIRMS)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Surveillance par satellite des foyers thermiques à proximité des parcelles.
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/fires")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Ouvrir la carte interactive</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/fire-alerts")}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Journal des alertes</span>
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {/* Diagramme circulaire des statuts d'alerte */}
              <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/40 p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-4">
                  Transmission des alertes incendie
                </h4>
                <DonutChart
                  data={fireAlertsDonutData}
                  centerValue={`${summary?.fire_alerts?.total ?? 0}`}
                  centerLabel="Alertes"
                  size={150}
                  strokeWidth={20}
                />
              </div>

              {/* Indicateur de menace active */}
              <div className="rounded-2xl border border-red-100 dark:border-red-950/60 bg-red-50/40 dark:bg-red-950/20 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Menace active
                    </span>
                    <span className="text-xs text-gray-400 dark:text-slate-500">Rayon 5 km</span>
                  </div>

                  <div className="mt-4">
                    <span className="text-4xl font-black text-red-600 dark:text-red-400 tracking-tight">
                      {summary?.fire_alerts?.threatened_parcels ?? 0}
                    </span>
                    <span className="ml-2 text-sm font-semibold text-gray-700 dark:text-slate-300">
                      parcelle(s) menacée(s)
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                    Des foyers thermiques ont été interceptés par la télédétection spatiale.
                    Les gestionnaires peuvent déclencher les notifications SMS d'urgence
                    vers les agriculteurs concernés depuis la carte des feux.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-red-200/60 dark:border-red-900/60 flex justify-between items-center text-xs">
                  <span className="text-gray-500 dark:text-slate-400">
                    Transmises : <strong className="text-gray-900 dark:text-white">{summary?.fire_alerts?.sent ?? 0}</strong>
                  </span>
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                    En attente : <strong className="text-amber-800 dark:text-amber-300">{summary?.fire_alerts?.pending ?? 0}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 5. Modal de prévisualisation & Téléchargement direct PDF avec carte des parcelles */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 p-6 sm:p-8 shadow-2xl">
            {/* Header de la modal */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    PDF Certifié
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    SmartSahaBio • Édité le {new Date().toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                  Rapport Officiel d'Activité & Cartographie des Parcelles
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Téléchargement direct du document officiel au format PDF avec carte géoréférencée
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadDashboardPdf}
                  disabled={downloadingPdf}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-700 dark:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 dark:hover:bg-emerald-700 transition disabled:opacity-50"
                  title="Télécharger directement le fichier PDF (sans imprimer)"
                >
                  {downloadingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Génération...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Télécharger le PDF</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="cursor-pointer rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Corps du document */}
            <div className="mt-6 space-y-6 text-sm text-gray-800 dark:text-slate-200">
              {/* Informations de filtre */}
              <div className="rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 p-4 border border-emerald-100 dark:border-emerald-800 text-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-gray-500 dark:text-slate-400 block">Périmètre d'analyse :</span>
                  <strong className="text-emerald-950 dark:text-emerald-300 text-sm">
                    {selectedCooperative
                      ? cooperativesList.find((c) => String(c.uuid || c.id) === String(selectedCooperative))?.name || "Coopérative"
                      : "Toutes les coopératives"}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400 block">Période :</span>
                  <strong className="text-gray-900 dark:text-white text-sm">
                    {selectedPeriod === "30d" ? "Derniers 30 jours" : selectedPeriod === "90d" ? "Dernier trimestre" : selectedPeriod === "year" ? "Année en cours" : "Période globale"}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400 block">Filière / Culture :</span>
                  <strong className="text-gray-900 dark:text-white text-sm">
                    {selectedCrop || "Toutes cultures"}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400 block">Parcelles incluses :</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 text-sm">
                    {filteredParcels.length > 0 ? filteredParcels.length : parcelsList.length} parcelles
                  </strong>
                </div>
              </div>

              {/* 1. Synthèse générale */}
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white uppercase text-xs tracking-wider mb-2 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-[10px] text-emerald-800 dark:text-emerald-300 font-bold">1</span>
                  Synthèse générale
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="border border-gray-200 dark:border-slate-800 p-3.5 rounded-xl bg-gray-50/50 dark:bg-slate-800/60">
                    <span className="text-gray-500 dark:text-slate-400 block mb-1">Coopératives :</span>
                    <strong className="text-base text-gray-900 dark:text-white">
                      {summary?.cooperatives?.total || cooperativesList.length || 1}
                    </strong>
                    <span className="text-gray-500 dark:text-slate-400 text-[11px] block mt-0.5">
                      ({summary?.cooperatives?.active || cooperativesList.length} actives)
                    </span>
                  </div>
                  <div className="border border-gray-200 dark:border-slate-800 p-3.5 rounded-xl bg-gray-50/50 dark:bg-slate-800/60">
                    <span className="text-gray-500 dark:text-slate-400 block mb-1">Producteurs audités :</span>
                    <strong className="text-base text-gray-900 dark:text-white">
                      {summary?.farmers?.total || "—"}
                    </strong>
                    <span className="text-gray-500 dark:text-slate-400 text-[11px] block mt-0.5">
                      ({summary?.farmers?.female_percentage || 0}% femmes)
                    </span>
                  </div>
                  <div className="border border-gray-200 dark:border-slate-800 p-3.5 rounded-xl bg-gray-50/50 dark:bg-slate-800/60">
                    <span className="text-gray-500 dark:text-slate-400 block mb-1">Superficie totale :</span>
                    <strong className="text-base text-gray-900 dark:text-white">
                      {summary?.parcels?.total_area_ha || "—"} ha
                    </strong>
                    <span className="text-gray-500 dark:text-slate-400 text-[11px] block mt-0.5">
                      ({summary?.parcels?.total || filteredParcels.length || parcelsList.length} parcelles)
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Conformité biologique */}
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white uppercase text-xs tracking-wider mb-2 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-[10px] text-emerald-800 dark:text-emerald-300 font-bold">2</span>
                  Conformité biologique (Règlement UE 2018/848)
                </h3>
                <div className="border border-emerald-100 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 p-4 rounded-xl space-y-2 text-xs">
                  <p>
                    Taux de conformité global :{" "}
                    <strong className="text-emerald-700 dark:text-emerald-400 text-sm">
                      {summary?.bio_audits?.compliance_rate || 100}%
                    </strong>
                  </p>
                  <p className="text-gray-600 dark:text-slate-300">
                    Audits conformes : <strong>{summary?.bio_audits?.compliant ?? 0}</strong> | Avec réserves :{" "}
                    <strong>{summary?.bio_audits?.compliant_with_reservations ?? 0}</strong> | Non conformes :{" "}
                    <strong>{summary?.bio_audits?.non_compliant ?? 0}</strong>
                  </p>
                  <p className="text-gray-600 dark:text-slate-300">
                    Parcelles certifiées bio : <strong>{summary?.bio_audits?.certified ?? 0}</strong> | En conversion :{" "}
                    <strong>{summary?.bio_audits?.in_conversion ?? 0}</strong>
                  </p>
                </div>
              </div>

              {/* 3. Aperçu de la cartographie géoréférencée des parcelles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-white uppercase text-xs tracking-wider flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-[10px] text-emerald-800 dark:text-emerald-300 font-bold">3</span>
                    Cartographie géoréférencée des parcelles
                  </h3>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 inline-block" />
                      <span className="text-gray-600 dark:text-slate-400">Conforme Bio</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />
                      <span className="text-gray-600 dark:text-slate-400">En conversion</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-600 inline-block" />
                      <span className="text-gray-600 dark:text-slate-400">Non conforme</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 overflow-hidden relative shadow-inner">
                  {/* Carte Leaflet interactive */}
                  <div className="h-[280px] w-full">
                    <MapContainer
                      center={[-18.8792, 47.5079]}
                      zoom={7}
                      scrollWheelZoom={false}
                      className="h-full w-full z-0"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />

                      {(filteredParcels.length > 0 ? filteredParcels : parcelsList).map((p, idx) => {
                        const geom = p.geom || p.geom_geojson;
                        let parsedGeom = null;
                        if (geom) {
                          try {
                            parsedGeom = typeof geom === "string" ? JSON.parse(geom) : geom;
                          } catch (e) {
                            parsedGeom = null;
                          }
                        }

                        if (parsedGeom) {
                          return (
                            <GeoJSON
                              key={`p-geom-${p.id || p.uuid || idx}`}
                              data={parsedGeom}
                              style={{
                                color: "#059669",
                                weight: 2.5,
                                fillColor: "#10b981",
                                fillOpacity: 0.35,
                              }}
                            >
                              <Popup>
                                <div className="p-1 text-xs text-gray-900">
                                  <strong>{p.name || `Parcelle #${idx + 1}`}</strong>
                                  <p>{p.area_ha ? `${p.area_ha} ha` : ""}</p>
                                </div>
                              </Popup>
                            </GeoJSON>
                          );
                        }

                        if (p.latitude && p.longitude) {
                          const lat = parseFloat(p.latitude);
                          const lng = parseFloat(p.longitude);
                          if (!isNaN(lat) && !isNaN(lng)) {
                            return (
                              <Marker key={`p-m-${p.id || p.uuid || idx}`} position={[lat, lng]}>
                                <Popup>
                                  <div className="p-1 text-xs text-gray-900">
                                    <strong>{p.name || `Parcelle #${idx + 1}`}</strong>
                                  </div>
                                </Popup>
                              </Marker>
                            );
                          }
                        }
                        return null;
                      })}
                    </MapContainer>
                  </div>

                  <div className="bg-emerald-900/90 text-white p-2.5 px-4 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapIcon size={14} className="text-emerald-300" />
                      Cette cartographie avec les contours polygonaux sera intégrée en haute définition dans votre PDF téléchargé.
                    </span>
                    <span className="text-[11px] text-emerald-200">
                      {(filteredParcels.length > 0 ? filteredParcels : parcelsList).length} parcelles
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Détail par coopérative */}
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white uppercase text-xs tracking-wider mb-2 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-[10px] text-emerald-800 dark:text-emerald-300 font-bold">4</span>
                  Détail par coopérative
                </h3>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-slate-800 font-semibold text-gray-700 dark:text-slate-300">
                      <tr>
                        <th className="p-2.5 border-b border-gray-200 dark:border-slate-800">Coopérative</th>
                        <th className="p-2.5 border-b border-gray-200 dark:border-slate-800">Culture</th>
                        <th className="p-2.5 border-b border-gray-200 dark:border-slate-800">Membres</th>
                        <th className="p-2.5 border-b border-gray-200 dark:border-slate-800">Parcelles</th>
                        <th className="p-2.5 border-b border-gray-200 dark:border-slate-800">Surface (ha)</th>
                        <th className="p-2.5 border-b border-gray-200 dark:border-slate-800">Conformité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                      {(reportData?.cooperatives_summary || []).map((c) => (
                        <tr key={c.uuid} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50">
                          <td className="p-2.5 font-medium text-gray-900 dark:text-slate-200">{c.name}</td>
                          <td className="p-2.5 text-gray-600 dark:text-slate-400">{c.main_crop || "—"}</td>
                          <td className="p-2.5 text-gray-600 dark:text-slate-400">{c.farmers_count}</td>
                          <td className="p-2.5 text-gray-600 dark:text-slate-400">{c.parcels_count}</td>
                          <td className="p-2.5 text-gray-600 dark:text-slate-400">{c.total_area_ha} ha</td>
                          <td className="p-2.5 font-bold text-emerald-700 dark:text-emerald-400">{c.compliance_rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Pied de modal avec bouton de téléchargement direct */}
            <div className="mt-8 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-slate-400">
                Génération directe du fichier .pdf certifié sans boîte de dialogue d'impression.
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleDownloadDashboardPdf}
                  disabled={downloadingPdf}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-700 dark:bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 dark:hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {downloadingPdf ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Téléchargement en cours...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Télécharger le Rapport PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
