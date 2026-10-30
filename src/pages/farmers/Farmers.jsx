import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    Plus,
    Search,
    Eye,
    Pencil,
    Trash2,
    Users,
    RefreshCw,
    AlertCircle,
    Building2,
    LogIn,
} from "lucide-react";

import {
    getAllFarmers,
    getAllFarmersByCooperative,
    deleteExistingFarmer,
} from "../../services/farmerService";

import { getAllCooperatives } from "../../services/cooperativeService";

import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const Farmers = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user, logout } = useAuth();
    const isBioAuditor = user?.role === "bio_auditor";

    // ============================================================
    // ÉTATS
    // ============================================================

    const [cooperatives, setCooperatives] = useState([]);
    const [cooperativeId, setCooperativeId] = useState(
        searchParams.get("cooperative_id") || ""
    );

    const [loadingCooperatives, setLoadingCooperatives] =
        useState(true);

    const [farmers, setFarmers] = useState([]);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const [showDeleteModal, setShowDeleteModal] =
        useState(false);

    const [selectedFarmer, setSelectedFarmer] =
        useState(null);

    const [deleting, setDeleting] = useState(false);

    // ============================================================
    // CHARGER LES COOPÉRATIVES
    // ============================================================

    const loadCooperatives = async () => {
        try {
            setLoadingCooperatives(true);
            setError("");

            const result = await getAllCooperatives();

            console.log("Coopératives chargées :", result);

            const data = Array.isArray(result)
                ? result
                : result?.data || [];

            setCooperatives(data);

            // ----------------------------------------------------
            // Si une coopérative est déjà présente dans l'URL
            // et existe dans la liste, on la conserve.
            // ----------------------------------------------------

            const cooperativeFromUrl =
                searchParams.get("cooperative_id");

            if (
                cooperativeFromUrl &&
                data.some(
                    (cooperative) =>
                        cooperative.uuid === cooperativeFromUrl
                )
            ) {
                setCooperativeId(cooperativeFromUrl);
            } else {
                setCooperativeId("");
            }
        } catch (err) {
            console.error(
                "Erreur lors du chargement des coopératives :",
                err
            );

            setCooperatives([]);
            setCooperativeId("");

            toast.error(
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                "Impossible de charger les coopératives."
            );
        } finally {
            setLoadingCooperatives(false);
        }
    };

    // ============================================================
    // CHARGER LES AGRICULTEURS
    // ============================================================

    const loadFarmers = async () => {
        try {
            setLoading(true);
            setError("");

            let result;
            if (cooperativeId) {
                result = await getAllFarmersByCooperative(
                    cooperativeId
                );
            } else {
                result = await getAllFarmers();
            }

            console.log(
                "Agriculteurs chargés :",
                result
            );

            const data = Array.isArray(result)
                ? result
                : result?.data || [];

            setFarmers(data);
        } catch (err) {
            console.error(
                "Erreur lors du chargement des agriculteurs :",
                err
            );

            setFarmers([]);

            toast.error(
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                "Impossible de charger les agriculteurs."
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
    // CHARGER LES AGRICULTEURS (TOUS OU PAR COOPÉRATIVE)
    // ============================================================

    useEffect(() => {
        loadFarmers();
    }, [cooperativeId]);

    // ============================================================
    // CHANGEMENT DE COOPÉRATIVE
    // ============================================================

    const handleCooperativeChange = (event) => {
        const value = event.target.value;

        setCooperativeId(value);
        setSearch("");
        setError("");

        if (value) {
            navigate(`/farmers?cooperative_id=${value}`, {
                replace: true,
            });
        } else {
            navigate("/farmers", {
                replace: true,
            });
        }
    };

    // ============================================================
    // COOPÉRATIVE SÉLECTIONNÉE
    // ============================================================

    const selectedCooperative = useMemo(() => {
        return cooperatives.find(
            (cooperative) =>
                cooperative.uuid === cooperativeId
        );
    }, [cooperatives, cooperativeId]);

    // ============================================================
    // RECHERCHE
    // ============================================================

    const filteredFarmers = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) {
            return farmers;
        }

        return farmers.filter((farmer) => {
            return (
                farmer.full_name
                    ?.toLowerCase()
                    .includes(value) ||
                farmer.id_card
                    ?.toLowerCase()
                    .includes(value) ||
                farmer.phone
                    ?.toLowerCase()
                    .includes(value) ||
                farmer.gender
                    ?.toLowerCase()
                    .includes(value) ||
                farmer.marital_status
                    ?.toLowerCase()
                    .includes(value) ||
                farmer.status
                    ?.toLowerCase()
                    .includes(value) ||
                farmer.cooperative?.name
                    ?.toLowerCase()
                    .includes(value)
            );
        });
    }, [farmers, search]);

    // ============================================================
    // SUPPRESSION
    // ============================================================

    const handleDeleteClick = (farmer) => {
        setSelectedFarmer(farmer);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedFarmer) {
            return;
        }

        const coopId = selectedFarmer.cooperative_id || cooperativeId;

        if (!coopId) {
            toast.error(
                "Coopérative introuvable pour cet agriculteur."
            );
            return;
        }

        try {
            setDeleting(true);

            await deleteExistingFarmer(
                coopId,
                selectedFarmer.uuid
            );

            setFarmers((current) =>
                current.filter(
                    (farmer) =>
                        farmer.uuid !==
                        selectedFarmer.uuid
                )
            );

            toast.success(
                "Agriculteur supprimé avec succès."
            );

            setShowDeleteModal(false);
            setSelectedFarmer(null);
        } catch (err) {
            console.error(
                "Erreur lors de la suppression :",
                err
            );

            toast.error(
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                err?.message ||
                "Impossible de supprimer cet agriculteur."
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
        setSelectedFarmer(null);
    };

    // ============================================================
    // SEXE
    // ============================================================

    const getGenderLabel = (gender) => {
        switch (gender) {
            case "male":
                return "Homme";

            case "female":
                return "Femme";

            default:
                return gender || "N/A";
        }
    };

    // ============================================================
    // SITUATION MATRIMONIALE
    // ============================================================

    const getMaritalStatusLabel = (status) => {
        switch (status) {
            case "married":
                return "Marié(e)";

            case "single":
                return "Célibataire";

            case "divorced":
                return "Divorcé(e)";

            case "widowed":
                return "Veuf / Veuve";

            default:
                return status || "N/A";
        }
    };

    // ============================================================
    // STATUT
    // ============================================================

    const getStatusLabel = (status) => {
        switch (status) {
            case "active":
                return "Actif";

            case "not_active":
                return "Inactif";

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
    // RENDU
    // ============================================================

    return (
        <div className="space-y-6">

            {/* ======================================================
                EN-TÊTE
            ======================================================= */}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>
                    <div className="flex items-center gap-3">


                        <div className="flex flex-col gap-3 md:flex-row md:items-center">

                            <div className="flex-1">

                                <select
                                    value={cooperativeId}
                                    onChange={
                                        handleCooperativeChange
                                    }
                                    disabled={
                                        loadingCooperatives
                                    }
                                    className="w-full cursor-pointer rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-gray-700 dark:text-slate-200 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-950 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-slate-800"
                                >

                                    <option value="">
                                        {loadingCooperatives
                                            ? "Chargement des coopératives..."
                                            : "Toutes les coopératives"}
                                    </option>

                                    {cooperatives.map(
                                        (cooperative) => (
                                            <option
                                                key={
                                                    cooperative.uuid
                                                }
                                                value={
                                                    cooperative.uuid
                                                }
                                            >
                                                {cooperative.name}
                                            </option>
                                        )
                                    )}

                                </select>

                            </div>

                        </div>

                        <div className="relative">

                            <Search
                                size={19}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Rechercher un agriculteur..."
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-950"
                            />

                        </div>

                        {/* {selectedCooperative ? (
                            <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                                <span className="font-medium">
                                    Coopérative sélectionnée :
                                </span>{" "}
                                {selectedCooperative.name}
                            </div>
                        ) : (
                            <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                                <span className="font-medium">
                                    Filtre :
                                </span>{" "}
                                Toutes les coopératives ({farmers.length} agriculteur{farmers.length > 1 ? "s" : ""})
                            </div>
                        )} */}



                    </div>

                </div>

                {!isBioAuditor ? (
                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                cooperativeId
                                    ? `/farmers/new?cooperative_id=${cooperativeId}`
                                    : `/farmers/new`
                            )
                        }
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-green-700 dark:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 dark:hover:bg-emerald-700"
                    >
                        <Plus size={18} />

                        Nouvel agriculteur
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
                AUCUNE COOPÉRATIVE
            ======================================================= */}

            {!loadingCooperatives &&
                cooperatives.length === 0 && (
                    <div className="flex min-h-[250px] flex-col items-center justify-center rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 text-center shadow-sm">

                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500">
                            <Building2 size={26} />
                        </div>

                        <h3 className="mt-4 text-base font-semibold text-gray-800 dark:text-slate-200">
                            Aucune coopérative disponible
                        </h3>

                        <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-slate-400">
                            Vous devez d'abord enregistrer
                            une coopérative avant d'ajouter
                            des agriculteurs.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/cooperatives/new"
                                )
                            }
                            className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-green-700 dark:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 dark:hover:bg-emerald-700"
                        >
                            <Plus size={18} />

                            Ajouter une coopérative
                        </button>

                    </div>
                )}

            {/* ======================================================
                CONTENU DES AGRICULTEURS
            ======================================================= */}

            {/* ==================================================
                        TABLEAU
                    =================================================== */}

            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">

                {loading ? (

                    <div className="flex min-h-[300px] flex-col items-center justify-center gap-3">

                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 dark:border-slate-700 border-t-green-700 dark:border-t-emerald-500" />

                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            Chargement des agriculteurs...
                        </p>

                    </div>

                ) : filteredFarmers.length === 0 ? (

                    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500">
                            <Users size={26} />
                        </div>

                        <h3 className="mt-4 text-base font-semibold text-gray-800 dark:text-slate-200">
                            {search
                                ? "Aucun agriculteur trouvé"
                                : "Aucun agriculteur enregistré"}
                        </h3>

                        <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-slate-400">
                            {search
                                ? "Essayez avec un autre terme de recherche."
                                : cooperativeId
                                    ? "Commencez par enregistrer votre premier agriculteur dans cette coopérative."
                                    : "Commencez par enregistrer votre premier agriculteur."}
                        </p>

                        {!search && (
                            <button
                                type="button"
                                onClick={() =>
                                    navigate(
                                        cooperativeId
                                            ? `/farmers/new?cooperative_id=${cooperativeId}`
                                            : `/farmers/new`
                                    )
                                }
                                className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-green-700 dark:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800 dark:hover:bg-emerald-700"
                            >
                                <Plus size={18} />

                                Ajouter un agriculteur
                            </button>
                        )}

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">

                            <thead className="bg-gray-50 dark:bg-slate-800/80">

                                <tr>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        Agriculteur
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        Coopérative
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        Sexe
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        Naissance
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        Situation familiale
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        Ménage
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

                                {filteredFarmers.map(
                                    (farmer) => (

                                        <tr
                                            key={
                                                farmer.uuid
                                            }
                                            className="transition hover:bg-gray-50 dark:hover:bg-slate-800/50"
                                        >

                                            {/* AGRICULTEUR */}

                                            <td className="whitespace-nowrap px-6 py-4">

                                                <div className="flex items-center gap-3">

                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-emerald-950/70 border border-green-200 dark:border-emerald-800/50 font-semibold text-green-700 dark:text-emerald-400">
                                                        {farmer.full_name
                                                            ?.charAt(
                                                                0
                                                            )
                                                            ?.toUpperCase() ||
                                                            "A"}
                                                    </div>

                                                    <div>

                                                        <p className="font-semibold text-gray-900 dark:text-slate-100">
                                                            {
                                                                farmer.full_name
                                                            }
                                                        </p>

                                                        <p className="text-xs text-gray-500 dark:text-slate-400">
                                                            {farmer.id_card
                                                                ? `CIN : ${farmer.id_card}`
                                                                : "CIN non renseignée"}
                                                        </p>

                                                        {farmer.phone && (
                                                            <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                                                <span>📱</span>
                                                                <span>{farmer.phone}</span>
                                                            </p>
                                                        )}

                                                    </div>

                                                </div>

                                            </td>

                                            {/* COOPÉRATIVE */}
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                                                <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-slate-300 border border-gray-200/80 dark:border-slate-700/80">
                                                    <Building2 size={13} className="text-gray-500 dark:text-slate-400" />
                                                    {farmer.cooperative?.name ||
                                                        cooperatives.find((c) => c.uuid === farmer.cooperative_id)?.name ||
                                                        "—"}
                                                </span>
                                            </td>

                                            {/* SEXE */}

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                                                {getGenderLabel(
                                                    farmer.gender
                                                )}
                                            </td>

                                            {/* NAISSANCE */}

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                                                {farmer.year_of_birth ||
                                                    "Non renseignée"}
                                            </td>

                                            {/* SITUATION */}

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                                                {getMaritalStatusLabel(
                                                    farmer.marital_status
                                                )}
                                            </td>

                                            {/* MÉNAGE */}

                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-slate-300">
                                                {farmer.household_number ??
                                                    "N/A"}
                                            </td>

                                            {/* STATUT */}

                                            <td className="whitespace-nowrap px-6 py-4">

                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                                                        farmer.status
                                                    )}`}
                                                >
                                                    {getStatusLabel(
                                                        farmer.status
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
                                                                `/farmers/${farmer.uuid}?cooperative_id=${farmer.cooperative_id || cooperativeId}`
                                                            )
                                                        }
                                                        className="cursor-pointer rounded-lg p-2 text-gray-500 dark:text-slate-400 transition hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400"
                                                    >
                                                        <Eye
                                                            size={
                                                                18
                                                            }
                                                        />
                                                    </button>

                                                    {/* MODIFIER & SUPPRIMER (Masqués pour auditeur bio) */}
                                                    {!isBioAuditor && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                title="Modifier"
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/farmers/${farmer.uuid}/edit?cooperative_id=${farmer.cooperative_id || cooperativeId}`
                                                                    )
                                                                }
                                                                className="cursor-pointer rounded-lg p-2 text-gray-500 dark:text-slate-400 transition hover:bg-green-50 dark:hover:bg-emerald-950/50 hover:text-green-600 dark:hover:text-emerald-400"
                                                            >
                                                                <Pencil
                                                                    size={
                                                                        18
                                                                    }
                                                                />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                title="Supprimer"
                                                                onClick={() =>
                                                                    handleDeleteClick(
                                                                        farmer
                                                                    )
                                                                }
                                                                className="cursor-pointer rounded-lg p-2 text-gray-500 dark:text-slate-400 transition hover:bg-red-50 dark:hover:bg-rose-950/50 hover:text-red-600 dark:hover:text-rose-400"
                                                            >
                                                                <Trash2
                                                                    size={
                                                                        18
                                                                    }
                                                                />
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

            {/* ==================================================
                        FOOTER
                    =================================================== */}

            {!loading &&
                filteredFarmers.length > 0 && (

                    <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">

                        <p>
                            {filteredFarmers.length}{" "}
                            agriculteur
                            {filteredFarmers.length >
                                1
                                ? "s"
                                : ""}{" "}
                            affiché
                            {filteredFarmers.length >
                                1
                                ? "s"
                                : ""}
                        </p>

                        {search && (
                            <button
                                type="button"
                                onClick={() =>
                                    setSearch("")
                                }
                                className="text-green-700 dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                                Effacer la recherche
                            </button>
                        )}

                    </div>

                )}

            {/* ======================================================
                MODAL SUPPRESSION
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
                                    Supprimer l'agriculteur ?
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-slate-400">

                                    Vous êtes sur le point de
                                    supprimer l'agriculteur{" "}

                                    <span className="font-semibold text-gray-800 dark:text-slate-200">
                                        {
                                            selectedFarmer?.full_name
                                        }
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
                                onClick={
                                    handleDeleteCancel
                                }
                                className="cursor-pointer rounded-lg border border-gray-300 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Annuler
                            </button>

                            <button
                                type="button"
                                disabled={deleting}
                                onClick={
                                    handleDeleteConfirm
                                }
                                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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

export default Farmers;