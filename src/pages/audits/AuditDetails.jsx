import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Pencil,
    Trash2,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    XCircle,
    CalendarDays,
    User,
    MapPin,
    ShieldCheck,
    FileCheck2,
    Warehouse,
    ClipboardCheck,
} from "lucide-react";

import { getAuditById, deleteAudit } from "../../api/audits";
import toast from "react-hot-toast";


// ============================================================
// LABELS
// ============================================================

const conversionStatusLabels = {
    not_started: "Non commencé",
    in_conversion: "En conversion",
    certified: "Certifié",
};

const contaminationRiskLabels = {
    low: "Faible",
    medium: "Moyen",
    high: "Élevé",
};

const severityLabels = {
    none: "Aucune",
    minor: "Mineure",
    major: "Majeure",
    critical: "Critique",
};

const overallStatusLabels = {
    compliant: "Conforme",
    non_compliant: "Non conforme",
    compliant_with_reservations: "Conforme avec réserves",
};


// ============================================================
// HELPERS
// ============================================================

const formatDate = (date) => {
    if (!date) return "Non renseignée";

    try {
        return new Date(date).toLocaleDateString("fr-FR");
    } catch {
        return date;
    }
};


const getOverallStatusClass = (status) => {
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
};


const getRiskClass = (risk) => {
    switch (risk) {
        case "low":
            return "bg-green-100 dark:bg-emerald-950/70 text-green-700 dark:text-emerald-300";

        case "medium":
            return "bg-yellow-100 dark:bg-amber-950/70 text-yellow-700 dark:text-amber-300";

        case "high":
            return "bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300";

        default:
            return "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300";
    }
};


const getSeverityClass = (severity) => {
    switch (severity) {
        case "none":
            return "bg-green-100 dark:bg-emerald-950/70 text-green-700 dark:text-emerald-300";

        case "minor":
            return "bg-yellow-100 dark:bg-amber-950/70 text-yellow-700 dark:text-amber-300";

        case "major":
            return "bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300";

        case "critical":
            return "bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300";

        default:
            return "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300";
    }
};


// ============================================================
// COMPOSANT
// ============================================================

