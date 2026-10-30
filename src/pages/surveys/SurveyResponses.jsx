import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileSpreadsheet,
  Send,
  Eye,
  Trash2,
  Calendar,
  Building2,
  User,
  MapPin,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  CheckCircle,
  FileText,
  X,
  Layers,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getSurveyById,
  getAllSurveyResponses,
  deleteExistingSurveyResponse,
  downloadSurveyCsv,
} from "../../services/surveyService";

const SurveyResponses = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  // Modal détail
  const [selectedResponse, setSelectedResponse] = useState(null);

  // Modal suppression
  const [responseToDelete, setResponseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ============================================================
  // CHARGEMENT
  // ============================================================

  const loadData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const [surveyRes, responsesRes] = await Promise.all([
        getSurveyById(id),
        getAllSurveyResponses(id),
      ]);

      setSurvey(surveyRes?.data || null);
      setResponses(Array.isArray(responsesRes?.data) ? responsesRes.data : []);
    } catch (err) {
      console.error("Erreur chargement réponses :", err);
      toast.error("Impossible de charger les réponses de l'enquête.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // ============================================================
  // FILTRAGE
  // ============================================================

  const filteredResponses = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return responses;

    return responses.filter((r) => {
      const farmerName = r.farmer?.full_name?.toLowerCase() || "";
      const farmerCin = r.farmer?.id_card?.toLowerCase() || "";
      const submittedBy = `${r.submitted_user?.first_name || ""} ${r.submitted_user?.last_name || ""}`.toLowerCase();
      const parcelId = r.parcel_id?.toLowerCase() || "";
      const date = new Date(r.created_at).toLocaleDateString("fr-FR").toLowerCase();

      return (
        farmerName.includes(term) ||
        farmerCin.includes(term) ||
        submittedBy.includes(term) ||
        parcelId.includes(term) ||
        date.includes(term)
      );
    });
  }, [responses, search]);

  // Métriques
  const metrics = useMemo(() => {
    const total = responses.length;
    const uniqueFarmers = new Set(responses.map((r) => r.farmer_id).filter(Boolean)).size;
    const lastDate = responses[0]?.created_at
      ? new Date(responses[0].created_at).toLocaleDateString("fr-FR")
      : "Aucune";

    return { total, uniqueFarmers, lastDate };
  }, [responses]);

  // Export CSV
  const handleExport = async () => {
    if (!survey) return;
    try {
      toast.loading("Génération du CSV...", { id: "csv" });
      await downloadSurveyCsv(id, survey.title);
      toast.success("Export CSV terminé avec succès !", { id: "csv" });
    } catch (err) {
      console.error("Erreur export :", err);
      toast.error("Impossible d'exporter les données.", { id: "csv" });
    }
  };

  // Suppression
  const handleDeleteConfirm = async () => {
    if (!responseToDelete) return;
    try {
      setDeleting(true);
      await deleteExistingSurveyResponse(id, responseToDelete.uuid);
      setResponses((prev) => prev.filter((r) => r.uuid !== responseToDelete.uuid));
      toast.success("Réponse supprimée.");
      setResponseToDelete(null);
    } catch (err) {
      console.error("Erreur suppression réponse :", err);
      toast.error("Impossible de supprimer cette réponse.");
    } finally {
      setDeleting(false);
    }
  };

  const fields = survey?.fields || [];

  // Organisation des questions par groupe / section
  const { groupsMap, uncategorizedFields, hasGroups } = useMemo(() => {
    const map = {};
    const uncategorized = [];
    let found = false;

    fields.forEach((field, originalIdx) => {
      const item = { field, originalIdx };
      const grp = field.group?.trim();
      if (grp) {
        found = true;
        if (!map[grp]) {
          map[grp] = [];
        }
        map[grp].push(item);
      } else {
        uncategorized.push(item);
      }
    });

    return {
      groupsMap: map,
      uncategorizedFields: uncategorized,
      hasGroups: found,
    };
  }, [fields]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-green-700 dark:text-emerald-500" />
        <p className="text-sm text-gray-500 dark:text-slate-400">Chargement des réponses...</p>
      </div>
    );
  }

  const renderResponseAnswer = (f, fIdx) => {
    const ans = selectedResponse?.answers?.[f.id];

    return (
      <div key={f.id} className="rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 p-3 space-y-1">
        <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">
          <span className="text-gray-400 dark:text-slate-500 font-normal mr-1">{fIdx + 1}.</span>
          {f.label}
        </p>

        {/* Affichage selon le type */}
        {f.type === "photo" && ans ? (
          <img
            src={ans}
            alt="Photo"
            className="h-40 w-auto rounded-lg border border-gray-200 dark:border-slate-700 mt-2 object-cover"
          />
        ) : f.type === "signature" && ans ? (
          <img
            src={ans}
            alt="Signature"
            className="h-20 w-auto rounded-lg border border-gray-200 dark:border-slate-700 mt-2 bg-white"
          />
        ) : Array.isArray(ans) ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {ans.map((item, i) => (
              <span
                key={i}
                className="rounded-md bg-green-50 dark:bg-emerald-950/60 px-2 py-0.5 text-xs font-medium text-green-800 dark:text-emerald-300"
              >
                {item}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-900 dark:text-white font-medium">
            {ans !== undefined && ans !== null && ans !== "" ? (
              <>
                {String(ans)} {f.unit ? ` ${f.unit}` : ""}
              </>
            ) : (
              <span className="italic text-gray-400 dark:text-slate-500">Non renseigné</span>
            )}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ======================================================
          EN-TÊTE
      ====================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/surveys")}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={19} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Réponses : {survey?.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Suivi et exportation des réponses collectées pour cette campagne
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-300 shadow-xs transition hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            <FileSpreadsheet size={17} className="text-emerald-700 dark:text-emerald-400" />
            Exporter CSV
          </button>

          <button
            type="button"
            onClick={() => navigate(`/surveys/${id}/fill`)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-green-700 dark:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 dark:hover:bg-emerald-700"
          >
            <Send size={16} />
            Saisir une réponse
          </button>
        </div>
      </div>

      {/* ======================================================
          MÉTADONNÉES & STATS
      ====================================================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-slate-400">Total Réponses</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{metrics.total}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-slate-400">Producteurs enquêtés</p>
          <p className="mt-1 text-2xl font-bold text-green-700 dark:text-emerald-400">{metrics.uniqueFarmers}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-slate-400">Dernière soumission</p>
          <p className="mt-1 text-lg font-bold text-purple-700 dark:text-purple-400">{metrics.lastDate}</p>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-slate-400">Coopérative & Campagne</p>
          <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">
            {survey?.cooperative?.name}
          </p>
          <span className="inline-block mt-0.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
            {survey?.campaign} (v{survey?.version || 1})
          </span>
        </div>
      </div>

      {/* ======================================================
          RECHERCHE & ACTIONS
      ====================================================== */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom de producteur, CIN, date, enquêteur..."
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-500/20"
          />
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex cursor-pointer shrink-0 items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-slate-700"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* ======================================================
          TABLEAU DES RÉPONSES
      ====================================================== */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {filteredResponses.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500">
              <FileText size={24} />
            </div>
            <h3 className="mt-3 text-base font-semibold text-gray-800 dark:text-slate-200">
              {search ? "Aucune réponse ne correspond à la recherche" : "Aucune réponse enregistrée"}
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              {search
                ? "Modifiez votre recherche."
                : "Commencez la collecte en cliquant sur « Saisir une réponse » ou via l'application mobile."}
            </p>
            {!search && (
              <button
                type="button"
                onClick={() => navigate(`/surveys/${id}/fill`)}
                className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-green-700 dark:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-800 dark:hover:bg-emerald-700"
              >
                <Send size={14} />
                Saisir la première réponse
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800">
              <thead className="bg-gray-50/75 dark:bg-slate-800/80">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    Date & Version
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    Agriculteur / Producteur
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    Parcelle & GPS
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    Enquêteur
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredResponses.map((r) => {
                  const dateStr = new Date(r.created_at).toLocaleString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const submitterName = r.submitted_user
                    ? `${r.submitted_user.first_name || ""} ${r.submitted_user.last_name || ""}`.trim()
                    : "Agent";

                  return (
                    <tr key={r.uuid} className="transition hover:bg-gray-50/70 dark:hover:bg-slate-800/50">
                      {/* Date */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <p className="font-semibold text-xs text-gray-900 dark:text-white">{dateStr}</p>
                        <span className="rounded bg-blue-50 dark:bg-blue-950/50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                          v{r.form_version || 1}
                        </span>
                      </td>

                      {/* Producteur */}
                      <td className="whitespace-nowrap px-6 py-4">
                        {r.farmer ? (
                          <div>
                            <p className="font-semibold text-xs text-gray-900 dark:text-white">{r.farmer.full_name}</p>
                            <p className="text-[11px] text-gray-400 dark:text-slate-500">CIN : {r.farmer.id_card || "—"}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-slate-500">Non renseigné</span>
                        )}
                      </td>

                      {/* Parcelle & GPS */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-xs text-gray-700 dark:text-slate-300">
                          {r.parcel ? (
                            <p className="font-medium text-gray-900 dark:text-white">{r.parcel.name || `Parcelle #${r.parcel.uuid?.substring(0, 8)}`}</p>
                          ) : (
                            <p className="text-gray-400 dark:text-slate-500">—</p>
                          )}
                          {r.latitude && r.longitude && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-green-700 dark:text-emerald-400">
                              <MapPin size={11} />
                              {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Enquêteur */}
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-gray-700 dark:text-slate-300">
                        {submitterName || "Agent de terrain"}
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Voir les détails"
                            onClick={() => setSelectedResponse(r)}
                            className="rounded-lg p-2 text-gray-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            title="Supprimer"
                            onClick={() => setResponseToDelete(r)}
                            className="rounded-lg p-2 text-gray-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 size={17} />
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

      {/* ======================================================
          MODAL DÉTAILS D'UNE SOUMISSION
      ====================================================== */}
      {selectedResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-xs px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Détail de la soumission d'enquête
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Soumise le {new Date(selectedResponse.created_at).toLocaleString("fr-FR")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={19} />
              </button>
            </div>

            {/* Infos générales */}
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 p-4 text-xs">
              <div>
                <span className="text-gray-500 dark:text-slate-400">Agriculteur :</span>
                <p className="font-semibold text-gray-800 dark:text-slate-200">
                  {selectedResponse.farmer?.full_name || "Non renseigné"}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-slate-400">Parcelle :</span>
                <p className="font-semibold text-gray-800 dark:text-slate-200">
                  {selectedResponse.parcel_id ? `#${selectedResponse.parcel_id.substring(0, 8)}` : "Non renseigné"}
                </p>
              </div>
              {selectedResponse.latitude && selectedResponse.longitude && (
                <div className="col-span-2">
                  <span className="text-gray-500 dark:text-slate-400">Position GPS :</span>
                  <p className="font-semibold text-green-800 dark:text-emerald-400">
                    {selectedResponse.latitude}, {selectedResponse.longitude}
                  </p>
                </div>
              )}
            </div>

            {/* Réponses aux questions du formulaire */}
            <div className="mt-5 space-y-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-2">
                Réponses enregistrées ({fields.length} questions)
              </h4>

              {hasGroups ? (
                <div className="space-y-4">
                  {Object.entries(groupsMap).map(([groupName, items]) => (
                    <div
                      key={groupName}
                      className="rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/30 p-3.5 space-y-2.5"
                    >
                      <div className="flex items-center gap-2 border-b border-gray-200/60 dark:border-slate-700 pb-2">
                        <Layers size={14} className="text-green-700 dark:text-emerald-400" />
                        <h5 className="text-xs font-bold text-gray-800 dark:text-slate-200">{groupName}</h5>
                        <span className="text-[11px] text-gray-400 dark:text-slate-500">
                          ({items.length} question{items.length > 1 ? "s" : ""})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {items.map(({ field, originalIdx }) =>
                          renderResponseAnswer(field, originalIdx)
                        )}
                      </div>
                    </div>
                  ))}

                  {uncategorizedFields.length > 0 && (
                    <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-800/30 p-3.5 space-y-2.5">
                      <div className="flex items-center gap-2 border-b border-gray-200/60 dark:border-slate-700 pb-2">
                        <Layers size={14} className="text-gray-500 dark:text-slate-400" />
                        <h5 className="text-xs font-bold text-gray-800 dark:text-slate-200">Autres questions</h5>
                        <span className="text-[11px] text-gray-400 dark:text-slate-500">
                          ({uncategorizedFields.length})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {uncategorizedFields.map(({ field, originalIdx }) =>
                          renderResponseAnswer(field, originalIdx)
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {fields.map((f, fIdx) => renderResponseAnswer(f, fIdx))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                className="rounded-xl bg-gray-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          MODAL SUPPRESSION RÉPONSE
      ====================================================== */}
      {responseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-xs px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Supprimer cette réponse ?</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
              Cette action retirera définitivement cette soumission d'enquête.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setResponseToDelete(null)}
                className="rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-semibold text-white cursor-pointer"
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyResponses;
