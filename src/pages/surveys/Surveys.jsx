import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Plus,
  Search,
  Building2,
  Calendar,
  FileCheck2,
  Pencil,
  Trash2,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Send,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getAllSurveys,
  deleteExistingSurvey,
  downloadSurveyCsv,
} from "../../services/surveyService";
import { getAllCooperatives } from "../../services/cooperativeService";

const Surveys = () => {
  const navigate = useNavigate();

  const [surveys, setSurveys] = useState([]);
  const [cooperatives, setCooperatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtres
  const [search, setSearch] = useState("");
  const [selectedCooperative, setSelectedCooperative] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modal suppression
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ============================================================
  // CHARGEMENT DES DONNÉES
  // ============================================================

  const loadData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const [surveysRes, coopsRes] = await Promise.all([
        getAllSurveys(),
        getAllCooperatives(),
      ]);

      const surveyList = Array.isArray(surveysRes?.data) ? surveysRes.data : [];
      const coopList = Array.isArray(coopsRes) ? coopsRes : Array.isArray(coopsRes?.data) ? coopsRes.data : [];

      setSurveys(surveyList);
      setCooperatives(coopList);
    } catch (error) {
      console.error("Erreur chargement formulaires :", error);
      toast.error("Impossible de charger les formulaires d'enquête.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Liste des campagnes uniques présentes
  const campaignsList = useMemo(() => {
    const set = new Set();
    surveys.forEach((s) => {
      if (s.campaign) set.add(s.campaign);
    });
    return Array.from(set).sort();
  }, [surveys]);

  // ============================================================
  // FILTRAGE
  // ============================================================

  const filteredSurveys = useMemo(() => {
    const term = search.trim().toLowerCase();

    return surveys.filter((survey) => {
      // Coopérative
      if (selectedCooperative !== "all" && survey.cooperative_id !== selectedCooperative) {
        return false;
      }

      // Campagne
      if (selectedCampaign !== "all" && survey.campaign !== selectedCampaign) {
        return false;
      }

      // Statut
      if (selectedStatus !== "all" && survey.status !== selectedStatus) {
        return false;
      }

      // Recherche texte
      if (term) {
        const matchesTitle = survey.title?.toLowerCase().includes(term);
        const matchesCampaign = survey.campaign?.toLowerCase().includes(term);
        const matchesCoop = survey.cooperative?.name?.toLowerCase().includes(term);
        const matchesDesc = survey.description?.toLowerCase().includes(term);
        return matchesTitle || matchesCampaign || matchesCoop || matchesDesc;
      }

      return true;
    });
  }, [surveys, search, selectedCooperative, selectedCampaign, selectedStatus]);

  // Statistiques
  const stats = useMemo(() => {
    const totalForms = surveys.length;
    const published = surveys.filter((s) => s.status === "published").length;
    const totalResponses = surveys.reduce((acc, s) => acc + (s.responses_count || 0), 0);
    const totalCampaigns = campaignsList.length;

    return { totalForms, published, totalResponses, totalCampaigns };
  }, [surveys, campaignsList]);

  // ============================================================
  // ACTIONS
  // ============================================================

  const handleDeleteConfirm = async () => {
    if (!selectedSurvey) return;

    try {
      setDeleting(true);
      await deleteExistingSurvey(selectedSurvey.uuid);
      setSurveys((prev) => prev.filter((s) => s.uuid !== selectedSurvey.uuid));
      toast.success("Formulaire supprimé avec succès.");
      setShowDeleteModal(false);
      setSelectedSurvey(null);
    } catch (err) {
      console.error("Erreur suppression :", err);
      toast.error(err?.response?.data?.error || "Impossible de supprimer ce formulaire.");
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCsv = async (survey) => {
    try {
      toast.loading("Génération du fichier CSV...", { id: `csv-${survey.uuid}` });
      await downloadSurveyCsv(survey.uuid, survey.title);
      toast.success("Fichier CSV téléchargé avec succès !", { id: `csv-${survey.uuid}` });
    } catch (error) {
      console.error("Erreur export :", error);
      toast.error("Échec de l'export CSV.", { id: `csv-${survey.uuid}` });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "published":
        return <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">Publié</span>;
      case "draft":
        return <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">Brouillon</span>;
      case "archived":
        return <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:text-slate-300">Archivé</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* ======================================================
          EN-TÊTE
      ====================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Formulaires d'enquête
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Création de formulaires dynamiques par coopérative et campagne, et suivi des réponses
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/surveys/new")}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-green-700 dark:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 dark:hover:bg-emerald-700"
        >
          <Plus size={18} />
          Nouveau formulaire
        </button>
      </div>

      {/* ======================================================
          STATISTIQUES
      ====================================================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-slate-400">Total Formulaires</p>
              <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stats.totalForms}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <ClipboardList size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-slate-400">Publiés / Actifs</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.published}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <FileCheck2 size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-slate-400">Réponses collectées</p>
              <p className="mt-1 text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.totalResponses}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <Send size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-slate-400">Campagnes actives</p>
              <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.totalCampaigns}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Calendar size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          BARRE DE FILTRES
      ====================================================== */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm lg:flex-row lg:items-center">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, campagne, coopérative..."
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-500/20"
          />
        </div>

        {/* Filtre Coopérative */}
        <div className="w-full lg:w-60">
          <select
            value={selectedCooperative}
            onChange={(e) => setSelectedCooperative(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-gray-700 dark:text-slate-200 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-500/20"
          >
            <option value="all">Toutes les coopératives</option>
            {cooperatives.map((c) => (
              <option key={c.uuid} value={c.uuid}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre Campagne */}
        <div className="w-full lg:w-52">
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-gray-700 dark:text-slate-200 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-500/20"
          >
            <option value="all">Toutes les campagnes</option>
            {campaignsList.map((camp) => (
              <option key={camp} value={camp}>
                {camp}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre Statut */}
        <div className="w-full lg:w-40">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-gray-700 dark:text-slate-200 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-500/20"
          >
            <option value="all">Tous les statuts</option>
            <option value="published">Publié</option>
            <option value="draft">Brouillon</option>
            <option value="archived">Archivé</option>
          </select>
        </div>

        {/* Actualiser */}
        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing || loading}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* ======================================================
          LISTE DES FORMULAIRES
      ====================================================== */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-green-700 dark:text-emerald-500" />
            <p className="text-sm text-gray-500 dark:text-slate-400">Chargement des formulaires...</p>
          </div>
        ) : filteredSurveys.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500">
              <ClipboardList size={28} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-800 dark:text-slate-200">
              {search || selectedCooperative !== "all" || selectedCampaign !== "all" || selectedStatus !== "all"
                ? "Aucun formulaire ne correspond à vos filtres"
                : "Aucun formulaire d'enquête créé"}
            </h3>
            <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-slate-400">
              {search || selectedCooperative !== "all"
                ? "Essayez d'ajuster vos critères de recherche ou de filtre."
                : "Créez votre premier formulaire personnalisé pour commencer la collecte de données par coopérative et par campagne."}
            </p>
            {!search && selectedCooperative === "all" && (
              <button
                type="button"
                onClick={() => navigate("/surveys/new")}
                className="mt-5 cursor-pointer inline-flex items-center gap-2 rounded-xl bg-green-700 dark:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 dark:hover:bg-emerald-700"
              >
                <Plus size={18} />
                Créer un formulaire
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800">
              <thead className="bg-gray-50/75 dark:bg-slate-800/80">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    Formulaire & Description
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    Coopérative
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    Campagne
                  </th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    Version & Champs
                  </th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    Statut
                  </th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    Réponses
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredSurveys.map((survey) => {
                  const fieldsCount = Array.isArray(survey.fields) ? survey.fields.length : 0;
                  return (
                    <tr key={survey.uuid} className="transition hover:bg-gray-50/70 dark:hover:bg-slate-800/50">
                      {/* TITRE */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 dark:bg-emerald-950/50 text-green-700 dark:text-emerald-400">
                            <ClipboardList size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{survey.title}</p>
                            <p className="line-clamp-1 max-w-xs text-xs text-gray-500 dark:text-slate-400">
                              {survey.description || "Aucune description"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* COOPÉRATIVE */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-slate-300">
                          <Building2 size={13} className="text-gray-500 dark:text-slate-400" />
                          {survey.cooperative?.name ||
                            cooperatives.find((c) => c.uuid === survey.cooperative_id)?.name ||
                            "—"}
                        </span>
                      </td>

                      {/* CAMPAGNE */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-xs font-medium text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50">
                          <Calendar size={13} className="text-amber-600 dark:text-amber-400" />
                          {survey.campaign}
                        </span>
                      </td>

                      {/* VERSION & CHAMPS */}
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-400">
                          <span className="rounded-md bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 font-semibold text-blue-700 dark:text-blue-300">
                            v{survey.version || 1}
                          </span>
                          <span className="text-gray-400 dark:text-slate-500">•</span>
                          <span>{fieldsCount} champ{fieldsCount > 1 ? "s" : ""}</span>
                        </div>
                      </td>

                      {/* STATUT */}
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        {getStatusBadge(survey.status)}
                      </td>

                      {/* RÉPONSES */}
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => navigate(`/surveys/${survey.uuid}/responses`)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300 transition hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer"
                        >
                          <Send size={12} />
                          {survey.responses_count || 0} réponse{(survey.responses_count || 0) > 1 ? "s" : ""}
                        </button>
                      </td>

                      {/* ACTIONS */}
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Saisir une réponse */}
                          {survey.status === "published" && (
                            <button
                              type="button"
                              title="Répondre à cette enquête"
                              onClick={() => navigate(`/surveys/${survey.uuid}/fill`)}
                              className="inline-flex items-center gap-1 rounded-lg bg-green-50 dark:bg-emerald-950/50 px-2.5 py-1.5 text-xs font-semibold text-green-700 dark:text-emerald-300 transition hover:bg-green-100 dark:hover:bg-emerald-900/50 cursor-pointer"
                            >
                              <Send size={13} />
                              Saisir
                            </button>
                          )}

                          {/* Consulter les réponses */}
                          <button
                            type="button"
                            title="Voir les réponses collectées"
                            onClick={() => navigate(`/surveys/${survey.uuid}/responses`)}
                            className="rounded-lg p-2 text-gray-500 dark:text-slate-400 transition hover:bg-purple-50 dark:hover:bg-purple-950/40 hover:text-purple-700 dark:hover:text-purple-300 cursor-pointer"
                          >
                            <Layers size={17} />
                          </button>

                          {/* Exporter CSV */}
                          <button
                            type="button"
                            title="Exporter en CSV"
                            onClick={() => handleExportCsv(survey)}
                            className="rounded-lg p-2 text-gray-500 dark:text-slate-400 transition hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer"
                          >
                            <FileSpreadsheet size={17} />
                          </button>

                          {/* Modifier */}
                          <button
                            type="button"
                            title="Modifier le formulaire"
                            onClick={() => navigate(`/surveys/${survey.uuid}/edit`)}
                            className="rounded-lg p-2 text-gray-500 dark:text-slate-400 transition hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                          >
                            <Pencil size={17} />
                          </button>

                          {/* Supprimer */}
                          <button
                            type="button"
                            title="Supprimer"
                            onClick={() => {
                              setSelectedSurvey(survey);
                              setShowDeleteModal(true);
                            }}
                            className="rounded-lg p-2 text-gray-500 dark:text-slate-400 transition hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
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
          MODAL DE SUPPRESSION
      ====================================================== */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/70 backdrop-blur-xs px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-transparent dark:border-slate-800 p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Supprimer le formulaire d'enquête ?
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                  Êtes-vous sûr de vouloir supprimer{" "}
                  <span className="font-semibold text-gray-800 dark:text-slate-200">
                    « {selectedSurvey?.title} »
                  </span>{" "}
                  ainsi que l'historique de ses réponses ?
                </p>
                <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                  Cette action est irréversible.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedSurvey(null);
                }}
                className="rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 cursor-pointer"
              >
                {deleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Supprimer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Surveys;
