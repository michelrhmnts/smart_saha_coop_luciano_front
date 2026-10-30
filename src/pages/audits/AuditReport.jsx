import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Loader2,
  RefreshCw,
  Building2,
  Users,
  MapPin,
  Ruler,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Search,
  Calendar,
  FileSpreadsheet,
} from "lucide-react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import toast from "react-hot-toast";

import { getCooperatives } from "../../api/cooperatives";
import { getMyParcels } from "../../api/parcels";
import { getAllAudits } from "../../api/audits";
import { downloadAuditReportPdf, downloadParcelsReportPdf } from "../../utils/parcelsMapPdf";

// Fix icône Leaflet par défaut
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Ajuster la vue de la carte sur l'ensemble des parcelles
function FitMultiParcelBounds({ parcelsWithAudit }) {
  const map = useMap();

  useEffect(() => {
    if (!parcelsWithAudit || parcelsWithAudit.length === 0) return;

    try {
      const featureGroup = L.featureGroup();
      let hasValidGeom = false;

      parcelsWithAudit.forEach((item) => {
        const geom = item.parcel?.geom || item.parcel?.geom_geojson;
        if (geom) {
          try {
            const parsed = typeof geom === "string" ? JSON.parse(geom) : geom;
            const layer = L.geoJSON(parsed);
            featureGroup.addLayer(layer);
            hasValidGeom = true;
          } catch (e) {
            console.warn("Erreur parsing geom pour bounds:", e);
          }
        } else if (item.parcel?.latitude && item.parcel?.longitude) {
          const lat = parseFloat(item.parcel.latitude);
          const lng = parseFloat(item.parcel.longitude);
          if (!isNaN(lat) && !isNaN(lng)) {
            featureGroup.addLayer(L.marker([lat, lng]));
            hasValidGeom = true;
          }
        }
      });

      if (hasValidGeom) {
        const bounds = featureGroup.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40] });
        }
      }
    } catch (err) {
      console.warn("Impossible de centrer les bounds:", err);
    }
  }, [parcelsWithAudit, map]);

  return null;
}

const conversionLabels = {
  not_started: "Non commencé",
  in_conversion: "En conversion",
  certified: "Certifié",
};

const overallLabels = {
  compliant: "Conforme",
  non_compliant: "Non conforme",
  compliant_with_reservations: "Conforme avec réserves",
};

const severityLabels = {
  none: "Aucune",
  minor: "Mineure",
  major: "Majeure",
  critical: "Critique",
};

const formatArea = (val) => {
  if (val === null || val === undefined || val === "") return "0.00";
  const num = Number(val);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR");
  } catch {
    return dateStr;
  }
};

const getFarmerName = (parcel) => {
  if (!parcel) return "Non renseigné";
  if (parcel.farmer) {
    if (Array.isArray(parcel.farmer)) {
      return parcel.farmer[0]?.full_name || "Non renseigné";
    }
    return parcel.farmer.full_name || "Non renseigné";
  }
  return parcel.farmer_name || "Non renseigné";
};

