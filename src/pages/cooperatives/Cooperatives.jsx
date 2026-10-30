import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Building2,
  RefreshCw,
  AlertCircle,
  FileDown,
  LogIn,
} from "lucide-react";

import {
  getAllCooperatives,
  deleteExistingCooperative,
} from "../../services/cooperativeService";
import { downloadCooperativePdf } from "../../utils/cooperativePdf";
import { useAuth } from "../../context/AuthContext";

const Cooperatives = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isBioAuditor = user?.role === "bio_auditor";

  const [cooperatives, setCooperatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCooperative, setSelectedCooperative] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ============================================================
  // CHARGEMENT DES COOPERATIVES
  // ============================================================

  const loadCooperatives = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getAllCooperatives();

      // console.log("RESULTAT API COOPERATIVES :", result);

      const data = Array.isArray(result)
        ? result
        : result?.data || [];

      // console.log("DATA COOPERATIVES :", data);

      setCooperatives(data);
    } catch (err) {
      console.error(
        "Erreur lors du chargement des coopératives :",
        err
      );

      setError(
        err?.response?.data?.error ||
        "Impossible de charger les coopératives."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================

  useEffect(() => {
    loadCooperatives();
  }, []);

  // ============================================================
  // RECHERCHE
  // ============================================================

  const filteredCooperatives = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return cooperatives;
    }

    return cooperatives.filter((cooperative) => {
      return (
        cooperative.name?.toLowerCase().includes(value) ||
        cooperative.president_name
          ?.toLowerCase()
          .includes(value) ||
        cooperative.email
          ?.toLowerCase()
          .includes(value) ||
        cooperative.mobile
          ?.toLowerCase()
          .includes(value) ||
        cooperative.address
          ?.toLowerCase()
          .includes(value)
      );
    });
  }, [cooperatives, search]);

  // ============================================================
  // SUPPRESSION
  // ============================================================

  const handleDeleteClick = (cooperative) => {
    setSelectedCooperative(cooperative);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCooperative) {
      return;
    }

    try {
      setDeleting(true);

      await deleteExistingCooperative(
        selectedCooperative.uuid
      );

      // Retirer la coopérative de la liste sans
      // refaire obligatoirement une requête API.
      setCooperatives((current) =>
        current.filter(
          (cooperative) =>
            cooperative.uuid !== selectedCooperative.uuid
        )
      );

      setShowDeleteModal(false);
      setSelectedCooperative(null);
    } catch (err) {
      console.error(
        "Erreur lors de la suppression :",
        err
      );

      setError(
        err?.response?.data?.error ||
        "Impossible de supprimer cette coopérative."
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (deleting) {
      return;
    }

    setShowDeleteModal(false);
    setSelectedCooperative(null);
  };

  // ============================================================
  // STATUT
  // ============================================================

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Active";

      case "not_active":
        return "Inactive";

      case "na":
        return "N/A";

      default:
        return status || "N/A";
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 dark:bg-emerald-950/70 text-green-700 dark:text-emerald-300 border border-green-200 dark:border-emerald-800/60";

      case "not_active":
        return "bg-red-100 dark:bg-rose-950/70 text-red-700 dark:text-rose-300 border border-red-200 dark:border-rose-800/60";

      case "na":
        return "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700";

      default:
        return "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700";
    }
  };

  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <div className="space-y-6">
      {/* ======================================================
          EN-TÊTE
      ======================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search
            size={19}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
          />
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Rechercher une coopérative..."
            className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-950"
          />
        </div>

        {!isBioAuditor ? (
          <button
            type="button"
            onClick={() => navigate("/cooperatives/new")}
            className="inline-flex items-center cursor-pointer justify-center gap-2 rounded-lg bg-green-700 dark:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 dark:hover:bg-emerald-700"
          >
            <Plus size={18} />
            Nouvelle coopérative
          </button>
        ) : (
          <></>
        )}
      </div>

      {/* ======================================================
          ERREUR
      ======================================================= */}

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-rose-900/60 bg-red-50 dark:bg-rose-950/30 p-4 text-red-700 dark:text-rose-300">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div className="flex-1">
            <p className="font-medium">
              Une erreur est survenue
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
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
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm font-medium text-red-700 dark:text-rose-300 shadow-xs transition hover:bg-red-100 dark:hover:bg-rose-950/50 shrink-0"
          >
            <LogIn size={16} />
            Me reconnecter
          </button>
        </div>
      )}

      {/* ======================================================
          TABLEAU
      ======================================================= */}

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* ----------------------------------------------------
            CHARGEMENT
        ----------------------------------------------------- */}

        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 dark:border-slate-700 border-t-green-700 dark:border-t-emerald-500" />

            <p className="text-sm text-gray-500 dark:text-slate-400">
              Chargement des coopératives...
            </p>
          </div>
        ) : filteredCooperatives.length === 0 ? (
          /* --------------------------------------------------
             AUCUNE DONNÉE
          --------------------------------------------------- */

          <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500">
              <Building2 size={26} />
            </div>

            <h3 className="mt-4 text-base font-semibold text-gray-800 dark:text-slate-200">
              {search
                ? "Aucune coopérative trouvée"
                : "Aucune coopérative enregistrée"}
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-slate-400">
              {search
                ? "Essayez avec un autre terme de recherche."
                : "Commencez par enregistrer votre première coopérative."}
            </p>

            {!search && !isBioAuditor && (
              <button
                type="button"
                onClick={() =>
                  navigate("/cooperatives/new")
                }
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-green-700 dark:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 dark:hover:bg-emerald-700 cursor-pointer shadow-xs"
              >
                <Plus size={18} />

                Ajouter une coopérative
              </button>
            )}
          </div>
        ) : (
          /* --------------------------------------------------
             TABLE
          --------------------------------------------------- */

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
              <thead className="bg-gray-50 dark:bg-slate-800/80">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    Coopérative
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    Président
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    Contact
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    Statut
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredCooperatives.map(
                  (cooperative) => (
                    <tr
                      key={cooperative.uuid}
                      className="transition hover:bg-gray-50 dark:hover:bg-slate-800/50"
                    >
                      {/* COOPERATIVE */}

                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-emerald-950/70 border border-green-200 dark:border-emerald-800/60 font-semibold text-green-700 dark:text-emerald-400">
                            {cooperative.name
                              ?.charAt(0)
                              ?.toUpperCase() || "C"}
                          </div>

                          <div>
                            <p className="font-semibold text-gray-900 dark:text-slate-100">
                              {cooperative.name}
                            </p>

                            <p className="text-xs text-gray-500 dark:text-slate-400">
                              {cooperative.address ||
                                "Adresse non renseignée"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* PRESIDENT */}

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                        {cooperative.president_name ||
                          "Non renseigné"}
                      </td>

                      {/* CONTACT */}

                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-300">
                        <div>
                          {cooperative.mobile && (
                            <p>
                              {cooperative.mobile}
                            </p>
                          )}

                          {cooperative.email && (
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                              {cooperative.email}
                            </p>
                          )}

                          {!cooperative.mobile &&
                            !cooperative.email && (
                              <span className="text-gray-400 dark:text-slate-500">
                                Non renseigné
                              </span>
                            )}
                        </div>
                      </td>

                      {/* STATUT */}

                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                            cooperative.status
                          )}`}
                        >
                          {getStatusLabel(
                            cooperative.status
                          )}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* VOIR */}

                          <button
                            type="button"
                            title="Voir"
                            onClick={() =>
                              navigate(
                                `/cooperatives/${cooperative.uuid}`
                              )
                            }
                            className="rounded-lg cursor-pointer p-2 text-gray-500 dark:text-slate-400 transition hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            <Eye size={18} />
                          </button>

                          {/* TELECHARGER PDF */}

                          <button
                            type="button"
                            title="Télécharger la fiche en PDF"
                            onClick={() =>
                              downloadCooperativePdf(cooperative)
                            }
                            className="rounded-lg cursor-pointer p-2 text-gray-500 dark:text-slate-400 transition hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700 dark:hover:text-emerald-400"
                          >
                            <FileDown size={18} />
                          </button>

                          {/* MODIFIER & SUPPRIMER (Masqués pour auditeur bio) */}
                          {!isBioAuditor && (
                            <>
                              <button
                                type="button"
                                title="Modifier"
                                onClick={() =>
                                  navigate(
                                    `/cooperatives/${cooperative.uuid}/edit`
                                  )
                                }
                                className="rounded-lg cursor-pointer p-2 text-gray-500 dark:text-slate-400 transition hover:bg-green-50 dark:hover:bg-emerald-950/50 hover:text-green-600 dark:hover:text-emerald-400"
                              >
                                <Pencil size={18} />
                              </button>

                              <button
                                type="button"
                                title="Supprimer"
                                onClick={() =>
                                  handleDeleteClick(
                                    cooperative
                                  )
                                }
                                className="rounded-lg p-2 cursor-pointer text-gray-500 dark:text-slate-400 transition hover:bg-red-50 dark:hover:bg-rose-950/50 hover:text-red-600 dark:hover:text-rose-400"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ======================================================
          FOOTER DU TABLEAU
      ======================================================= */}

      {!loading &&
        filteredCooperatives.length > 0 && (
          <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {filteredCooperatives.length}{" "}
              coopérative
              {filteredCooperatives.length > 1
                ? "s"
                : ""}{" "}
              affichée
              {filteredCooperatives.length > 1
                ? "s"
                : ""}
            </p>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-green-700 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Effacer la recherche
              </button>
            )}
          </div>
        )}

      {/* ======================================================
          MODAL DE SUPPRESSION
      ======================================================= */}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-rose-950/60 text-red-600 dark:text-rose-400">
                <Trash2 size={21} />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Supprimer la coopérative ?
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-slate-400">
                  Vous êtes sur le point de supprimer
                  la coopérative{" "}
                  <span className="font-semibold text-gray-800 dark:text-slate-200">
                    {selectedCooperative?.name}
                  </span>
                  .
                </p>

                <p className="mt-2 text-sm text-red-600 dark:text-rose-400">
                  Cette action est irréversible.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteCancel}
                className="rounded-lg border cursor-pointer border-gray-300 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteConfirm}
                className="inline-flex items-center gap-2 cursor-pointer rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 size={17} />

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

export default Cooperatives;