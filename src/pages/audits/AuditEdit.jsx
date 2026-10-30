import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Save,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    PenLine,
    Eraser,
} from "lucide-react";

import { getAuditById, updateAudit, getAllAudits } from "../../api/audits";
import { getMyParcels } from "../../api/parcels";
import toast from "react-hot-toast";
import RichTextEditor from "../../components/common/RichTextEditor";

const formatArea = (val) => {
    if (val === null || val === undefined || val === "") return "-";
    const num = Number(val);
    return isNaN(num) ? val : num.toFixed(2);
};

const getFarmerName = (parcel) => {
    if (!parcel) return "";
    if (parcel.farmer) {
        if (Array.isArray(parcel.farmer)) {
            return parcel.farmer[0]?.full_name || "";
        }
        return parcel.farmer.full_name || "";
    }
    return parcel.farmer_name || "";
};

const initialForm = {
    parcel_id: "",
    auditor_name: "",
    audit_date: "",
    conversion_start_date: "",
    conversion_status: "not_started",

    inputs_used: "",
    seed_origin: "",
    pest_management_method: "",
    neighboring_crops: "",

    buffer_zone_distance_m: "",
    contamination_risk: "low",

    parcel_register_kept: false,
    inputs_register_kept: false,
    harvest_register_kept: false,
    sales_register_kept: false,

    bio_nonbio_separation: "",
    storage_handling_notes: "",

    non_conformities: "",
    non_conformity_severity: "none",
    corrective_action_plan: "",
    corrective_action_deadline: "",

    overall_status: "compliant",
    auditor_signature: null,
};


// ============================================================
// COMPOSANT
// ============================================================