export default function AuditReport() {
  const navigate = useNavigate();

  const [cooperatives, setCooperatives] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [audits, setAudits] = useState([]);

  const [selectedCooperativeId, setSelectedCooperativeId] = useState("all");
  const [tableSearch, setTableSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [coopsRes, parcelsRes, auditsRes] = await Promise.allSettled([
        getCooperatives(),
        getMyParcels(),
        getAllAudits(),
      ]);

      if (coopsRes.status === "fulfilled") {
        const res = coopsRes.value;
        const list = Array.isArray(res) ? res : res?.data || [];
        setCooperatives(list);
      }

      let parcelsList = [];
      if (parcelsRes.status === "fulfilled" && parcelsRes.value?.success) {
        parcelsList = parcelsRes.value.data || [];
        setParcels(parcelsList);
      }

      if (auditsRes.status === "fulfilled" && auditsRes.value?.data?.success) {
        setAudits(auditsRes.value.data.data || []);
      }
    } catch (err) {
      console.error("Erreur chargement données rapport d'audit :", err);
      setError("Une erreur est survenue lors du chargement des données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map des parcelles par UUID
  const parcelsMap = useMemo(() => {
    const map = {};
    parcels.forEach((p) => {
      if (p.uuid) map[p.uuid] = p;
    });
    return map;
  }, [parcels]);

  // Filtrer les audits selon la coopérative sélectionnée
  const filteredAudits = useMemo(() => {
    return audits.filter((audit) => {
      if (selectedCooperativeId === "all") return true;
      const parcel = parcelsMap[audit.parcel_id] || audit.parcel;
      const coopId = parcel?.cooperative_id || parcel?.cooperative?.uuid;
      return String(coopId) === String(selectedCooperativeId);
    });
  }, [audits, parcelsMap, selectedCooperativeId]);

  // Toutes les parcelles de la coopérative sélectionnée (pour statistiques globales)
  const coopsParcels = useMemo(() => {
    return parcels.filter((p) => {
      if (selectedCooperativeId === "all") return true;
      const coopId = p.cooperative_id || p.cooperative?.uuid;
      return String(coopId) === String(selectedCooperativeId);
    });
  }, [parcels, selectedCooperativeId]);

  // Liste des parcelles qui ONT DÉJÀ UN AUDIT
  const auditedParcelsList = useMemo(() => {
    return filteredAudits.map((audit) => {
      const parcel = parcelsMap[audit.parcel_id] || audit.parcel || {};
      return {
        audit,
        parcel,
        farmerName: getFarmerName(parcel),
      };
    });
  }, [filteredAudits, parcelsMap]);

  // KPIs
  const kpis = useMemo(() => {
    // 1. Nombre de producteurs uniques des parcelles auditées
    const farmersSet = new Set();
    auditedParcelsList.forEach((item) => {
      const fName = item.farmerName;
      if (fName && fName !== "Non renseigné") {
        farmersSet.add(fName);
      } else if (item.parcel?.farmer_id) {
        farmersSet.add(item.parcel.farmer_id);
      }
    });

    // 2. Nombre de parcelles auditées
    const auditedParcelsCount = auditedParcelsList.length;
    const totalParcelsCount = coopsParcels.length;

    // 3. Superficie totale auditée en hectares
    const totalAreaHa = auditedParcelsList.reduce((sum, item) => {
      const area = Number(item.parcel?.area_ha);
      return sum + (isNaN(area) ? 0 : area);
    }, 0);

    // 4. Nombre de non-conformités
    let nonConformitiesCount = 0;
    let minorCount = 0;
    let majorCount = 0;
    let criticalCount = 0;

    filteredAudits.forEach((audit) => {
      const hasSev =
        audit.non_conformity_severity &&
        audit.non_conformity_severity !== "none";
      const hasText =
        audit.non_conformities && audit.non_conformities.trim().length > 0;
      if (hasSev || hasText) {
        nonConformitiesCount++;
        if (audit.non_conformity_severity === "minor") minorCount++;
        else if (audit.non_conformity_severity === "major") majorCount++;
        else if (audit.non_conformity_severity === "critical") criticalCount++;
      }
    });

    return {
      farmersCount: farmersSet.size,
      auditedParcelsCount,
      totalParcelsCount,
      totalAreaHa,
      nonConformitiesCount,
      minorCount,
      majorCount,
      criticalCount,
    };
  }, [auditedParcelsList, coopsParcels, filteredAudits]);

  // Liste filtrée par recherche textuelle pour le tableau des parcelles
  const searchFilteredParcels = useMemo(() => {
    if (!tableSearch.trim()) return auditedParcelsList;
    const q = tableSearch.toLowerCase().trim();
    return auditedParcelsList.filter((item) => {
      const pName = (item.parcel?.name || "").toLowerCase();
      const fName = (item.farmerName || "").toLowerCase();
      const audName = (item.audit?.auditor_name || "").toLowerCase();
      const res = (overallLabels[item.audit?.overall_status] || "").toLowerCase();
      return (
        pName.includes(q) ||
        fName.includes(q) ||
        audName.includes(q) ||
        res.includes(q)
      );
    });
  }, [auditedParcelsList, tableSearch]);

  // Liste dédiée des non-conformités
  const nonConformitiesList = useMemo(() => {
    return auditedParcelsList.filter((item) => {
      const hasSev =
        item.audit?.non_conformity_severity &&
        item.audit?.non_conformity_severity !== "none";
      const hasText =
        item.audit?.non_conformities &&
        item.audit?.non_conformities.trim().length > 0;
      return hasSev || hasText;
    });
  }, [auditedParcelsList]);

  // Style de polygone selon le résultat
  const getParcelStyle = (overallStatus) => {
    switch (overallStatus) {
      case "compliant":
        return {
          color: "#059669",
          weight: 2,
          fillColor: "#10b981",
          fillOpacity: 0.45,
        };
      case "compliant_with_reservations":
        return {
          color: "#d97706",
          weight: 2,
          fillColor: "#f59e0b",
          fillOpacity: 0.45,
        };
      case "non_compliant":
        return {
          color: "#dc2626",
          weight: 2,
          fillColor: "#ef4444",
          fillOpacity: 0.45,
        };
      default:
        return {
          color: "#4b5563",
          weight: 2,
          fillColor: "#9ca3af",
          fillOpacity: 0.35,
        };
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      toast.loading("Génération du rapport PDF avec cartographie des parcelles...", { id: "pdf-gen" });

      const coop = cooperatives.find((c) => String(c.uuid || c.id) === String(selectedCooperativeId));
      const coopName = selectedCooperativeId === "all" ? "Toutes les coopératives" : (coop?.name || "Coopérative");

      const compliantCount = auditedParcelsList.filter(
        (item) => (item.audit?.overall_status || "compliant") === "compliant"
      ).length;
      const complianceRate = auditedParcelsList.length > 0
        ? Math.round((compliantCount / auditedParcelsList.length) * 100)
        : 100;

      const parcelsToExport = tableSearch?.trim() ? searchFilteredParcels : auditedParcelsList;

      await downloadAuditReportPdf({
        cooperativeName: coopName,
        generationDate: new Date(),
        kpis: {
          farmersCount: kpis.farmersCount,
          auditedParcelsCount: kpis.auditedParcelsCount,
          totalParcelsCount: kpis.totalParcelsCount,
          totalAreaHa: kpis.totalAreaHa,
          nonConformitiesCount: kpis.nonConformitiesCount,
          minorCount: kpis.minorCount,
          majorCount: kpis.majorCount,
          criticalCount: kpis.criticalCount,
        },
        auditedParcelsList: parcelsToExport,
        nonConformitiesList: nonConformitiesList,
        fileName: `Rapport_Audit_Biologique_${coopName.replace(/[^a-zA-Z0-9_-]/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`,
      });

      toast.success("Rapport PDF officiel téléchargé avec succès !", { id: "pdf-gen" });
    } catch (err) {
      console.error("Erreur téléchargement PDF :", err);
      toast.error("Échec de la génération du PDF", { id: "pdf-gen" });
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 print:p-0 print:bg-white space-y-6">
      {/* ====================================================
          EN-TÊTE DU RAPPORT
      ==================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-slate-800 pb-5 print:border-b-2 print:border-gray-800">
        <div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition mb-2 print:hidden cursor-pointer"
          >
            <ArrowLeft size={16} />
            Retour au tableau de bord
          </button>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>Rapport d'Audit Biologique</span>
          </h1>

          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Indicateurs de conformité, cartographie des parcelles contrôlées et suivi des non-conformités
          </p>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold text-gray-700 dark:text-slate-200 shadow-xs hover:bg-gray-50 dark:hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || loading}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
            title="Télécharger directement le rapport en PDF avec la carte des parcelles"
          >
            {downloadingPdf ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Génération du PDF...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Télécharger PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ====================================================
          BARRE DE FILTRE : COOPÉRATIVE DU GESTIONNAIRE
      ==================================================== */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:border-gray-300">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-slate-200">
            <Building2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>Coopérative :</span>
          </div>

          <select
            value={selectedCooperativeId}
            onChange={(e) => setSelectedCooperativeId(e.target.value)}
            className="rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-white px-3.5 py-2 text-sm font-medium outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer min-w-[240px]"
          >
            <option value="all">Toutes mes coopératives</option>
            {cooperatives.map((c) => (
              <option key={c.uuid || c.id} value={c.uuid || c.id}>
                {c.name || `Coopérative #${c.id}`}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">
          Rapport généré le{" "}
          <span className="font-semibold text-gray-700 dark:text-slate-300">
            {new Date().toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* ====================================================
          PARTIE 1 : KPIS ET CARTE INTERACTIVE
      ==================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            1. Indicateurs clés de performance & Cartographie
          </h2>
        </div>

        {/* 4 Blocs KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1 : Producteurs */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                Producteurs audités
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                <Users size={20} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                {kpis.farmersCount}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Producteurs ayant au moins une parcelle auditée
              </p>
            </div>
          </div>

          {/* KPI 2 : Parcelles auditées */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                Parcelles auditées
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                <MapPin size={20} />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-gray-900 dark:text-white">
                  {kpis.auditedParcelsCount}
                </p>
                <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                  / {kpis.totalParcelsCount} total
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                {kpis.totalParcelsCount > 0
                  ? `${Math.round(
                      (kpis.auditedParcelsCount / kpis.totalParcelsCount) * 100
                    )}% des parcelles contrôlées`
                  : "Aucune parcelle"}
              </p>
            </div>
          </div>

          {/* KPI 3 : Nombre d'hectares */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                Superficie auditée
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                <Ruler size={20} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                {kpis.totalAreaHa.toFixed(2)} <span className="text-base font-medium">ha</span>
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Surface totale sous contrôle bio
              </p>
            </div>
          </div>

          {/* KPI 4 : Non-conformités */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                Non-conformités
              </span>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  kpis.nonConformitiesCount > 0
                    ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400"
                    : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                }`}
              >
                <AlertTriangle size={20} />
              </div>
            </div>
            <div className="mt-3">
              <p
                className={`text-2xl font-black ${
                  kpis.nonConformitiesCount > 0
                    ? "text-red-700 dark:text-red-400"
                    : "text-emerald-700 dark:text-emerald-400"
                }`}
              >
                {kpis.nonConformitiesCount}
              </p>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                <span className="text-yellow-600 dark:text-amber-400 font-medium">
                  {kpis.minorCount} min
                </span>
                <span>•</span>
                <span className="text-orange-600 dark:text-orange-400 font-medium">
                  {kpis.majorCount} maj
                </span>
                <span>•</span>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  {kpis.criticalCount} crit
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Carte interactive des parcelles auditées */}
        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-gray-50/70 dark:bg-slate-800/60">
            <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-white text-sm">
              <MapPin className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Cartographie des parcelles auditées</span>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2 py-0.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                {auditedParcelsList.length}
              </span>
            </div>

            {/* Légende de la carte */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-600 inline-block" />
                <span className="text-gray-600 dark:text-slate-300 font-medium">Conforme</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />
                <span className="text-gray-600 dark:text-slate-300 font-medium">Avec réserves</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-600 inline-block" />
                <span className="text-gray-600 dark:text-slate-300 font-medium">Non conforme</span>
              </div>
            </div>
          </div>

          <div className="h-[420px] w-full relative">
            <MapContainer
              center={[-18.8792, 47.5079]}
              zoom={7}
              scrollWheelZoom={true}
              className="h-full w-full z-10"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {auditedParcelsList.map((item) => {
                const geom = item.parcel?.geom || item.parcel?.geom_geojson;
                const status = item.audit?.overall_status || "compliant";
                const style = getParcelStyle(status);

                let parsedGeom = null;
                if (geom) {
                  try {
                    parsedGeom =
                      typeof geom === "string" ? JSON.parse(geom) : geom;
                  } catch (e) {
                    parsedGeom = null;
                  }
                }

                if (parsedGeom) {
                  return (
                    <GeoJSON
                      key={`geom-${item.audit.uuid}`}
                      data={parsedGeom}
                      style={style}
                    >
                      <Popup>
                        <div className="p-1 space-y-1.5 text-xs min-w-[180px]">
                          <p className="font-bold text-gray-900 text-sm">
                            {item.parcel?.name || "Parcelle"}
                          </p>
                          <p className="text-gray-600">
                            <strong>Producteur :</strong> {item.farmerName}
                          </p>
                          <p className="text-gray-600">
                            <strong>Superficie :</strong>{" "}
                            {formatArea(item.parcel?.area_ha)} ha
                          </p>
                          <p className="text-gray-600">
                            <strong>Auditeur :</strong>{" "}
                            {item.audit?.auditor_name || "-"}
                          </p>
                          <p className="text-gray-600">
                            <strong>Date :</strong>{" "}
                            {formatDate(item.audit?.audit_date)}
                          </p>
                          <p className="text-gray-600">
                            <strong>Statut bio :</strong>{" "}
                            {conversionLabels[item.audit?.conversion_status] ||
                              "-"}
                          </p>
                          <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                status === "compliant"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : status === "non_compliant"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {overallLabels[status] || status}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/audits/${item.audit.uuid}`)
                              }
                              className="text-emerald-700 hover:underline font-bold text-[11px]"
                            >
                              Voir audit &rarr;
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </GeoJSON>
                  );
                }

                if (item.parcel?.latitude && item.parcel?.longitude) {
                  const lat = parseFloat(item.parcel.latitude);
                  const lng = parseFloat(item.parcel.longitude);
                  if (!isNaN(lat) && !isNaN(lng)) {
                    return (
                      <Marker
                        key={`marker-${item.audit.uuid}`}
                        position={[lat, lng]}
                      >
                        <Popup>
                          <div className="p-1 space-y-1 text-xs">
                            <p className="font-bold text-gray-900 text-sm">
                              {item.parcel?.name || "Parcelle"}
                            </p>
                            <p className="text-gray-600">
                              <strong>Producteur :</strong> {item.farmerName}
                            </p>
                            <p className="text-gray-600">
                              <strong>Résultat :</strong>{" "}
                              {overallLabels[status] || status}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/audits/${item.audit.uuid}`)
                              }
                              className="text-emerald-700 hover:underline font-bold text-[11px] mt-1"
                            >
                              Consulter audit &rarr;
                            </button>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  }
                }

                return null;
              })}

              <FitMultiParcelBounds parcelsWithAudit={auditedParcelsList} />
            </MapContainer>
          </div>
        </div>
      </section>

      {/* ====================================================
          PARTIE 2 : TABLEAU DES PARCELLES AUDITÉES
      ==================================================== */}
      <section className="space-y-4 print:pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>2. Liste des parcelles auditées</span>
              <span className="rounded-full bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:text-slate-300">
                {searchFilteredParcels.length}
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Toutes les parcelles disposant d'un audit de conformité biologique
            </p>
          </div>

          <div className="relative w-full sm:w-72 print:hidden">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
            />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Rechercher parcelle, producteur..."
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white dark:placeholder:text-slate-500 py-2 pl-9 pr-4 text-xs outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 text-left text-xs">
              <thead className="bg-gray-50/80 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Parcelle</th>
                  <th className="px-5 py-3.5">Producteur</th>
                  <th className="px-5 py-3.5">Date Audit</th>
                  <th className="px-5 py-3.5">Auditeur</th>
                  <th className="px-5 py-3.5">Conversion</th>
                  <th className="px-5 py-3.5">Résultat</th>
                  <th className="px-5 py-3.5 text-right print:hidden">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300">
                {searchFilteredParcels.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-8 text-center text-gray-500 dark:text-slate-400">
                      Aucune parcelle auditée trouvée.
                    </td>
                  </tr>
                ) : (
                  searchFilteredParcels.map((item) => {
                    const status = item.audit.overall_status;
                    const conv = item.audit.conversion_status;

                    return (
                      <tr
                        key={item.audit.uuid}
                        className="hover:bg-gray-50/70 dark:hover:bg-slate-800/60 transition"
                      >
                        <td className="px-5 py-3.5 font-semibold text-gray-900 dark:text-white">
                          <div>{item.parcel?.name || "Parcelle sans nom"}</div>
                          <div className="text-[11px] text-gray-400 dark:text-slate-500 font-normal">
                            {formatArea(item.parcel?.area_ha)} ha
                          </div>
                        </td>

                        <td className="px-5 py-3.5 font-medium text-gray-800 dark:text-slate-200">
                          {item.farmerName}
                        </td>

                        <td className="px-5 py-3.5 text-gray-600 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(item.audit.audit_date)}
                        </td>

                        <td className="px-5 py-3.5 text-gray-600 dark:text-slate-400">
                          {item.audit.auditor_name || "-"}
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              conv === "certified"
                                ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300"
                                : conv === "in_conversion"
                                ? "bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300"
                                : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300"
                            }`}
                          >
                            {conversionLabels[conv] || conv}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              status === "compliant"
                                ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300"
                                : status === "non_compliant"
                                ? "bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300"
                                : "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300"
                            }`}
                          >
                            {status === "compliant" && (
                              <CheckCircle2 size={13} />
                            )}
                            {status === "compliant_with_reservations" && (
                              <Clock size={13} />
                            )}
                            {status === "non_compliant" && (
                              <XCircle size={13} />
                            )}
                            {overallLabels[status] || status}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right print:hidden">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/audits/${item.audit.uuid}`)
                            }
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-400 transition cursor-pointer font-medium"
                            title="Consulter l'audit"
                          >
                            <Eye size={15} />
                            <span>Détails</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ====================================================
          PARTIE 3 : LISTE DES NON-CONFORMITÉS
      ==================================================== */}
      <section className="space-y-4 print:pt-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>3. Registre des non-conformités et plans d'actions</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                nonConformitiesList.length > 0
                  ? "bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300"
                  : "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300"
              }`}
            >
              {nonConformitiesList.length}
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            Suivi des écarts constatés, niveau de gravité et échéances correctives
          </p>
        </div>

        {nonConformitiesList.length === 0 ? (
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/30 p-6 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-2" />
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
              Aucune non-conformité relevée
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 max-w-md mx-auto">
              Toutes les parcelles auditées pour cette coopérative respectent
              pleinement les exigences du cahier des charges biologique.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 text-left text-xs">
                <thead className="bg-gray-50/80 dark:bg-slate-800/80 text-gray-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Parcelle & Producteur</th>
                    <th className="px-5 py-3.5">Date & Auditeur</th>
                    <th className="px-5 py-3.5">Sévérité</th>
                    <th className="px-5 py-3.5">Non-conformité constatée</th>
                    <th className="px-5 py-3.5">Plan d'action corrective</th>
                    <th className="px-5 py-3.5">Échéance</th>
                    <th className="px-5 py-3.5 text-right print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300">
                  {nonConformitiesList.map((item) => {
                    const sev = item.audit.non_conformity_severity || "minor";
                    const isOverdue =
                      item.audit.corrective_action_deadline &&
                      new Date(item.audit.corrective_action_deadline) < new Date();

                    return (
                      <tr
                        key={`nc-${item.audit.uuid}`}
                        className="hover:bg-gray-50/70 dark:hover:bg-slate-800/60 transition align-top"
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-gray-900 dark:text-white">
                            {item.parcel?.name || "Parcelle"}
                          </div>
                          <div className="text-[11px] text-gray-500 dark:text-slate-400">
                            {item.farmerName}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="text-gray-900 dark:text-white font-medium">
                            {formatDate(item.audit.audit_date)}
                          </div>
                          <div className="text-[11px] text-gray-400 dark:text-slate-500">
                            {item.audit.auditor_name || "-"}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              sev === "critical"
                                ? "bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300"
                                : sev === "major"
                                ? "bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300"
                                : "bg-yellow-100 dark:bg-amber-950/70 text-yellow-800 dark:text-amber-300"
                            }`}
                          >
                            {severityLabels[sev] || sev}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 max-w-xs">
                          {item.audit.non_conformities ? (
                            <div
                              className="text-gray-800 dark:text-slate-200 line-clamp-3 [&_ul]:list-disc [&_ul]:pl-4"
                              dangerouslySetInnerHTML={{
                                __html: item.audit.non_conformities,
                              }}
                            />
                          ) : (
                            <span className="text-gray-400 dark:text-slate-500 italic">
                              Non précisée
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 max-w-xs">
                          {item.audit.corrective_action_plan ? (
                            <div
                              className="text-gray-800 dark:text-slate-200 line-clamp-3 [&_ul]:list-disc [&_ul]:pl-4"
                              dangerouslySetInnerHTML={{
                                __html: item.audit.corrective_action_plan,
                              }}
                            />
                          ) : (
                            <span className="text-gray-400 dark:text-slate-500 italic">
                              Aucun plan renseigné
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {item.audit.corrective_action_deadline ? (
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${
                                isOverdue ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-slate-300"
                              }`}
                            >
                              <Calendar size={13} />
                              {formatDate(item.audit.corrective_action_deadline)}
                              {isOverdue && (
                                <span className="text-[10px] text-red-500 dark:text-red-400 font-normal">
                                  (Échue)
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-slate-500">-</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-right print:hidden whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/audits/${item.audit.uuid}`)
                            }
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-400 transition cursor-pointer font-medium"
                          >
                            <Eye size={15} />
                            <span>Voir</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
