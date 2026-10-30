import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  X,
} from "lucide-react";

import {
  getAllAudits,
  deleteAudit,
} from "../../api/audits";
import { getMyParcels } from "../../api/parcels";


const conversionStatusLabels = {
  not_started: "Non commencé",
  in_conversion: "En conversion",
  certified: "Certifié",
};

const overallStatusLabels = {
  compliant: "Conforme",
  non_compliant: "Non conforme",
  compliant_with_reservations: "Conforme avec réserves",
};


function getConversionStatusClass(status) {
  switch (status) {
    case "certified":
      return "bg-green-100 dark:bg-emerald-950/70 text-green-700 dark:text-emerald-300";

    case "in_conversion":
      return "bg-yellow-100 dark:bg-amber-950/70 text-yellow-700 dark:text-amber-300";

    default:
      return "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300";
  }
}


function getOverallStatusClass(status) {
  switch (status) {
    case "compliant":
      return "bg-green-100 dark:bg-emerald-950/70 text-green-700 dark:text-emerald-300";

    case "non_compliant":
      return "bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300";

    case "compliant_with_reservations":
      return "bg-yellow-100 dark:bg-amber-950/70 text-yellow-700 dark:text-amber-300";

    default:
      return "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300";
  }
}


function getOverallStatusIcon(status) {
  switch (status) {
    case "compliant":
      return <CheckCircle2 size={15} />;

    case "non_compliant":
      return <XCircle size={15} />;

    case "compliant_with_reservations":
      return <Clock size={15} />;

    default:
      return <AlertCircle size={15} />;
  }
}


function formatDate(date) {
  if (!date) {
    return "-";
  }

  try {
    return new Date(date).toLocaleDateString("fr-FR");
  } catch {
    return date;
  }
}


