import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Plus,
    Search,
    Eye,
    Pencil,
    Trash2,
    Map as MapIcon,
    RefreshCw,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

import {
    getAllMyParcels,
    deleteExistingParcel,
} from "../../services/parcelService";
import { useAuth } from "../../context/AuthContext";

function Parcels() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isBioAuditor = user?.role === "bio_auditor";

    const [parcels, setParcels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedCooperative, setSelectedCooperative] = useState("all");

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedParcel, setSelectedParcel] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // ============================================================
    // PAGINATION (Test avec 2 parcelles par page)
    // ============================================================
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    // ============================================================
    // CHARGEMENT DES PARCELLES
    // ============================================================

    const loadParcels = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const result = await getAllMyParcels();

            setParcels(result?.data || []);
            console.log("📦 Parcelles chargées :", result?.data || []);

        } catch (error) {

            console.error(
                "Erreur lors du chargement des parcelles :",
                error
            );

            toast.error(
                error?.response?.data?.error ||
                error?.message ||
                "Impossible de charger les parcelles."
            );

        } finally {

            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadParcels();
    }, []);

    // ============================================================
    // RECHERCHE
    // ============================================================

    // ============================================================
    // COOPÉRATIVES DISPONIBLES DANS LES PARCELLES
    // ============================================================

    const cooperativeOptions = useMemo(() => {
        const cooperativesMap = new Map();

        parcels.forEach((parcel) => {
            const cooperativeId = parcel.cooperative_id;
            const cooperativeName = parcel.cooperative?.name;

            if (cooperativeId && cooperativeName) {
                cooperativesMap.set(cooperativeId, {
                    id: cooperativeId,
                    name: cooperativeName,
                });
            }
        });

        return Array.from(cooperativesMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name, "fr")
        );
    }, [parcels]);

    // ============================================================
    // RECHERCHE ET FILTRE PAR COOPÉRATIVE
    // ============================================================

    const filteredParcels = useMemo(() => {
        const value = search.trim().toLowerCase();

        return parcels.filter((parcel) => {
            // Filtre par coopérative
            const matchesCooperative =
                selectedCooperative === "all" ||
                parcel.cooperative_id === selectedCooperative;

            // Filtre par recherche
            const matchesSearch =
                !value ||
                [
                    parcel.name,
                    parcel.uuid,
                    parcel.farmer_id,
                    parcel.farmer?.full_name,
                    parcel.cooperative?.name,
                    parcel.area_ha,
                    parcel.created_at,
                ]
                    .filter(
                        (field) =>
                            field !== null &&
                            field !== undefined &&
                            field !== ""
                    )
                    .some((field) =>
                        String(field).toLowerCase().includes(value)
                    );

            return matchesCooperative && matchesSearch;
        });
    }, [parcels, search, selectedCooperative]);

    // Réinitialiser la page courante à 1 si la recherche ou le filtre de coopérative change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedCooperative]);

    const totalPages = Math.ceil(filteredParcels.length / itemsPerPage) || 1;
    const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

    const paginatedParcels = useMemo(() => {
        const startIndex = (safeCurrentPage - 1) * itemsPerPage;
        return filteredParcels.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredParcels, safeCurrentPage, itemsPerPage]);

    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (safeCurrentPage <= 4) {
            return [1, 2, 3, 4, 5, "...", totalPages];
        }
        if (safeCurrentPage >= totalPages - 3) {
            return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }
        return [1, "...", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "...", totalPages];
    };

    // ============================================================
    // SUPPRESSION
    // ============================================================

    const openDeleteModal = (parcel) => {
        setSelectedParcel(parcel);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedParcel) return;

        try {
            setDeleting(true);

            await deleteExistingParcel(
                selectedParcel.cooperative_id,
                selectedParcel.uuid
            );

            setParcels((current) =>
                current.filter(
                    (parcel) => parcel.uuid !== selectedParcel.uuid
                )
            );

            toast.success("Parcelle supprimée avec succès.");

            setShowDeleteModal(false);
            setSelectedParcel(null);
        } catch (error) {
            console.error(
                "Erreur lors de la suppression :",
                error
            );

            toast.error(
                error?.response?.data?.error ||
                error?.message ||
                "Impossible de supprimer cette parcelle."
            );
        } finally {
            setDeleting(false);
        }
    };

    // ============================================================
    // FORMATAGE
    // ============================================================

    const formatArea = (area) => {
        if (area === null || area === undefined || area === "") {
            return "—";
        }

        const number = Number(area);

        if (Number.isNaN(number)) {
            return "—";
        }

        return `${number.toFixed(2)} ha`;
    };

    const formatDate = (date) => {
        if (!date) {
            return "—";
        }

        return new Date(date).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    // ============================================================
    // RENDU
    // ============================================================

    return (
        <div className="space-y-6">
            {/* ======================================================
          EN-TÊTE
      ====================================================== */}

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Filtres et recherche (à gauche) */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Recherche */}
                    <div className="relative w-full sm:w-64 md:w-72">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher une parcelle..."
                            className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-950"
                        />
                    </div>

                    {/* Filtre par coopérative */}
                    <div className="w-full sm:w-56 md:w-64">
                        <select
                            value={selectedCooperative}
                            onChange={(e) => setSelectedCooperative(e.target.value)}
                            aria-label="Filtrer par coopérative"
                            className="w-full cursor-pointer rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-950"
                        >
                            <option value="all">Toutes les coopératives</option>

                            {cooperativeOptions.map((cooperative) => (
                                <option key={cooperative.id} value={cooperative.id}>
                                    {cooperative.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Actualiser */}
                    <button
                        type="button"
                        onClick={() => loadParcels(true)}
                        disabled={refreshing || loading}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw
                            size={17}
                            className={refreshing ? "animate-spin" : ""}
                        />
                        <span>Actualiser</span>
                    </button>
                </div>

                {/* Bouton Ajouter (à droite) ou badge mode inspection */}
                <div className="flex justify-end">
                    {!isBioAuditor ? (
                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    `/parcels/new`
                                )
                            }
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-green-700 dark:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 dark:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus size={18} />
                            <span>Ajouter une parcelle</span>
                        </button>
                    ) : (
                        <></>
                    )}
                </div>
            </div>

            {/* ======================================================
          CONTENU
      ====================================================== */}

            <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                {loading ? (
                    <div className="flex min-h-[350px] items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 dark:border-slate-700 border-t-green-700 dark:border-t-emerald-500" />

                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                Chargement des parcelles...
                            </p>
                        </div>
                    </div>
                ) : filteredParcels.length === 0 ? (
                    <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
                        {search.trim() || selectedCooperative !== "all" ? (
                            <>
                                <Search
                                    size={42}
                                    className="mb-4 text-gray-300 dark:text-slate-600"
                                />

                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Aucune parcelle trouvée
                                </h3>

                                <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-slate-400">
                                    Aucune parcelle ne correspond à votre
                                    recherche.
                                </p>
                            </>
                        ) : (
                            <>
                                <MapIcon
                                    size={42}
                                    className="mb-4 text-gray-300 dark:text-slate-600"
                                />

                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Aucune parcelle enregistrée
                                </h3>

                                <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-slate-400">
                                    Commencez par ajouter une parcelle
                                    agricole.
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            `/parcels/new`
                                        )
                                    }
                                    className="mt-5 cursor-pointer inline-flex items-center gap-2 rounded-lg bg-green-700 dark:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 dark:hover:bg-emerald-700"
                                >
                                    <Plus size={18} />
                                    Ajouter une parcelle
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        {/* ==================================================
                VERSION DESKTOP
            ================================================== */}

                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/80">

                                        {/* Parcelle */}
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                                            Parcelle
                                        </th>

                                        {/* Coopérative */}
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                                            Coopérative
                                        </th>

                                        {/* Agriculteur */}
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                                            Agriculteur
                                        </th>

                                        {/* Superficie */}
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                                            Superficie
                                        </th>

                                        {/* Date */}
                                        <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                                            Créée le
                                        </th>

                                        {/* Actions */}
                                        <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginatedParcels.map((parcel) => (
                                        <tr
                                            key={parcel.uuid}
                                            className="border-b border-gray-50 dark:border-slate-800/60 transition hover:bg-gray-50/50 dark:hover:bg-slate-800/50"
                                        >

                                            {/* ========================= */}
                                            {/* PARCELLE */}
                                            {/* ========================= */}

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">

                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-emerald-950/70 border border-green-200/80 dark:border-emerald-800/50 text-green-700 dark:text-emerald-400">
                                                        <MapIcon size={19} />
                                                    </div>

                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-slate-100">
                                                            {parcel.name || "Parcelle"}
                                                        </p>

                                                        <p className="max-w-[180px] truncate text-xs text-gray-400 dark:text-slate-500">
                                                            {parcel.uuid}
                                                        </p>
                                                    </div>

                                                </div>
                                            </td>

                                            {/* ========================= */}
                                            {/* COOPÉRATIVE */}
                                            {/* ========================= */}

                                            <td className="px-6 py-4">
                                                <p className="max-w-[180px] truncate text-sm font-medium text-gray-900 dark:text-slate-100">
                                                    {parcel.cooperative?.name || "—"}
                                                </p>

                                                {parcel.cooperative?.president_name && (
                                                    <p className="max-w-[180px] truncate text-xs text-gray-400 dark:text-slate-500">
                                                        {parcel.cooperative.president_name}
                                                    </p>
                                                )}
                                            </td>

                                            {/* ========================= */}
                                            {/* AGRICULTEUR */}
                                            {/* ========================= */}

                                            <td className="px-6 py-4">
                                                <p className="max-w-[180px] truncate text-sm text-gray-600 dark:text-slate-300">
                                                    {parcel.farmer?.full_name || "—"}
                                                </p>
                                            </td>

                                            {/* ========================= */}
                                            {/* SUPERFICIE */}
                                            {/* ========================= */}

                                            <td className="px-6 py-4">
                                                <span className="rounded-lg bg-green-50 dark:bg-emerald-950/60 border border-green-200/80 dark:border-emerald-800/60 px-2.5 py-1 text-xs font-semibold text-green-800 dark:text-emerald-300">
                                                    {formatArea(parcel.area_ha)}
                                                </span>
                                            </td>

                                            {/* ========================= */}
                                            {/* DATE */}
                                            {/* ========================= */}

                                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                                                {formatDate(parcel.created_at)}
                                            </td>

                                            {/* ========================= */}
                                            {/* ACTIONS */}
                                            {/* ========================= */}

                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-2">

                                                    {/* Voir */}
                                                    <button
                                                        type="button"
                                                        title="Voir"
                                                        onClick={() =>
                                                            navigate(
                                                                `/parcels/${parcel.uuid}?cooperative_id=${parcel.cooperative_id}`
                                                            )
                                                        }
                                                        className="rounded-lg cursor-pointer p-2 text-gray-500 dark:text-slate-400 transition hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100"
                                                    >
                                                        <Eye size={18} />
                                                    </button>

                                                    {/* Modifier et Supprimer (Masqués pour auditeur bio) */}
                                                    {!isBioAuditor && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                title="Modifier"
                                                                onClick={() => {
                                                                    const targetCoop = parcel.cooperative_id || parcel.cooperative?.uuid || cooperativeId;
                                                                    navigate(
                                                                        `/parcels/${parcel.uuid}/edit${targetCoop ? `?cooperative_id=${targetCoop}` : ""}`
                                                                    );
                                                                }}
                                                                className="rounded-lg cursor-pointer p-2 text-gray-500 dark:text-slate-400 transition hover:bg-green-50 dark:hover:bg-emerald-950/50 hover:text-green-700 dark:hover:text-emerald-400"
                                                            >
                                                                <Pencil size={18} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                title="Supprimer"
                                                                onClick={() =>
                                                                    openDeleteModal(parcel)
                                                                }
                                                                className="rounded-lg cursor-pointer p-2 text-gray-500 dark:text-slate-400 transition hover:bg-red-50 dark:hover:bg-rose-950/50 hover:text-red-600 dark:hover:text-rose-400"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </>
                                                    )}

                                                </div>
                                            </td>

                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ==================================================
                VERSION MOBILE
            ================================================== */}

                        <div className="divide-y divide-gray-100 dark:divide-slate-800 md:hidden">
                            {paginatedParcels.map((parcel) => (
                                <div
                                    key={parcel.uuid}
                                    className="p-5"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-emerald-950/70 border border-green-200/80 dark:border-emerald-800/50 text-green-700 dark:text-emerald-400">
                                                <MapIcon size={19} />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-900 dark:text-slate-100">
                                                    {parcel.name || "Parcelle"}
                                                </p>

                                                <p className="truncate text-xs text-gray-400 dark:text-slate-500">
                                                    {parcel.uuid}
                                                </p>
                                            </div>
                                        </div>

                                        <span className="shrink-0 rounded-lg bg-green-50 dark:bg-emerald-950/60 border border-green-200/80 dark:border-emerald-800/60 px-2.5 py-1 text-xs font-semibold text-green-800 dark:text-emerald-300">
                                            {formatArea(parcel.area_ha)}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-400 dark:text-slate-500">
                                                Agriculteur
                                            </p>

                                            <p className="mt-1 truncate text-sm font-medium text-gray-700 dark:text-slate-300">
                                                {parcel.farmer?.full_name || parcel.farmer_id || "—"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-400 dark:text-slate-500">
                                                Coopérative
                                            </p>

                                            <p className="mt-1 truncate text-sm text-gray-600 dark:text-slate-300">
                                                {parcel.cooperative?.name || "—"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/parcels/${parcel.uuid}?cooperative_id=${parcel.cooperative_id}`
                                                )
                                            }
                                            className="rounded-lg p-2 text-gray-500 dark:text-slate-400 transition hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-100 cursor-pointer"
                                        >
                                            <Eye size={18} />
                                        </button>

                                        {/* Modifier et Supprimer Mobile (Masqués pour auditeur bio) */}
                                        {!isBioAuditor && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const targetCoop = parcel.cooperative_id || parcel.cooperative?.uuid || cooperativeId;
                                                        navigate(
                                                            `/parcels/${parcel.uuid}/edit${targetCoop ? `?cooperative_id=${targetCoop}` : ""}`
                                                        );
                                                    }}
                                                    className="rounded-lg p-2 text-gray-500 dark:text-slate-400 transition hover:bg-green-50 dark:hover:bg-emerald-950/50 hover:text-green-700 dark:hover:text-emerald-400 cursor-pointer"
                                                >
                                                    <Pencil size={18} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openDeleteModal(parcel)
                                                    }
                                                    className="rounded-lg p-2 text-gray-500 dark:text-slate-400 transition hover:bg-red-50 dark:hover:bg-rose-950/50 hover:text-red-600 dark:hover:text-rose-400 cursor-pointer"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ==================================================
                FOOTER & PAGINATION
            ================================================== */}

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/60 px-6 py-4">
                            {/* Informations de comptage à gauche */}
                            <div className="flex flex-wrap items-center gap-3">
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    Affichage de{" "}
                                    <span className="font-semibold text-gray-800 dark:text-slate-200">
                                        {filteredParcels.length === 0 ? 0 : (safeCurrentPage - 1) * itemsPerPage + 1}
                                    </span>{" "}
                                    à{" "}
                                    <span className="font-semibold text-gray-800 dark:text-slate-200">
                                        {Math.min(safeCurrentPage * itemsPerPage, filteredParcels.length)}
                                    </span>{" "}
                                    sur{" "}
                                    <span className="font-semibold text-gray-800 dark:text-slate-200">
                                        {filteredParcels.length}
                                    </span>{" "}
                                    parcelle{filteredParcels.length > 1 ? "s" : ""}
                                </p>

                                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
                                    <span>•</span>
                                    <span>{itemsPerPage} par page</span>
                                </div>
                            </div>

                            {/* Contrôle de pagination aligné en bas à droite */}
                            {totalPages > 1 && (
                                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                    {/* Bouton Page précédente */}
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={safeCurrentPage === 1}
                                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 shadow-xs transition hover:bg-gray-100 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                                        title="Page précédente"
                                        aria-label="Page précédente"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>

                                    {/* Numéros de page */}
                                    <div className="flex items-center gap-1">
                                        {getPageNumbers().map((pageItem, idx) =>
                                            pageItem === "..." ? (
                                                <span key={`dots-${idx}`} className="px-1.5 text-xs text-gray-400 dark:text-slate-500">
                                                    ...
                                                </span>
                                            ) : (
                                                <button
                                                    key={pageItem}
                                                    type="button"
                                                    onClick={() => setCurrentPage(pageItem)}
                                                    className={`h-8 min-w-[32px] cursor-pointer rounded-lg px-2 text-xs font-semibold transition ${
                                                        safeCurrentPage === pageItem
                                                            ? "bg-green-700 dark:bg-emerald-600 text-white shadow-xs"
                                                            : "border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                                                    }`}
                                                >
                                                    {pageItem}
                                                </button>
                                            )
                                        )}
                                    </div>

                                    {/* Bouton Page suivante */}
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={safeCurrentPage === totalPages}
                                        className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 shadow-xs transition hover:bg-gray-100 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                                        title="Page suivante"
                                        aria-label="Page suivante"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* ======================================================
          MODALE DE SUPPRESSION
      ====================================================== */}

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-xl">
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-rose-950/60 text-red-600 dark:text-rose-400">
                                <AlertCircle size={23} />
                            </div>

                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Supprimer la parcelle ?
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-slate-400">
                                    Cette action est définitive. La parcelle
                                    sera supprimée de la base de données.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedParcel(null);
                                }}
                                disabled={deleting}
                                className="rounded-xl cursor-pointer border border-gray-200 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"
                            >
                                Annuler
                            </button>

                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
                                disabled={deleting}
                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deleting && (
                                    <RefreshCw
                                        size={16}
                                        className="animate-spin"
                                    />
                                )}

                                {deleting
                                    ? "Suppression..."
                                    : "Supprimer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Parcels;