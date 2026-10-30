import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import fireAlertService from "../../services/fireAlertService";
import toast from "react-hot-toast";

const FireAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtres
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "pending" | "sent"
  const [channelFilter, setChannelFilter] = useState("all"); // "all" | "sms" | "notification"
  const [searchFilter, setSearchFilter] = useState("");

  // Modals et actions
  const [selectedAlertForDetails, setSelectedAlertForDetails] = useState(null);
  const [dispatchModalAlert, setDispatchModalAlert] = useState(null); // alerte unique ou "all"
  const [dispatchChannel, setDispatchChannel] = useState("sms");
  const [dispatchRecipient, setDispatchRecipient] = useState("");
  const [processingDispatch, setProcessingDispatch] = useState(false);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await fireAlertService.getFireAlerts();
      setAlerts(result.data || []);
    } catch (err) {
      console.error(
        "❌ Erreur récupération alertes :",
        err.response?.data || err.message
      );
      setError(
        err.response?.data?.error ||
          "Impossible de charger le journal des alertes."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  // Déclenchement de l'envoi d'une alerte ou de toutes les alertes
  const handleOpenDispatchModal = (alertOrAll) => {
    setDispatchModalAlert(alertOrAll);
    setDispatchChannel("sms");
    const defaultPhone =
      alertOrAll === "all"
        ? ""
        : alertOrAll?.recipient ||
          alertOrAll?.parcels?.farmers?.phone ||
          "";
    setDispatchRecipient(defaultPhone);
  };

  const handleConfirmDispatch = async (e) => {
    e.preventDefault();
    try {
      setProcessingDispatch(true);

      if (dispatchModalAlert === "all") {
        await fireAlertService.sendAllFireAlerts(
          dispatchRecipient || null,
          dispatchChannel
        );
        toast.success("Toutes les alertes en attente ont été diffusées !");
      } else {
        await fireAlertService.sendFireAlert(
          dispatchModalAlert.uuid,
          dispatchRecipient || null,
          dispatchChannel
        );
        toast.success("Alerte transmise et archivée avec succès !");
      }

      setDispatchModalAlert(null);
      await loadAlerts();
    } catch (err) {
      console.error("❌ Erreur diffusion :", err);
      toast.error(
        err?.response?.data?.error || "Erreur lors de la diffusion de l'alerte."
      );
    } finally {
      setProcessingDispatch(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (alerts.length === 0) return;

    const headers = [
      "ID Alerte",
      "ID Parcelle",
      "Nom Parcelle",
      "Distance (m)",
      "Zone tampon (m)",
      "Canal",
      "Destinataire",
      "Statut",
      "Date de détection",
      "Date d'envoi",
    ];

    const rows = alerts.map((a) => [
      a.uuid || "",
      a.parcel_id || "",
      a.parcels?.name || "",
      a.distance_m || "",
      a.radius_m || "",
      a.alert_type || "",
      a.recipient || "",
      a.status || "",
      a.created_at || "",
      a.sent_at || "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `journal_alertes_feux_smartsaha.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "En attente",
      sent: "Transmise",
      failed: "Échec",
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "sent":
        return "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60";
      case "pending":
        return "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60";
      case "failed":
        return "bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/60";
      default:
        return "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700";
    }
  };

  // Filtrage
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesStatus =
        statusFilter === "all" || alert.status === statusFilter;
      const matchesChannel =
        channelFilter === "all" || alert.alert_type === channelFilter;

      const term = searchFilter.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (alert.parcel_id && alert.parcel_id.toLowerCase().includes(term)) ||
        (alert.parcels?.name &&
          alert.parcels.name.toLowerCase().includes(term)) ||
        (alert.recipient && alert.recipient.toLowerCase().includes(term));

      return matchesStatus && matchesChannel && matchesSearch;
    });
  }, [alerts, statusFilter, channelFilter, searchFilter]);

  const totalCount = alerts.length;
  const pendingCount = alerts.filter((a) => a.status === "pending").length;
  const sentCount = alerts.filter((a) => a.status === "sent").length;
  const impactedParcelsCount = new Set(
    alerts.map((a) => a.parcel_id).filter(Boolean)
  ).size;

  return (
    <div className="space-y-6 p-6">
      {/* ========================================================
          EN-TÊTE DE LA PAGE
      ======================================================== */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/fires"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              ← Retour à la carte interactive de surveillance
            </Link>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            Journal des alertes incendie
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">
            Historique complet, horodaté et auditable des alertes déclenchées à proximité
            des parcelles agricoles enregistrées.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={() => handleOpenDispatchModal("all")}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-red-700"
            >
              <span>Diffuser les {pendingCount} alertes par SMS (sms.mg)</span>
            </button>
          )}

          <button
            type="button"
            onClick={loadAlerts}
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-200 shadow-sm transition hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span>
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-700 dark:text-red-300">
          <span>❌</span> <span>{error}</span>
        </div>
      )}

      {/* ========================================================
          CARTES KPI / STATISTIQUES DU JOURNAL
      ======================================================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
            Total des alertes
          </p>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white">
            {loading ? "..." : totalCount}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Historique complet archivé</p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
            En attente d'envoi
          </p>
          <p
            className={`mt-2 text-3xl font-extrabold ${
              pendingCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-900 dark:text-white"
            }`}
          >
            {loading ? "..." : pendingCount}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Prêtes à être transmises</p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
            Alertes transmises
          </p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {loading ? "..." : sentCount}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Diffusées aux destinataires</p>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
            Parcelles impactées
          </p>
          <p className="mt-2 text-3xl font-extrabold text-red-600 dark:text-red-400">
            {loading ? "..." : impactedParcelsCount}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Parcelles ayant déclenché une alerte</p>
        </div>
      </div>

      {/* ========================================================
          BARRE DE FILTRES ET RECHERCHE
      ======================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtre statut */}
          <div className="inline-flex rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-1 text-xs font-semibold">
            {[
              { label: "Toutes", value: "all" },
              { label: `En attente (${pendingCount})`, value: "pending" },
              { label: `Transmises (${sentCount})`, value: "sent" },
            ].map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 transition ${
                  statusFilter === f.value
                    ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Filtre canal */}
          <div className="inline-flex rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-1 text-xs font-semibold">
            {[
              { label: "Tous canaux", value: "all" },
              { label: "📱 SMS (sms.mg)", value: "sms" },
              { label: "🔔 Système", value: "notification" },
            ].map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setChannelFilter(c.value)}
                className={`rounded-lg px-3 py-1.5 transition ${
                  channelFilter === c.value
                    ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <input
            type="text"
            placeholder="Rechercher par parcelle ou destinataire..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 px-3.5 py-1.5 text-xs focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
          />
        </div>

        {alerts.length > 0 && (
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 shadow-sm transition hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <span>📥</span>
            <span>Exporter le journal (CSV)</span>
          </button>
        )}
      </div>

      {/* ========================================================
          TABLEAU DU JOURNAL DES ALERTES
      ======================================================== */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {loading ? (
          <div className="flex h-36 items-center justify-center text-sm text-gray-500 dark:text-slate-400">
            <span className="mr-2 animate-spin">🔄</span>
            Chargement du journal des alertes...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500 dark:text-slate-400">
            {alerts.length === 0
              ? "Aucune alerte incendie enregistrée dans le journal. La surveillance continue en continu."
              : "Aucune alerte ne correspond à vos filtres actuels."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/50 text-xs font-semibold uppercase text-gray-500 dark:text-slate-400">
                  <th className="px-5 py-3.5">Parcelle concernée</th>
                  <th className="px-5 py-3.5">Distance du feu</th>
                  <th className="px-5 py-3.5">Zone tampon</th>
                  <th className="px-5 py-3.5">Canal</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5">Date de détection</th>
                  <th className="px-5 py-3.5">Horodatage d'envoi</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredAlerts.map((alert) => (
                  <tr key={alert.uuid} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/60 transition">
                    <td className="px-5 py-4">
                      {alert.parcels?.name && (
                        <div className="text-xs font-bold text-gray-900 dark:text-white">
                          {alert.parcels.name}
                        </div>
                      )}
                      <div className="font-mono text-xs text-gray-600 dark:text-slate-400">
                        {alert.parcel_id}
                      </div>
                      {alert.parcels?.area_ha && (
                        <div className="text-[11px] text-gray-400 dark:text-slate-500">
                          Superficie : {Number(alert.parcels.area_ha).toFixed(3)} ha
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-semibold text-red-700 dark:text-red-400">
                        {Number(alert.distance_m).toFixed(0)} m
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-gray-600 dark:text-slate-400">
                      {Number(alert.radius_m) / 1000} km
                    </td>

                    <td className="px-5 py-4 text-xs text-gray-700 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        {alert.alert_type === "sms" ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <span>📱</span>
                            <span>SMS (sms.mg)</span>
                          </span>
                        ) : alert.alert_type === "email" ? (
                          <>
                            <span>📧</span>
                            <span>Email</span>
                          </>
                        ) : (
                          <>
                            <span>🔔</span>
                            <span>Système</span>
                          </>
                        )}
                      </span>
                      {alert.recipient && (
                        <div className="text-[11px] text-emerald-800 dark:text-emerald-400 font-mono font-semibold truncate max-w-[150px] mt-0.5">
                          📱 {alert.recipient}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadge(
                          alert.status
                        )}`}
                      >
                        {getStatusLabel(alert.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-gray-600 dark:text-slate-400">
                      {new Date(alert.created_at).toLocaleString("fr-FR")}
                    </td>

                    <td className="px-5 py-4 text-xs text-gray-600 dark:text-slate-400">
                      {alert.sent_at ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          {new Date(alert.sent_at).toLocaleString("fr-FR")}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-slate-500 italic">Non transmis</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedAlertForDetails(alert)}
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-gray-700 dark:text-slate-300 shadow-xs hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                          <span>🔍</span>
                          <span>Détails</span>
                        </button>

                        {alert.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => handleOpenDispatchModal(alert)}
                            className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700"
                          >
                            <span>🚀</span>
                            <span>Transmettre</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL DE TRANSMISSION D'ALERTE
      ======================================================== */}
      {dispatchModalAlert && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {dispatchModalAlert === "all"
                  ? `Diffuser les ${pendingCount} alertes en attente`
                  : "Transmettre l'alerte incendie"}
              </h3>
              <button
                type="button"
                onClick={() => setDispatchModalAlert(null)}
                className="cursor-pointer rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="space-y-4 text-xs">
              <div>
                <label className="mb-1 block font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-300">
                  Canal d'envoi
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDispatchChannel("sms")}
                    className={`rounded-xl cursor-pointer border p-2.5 text-left transition ${
                      dispatchChannel === "sms"
                        ? "border-red-600 bg-red-50/50 dark:bg-red-950/40 text-red-900 dark:text-red-200 ring-1 ring-red-600 font-bold"
                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <p className="font-bold">📱 SMS (sms.mg)</p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">Simple téléphone 2G</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDispatchChannel("notification")}
                    className={`rounded-xl cursor-pointer border p-2.5 text-left transition ${
                      dispatchChannel === "notification"
                        ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-600 font-bold"
                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <p className="font-bold">🔔 Notification Système</p>
                    <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5">Journal de bord uniquement</p>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-300">
                  Destinataire (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Email ou numéro de téléphone du producteur..."
                  value={dispatchRecipient}
                  onChange={(e) => setDispatchRecipient(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 px-3 py-2 text-xs text-gray-800 focus:border-emerald-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">
                  Si non renseigné, l'alerte sera notifiée au producteur rattaché à la parcelle.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDispatchModalAlert(null)}
                  className="cursor-pointer rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={processingDispatch}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 font-semibold text-white shadow transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {processingDispatch ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      <span>Envoi...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀</span>
                      <span>Confirmer la transmission</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DE DÉTAILS COMPLETS DE L'ALERTE
      ======================================================== */}
      {selectedAlertForDetails && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Fiche détaillée de l'alerte incendie
              </h3>
              <button
                type="button"
                onClick={() => setSelectedAlertForDetails(null)}
                className="cursor-pointer rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-gray-700 dark:text-slate-300">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500 dark:text-slate-400">ID Unique Alerte :</span>
                <span className="font-mono text-gray-900 dark:text-slate-200">{selectedAlertForDetails.uuid}</span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500 dark:text-slate-400">Parcelle :</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedAlertForDetails.parcels?.name || selectedAlertForDetails.parcel_id}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500 dark:text-slate-400">Distance métrique au foyer :</span>
                <strong className="text-red-700 dark:text-red-400">
                  {Number(selectedAlertForDetails.distance_m).toFixed(1)} mètres
                </strong>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500 dark:text-slate-400">Zone tampon configurée :</span>
                <span className="text-gray-900 dark:text-slate-200">{Number(selectedAlertForDetails.radius_m) / 1000} km</span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500 dark:text-slate-400">Canal de notification :</span>
                <span className="capitalize font-semibold text-emerald-800 dark:text-emerald-400">
                  {selectedAlertForDetails.alert_type}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500 dark:text-slate-400">Statut de l'alerte :</span>
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 font-semibold ${getStatusBadge(
                    selectedAlertForDetails.status
                  )}`}
                >
                  {getStatusLabel(selectedAlertForDetails.status)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500 dark:text-slate-400">Date et heure de détection :</span>
                <span className="text-gray-900 dark:text-slate-200">
                  {new Date(selectedAlertForDetails.created_at).toLocaleString("fr-FR")}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-slate-800">
                <span className="text-gray-500 dark:text-slate-400">Date et heure d'envoi effectif :</span>
                <span className="text-gray-900 dark:text-slate-200">
                  {selectedAlertForDetails.sent_at
                    ? new Date(selectedAlertForDetails.sent_at).toLocaleString("fr-FR")
                    : "Non transmis"}
                </span>
              </div>

              {selectedAlertForDetails.fire_detections && (
                <div className="rounded-xl bg-gray-50 dark:bg-slate-800 p-3 space-y-1 mt-3 border border-gray-200 dark:border-slate-700">
                  <p className="font-bold text-gray-800 dark:text-white">🛰️ Caractéristiques du foyer satellite :</p>
                  <p className="text-gray-600 dark:text-slate-300">
                    Satellite : {selectedAlertForDetails.fire_detections.satellite || "VIIRS"} — Puissance FRP :{" "}
                    <strong>{selectedAlertForDetails.fire_detections.frp || "N/A"} MW</strong>
                  </p>
                  <p className="text-gray-600 dark:text-slate-300">
                    Coordonnées : {selectedAlertForDetails.fire_detections.latitude},{" "}
                    {selectedAlertForDetails.fire_detections.longitude}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedAlertForDetails(null)}
                className="cursor-pointer rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FireAlerts;