export default function Audits() {
  const navigate = useNavigate();
  const [audits, setAudits] = useState([]);
  const [parcelsMap, setParcelsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dateFilterMode, setDateFilterMode] = useState("all"); // "all" | "single" | "range"
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [conversionFilter, setConversionFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const resetAllFilters = () => {
    setSearch("");
    setDateFilterMode("all");
    setSingleDate("");
    setStartDate("");
    setEndDate("");
    setConversionFilter("all");
    setResultFilter("all");
  };

  const isDateFilterActive =
    (dateFilterMode === "single" && Boolean(singleDate)) ||
    (dateFilterMode === "range" && Boolean(startDate || endDate));

  const isAnyFilterActive =
    Boolean(search) ||
    isDateFilterActive ||
    conversionFilter !== "all" ||
    resultFilter !== "all";


  // ============================================================
  // CHARGER LES AUDITS ET LES PARCELLES
  // ============================================================

  const loadAudits = async () => {
    try {
      setLoading(true);
      setError("");

      const [auditsRes, parcelsRes] = await Promise.allSettled([
        getAllAudits(),
        getMyParcels(),
      ]);

      if (parcelsRes.status === "fulfilled" && parcelsRes.value?.success) {
        const pList = parcelsRes.value.data || [];
        const map = {};
        pList.forEach((p) => {
          if (p.uuid) {
            map[p.uuid] = p.name || p.uuid;
          }
        });
        setParcelsMap(map);
      }

      if (auditsRes.status === "fulfilled" && auditsRes.value?.data?.success) {
        setAudits(auditsRes.value.data.data || []);
      } else {
        setAudits([]);
        setError(
          auditsRes.value?.data?.message ||
          "Impossible de récupérer les audits."
        );
      }
    } catch (err) {
      console.error("Erreur chargement audits :", err);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Une erreur est survenue lors du chargement des audits.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadAudits();
  }, []);


  const getParcelDisplayName = (audit) => {
    return (
      audit.parcel?.name ||
      audit.parcel_name ||
      parcelsMap[audit.parcel_id] ||
      audit.parcel_id ||
      "-"
    );
  };


  // ============================================================
  // RECHERCHE
  // ============================================================

  const filteredAudits = audits.filter((audit) => {
    const searchValue = search.toLowerCase().trim();

    if (searchValue) {
      const parcelDisplayName = getParcelDisplayName(audit).toLowerCase();

      const matchesSearch =
        audit.auditor_name?.toLowerCase().includes(searchValue) ||
        parcelDisplayName.includes(searchValue) ||
        audit.parcel_id?.toLowerCase().includes(searchValue) ||
        audit.overall_status?.toLowerCase().includes(searchValue) ||
        audit.conversion_status?.toLowerCase().includes(searchValue);

      if (!matchesSearch) return false;
    }

    // Filtre par date exacte
    if (dateFilterMode === "single" && singleDate) {
      if (!audit.audit_date) return false;
      const auditDate = audit.audit_date.split("T")[0];
      if (auditDate !== singleDate) return false;
    }

    // Filtre par intervalle de dates
    if (dateFilterMode === "range") {
      if (!audit.audit_date) return false;
      const auditDate = audit.audit_date.split("T")[0];
      if (startDate && auditDate < startDate) return false;
      if (endDate && auditDate > endDate) return false;
    }

    // Filtre par statut de conversion
    if (conversionFilter !== "all") {
      if (audit.conversion_status !== conversionFilter) return false;
    }

    // Filtre par résultat
    if (resultFilter !== "all") {
      if (audit.overall_status !== resultFilter) return false;
    }

    return true;
  });


  // ============================================================
  // SUPPRESSION
  // ============================================================

  const openDeleteModal = (audit) => {
    setSelectedAudit(audit);
    setShowDeleteModal(true);
  };


  const closeDeleteModal = () => {
    if (deleting) {
      return;
    }

    setShowDeleteModal(false);
    setSelectedAudit(null);
  };


  const handleDelete = async () => {
    if (!selectedAudit?.uuid) {
      return;
    }

    try {
      setDeleting(true);

      await deleteAudit(selectedAudit.uuid);

      setAudits((previousAudits) =>
        previousAudits.filter(
          (audit) => audit.uuid !== selectedAudit.uuid
        )
      );

      closeDeleteModal();

    } catch (err) {
      console.error("Erreur suppression audit :", err);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Impossible de supprimer l'audit.";

      setError(message);
    } finally {
      setDeleting(false);
    }
  };


  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <div className="p-1 space-y-6">

      {/* ======================================================
          EN-TÊTE
      ====================================================== */}

      <div className="space-y-3">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">

            <div className="relative flex-1 max-w-md">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par auditeur, parcelle ou statut..."
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-green-700 dark:focus:border-emerald-500 focus:ring-1 focus:ring-green-700 dark:focus:ring-emerald-500"
              />

            </div>

            <button
              type="button"
              onClick={loadAudits}
              disabled={loading}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-200 transition hover:bg-gray-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Actualiser
            </button>

          </div>

          <button
            type="button"
            onClick={() => {
              navigate("/audits/new");
            }}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 shrink-0"
          >
            <Plus size={18} />
            Nouvel audit
          </button>

        </div>

        {/* ====================================================
            BARRE DE FILTRES : DATE, CONVERSION, RÉSULTAT
        ==================================================== */}

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm text-gray-700 dark:text-slate-300 shadow-xs">

          {/* Filtre Date */}
          <div className="flex items-center gap-2 font-medium text-gray-600 dark:text-slate-400">
            <Calendar size={17} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
            <span>Date :</span>
          </div>

          <select
            value={dateFilterMode}
            onChange={(e) => setDateFilterMode(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-1.5 text-sm outline-none focus:border-green-700 dark:focus:border-emerald-500 focus:ring-1 focus:ring-green-700 cursor-pointer"
          >
            <option value="all">Toutes les dates</option>
            <option value="single">Date exacte</option>
            <option value="range">Intervalle de dates</option>
          </select>

          {dateFilterMode === "single" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-1.5 text-sm outline-none focus:border-green-700 dark:focus:border-emerald-500 focus:ring-1 focus:ring-green-700"
              />
            </div>
          )}

          {dateFilterMode === "range" && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-slate-400">Du</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-1.5 text-sm outline-none focus:border-green-700 dark:focus:border-emerald-500 focus:ring-1 focus:ring-green-700"
              />
              <span className="text-xs text-gray-500 dark:text-slate-400">Au</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-1.5 text-sm outline-none focus:border-green-700 dark:focus:border-emerald-500 focus:ring-1 focus:ring-green-700"
              />
            </div>
          )}

          {/* Séparateur */}
          <div className="hidden sm:block h-5 w-px bg-gray-200 dark:bg-slate-700" />

          {/* Filtre Conversion */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Conversion :</span>
            <select
              value={conversionFilter}
              onChange={(e) => setConversionFilter(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-1.5 text-sm outline-none focus:border-green-700 dark:focus:border-emerald-500 focus:ring-1 focus:ring-green-700 cursor-pointer"
            >
              <option value="all">Toutes</option>
              <option value="not_started">Non commencé</option>
              <option value="in_conversion">En conversion</option>
              <option value="certified">Certifié</option>
            </select>
          </div>

          {/* Filtre Résultat */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Résultat :</span>
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white px-3 py-1.5 text-sm outline-none focus:border-green-700 dark:focus:border-emerald-500 focus:ring-1 focus:ring-green-700 cursor-pointer"
            >
              <option value="all">Tous</option>
              <option value="compliant">Conforme</option>
              <option value="compliant_with_reservations">Conforme avec réserves</option>
              <option value="non_compliant">Non conforme</option>
            </select>
          </div>

          {/* Bouton pour réinitialiser tous les filtres */}
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition cursor-pointer"
              title="Réinitialiser tous les filtres"
            >
              <X size={14} />
              Réinitialiser
            </button>
          )}

          <div className="ml-auto text-xs text-gray-500 dark:text-slate-400 font-medium">
            {filteredAudits.length} audit{filteredAudits.length > 1 ? "s" : ""} affiché{filteredAudits.length > 1 ? "s" : ""}
          </div>

        </div>

      </div>


      {/* ====================================================== 
          ERREUR
      ====================================================== */}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 p-4 text-red-700 dark:text-red-300">

          <AlertCircle
            size={20} 
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-medium">
              Erreur
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>

        </div>
      )}


      {/* ======================================================
          TABLEAU
      ====================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">

        <div className="overflow-x-auto">

          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">

            <thead className="bg-gray-50 dark:bg-slate-800/60">

              <tr>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Auditeur
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Parcelle
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Date
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Conversion
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Résultat
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Actions
                </th>

              </tr>

            </thead>


            <tbody className="divide-y divide-gray-200 dark:divide-slate-800 bg-white dark:bg-slate-900">

              {loading ? (

                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">

                      <RefreshCw
                        size={28}
                        className="animate-spin text-green-700 dark:text-emerald-400"
                      />

                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        Chargement des audits...
                      </p>

                    </div>
                  </td>
                </tr>

              ) : filteredAudits.length === 0 ? (

                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center"
                  >

                    <div className="flex flex-col items-center justify-center">

                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500">
                        <ClipboardCheck size={28} />
                      </div>

                      <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                        Aucun audit trouvé
                      </h3>

                      <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                        {isAnyFilterActive
                          ? "Aucun audit ne correspond à vos critères de recherche ou de filtre."
                          : "Vous n'avez encore enregistré aucun audit biologique."
                        }
                      </p>

                    </div>

                  </td>
                </tr>

              ) : (

                filteredAudits.map((audit) => (

                  <tr
                    key={audit.uuid}
                    className="transition hover:bg-gray-50 dark:hover:bg-slate-800/60"
                  >

                    {/* AUDITEUR */}

                    <td className="whitespace-nowrap px-6 py-4">

                      <div className="font-medium text-gray-800 dark:text-white">
                        {audit.auditor_name || "-"}
                      </div>

                    </td>


                    {/* PARCELLE */}

                    <td className="whitespace-nowrap px-6 py-4">

                      <div className="font-medium text-gray-800 dark:text-white">
                        {getParcelDisplayName(audit)}
                      </div>

                    </td>


                    {/* DATE */}

                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                      {formatDate(audit.audit_date)}
                    </td>


                    {/* CONVERSION */}

                    <td className="whitespace-nowrap px-6 py-4">

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getConversionStatusClass(
                          audit.conversion_status
                        )}`}
                      >
                        {
                          conversionStatusLabels[
                          audit.conversion_status
                          ] || audit.conversion_status || "-"
                        }
                      </span>

                    </td>


                    {/* RESULTAT */}

                    <td className="whitespace-nowrap px-6 py-4">

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getOverallStatusClass(
                          audit.overall_status
                        )}`}
                      >

                        {getOverallStatusIcon(
                          audit.overall_status
                        )}

                        {
                          overallStatusLabels[
                          audit.overall_status
                          ] || audit.overall_status || "-"
                        }

                      </span>

                    </td>


                    {/* ACTIONS */}

                    <td className="whitespace-nowrap px-6 py-4">

                      <div className="flex justify-end gap-2">

                        <button
                          type="button"
                          title="Voir"
                          onClick={() => {
                            navigate(`/audits/${audit.uuid}`);
                          }}
                          className="rounded-lg cursor-pointer p-2 text-gray-500 dark:text-slate-400 transition hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-green-700 dark:hover:text-emerald-400"
                        >
                          <Eye size={18} />
                        </button>


                        <button
                          type="button"
                          title="Modifier"
                          onClick={() => {
                            navigate(`/audits/${audit.uuid}/edit`);
                          }}
                          className="rounded-lg cursor-pointer p-2 text-gray-500 dark:text-slate-400 transition hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          <Pencil size={18} />
                        </button>


                        <button
                          type="button"
                          title="Supprimer"
                          onClick={() => openDeleteModal(audit)}
                          className="rounded-lg cursor-pointer p-2 text-gray-500 dark:text-slate-400 transition hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Trash2 size={18} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ======================================================
          COMPTEUR
      ====================================================== */}

      {!loading && (
        <div className="text-sm text-gray-500 dark:text-slate-400">
          {filteredAudits.length} audit
          {filteredAudits.length !== 1 ? "s" : ""} affiché
          {filteredAudits.length !== 1 ? "s" : ""}
        </div>
      )}


      {/* ======================================================
          MODAL SUPPRESSION
      ====================================================== */}

      {showDeleteModal && selectedAudit && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-xl">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400">
                <Trash2 size={21} />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Supprimer l'audit
                </h2>

                <p className="text-sm text-gray-500 dark:text-slate-400">
                  Cette action est irréversible.
                </p>
              </div>

            </div>


            <div className="rounded-lg bg-gray-50 dark:bg-slate-800 p-4">

              <p className="text-sm text-gray-600 dark:text-slate-300">
                Voulez-vous vraiment supprimer l'audit réalisé par :
              </p>

              <p className="mt-1 font-semibold text-gray-800 dark:text-white">
                {selectedAudit.auditor_name || "-"}
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Date : {formatDate(selectedAudit.audit_date)}
              </p>

            </div>


            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="rounded-lg cursor-pointer border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {deleting && (
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />
                )}

                {deleting
                  ? "Suppression..."
                  : "Supprimer"
                }

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}