export default function AuditEdit() {
    const { auditId } = useParams();
    const navigate = useNavigate();

    const canvasRef = useRef(null);

    const [form, setForm] = useState(initialForm);

    const [parcels, setParcels] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);


    // ==========================================================
    // CHARGER L'AUDIT + LES PARCELLES
    // ==========================================================

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError("");

                const [auditResponse, parcelsResponse, allAuditsResponse] =
                    await Promise.all([
                        getAuditById(auditId),
                        getMyParcels(),
                        getAllAudits(),
                    ]);

                // Identifier les parcelles associées à d'autres audits
                const otherAudits = (allAuditsResponse?.data?.data || []).filter(
                    (a) => a.uuid !== auditId
                );
                const auditedParcelIds = new Set(
                    otherAudits.map((a) => a.parcel_id).filter(Boolean)
                );

                if (parcelsResponse?.success) {
                    const allParcels = parcelsResponse.data || [];
                    // Règle métier : une parcelle a un seul audit maximum
                    const available = allParcels.filter(
                        (p) => !auditedParcelIds.has(p.uuid)
                    );
                    setParcels(available);
                } else {
                    setParcels([]);
                }

                // ------------------------------------------------------
                // AUDIT
                // ------------------------------------------------------

                if (!auditResponse?.data?.success) {
                    setError(
                        auditResponse?.data?.message ||
                        "Impossible de charger l'audit."
                    );

                    return;
                }


                const audit = auditResponse.data.data;


                setForm({
                    parcel_id: audit.parcel_id || "",
                    auditor_name: audit.auditor_name || "",
                    audit_date: audit.audit_date || "",
                    conversion_start_date:
                        audit.conversion_start_date || "",

                    conversion_status:
                        audit.conversion_status ||
                        "not_started",

                    inputs_used:
                        audit.inputs_used || "",

                    seed_origin:
                        audit.seed_origin || "",

                    pest_management_method:
                        audit.pest_management_method || "",

                    neighboring_crops:
                        audit.neighboring_crops || "",

                    buffer_zone_distance_m:
                        audit.buffer_zone_distance_m ?? "",

                    contamination_risk:
                        audit.contamination_risk || "low",

                    parcel_register_kept:
                        Boolean(audit.parcel_register_kept),

                    inputs_register_kept:
                        Boolean(audit.inputs_register_kept),

                    harvest_register_kept:
                        Boolean(audit.harvest_register_kept),

                    sales_register_kept:
                        Boolean(audit.sales_register_kept),

                    bio_nonbio_separation:
                        audit.bio_nonbio_separation || "",

                    storage_handling_notes:
                        audit.storage_handling_notes || "",

                    non_conformities:
                        audit.non_conformities || "",

                    non_conformity_severity:
                        audit.non_conformity_severity ||
                        "none",

                    corrective_action_plan:
                        audit.corrective_action_plan || "",

                    corrective_action_deadline:
                        audit.corrective_action_deadline || "",

                    overall_status:
                        audit.overall_status ||
                        "compliant",

                    auditor_signature:
                        audit.auditor_signature || null,
                });


                if (audit.auditor_signature) {
                    setHasSignature(true);
                }


                // ------------------------------------------------------
                // PARCELLES
                // ------------------------------------------------------

                if (parcelsResponse?.success) {
                    setParcels(
                        parcelsResponse.data || []
                    );
                } else {
                    setParcels([]);
                }

            } catch (err) {
                console.error(
                    "Erreur chargement édition audit :",
                    err
                );

                const message =
                    err?.response?.data?.message ||
                    "Impossible de charger les données de l'audit.";

                setError(message);

                toast.error(message);

            } finally {
                setLoading(false);
            }
        };


        loadData();
    }, [auditId]);


    // ==========================================================
    // CHANGEMENT DES CHAMPS
    // ==========================================================

    const handleChange = (event) => {
        const { name, value, type, checked } =
            event.target;

        setForm((previous) => ({
            ...previous,

            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    };


    // ==========================================================
    // SIGNATURE
    // ==========================================================

    const getCanvasContext = () => {
        const canvas = canvasRef.current;

        if (!canvas) return null;

        return canvas.getContext("2d");
    };


    const startDrawing = (event) => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();

        const x =
            (event.clientX - rect.left) *
            (canvas.width / rect.width);

        const y =
            (event.clientY - rect.top) *
            (canvas.height / rect.height);

        const context = getCanvasContext();

        if (!context) return;

        context.beginPath();
        context.moveTo(x, y);

        setIsDrawing(true);
    };


    const draw = (event) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;

        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();

        const x =
            (event.clientX - rect.left) *
            (canvas.width / rect.width);

        const y =
            (event.clientY - rect.top) *
            (canvas.height / rect.height);

        const context = getCanvasContext();

        if (!context) return;

        context.lineWidth = 2;
        context.lineCap = "round";

        context.lineTo(x, y);
        context.stroke();

        setHasSignature(true);
    };


    const stopDrawing = () => {
        setIsDrawing(false);

        if (canvasRef.current && hasSignature) {
            setForm((previous) => ({
                ...previous,
                auditor_signature:
                    canvasRef.current.toDataURL(
                        "image/png"
                    ),
            }));
        }
    };


    // ==========================================================
    // EFFACER SIGNATURE
    // ==========================================================

    const clearSignature = () => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const context = canvas.getContext("2d");

        context.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        setHasSignature(false);

        setForm((previous) => ({
            ...previous,
            auditor_signature: null,
        }));
    };


    // ==========================================================
    // CHARGER SIGNATURE EXISTANTE DANS LE CANVAS
    // ==========================================================

    useEffect(() => {
        if (
            loading ||
            !form.auditor_signature ||
            !canvasRef.current
        ) {
            return;
        }

        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        const image = new Image();

        image.onload = () => {
            context.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            context.drawImage(
                image,
                0,
                0,
                canvas.width,
                canvas.height
            );
        };

        image.src = form.auditor_signature;
    }, [
        loading,
        form.auditor_signature,
    ]);


    // ==========================================================
    // ENREGISTRER
    // ==========================================================
    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError("");

            // --------------------------------------------------------
            // VALIDATION
            // --------------------------------------------------------

            if (!form.parcel_id) {
                toast.error("Veuillez sélectionner une parcelle.");
                return;
            }

            if (!form.auditor_name.trim()) {
                toast.error(
                    "Le nom de l'auditeur est obligatoire."
                );
                return;
            }


            // --------------------------------------------------------
            // PAYLOAD
            // --------------------------------------------------------

            const payload = {
                parcel_id: form.parcel_id,

                auditor_name:
                    form.auditor_name.trim(),

                audit_date:
                    form.audit_date || null,

                conversion_start_date:
                    form.conversion_start_date || null,

                conversion_status:
                    form.conversion_status,

                inputs_used:
                    form.inputs_used.trim() || null,

                seed_origin:
                    form.seed_origin.trim() || null,

                pest_management_method:
                    form.pest_management_method.trim() ||
                    null,

                neighboring_crops:
                    form.neighboring_crops.trim() ||
                    null,

                buffer_zone_distance_m:
                    form.buffer_zone_distance_m === ""
                        ? null
                        : Number(
                            form.buffer_zone_distance_m
                        ),

                contamination_risk:
                    form.contamination_risk,

                parcel_register_kept:
                    form.parcel_register_kept,

                inputs_register_kept:
                    form.inputs_register_kept,

                harvest_register_kept:
                    form.harvest_register_kept,

                sales_register_kept:
                    form.sales_register_kept,

                bio_nonbio_separation:
                    form.bio_nonbio_separation.trim() ||
                    null,

                storage_handling_notes:
                    form.storage_handling_notes.trim() ||
                    null,

                non_conformities:
                    form.non_conformities.trim() ||
                    null,

                non_conformity_severity:
                    form.non_conformity_severity,

                corrective_action_plan:
                    form.corrective_action_plan.trim() ||
                    null,

                corrective_action_deadline:
                    form.corrective_action_deadline ||
                    null,

                overall_status:
                    form.overall_status,

                auditor_signature:
                    form.auditor_signature || null,
            };


            console.log(
                "Payload modification audit :",
                payload
            );


            // --------------------------------------------------------
            // API
            // --------------------------------------------------------

            const response = await updateAudit(
                auditId,
                payload
            );

            console.log(
                "Audit modifié :",
                response
            );


            // --------------------------------------------------------
            // SUCCÈS
            // --------------------------------------------------------

            if (response?.data?.success) {

                toast.success(
                    "Audit modifié avec succès."
                );

                setTimeout(() => {
                    navigate(`/audits/${auditId}`);
                }, 700);

                return;
            }


            // --------------------------------------------------------
            // ERREUR API
            // --------------------------------------------------------

            toast.error(
                response?.data?.message ||
                "Impossible de modifier l'audit."
            );

        } catch (err) {

            console.error(
                "Erreur modification audit :",
                err
            );

            toast.error(
                err?.response?.data?.message ||
                "Une erreur est survenue lors de la modification."
            );

        } finally {
            setSaving(false);
        }
    };


    // ==========================================================
    // LOADING
    // ==========================================================

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">

                <div className="flex flex-col items-center gap-3">

                    <RefreshCw
                        size={32}
                        className="animate-spin text-green-700 dark:text-emerald-500"
                    />

                    <p className="text-gray-500 dark:text-slate-400">
                        Chargement de l'audit...
                    </p>

                </div>

            </div>
        );
    }


    // ==========================================================
    // INTERFACE
    // ==========================================================

    return (
        <div className="p-1">

            {/* ======================================================
          HEADER
      ====================================================== */}

            <div className="mb-6">

                <button
                    type="button"
                    onClick={() =>
                        navigate(`/audits/${auditId}`)
                    }
                    className="flex cursor-pointer items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-green-700 dark:hover:text-emerald-400 mb-4"
                >
                    <ArrowLeft size={18} />

                    Retour aux détails
                </button>


                <div>

                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Modifier l'audit biologique
                    </h1>

                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                        Modifiez les informations de l'audit
                        puis enregistrez les changements.
                    </p>

                </div>

            </div>


            {/* ======================================================
          MESSAGES
      ====================================================== */}

            {error && (
                <div className="mb-5 flex items-start gap-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-xl p-4">

                    <AlertCircle
                        size={20}
                        className="mt-0.5 shrink-0"
                    />

                    <p>{error}</p>

                </div>
            )}


            {success && (
                <div className="mb-5 flex items-center gap-3 bg-green-50 dark:bg-emerald-950/40 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-emerald-300 rounded-xl p-4">

                    <CheckCircle2 size={20} />

                    <p>{success}</p>

                </div>
            )}


            {/* ======================================================
          FORMULAIRE
      ====================================================== */}

            <form
                onSubmit={handleSubmit}
                className="space-y-6"
            >

                {/* ====================================================
            INFORMATIONS GÉNÉRALES
        ==================================================== */}

                <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">

                    <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">

                        <h2 className="font-semibold text-gray-800 dark:text-white">
                            1. Informations générales
                        </h2>

                    </div>


                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

                        <div>

                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Parcelle *
                            </label>

                            <select
                                name="parcel_id"
                                value={form.parcel_id}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-emerald-500"
                            >

                                <option value="">
                                    Sélectionner une parcelle
                                </option>

                                {parcels.map((parcel) => {
                                    const farmerName = getFarmerName(parcel);
                                    const parcelName = parcel.name || "Parcelle sans nom";
                                    const areaText = `${formatArea(parcel.area_ha)} ha`;
                                    const label = farmerName
                                        ? `${parcelName} (${areaText}) — ${farmerName}`
                                        : `${parcelName} (${areaText})`;

                                    return (
                                        <option
                                            key={parcel.uuid}
                                            value={parcel.uuid}
                                        >
                                            {label}
                                        </option>
                                    );
                                })}

                            </select>

                        </div>


                        <div>

                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Nom de l'auditeur *
                            </label>

                            <input
                                type="text"
                                name="auditor_name"
                                value={form.auditor_name}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white dark:placeholder:text-slate-500 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-emerald-500"
                            />

                        </div>


                        <div>

                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Date de l'audit
                            </label>

                            <input
                                type="date"
                                name="audit_date"
                                value={form.audit_date}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-emerald-500"
                            />

                        </div>

                    </div>

                </section>


                {/* ====================================================
            CONVERSION
        ==================================================== */}

                <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">

                    <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">

                        <h2 className="font-semibold text-gray-800 dark:text-white">
                            2. Conversion biologique
                        </h2>

                    </div>


                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

                        <div>

                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Date de début de conversion
                            </label>

                            <input
                                type="date"
                                name="conversion_start_date"
                                value={
                                    form.conversion_start_date
                                }
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600"
                            />

                        </div>


                        <div>

                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Statut de conversion
                            </label>

                            <select
                                name="conversion_status"
                                value={
                                    form.conversion_status
                                }
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600"
                            >

                                <option value="not_started">
                                    Non commencé
                                </option>

                                <option value="in_conversion">
                                    En conversion
                                </option>

                                <option value="certified">
                                    Certifié
                                </option>

                            </select>

                        </div>

                    </div>

                </section>


                {/* ====================================================
            PRATIQUES AGRICOLES
        ==================================================== */}

                <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">

                    <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">

                        <h2 className="font-semibold text-gray-800 dark:text-white">
                            3. Pratiques agricoles
                        </h2>

                    </div>


                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

                        <TextArea
                            label="Intrants utilisés"
                            name="inputs_used"
                            value={form.inputs_used}
                            onChange={handleChange}
                        />

                        <TextArea
                            label="Origine des semences"
                            name="seed_origin"
                            value={form.seed_origin}
                            onChange={handleChange}
                        />

                        <TextArea
                            label="Méthodes de gestion des ravageurs"
                            name="pest_management_method"
                            value={
                                form.pest_management_method
                            }
                            onChange={handleChange}
                        />

                        <TextArea
                            label="Cultures voisines"
                            name="neighboring_crops"
                            value={form.neighboring_crops}
                            onChange={handleChange}
                        />

                    </div>

                </section>


                {/* ====================================================
            CONTAMINATION
        ==================================================== */}

                <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">

                    <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">

                        <h2 className="font-semibold text-gray-800 dark:text-white">
                            4. Risque de contamination
                        </h2>

                    </div>


                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

                        <div>

                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Niveau de risque
                            </label>

                            <select
                                name="contamination_risk"
                                value={
                                    form.contamination_risk
                                }
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600"
                            >

                                <option value="low">
                                    Faible
                                </option>

                                <option value="medium">
                                    Moyen
                                </option>

                                <option value="high">
                                    Élevé
                                </option>

                            </select>

                        </div>


                        <div>

                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Distance de la zone tampon (m)
                            </label>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                name="buffer_zone_distance_m"
                                value={
                                    form.buffer_zone_distance_m
                                }
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white dark:placeholder:text-slate-500 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600"
                            />

                        </div>

                    </div>

                </section>


                {/* ====================================================
            TRAÇABILITÉ
        ==================================================== */}

                <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">

                    <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">

                        <h2 className="font-semibold text-gray-800 dark:text-white">
                            5. Traçabilité et registres
                        </h2>

                    </div>


                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">

                        <Checkbox
                            label="Registre des parcelles conservé"
                            name="parcel_register_kept"
                            checked={
                                form.parcel_register_kept
                            }
                            onChange={handleChange}
                        />

                        <Checkbox
                            label="Registre des intrants conservé"
                            name="inputs_register_kept"
                            checked={
                                form.inputs_register_kept
                            }
                            onChange={handleChange}
                        />

                        <Checkbox
                            label="Registre des récoltes conservé"
                            name="harvest_register_kept"
                            checked={
                                form.harvest_register_kept
                            }
                            onChange={handleChange}
                        />

                        <Checkbox
                            label="Registre des ventes conservé"
                            name="sales_register_kept"
                            checked={
                                form.sales_register_kept
                            }
                            onChange={handleChange}
                        />

                    </div>

                </section>


                {/* ====================================================
            STOCKAGE
        ==================================================== */}

                <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">

                    <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">

                        <h2 className="font-semibold text-gray-800 dark:text-white">
                            6. Séparation et stockage
                        </h2>

                    </div>


                    <div className="p-6 space-y-5">

                        <TextArea
                            label="Séparation biologique / non biologique"
                            name="bio_nonbio_separation"
                            value={
                                form.bio_nonbio_separation
                            }
                            onChange={handleChange}
                        />

                        <TextArea
                            label="Notes sur le stockage et la manipulation"
                            name="storage_handling_notes"
                            value={
                                form.storage_handling_notes
                            }
                            onChange={handleChange}
                        />

                    </div>

                </section>


                {/* ====================================================
            NON-CONFORMITÉS
        ==================================================== */}

                <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">

                    <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">

                        <h2 className="font-semibold text-gray-800 dark:text-white">
                            7. Non-conformités et actions correctives
                        </h2>

                    </div>


                    <div className="p-6 space-y-5">

                        <TextArea
                            label="Non-conformités constatées"
                            name="non_conformities"
                            value={
                                form.non_conformities
                            }
                            onChange={handleChange}
                        />


                        <div>

                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Niveau de non-conformité
                            </label>

                            <select
                                name="non_conformity_severity"
                                value={
                                    form.non_conformity_severity
                                }
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-emerald-500"
                            >

                                <option value="none">
                                    Aucune
                                </option>

                                <option value="minor">
                                    Mineure
                                </option>

                                <option value="major">
                                    Majeure
                                </option>

                                <option value="critical">
                                    Critique
                                </option>

                            </select>

                        </div>


                        <TextArea
                            label="Plan d'action corrective"
                            name="corrective_action_plan"
                            value={
                                form.corrective_action_plan
                            }
                            onChange={handleChange}
                        />


                        <div>

                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                Date limite de l'action corrective
                            </label>

                            <input
                                type="date"
                                name="corrective_action_deadline"
                                value={
                                    form.corrective_action_deadline
                                }
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-emerald-500"
                            />

                        </div>

                    </div>

                </section>


                {/* ====================================================
            CONCLUSION
        ==================================================== */}

                <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">

                    <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800">

                        <h2 className="font-semibold text-gray-800 dark:text-white">
                            8. Conclusion
                        </h2>

                    </div>


                    <div className="p-6">

                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                            Statut global
                        </label>

                        <select
                            name="overall_status"
                            value={form.overall_status}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-600 dark:focus:ring-emerald-500"
                        >

                            <option value="compliant">
                                Conforme
                            </option>

                            <option value="non_compliant">
                                Non conforme
                            </option>

                            <option value="compliant_with_reservations">
                                Conforme avec réserves
                            </option>

                        </select>

                    </div>

                </section>


                {/* ====================================================
            SIGNATURE
        ==================================================== */}

                <section className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">

                    <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-2">

                        <PenLine
                            size={20}
                            className="text-green-700 dark:text-emerald-400"
                        />

                        <h2 className="font-semibold text-gray-800 dark:text-white">
                            9. Signature de l'auditeur
                        </h2>

                    </div>


                    <div className="p-6">

                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">
                            Vous pouvez conserver la signature
                            existante ou la remplacer en dessinant
                            une nouvelle signature.
                        </p>


                        <div className="border border-gray-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white max-w-2xl">

                            <canvas
                                ref={canvasRef}
                                width={800}
                                height={250}
                                onPointerDown={startDrawing}
                                onPointerMove={draw}
                                onPointerUp={stopDrawing}
                                onPointerLeave={stopDrawing}
                                className="w-full h-[250px] cursor-crosshair touch-none"
                            />

                        </div>


                        <button
                            type="button"
                            onClick={clearSignature}
                            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                        >

                            <Eraser size={17} />

                            Effacer la signature

                        </button>

                    </div>

                </section>


                {/* ====================================================
            BOUTONS
        ==================================================== */}

                <div className="flex flex-col sm:flex-row justify-end gap-3 pb-8">

                    <button
                        type="button"
                        onClick={() =>
                            navigate(`/audits/${auditId}`)
                        }
                        disabled={saving}
                        className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors disabled:opacity-50"
                    >
                        Annuler
                    </button>


                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-green-700 hover:bg-green-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white cursor-pointer transition-colors disabled:opacity-50"
                    >

                        {saving ? (
                            <>
                                <RefreshCw
                                    size={18}
                                    className="animate-spin"
                                />

                                Enregistrement...
                            </>
                        ) : (
                            <>
                                <Save size={18} />

                                Enregistrer les modifications
                            </>
                        )}

                    </button>

                </div>

            </form>

        </div>
    );
}


// ============================================================
// TEXTAREA
// ============================================================

function TextArea({
    label,
    name,
    value,
    onChange,
    placeholder = "Saisissez du texte...",
    minHeight = "120px",
}) {
    return (
        <div>

            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {label}
            </label>

            <RichTextEditor
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                minHeight={minHeight}
            />

        </div>
    );
}


// ============================================================
// CHECKBOX
// ============================================================

function Checkbox({
    label,
    name,
    checked,
    onChange,
}) {
    return (
        <label className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/60 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">

            <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={onChange}
                className="w-4 h-4 text-green-700 dark:text-emerald-500 rounded dark:bg-slate-700 dark:border-slate-600"
            />

            <span className="text-sm text-gray-700 dark:text-slate-200">
                {label}
            </span>

        </label>
    );
}