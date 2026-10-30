import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Settings,
  Shield,
  Flame,
  Smartphone,
  Save,
  RefreshCw,
  Building2,
  Users,
  MapPin,
  ClipboardCheck,
  Crown,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Database,
  Radio,
} from "lucide-react";
import {
  getAdminSettings,
  updateAdminSettings,
  getAdminStats,
} from "../../services/adminService";

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    platform_name: "SmartSahaBio",
    bio_standard: "Règlementation UE 2018/848",
    fire_alert_radius_km: 5,
    audit_validity_months: 12,
    nasa_firm_source: "VIIRS_NOAA21_NRT",
    auto_notify_fire: true,
    require_parcel_gps: true,
    allow_offline_mobile: true,
    maintenance_mode: false,
  });

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, statsRes] = await Promise.all([
        getAdminSettings(),
        getAdminStats(),
      ]);

      if (settingsRes.success) {
        setSettings(settingsRes.data);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error("Erreur chargement paramètres :", err);
      toast.error("Impossible de charger les paramètres.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await updateAdminSettings(settings);
      if (res.success) {
        toast.success("Paramètres enregistrés avec succès !");
        setSettings(res.data);
      }
    } catch (err) {
      console.error("Erreur sauvegarde :", err);
      toast.error("Erreur lors de l'enregistrement des paramètres.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. En-tête de la page                                    */}
      {/* ======================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800">
              <Crown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              Espace Administrateur
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight sm:text-3xl">
            Paramètres système & Normes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configurez les règles de conformité biologique, les alertes satellitaires et le comportement global de l'application.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600 dark:text-emerald-400" : ""}`} />
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-5 py-2.5 text-sm font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Enregistrement..." : "Enregistrer les modifications"}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. Vue d'ensemble globale de la plateforme               */}
      {/* ======================================================== */}
      {stats && (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-[#0a1e1d] to-[#041a1c] p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">État global de la plateforme</h2>
                <p className="text-xs text-teal-200/70">Données agrégées sur l'ensemble des coopératives</p>
              </div>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
              Système Actif
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-white/10">
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
              <span className="text-xs text-teal-200/80 font-medium block">Coopératives</span>
              <span className="text-3xl font-black text-white mt-1 block">{stats.cooperatives}</span>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
              <span className="text-xs text-teal-200/80 font-medium block">Agriculteurs</span>
              <span className="text-3xl font-black text-white mt-1 block">{stats.farmers}</span>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
              <span className="text-xs text-teal-200/80 font-medium block">Parcelles tracées</span>
              <span className="text-3xl font-black text-white mt-1 block">{stats.parcels}</span>
            </div>
            <div className="rounded-2xl bg-white/5 p-4 border border-white/10">
              <span className="text-xs text-teal-200/80 font-medium block">Audits Bio réalisés</span>
              <span className="text-3xl font-black text-white mt-1 block">{stats.audits}</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. Formulaire de Configuration                           */}
      {/* ======================================================== */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1 : Conformité & Certification Bio */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Standard Biologique & Réglementation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Norme appliquée pour les audits de conformité</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Référentiel de certification
            </label>
            <select
              name="bio_standard"
              value={settings.bio_standard}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/15"
            >
              <option value="Règlementation UE 2018/848">Règlementation UE 2018/848 (Export Europe)</option>
              <option value="USDA National Organic Program (NOP)">USDA National Organic Program (NOP)</option>
              <option value="Standard National Malgache (ABM)">Standard National Malgache (ABM)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Validité maximale d'un audit de conformité (mois)
            </label>
            <input
              type="number"
              min="1"
              max="36"
              name="audit_validity_months"
              value={settings.audit_validity_months}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/15"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Les parcelles dont l'audit dépasse cette durée seront signalées à renouveler.
            </p>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="require_parcel_gps"
                checked={settings.require_parcel_gps}
                onChange={handleChange}
                className="h-4 w-4 rounded text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600"
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Tracé GPS / Polygone PostGIS obligatoire pour certifier une parcelle
              </span>
            </label>
          </div>
        </div>

        {/* Section 2 : Détection des Feux Satellitaires */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Veille Satellitaire Incendies (NASA)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Paramétrage des alertes feux en temps réel</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Source satellitaire NASA FIRMS
            </label>
            <select
              name="nasa_firm_source"
              value={settings.nasa_firm_source}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/15"
            >
              <option value="VIIRS_NOAA21_NRT">VIIRS NOAA-21 NRT (Résolution 375m - Recommandé)</option>
              <option value="MODIS_NRT">MODIS NRT (Résolution 1km)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Rayon d'alerte de proximité (km)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              name="fire_alert_radius_km"
              value={settings.fire_alert_radius_km}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/15"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Déclenche une alerte si un foyer actif est détecté à moins de cette distance d'une parcelle.
            </p>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="auto_notify_fire"
                checked={settings.auto_notify_fire}
                onChange={handleChange}
                className="h-4 w-4 rounded text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600"
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Génération automatique des notifications d'urgence en cas d'incendie détecté
              </span>
            </label>
          </div>
        </div>

        {/* Section 3 : Application Mobile (Agents & Auditeurs) */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Application Mobile Terrain</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Collecte et synchronisation hors-ligne</p>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="allow_offline_mobile"
                checked={settings.allow_offline_mobile}
                onChange={handleChange}
                className="h-4 w-4 rounded text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 dark:bg-slate-700 dark:border-slate-600"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Autoriser la collecte en mode hors-ligne
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Permet aux agents d'enregistrer enquêtes et coordonnées GPS en zone blanche puis synchroniser au retour.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 4 : Maintenance & Sécurité Plateforme */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="h-9 w-9 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-400 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Maintenance & Statut Plateforme</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Contrôle de l'accès général</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nom de la plateforme
            </label>
            <input
              type="text"
              name="platform_name"
              value={settings.platform_name}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white px-3.5 py-2.5 text-sm outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/15"
            />
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="maintenance_mode"
                checked={settings.maintenance_mode}
                onChange={handleChange}
                className="h-4 w-4 rounded text-red-600 dark:text-rose-500 focus:ring-red-500 dark:bg-slate-700 dark:border-slate-600"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Mode maintenance (accès réservé aux administrateurs)
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                  Affiche une page de maintenance pour les gestionnaires et bloque les synchronisations.
                </span>
              </div>
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
