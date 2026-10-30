import { useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import fireService from "../../services/fireService";
import fireAlertService from "../../services/fireAlertService";
import FireMap from "./FireMap";
import toast from "react-hot-toast";

const FireMonitoring = () => {
  // Paramètres de surveillance (1km, 2km, 5km, 10km uniquement)
  const [radiusKm, setRadiusKm] = useState(5);
  const [period, setPeriod] = useState("24h"); // "24h" | "48h" | "7d"

  // Données et état de chargement
  const [fires, setFires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);

  // Rafraîchissement automatique paramétrable (délai en secondes)
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(300); // 5 min par défaut
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(300);

  // Navigation et focus carte
  const [focusedTarget, setFocusedTarget] = useState(null);
  const [searchParcel, setSearchParcel] = useState("");
  const [riskFilter, setRiskFilter] = useState("all"); // "all" | "critical" | "high" | "watch"

  // Modal d'alerte (mapi.mg)
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedFireForAlert, setSelectedFireForAlert] = useState(null);
  const [alertChannel, setAlertChannel] = useState("sms"); // "sms" | "notification" | "both"
  const [alertRecipient, setAlertRecipient] = useState("");
  const [alertRecipientType, setAlertRecipientType] = useState("farmers"); // "farmers" | "individual_farmer" | "coop_manager" | "custom"
  const [alertMessage, setAlertMessage] = useState("");
  const [sendingAlerts, setSendingAlerts] = useState(false);
  const [alertSuccessMessage, setAlertSuccessMessage] = useState(null);

  const countdownTimerRef = useRef(null);

  // Chargement des données de feux
  const loadFires = async (showLoading = true, forceRefresh = false) => {
    try {
      if (showLoading) setLoading(true);
      if (forceRefresh) setIsSyncing(true);
      setError(null);

      const result = await fireService.getNearbyFires(radiusKm, period, forceRefresh);
      setFires(result.data || []);
      setLastUpdated(new Date());
      if (result.last_sync_at) {
        setLastSyncAt(new Date(result.last_sync_at));
      }
      setSecondsUntilRefresh(refreshIntervalSec);
      if (forceRefresh) {
        toast.success("Synchronisation NASA FIRMS terminée avec succès !");
      }
    } catch (err) {
      console.error(
        "❌ Erreur récupération feux :",
        err.response?.data || err.message
      );
      setError(
        err.response?.data?.error ||
        "Impossible de récupérer les détections de feux NASA FIRMS."
      );
      setFires([]);
      if (forceRefresh) {
        toast.error("Erreur lors de la synchronisation NASA FIRMS.");
      }
    } finally {
      if (showLoading) setLoading(false);
      if (forceRefresh) setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadFires(true);
  }, [radiusKm, period]);

  // Compte à rebours et rafraîchissement automatique
  useEffect(() => {
    if (refreshIntervalSec <= 0) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      return;
    }

    setSecondsUntilRefresh(refreshIntervalSec);

    countdownTimerRef.current = setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          loadFires(false);
          return refreshIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [refreshIntervalSec, radiusKm, period]);

  // Statistiques dérivées
  const affectedParcelIds = useMemo(() => {
    const ids = new Set();
    fires.forEach((f) => {
      if (f.parcel_id) ids.add(f.parcel_id);
      if (Array.isArray(f.affected_parcels)) {
        f.affected_parcels.forEach((ap) => {
          if (ap.parcel_id) ids.add(ap.parcel_id);
        });
      }
    });
    return Array.from(ids);
  }, [fires]);

  const minDistance = useMemo(() => {
    if (fires.length === 0) return null;
    const distances = fires
      .map((f) => Number(f.distance_m))
      .filter((d) => !isNaN(d) && d >= 0);
    return distances.length > 0 ? Math.min(...distances) : null;
  }, [fires]);

  const maxFrp = useMemo(() => {
    if (fires.length === 0) return 0;
    const frps = fires
      .map((f) => Number(f.frp ?? f.fire_frp ?? 0))
      .filter((v) => !isNaN(v));
    return frps.length > 0 ? Math.max(...frps) : 0;
  }, [fires]);

  // Filtrage du tableau
  const filteredFires = useMemo(() => {
    return fires.filter((f) => {
      const dist = Number(f.distance_m || 999999);
      if (riskFilter === "critical" && dist > 1000) return false;
      if (riskFilter === "high" && (dist <= 1000 || dist > 3000)) return false;
      if (riskFilter === "watch" && dist <= 3000) return false;

      if (!searchParcel.trim()) return true;
      const term = searchParcel.toLowerCase().trim();
      const inMain = f.parcel_id && f.parcel_id.toLowerCase().includes(term);
      const inAffected =
        Array.isArray(f.affected_parcels) &&
        f.affected_parcels.some(
          (ap) =>
            (ap.parcel_id && ap.parcel_id.toLowerCase().includes(term)) ||
            (ap.parcel_name && ap.parcel_name.toLowerCase().includes(term))
        );
      return inMain || inAffected;
    });
  }, [fires, searchParcel, riskFilter]);

  // Préparation de l'alerte SMS (individuelle ou groupée)
  const handleOpenAlertModal = (singleFire = null) => {
    setSelectedFireForAlert(singleFire);
    setAlertChannel("sms");

    if (singleFire) {
      setAlertRecipientType("individual_farmer");
      setAlertRecipient(singleFire.farmer_phone || "");
      const dist = Math.round(singleFire.distance_m || 0);
      const parcelName = singleFire.parcel_name || singleFire.parcel_id || "votre parcelle";
      const farmerName = singleFire.farmer_name || "";
      const defaultMsg = `ALERTE FEU SMARTSAHA: ${farmerName ? `${farmerName}, ` : ""}foyer actif a ${dist}m de votre parcelle [${parcelName}]. Verifiez d'urgence vos coupe-feux.`;
      setAlertMessage(defaultMsg.slice(0, 160));
    } else {
      setAlertRecipientType("farmers");
      setAlertRecipient("");
      const defaultMsg = `ALERTE FEU SMARTSAHA: Foyer actif detecte a proximite de vos parcelles (zone ${radiusKm}km). Verifiez d'urgence vos coupe-feux et vos terres.`;
      setAlertMessage(defaultMsg.slice(0, 160));
    }
    setShowAlertModal(true);
  };

  const handleConfirmSendAlerts = async (e) => {
    e.preventDefault();
    try {
      setSendingAlerts(true);
      setAlertSuccessMessage(null);

      // 1. Enregistre / génère les alertes dans la base Supabase
      await fireAlertService.generateFireAlerts(radiusKm, period);

      // 2. Détermination du destinataire
      let targetRecipient = null;
      if (selectedFireForAlert) {
        targetRecipient = alertRecipient || selectedFireForAlert.farmer_phone;
        if (!targetRecipient && alertChannel === "sms") {
          toast.error("Veuillez renseigner le numéro de téléphone de l'agriculteur.");
          setSendingAlerts(false);
          return;
        }
      } else if (alertRecipientType === "custom") {
        targetRecipient = alertRecipient;
      }

      // 3. Diffuse les alertes par SMS (mapi.mg)
      const res = await fireAlertService.sendAllFireAlerts(
        targetRecipient,
        alertChannel,
        alertMessage
      );

      const successNotice =
        res?.message ||
        `Alertes diffusées avec succès via ${
          alertChannel === "sms"
            ? "SMS (mapi.mg)"
            : alertChannel === "both"
            ? "SMS & Système"
            : "Notification Système"
        } !`;

      toast.success(successNotice);
      setAlertSuccessMessage(successNotice);
      setShowAlertModal(false);
      setSelectedFireForAlert(null);
      setTimeout(() => setAlertSuccessMessage(null), 8000);
    } catch (err) {
      console.error("❌ Erreur déclenchement alertes :", err);
      toast.error(err?.response?.data?.error || err.message || "Erreur lors de la diffusion des alertes.");
    } finally {
      setSendingAlerts(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (fires.length === 0) return;

    const headers = [
      "ID Parcelle la plus proche",
      "Distance (m)",
      "Puissance FRP (MW)",
      "Confiance",
      "Satellite",
      "Instrument",
      "Date d'acquisition",
      "Heure d'acquisition",
      "Latitude",
      "Longitude",
      "Nombre de parcelles impactées",
    ];

    const rows = fires.map((f) => [
      f.parcel_id || "",
      f.distance_m || "",
      f.frp ?? f.fire_frp ?? "",
      f.confidence ?? f.fire_confidence ?? "",
      f.satellite || "",
      f.instrument || "",
      f.acq_date || "",
      f.acq_time || "",
      f.latitude ?? f.fire_latitude ?? "",
      f.longitude ?? f.fire_longitude ?? "",
      f.affected_parcels ? f.affected_parcels.length : 1,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `suivi_feux_smartsaha_${period}_${radiusKm}km.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 p-6">
      {/* ========================================================
          EN-TÊTE DE LA PAGE
      ======================================================== */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
              Surveillance satellite active
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            Surveillance interactive des feux
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Détection quasi temps réel via NASA FIRMS (VIIRS NOAA-21) et calcul automatique
            de proximité avec les parcelles de la coopérative.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/fire-alerts"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-200 shadow-sm transition hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <span>Journal des alertes</span>
          </Link>

          <button
            type="button"
            onClick={() => loadFires(true, true)}
            disabled={loading || isSyncing}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-50"
            title="Interroge NASA FIRMS et met à jour instantanément la base PostGIS"
          >
            <span className={loading || isSyncing ? "animate-spin" : ""}>🔄</span>
            <span>{isSyncing ? "Synchronisation NASA..." : "Actualiser (NASA FIRMS)"}</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          BARRE DES PARAMÈTRES (ZONE TAMPON, HISTORIQUE, REFRESH)
      ======================================================== */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6">
            {/* Zone tampon paramétrable : 1km, 2km, 5km, 10km uniquement */}
            <div>
              <label
                htmlFor="radius-select"
                className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400"
              >
                Zone tampon de proximité
              </label>
              <select
                id="radius-select"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold text-gray-800 dark:text-slate-200 transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
              >
                <option value={1}>1 km (Périmètre immédiat)</option>
                <option value={2}>2 km</option>
                <option value={5}>5 km (Recommandé)</option>
                <option value={10}>10 km (Vigilance étendue)</option>
              </select>
            </div>

            {/* Période d'historique (24h, 48h, 7 jours) */}
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                Période d'historique
              </label>
              <div className="inline-flex rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-1">
                {[
                  { label: "24h", value: "24h" },
                  { label: "48h", value: "48h" },
                  { label: "7 jours", value: "7d" },
                ].map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPeriod(p.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      period === p.value
                        ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                        : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rafraîchissement automatique défini */}
            <div>
              <label
                htmlFor="refresh-select"
                className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400"
              >
                Délai de rafraîchissement
              </label>
              <div className="flex items-center gap-2">
                <select
                  id="refresh-select"
                  value={refreshIntervalSec}
                  onChange={(e) => setRefreshIntervalSec(Number(e.target.value))}
                  className="rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3 py-2 text-sm font-medium text-gray-800 dark:text-slate-200 transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                >
                  <option value={0}>Désactivé</option>
                  <option value={60}>1 minute (Très fréquent)</option>
                  <option value={300}>5 minutes (Recommandé)</option>
                  <option value={900}>15 minutes</option>
                  <option value={1800}>30 minutes</option>
                </select>

                {refreshIntervalSec > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{secondsUntilRefresh}s</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Statut de synchronisation automatique 30 min & PostGIS */}
          <div className="flex flex-col items-end gap-1 text-xs">
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 px-3 py-1 font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Synchro NASA auto : toutes les 30 min</span>
            </div>
            {lastSyncAt ? (
              <p className="text-gray-500 dark:text-slate-400">
                Dernière synchro PostGIS :{" "}
                <strong className="text-gray-700 dark:text-slate-200">
                  {lastSyncAt.toLocaleTimeString("fr-FR")}
                </strong>
              </p>
            ) : lastUpdated ? (
              <p className="text-gray-500 dark:text-slate-400">
                Dernière consultation :{" "}
                <strong className="text-gray-700 dark:text-slate-200">
                  {lastUpdated.toLocaleTimeString("fr-FR")}
                </strong>
              </p>
            ) : null}
            <p className="text-gray-400 dark:text-slate-500 text-[11px]">Source : NASA FIRMS NRT (Capteur VIIRS 375m)</p>
          </div>
        </div>
      </div>

      {/* ========================================================
          MESSAGES D'ÉTAT ET NOTIFICATIONS
      ======================================================== */}
      {alertSuccessMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          <span>✅</span>
          <span>{alertSuccessMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 p-4 text-sm text-red-700 dark:text-red-300">
          <span>❌</span>
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================
          BANNIÈRE D'ALERTE RISQUE INCENDIE
      ======================================================== */}
      {!loading && fires.length > 0 && affectedParcelIds.length > 0 && (
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-5 shadow-sm sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div>
              <h3 className="text-base font-bold text-red-800 dark:text-red-300">
                Alerte risque d'incendie détectée !
              </h3>
              <p className="mt-0.5 text-sm text-red-700 dark:text-red-400">
                <strong>{affectedParcelIds.length}</strong> parcelle(s) se trouve(nt) dans le rayon de{" "}
                <strong>{radiusKm} km</strong> d'un foyer actif.
                {minDistance !== null && (
                  <span>
                    {" "}
                    Distance minimale du foyer le plus proche :{" "}
                    <strong className="underline">{minDistance.toFixed(0)} mètres</strong>.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenAlertModal(null)}
              disabled={sendingAlerts}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-red-700 disabled:opacity-50"
              title="Diffuser des SMS à tous les agriculteurs des parcelles menacées"
            >
              <span>Alerter TOUS les agriculteurs par SMS ({affectedParcelIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          CARTES KPI / STATISTIQUES CLÉS
      ======================================================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
            Foyers de feu détectés
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-red-600 dark:text-red-400">
              {loading ? "..." : fires.length}
            </p>
            <span className="text-xs font-medium text-gray-400 dark:text-slate-500">NASA FIRMS</span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Dans la zone tampon de {radiusKm} km ({period})
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
            Parcelles menacées
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <p
              className={`text-3xl font-extrabold ${
                affectedParcelIds.length > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {loading ? "..." : affectedParcelIds.length}
            </p>
            <span className="text-xs font-medium text-gray-400 dark:text-slate-500">à risque immédiat</span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Parcelles situées dans la zone tampon
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
            Distance minimale
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-gray-800 dark:text-white">
              {loading ? "..." : minDistance !== null ? `${minDistance.toFixed(0)} m` : "N/A"}
            </p>
            <span className="text-xs font-medium text-gray-400 dark:text-slate-500">Métrique UTM</span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Foyer le plus proche d'une parcelle</p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
            Puissance radiative max (FRP)
          </p>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {loading ? "..." : maxFrp > 0 ? `${maxFrp.toFixed(1)} MW` : "N/A"}
            </p>
            <span className="text-xs font-medium text-gray-400 dark:text-slate-500">Fire Radiative Power</span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Intensité thermique du foyer maximal</p>
        </div>
      </div>

      {/* ========================================================
          CARTE INTERACTIVE LEAFLET (SUPERPOSITION FEUX & PARCELLES)
      ======================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800 dark:text-white">
              Carte de superposition (Foyers & Parcelles)
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Zone tampon de {radiusKm} km autour des feux. Cliquez sur un élément pour afficher ses informations.
            </p>
          </div>
        </div>

        <FireMap
          fires={fires}
          radiusKm={radiusKm}
          focusedTarget={focusedTarget}
        />
      </div>

      {/* ========================================================
          TABLEAU DÉTAILLÉ DES DÉTECTIONS ET PARCELLES IMPACTÉES
      ======================================================== */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">
              Détections de feux à proximité des parcelles
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Historique des foyers détectés, distances métriques calculées et parcelles exposées.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filtre de risque */}
            <div className="inline-flex rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-1 text-xs font-semibold">
              {[
                { label: "Tous", value: "all" },
                { label: "Critique (< 1km)", value: "critical" },
                { label: "Élevé (1-3km)", value: "high" },
                { label: "Vigilance (> 3km)", value: "watch" },
              ].map((rf) => (
                <button
                  key={rf.value}
                  type="button"
                  onClick={() => setRiskFilter(rf.value)}
                  className={`rounded-lg px-2.5 py-1 transition ${
                    riskFilter === rf.value
                      ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>

            {/* Recherche parcelle */}
            <input
              type="text"
              placeholder="Rechercher par parcelle..."
              value={searchParcel}
              onChange={(e) => setSearchParcel(e.target.value)}
              className="rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 px-3 py-1.5 text-xs focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
            />

            {fires.length > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                <span>📥</span>
                <span>Exporter CSV</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex h-36 items-center justify-center text-sm text-gray-500 dark:text-slate-400">
            <span className="mr-2 animate-spin">🔄</span>
            Interrogation des satellites NASA FIRMS en cours...
          </div>
        ) : filteredFires.length === 0 ? (
          <div className="rounded-xl bg-gray-50 dark:bg-slate-800/60 p-8 text-center text-sm text-gray-500 dark:text-slate-400">
            {fires.length === 0
              ? `Aucun foyer de chaleur détecté dans le rayon de ${radiusKm} km pour la période sélectionnée (${period}). Vos parcelles sont en sécurité.`
              : "Aucune détection ne correspond aux filtres appliqués."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">
                  <th className="px-4 py-3">Niveau de risque</th>
                  <th className="px-4 py-3">Parcelle(s)</th>
                  <th className="px-4 py-3">Agriculteur & Téléphone</th>
                  <th className="px-4 py-3">Distance</th>
                  <th className="px-4 py-3">Puissance (FRP)</th>
                  <th className="px-4 py-3">Confiance</th>
                  <th className="px-4 py-3">Détection</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredFires.map((fire, idx) => {
                  const dist = Number(fire.distance_m);
                  const isCritical = dist <= 1000;
                  const isHigh = dist > 1000 && dist <= 3000;

                  const formattedDate =
                    fire.detected_at || fire.fire_detected_at
                      ? new Date(fire.detected_at || fire.fire_detected_at).toLocaleString("fr-FR")
                      : `${fire.acq_date || ""} ${fire.acq_time || ""}`.trim() || "N/A";

                  const lat = Number(fire.latitude ?? fire.fire_latitude);
                  const lon = Number(fire.longitude ?? fire.fire_longitude);

                  const affectedCount = Array.isArray(fire.affected_parcels)
                    ? fire.affected_parcels.length
                    : 1;

                  return (
                    <tr
                      key={fire.external_id || `${fire.parcel_id}-${fire.fire_id}-${idx}`}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800/60 transition"
                    >
                      <td className="px-4 py-3">
                        {isCritical ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-950/70 px-2.5 py-0.5 text-xs font-bold text-red-700 dark:text-red-400">
                            <span>🚨</span> Danger critique
                          </span>
                        ) : isHigh ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/70 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                            <span>⚠️</span> Risque élevé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-950/70 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:text-yellow-300">
                            <span>🟡</span> Vigilance
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-xs text-gray-900 dark:text-white">
                          {fire.parcel_name || fire.parcel_id || "N/A"}
                        </div>
                        {affectedCount > 1 && (
                          <span className="mt-0.5 inline-block rounded bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:text-red-400">
                            + {affectedCount - 1} autre(s) parcelle(s)
                          </span>
                        )}
                      </td>

                      {/* AGRICULTEUR & TÉLÉPHONE */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-xs text-gray-900 dark:text-white">
                          {fire.farmer_name || "Agriculteur non assigné"}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-gray-600 dark:text-slate-400">
                          {fire.farmer_phone ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <span>📱</span>
                              <span>{fire.farmer_phone}</span>
                            </span>
                          ) : (
                            <span className="italic text-amber-600 dark:text-amber-400">
                              ⚠️ Pas de téléphone
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <strong className="text-gray-900 dark:text-white">{dist.toFixed(0)} m</strong>
                      </td>

                      <td className="px-4 py-3 text-amber-700 dark:text-amber-400 font-semibold">
                        {fire.frp ?? fire.fire_frp ?? "N/A"} MW
                      </td>

                      <td className="px-4 py-3 capitalize text-gray-700 dark:text-slate-300">
                        {fire.confidence ?? fire.fire_confidence ?? "Nominale"}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-400">{formattedDate}</td>

                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenAlertModal(fire)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 text-xs font-bold text-red-700 dark:text-red-300 shadow-xs transition hover:bg-red-600 hover:text-white"
                            title="Envoyer un SMS d'alerte direct à cet agriculteur via mapi.mg"
                          >
                            <span>📱</span>
                            <span>Alerter SMS</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setFocusedTarget({ latitude: lat, longitude: lon })}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-slate-300 shadow-xs transition hover:bg-emerald-50 dark:hover:bg-slate-700 hover:text-emerald-700 dark:hover:text-emerald-400"
                            title="Centrer la carte sur ce feu"
                          >
                            <span>🎯</span>
                            <span>Centrer</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL DE DIFFUSION D'ALERTE INCENDIE (SMS mapi.mg)
      ======================================================== */}
      {showAlertModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedFireForAlert
                      ? "Alerte SMS individuelle (mapi.mg)"
                      : "Diffuser les alertes SMS à tous"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Passerelle mapi.mg multi-opérateurs (Telma, Orange, Airtel)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAlertModal(false);
                  setSelectedFireForAlert(null);
                }}
                className="cursor-pointer rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSendAlerts} className="space-y-4">
              {/* Résumé de l'impact */}
              {selectedFireForAlert ? (
                <div className="rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs text-red-800 dark:text-red-300 space-y-1">
                  <p className="font-bold">
                    🚨 Agriculteur ciblé :{" "}
                    <span className="text-red-950 dark:text-red-200 font-extrabold">
                      {selectedFireForAlert.farmer_name || "Agriculteur"}
                    </span>
                  </p>
                  <p>
                    Parcelle : <strong>{selectedFireForAlert.parcel_name || selectedFireForAlert.parcel_id}</strong> — Distance feu :{" "}
                    <strong>{Math.round(selectedFireForAlert.distance_m || 0)} m</strong>
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs text-red-800 dark:text-red-300 space-y-1">
                  <p className="font-bold">
                    {affectedParcelIds.length} parcelle(s) en zone de risque ({radiusKm} km)
                  </p>
                  <p>
                    Distance minimale : <strong>{minDistance !== null ? `${minDistance.toFixed(0)} m` : "N/A"}</strong> — FRP max : <strong>{maxFrp.toFixed(1)} MW</strong>
                  </p>
                </div>
              )}

              {/* Choix du canal d'alerte */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-300">
                  Canal de transmission
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "sms", label: "SMS (mapi.mg)", desc: "Simple téléphone 2G" },
                    { value: "notification", label: "Système", desc: "Journal de bord" },
                    { value: "both", label: "SMS + Système", desc: "SMS + Journal" },
                  ].map((ch) => (
                    <button
                      key={ch.value}
                      type="button"
                      onClick={() => setAlertChannel(ch.value)}
                      className={`rounded-xl cursor-pointer border p-2.5 text-left transition ${
                        alertChannel === ch.value
                          ? "border-red-600 bg-red-50/50 dark:bg-red-950/40 text-red-900 dark:text-red-200 ring-1 ring-red-600 font-bold"
                          : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <p className="text-xs font-bold">{ch.label}</p>
                      <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">{ch.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Destinataires */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-300">
                  Destinataire mobile
                </label>

                {selectedFireForAlert ? (
                  <div>
                    <input
                      type="tel"
                      required
                      placeholder="Ex : 0341234567 (Numéro Telma, Orange ou Airtel)"
                      value={alertRecipient}
                      onChange={(e) => setAlertRecipient(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-gray-800 dark:text-white focus:border-red-500 focus:outline-none"
                    />
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-slate-400">
                      {selectedFireForAlert.farmer_phone
                        ? "Numéro récupéré depuis la fiche de l'agriculteur (modifiable si besoin)."
                        : "Aucun téléphone enregistré pour cet agriculteur. Saisissez son numéro."}
                    </p>
                  </div>
                ) : (
                  <div>
                    <select
                      value={alertRecipientType}
                      onChange={(e) => setAlertRecipientType(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3 py-2 text-xs font-medium text-gray-800 dark:text-slate-200 focus:border-red-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                    >
                      <option value="farmers">
                        Tous les agriculteurs des parcelles impactées ({affectedParcelIds.length} parcelles)
                      </option>
                      <option value="coop_manager">
                        Responsable sécurité & gestionnaire de coopérative
                      </option>
                      <option value="custom">Autre numéro de téléphone (saisie manuelle)</option>
                    </select>

                    {alertRecipientType === "custom" && (
                      <input
                        type="tel"
                        required
                        placeholder="Ex : 0341234567..."
                        value={alertRecipient}
                        onChange={(e) => setAlertRecipient(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-gray-800 dark:text-white focus:border-red-500 focus:outline-none"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Message d'alerte SMS */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-300">
                    Contenu du SMS
                  </label>
                  <span
                    className={`text-[11px] ${
                      alertMessage.length <= 160 ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-amber-600 dark:text-amber-400 font-bold"
                    }`}
                  >
                    {alertMessage.length}/160 car. (1 SMS)
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={160}
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-xs text-gray-800 dark:text-white focus:border-red-500 focus:outline-none"
                />
                <p className="mt-0.5 text-[10px] text-gray-400 dark:text-slate-500">
                  Message court optimisé pour simple téléphone (GSM 7-bit).
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAlertModal(false);
                    setSelectedFireForAlert(null);
                  }}
                  className="rounded-xl cursor-pointer border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={sendingAlerts}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-xs font-semibold text-white shadow transition hover:bg-red-700 disabled:opacity-50"
                >
                  {sendingAlerts ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      <span>Envoi SMS en cours via mapi.mg...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {selectedFireForAlert
                          ? "Envoyer le SMS à l'agriculteur"
                          : "Envoyer toutes les alertes par SMS"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FireMonitoring;