export default function AuditDetails() {
    const { auditId } = useParams();
    const navigate = useNavigate();

    const [audit, setAudit] = useState(null);

    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    const [error, setError] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);


    // ==========================================================
    // CHARGER L'AUDIT
    // ==========================================================

    const loadAudit = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getAuditById(auditId);

            // console.log("Audit chargé :", response);

            if (response?.data?.success) {
                setAudit(response.data.data);
            } else {
                const message =
                    response?.data?.message ||
                    "Impossible de charger l'audit.";

                setError(message);
                toast.error(message);
            }

        } catch (err) {
            console.error(
                "Erreur chargement audit :",
                err
            );

            const message =
                err?.response?.data?.message ||
                "Une erreur est survenue lors du chargement de l'audit.";

            setError(message);

            toast.error(message);

        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadAudit();
    }, [auditId]);


    // ==========================================================
    // SUPPRIMER
    // ==========================================================

    const handleDelete = async () => {
        try {
            setDeleting(true);

            const response = await deleteAudit(auditId);

            console.log(
                "Audit supprimé :",
                response
            );


            if (response?.data?.success) {

                toast.success(
                    "Audit supprimé avec succès."
                );

                setShowDeleteModal(false);

                setTimeout(() => {
                    navigate("/audits");
                }, 700);

                return;
            }

            toast.error(
                response?.data?.message ||
                "Impossible de supprimer l'audit."
            );

        } catch (err) {

            console.error(
                "Erreur suppression audit :",
                err
            );

            toast.error(
                err?.response?.data?.message ||
                "Une erreur est survenue lors de la suppression."
            );

        } finally {
            setDeleting(false);
        }
    };


    // ==========================================================
    // LOADING
    // ==========================================================

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-3">

                    <RefreshCw
                        size={32}
                        className="animate-spin text-green-700 dark:text-emerald-400"
                    />

                    <p className="text-gray-500 dark:text-slate-400">
                        Chargement de l'audit...
                    </p>

                </div>
            </div>
        );
    }


    // ==========================================================
    // ERROR
    // ==========================================================

    if (error && !audit) {
        return (
            <div className="p-1">

                <button
                    onClick={() => navigate("/audits")}
                    className="flex cursor-pointer items-center gap-2 text-gray-600 dark:text-slate-400 hover:text-green-700 dark:hover:text-emerald-400 mb-6"
                >
                    <ArrowLeft size={18} />

                    Retour aux audits
                </button>


                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl p-6">

                    <div className="flex items-start gap-3">

                        <AlertCircle
                            size={24}
                            className="text-red-600 dark:text-red-400 mt-0.5"
                        />

                        <div>

                            <h2 className="font-semibold text-red-700 dark:text-red-300">
                                Impossible de charger l'audit
                            </h2>

                            <p className="text-red-600 dark:text-red-400 mt-1">
                                {error}
                            </p>

                        </div>

                    </div>

                </div>

            </div>
        );
    }


    if (!audit) {
        return null;
    }


    // ==========================================================
    // AFFICHAGE
    // ==========================================================

    return (
        <div className="p-1 space-y-6">

            {/* ======================================================
          HEADER
      ====================================================== */}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                <div>

                    <button
                        onClick={() => navigate("/audits")}
                        className="flex cursor-pointer items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-green-700 dark:hover:text-emerald-400 mb-3"
                    >
                        <ArrowLeft size={18} />

                        Retour aux audits
                    </button>


                    <div className="flex items-center gap-3">

                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-emerald-950/70 flex items-center justify-center">
                            <ClipboardCheck
                                size={25}
                                className="text-green-700 dark:text-emerald-400"
                            />
                        </div>


                        <div>

                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                                Détails de l'audit biologique
                            </h1>

                            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                                Audit du {formatDate(audit.audit_date)}
                            </p>

                        </div>

                    </div>

                </div>


                {/* ACTIONS */}

                <div className="flex items-center gap-3">

                    <button
                        onClick={() =>
                            navigate(`/audits/${audit.uuid}/edit`)
                        }
                        className="flex cursor-pointer items-center gap-2 px-4 py-2.5 rounded-lg bg-green-700 hover:bg-green-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white transition"
                    >
                        <Pencil size={17} />

                        Modifier
                    </button>


                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex cursor-pointer items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    >
                        <Trash2 size={17} />

                        Supprimer
                    </button>

                </div>

            </div>


            {/* ======================================================
          ERREUR
      ====================================================== */}

            {error && (
                <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 rounded-xl p-4 flex items-center gap-3">

                    <AlertCircle size={20} />

                    {error}

                </div>
            )}


            {/* ======================================================
          STATUT GLOBAL
      ====================================================== */}

            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm p-6">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                    <div>

                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            Statut global de l'audit
                        </p>

                        <div className="flex items-center gap-3 mt-2">

                            {audit.overall_status === "compliant" ? (
                                <CheckCircle2
                                    size={28}
                                    className="text-green-600 dark:text-emerald-400"
                                />
                            ) : (
                                <XCircle
                                    size={28}
                                    className="text-red-600 dark:text-red-400"
                                />
                            )}

                            <span
                                className={`px-4 py-2 rounded-full text-sm font-semibold ${getOverallStatusClass(
                                    audit.overall_status
                                )}`}
                            >
                                {overallStatusLabels[
                                    audit.overall_status
                                ] || audit.overall_status}
                            </span>

                        </div>

                    </div>


                    <div className="text-sm text-gray-500 dark:text-slate-400">

                        <p>
                            Créé le{" "}
                            <span className="font-medium text-gray-700 dark:text-slate-200">
                                {formatDate(audit.created_at)}
                            </span>
                        </p>

                        <p className="mt-1">
                            Mis à jour le{" "}
                            <span className="font-medium text-gray-700 dark:text-slate-200">
                                {formatDate(audit.updated_at)}
                            </span>
                        </p>

                    </div>

                </div>

            </div>


            {/* ======================================================
          INFORMATIONS GÉNÉRALES
      ====================================================== */}

            <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">

                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-3">

                    <User
                        size={20}
                        className="text-green-700 dark:text-emerald-400"
                    />

                    <h2 className="font-semibold text-gray-800 dark:text-white">
                        Informations générales
                    </h2>

                </div>


                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

                    <InfoItem
                        label="Auditeur"
                        value={audit.auditor_name}
                    />

                    <InfoItem
                        label="Date de l'audit"
                        value={formatDate(audit.audit_date)}
                    />

                    <InfoItem
                        label="Parcelle"
                        value={audit.parcel?.name ? `${audit.parcel.name} (${audit.parcel_id})` : (audit.parcel_name || audit.parcel_id)}
                    />

                </div>

            </section>


            {/* ======================================================
          CONVERSION
      ====================================================== */}

            <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">

                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-3">

                    <CalendarDays
                        size={20}
                        className="text-green-700 dark:text-emerald-400"
                    />

                    <h2 className="font-semibold text-gray-800 dark:text-white">
                        Conversion biologique
                    </h2>

                </div>


                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                    <InfoItem
                        label="Début de conversion"
                        value={formatDate(
                            audit.conversion_start_date
                        )}
                    />


                    <div>

                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">
                            Statut de conversion
                        </p>

                        <span className="inline-flex px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 dark:bg-emerald-950/70 text-green-700 dark:text-emerald-300">
                            {conversionStatusLabels[
                                audit.conversion_status
                            ] || audit.conversion_status}
                        </span>

                    </div>

                </div>

            </section>


            {/* ======================================================
          PRATIQUES AGRICOLES
      ====================================================== */}

            <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">

                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-3">

                    <MapPin
                        size={20}
                        className="text-green-700 dark:text-emerald-400"
                    />

                    <h2 className="font-semibold text-gray-800 dark:text-white">
                        Pratiques agricoles
                    </h2>

                </div>


                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                    <TextBlock
                        label="Intrants utilisés"
                        value={audit.inputs_used}
                    />

                    <TextBlock
                        label="Origine des semences"
                        value={audit.seed_origin}
                    />

                    <TextBlock
                        label="Méthodes de gestion des ravageurs"
                        value={audit.pest_management_method}
                    />

                    <TextBlock
                        label="Cultures voisines"
                        value={audit.neighboring_crops}
                    />

                </div>

            </section>


            {/* ======================================================
          RISQUE DE CONTAMINATION
      ====================================================== */}

            <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">

                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-3">

                    <ShieldCheck
                        size={20}
                        className="text-green-700 dark:text-emerald-400"
                    />

                    <h2 className="font-semibold text-gray-800 dark:text-white">
                        Risque de contamination
                    </h2>

                </div>


                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                    <div>

                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">
                            Niveau de risque
                        </p>

                        <span
                            className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${getRiskClass(
                                audit.contamination_risk
                            )}`}
                        >
                            {contaminationRiskLabels[
                                audit.contamination_risk
                            ] || audit.contamination_risk}
                        </span>

                    </div>


                    <InfoItem
                        label="Distance de la zone tampon"
                        value={
                            audit.buffer_zone_distance_m !== null &&
                                audit.buffer_zone_distance_m !== undefined
                                ? `${audit.buffer_zone_distance_m} m`
                                : "Non renseignée"
                        }
                    />

                </div>

            </section>


            {/* ======================================================
          TRAÇABILITÉ
      ====================================================== */}

            <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">

                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-3">

                    <FileCheck2
                        size={20}
                        className="text-green-700 dark:text-emerald-400"
                    />

                    <h2 className="font-semibold text-gray-800 dark:text-white">
                        Traçabilité et registres
                    </h2>

                </div>


                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">

                    <BooleanItem
                        label="Registre des parcelles"
                        value={audit.parcel_register_kept}
                    />

                    <BooleanItem
                        label="Registre des intrants"
                        value={audit.inputs_register_kept}
                    />

                    <BooleanItem
                        label="Registre des récoltes"
                        value={audit.harvest_register_kept}
                    />

                    <BooleanItem
                        label="Registre des ventes"
                        value={audit.sales_register_kept}
                    />

                </div>

            </section>


            {/* ======================================================
          STOCKAGE
      ====================================================== */}

            <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">

                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-3">

                    <Warehouse
                        size={20}
                        className="text-green-700 dark:text-emerald-400"
                    />

                    <h2 className="font-semibold text-gray-800 dark:text-white">
                        Séparation et stockage
                    </h2>

                </div>


                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                    <TextBlock
                        label="Séparation biologique / non biologique"
                        value={audit.bio_nonbio_separation}
                    />

                    <TextBlock
                        label="Notes sur le stockage et la manipulation"
                        value={audit.storage_handling_notes}
                    />

                </div>

            </section>


            {/* ======================================================
          NON-CONFORMITÉS
      ====================================================== */}

            <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">

                <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">

                    <h2 className="font-semibold text-gray-800 dark:text-white">
                        Non-conformités et actions correctives
                    </h2>

                </div>


                <div className="p-6 space-y-6">

                    <div>

                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">
                            Niveau de non-conformité
                        </p>

                        <span
                            className={`inline-flex px-3 py-1.5 rounded-full text-sm font-medium ${getSeverityClass(
                                audit.non_conformity_severity
                            )}`}
                        >
                            {severityLabels[
                                audit.non_conformity_severity
                            ] || audit.non_conformity_severity}
                        </span>

                    </div>


                    <TextBlock
                        label="Non-conformités constatées"
                        value={audit.non_conformities}
                    />


                    <TextBlock
                        label="Plan d'action corrective"
                        value={audit.corrective_action_plan}
                    />


                    <InfoItem
                        label="Date limite de l'action corrective"
                        value={formatDate(
                            audit.corrective_action_deadline
                        )}
                    />

                </div>

            </section>


            {/* ======================================================
          SIGNATURE
      ====================================================== */}

            {audit.auditor_signature && (
                <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">

                    <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">

                        <h2 className="font-semibold text-gray-800 dark:text-white">
                            Signature de l'auditeur
                        </h2>

                    </div>


                    <div className="p-6">

                        <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 inline-block bg-gray-50 dark:bg-slate-800">

                            <img
                                src={audit.auditor_signature}
                                alt="Signature de l'auditeur"
                                className="max-w-[350px] max-h-[150px] object-contain"
                            />

                        </div>

                    </div>

                </section>
            )}


            {/* ======================================================
          MODALE SUPPRESSION
      ====================================================== */}

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

                    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md p-6">

                        <div className="flex items-start gap-4">

                            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/70 flex items-center justify-center shrink-0">

                                <Trash2
                                    size={20}
                                    className="text-red-600 dark:text-red-400"
                                />

                            </div>


                            <div>

                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                                    Supprimer cet audit ?
                                </h3>

                                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                                    Cette action est irréversible. Toutes les
                                    données de cet audit seront supprimées.
                                </p>

                            </div>

                        </div>


                        <div className="flex justify-end gap-3 mt-6">

                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleting}
                                className="px-4 py-2 cursor-pointer rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                                Annuler
                            </button>


                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
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


// ============================================================
// INFO ITEM
// ============================================================

function InfoItem({ label, value }) {
    return (
        <div>

            <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
                {label}
            </p>

            <p className="font-medium text-gray-800 dark:text-white break-words">
                {value || "Non renseigné"}
            </p>

        </div>
    );
}


// ============================================================
// TEXT BLOCK
// ============================================================

function TextBlock({ label, value }) {
    const isHtml = typeof value === "string" && /<[a-z][\s\S]*>/i.test(value);

    return (
        <div>

            <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">
                {label}
            </p>

            {isHtml ? (
                <div
                    className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg p-4 text-sm text-gray-700 dark:text-slate-200 min-h-[50px] leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5"
                    dangerouslySetInnerHTML={{ __html: value }}
                />
            ) : (
                <div className="bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg p-4 text-sm text-gray-700 dark:text-slate-200 whitespace-pre-wrap min-h-[50px]">
                    {value || "Aucune information renseignée."}
                </div>
            )}

        </div>
    );
}


// ============================================================
// BOOLEAN ITEM
// ============================================================

function BooleanItem({ label, value }) {
    return (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">

            <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                {label}
            </span>


            {value ? (
                <span className="flex items-center gap-2 text-green-700 dark:text-emerald-400 text-sm font-medium">

                    <CheckCircle2 size={18} />

                    Oui

                </span>
            ) : (
                <span className="flex items-center gap-2 text-red-600 dark:text-rose-400 text-sm font-medium">

                    <XCircle size={18} />

                    Non

                </span>
            )}

        </div>
    );
}