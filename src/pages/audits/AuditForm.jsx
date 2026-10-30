import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Save,
    RefreshCw,
    AlertCircle,
    CheckCircle2,
    ClipboardCheck,
    Eraser,
} from "lucide-react";
import toast from "react-hot-toast";
import { createAudit, getAllAudits } from "../../api/audits";
import { getMyParcels } from "../../api/parcels";
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

export default function AuditForm() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    const [parcels, setParcels] = useState([]);
    const [loadingParcels, setLoadingParcels] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [isDrawing, setIsDrawing] = useState(false);

    const [formData, setFormData] = useState({
        parcel_id: "",
        auditor_name: "",
        audit_date: new Date().toISOString().split("T")[0],

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
    });


    // ============================================================
    // CHARGEMENT DES PARCELLES
    // ============================================================

    useEffect(() => {
        const loadParcels = async () => {
            try {
                setLoadingParcels(true);
                setError("");

                const [parcelsResponse, auditsResponse] = await Promise.all([
                    getMyParcels(),
                    getAllAudits(),
                ]);

                // Identifier les IDs de parcelles qui possèdent déjà un audit
                const auditedParcelIds = new Set(
                    (auditsResponse?.data?.data || [])
                        .map((a) => a.parcel_id)
                        .filter(Boolean)
                );

                if (parcelsResponse?.success) {
                    const allParcels = parcelsResponse.data || [];
                    // Règle métier : une parcelle a 1 audit max -> exclure celles déjà auditées
                    const available = allParcels.filter(
                        (p) => !auditedParcelIds.has(p.uuid)
                    );
                    setParcels(available);
                } else {
                    setParcels([]);

                    setError(
                        parcelsResponse?.message ||
                        "Impossible de charger les parcelles."
                    );
                }
            } catch (err) {
                console.error(
                    "Erreur chargement parcelles :",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    "Impossible de charger les parcelles."
                );
            } finally {
                setLoadingParcels(false);
            }
        };

        loadParcels();
    }, []);


    // ============================================================
    // CHANGEMENT DES CHAMPS
    // ============================================================

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value,
        }));
    };


    // ============================================================
    // SIGNATURE
    // ============================================================

    const getCanvasPosition = (event) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY,
        };
    };


    const startDrawing = (event) => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext("2d");

        const { x, y } = getCanvasPosition(event);

        ctx.beginPath();
        ctx.moveTo(x, y);

        setIsDrawing(true);
    };


    const draw = (event) => {
        if (!isDrawing) {
            return;
        }

        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext("2d");

        const { x, y } = getCanvasPosition(event);

        ctx.lineTo(x, y);

        ctx.strokeStyle = "#272739";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
    };


    const stopDrawing = () => {
        if (!isDrawing) {
            return;
        }

        setIsDrawing(false);

        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const signature = canvas.toDataURL("image/png");

        setFormData((previous) => ({
            ...previous,
            auditor_signature: signature,
        }));
    };


    const clearSignature = () => {
        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext("2d");

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        setFormData((previous) => ({
            ...previous,
            auditor_signature: null,
        }));
    };


    // ============================================================
    // SOUMISSION DU FORMULAIRE
    // ============================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        // ----------------------------------------------------------
        // VALIDATION
        // ----------------------------------------------------------

        if (!formData.parcel_id) {
            toast.error("Veuillez sélectionner une parcelle.");
            return;
        }

        if (!formData.auditor_name.trim()) {
            toast.error(
                "Le nom de l'auditeur est obligatoire."
            );
            return;
        }

        // ----------------------------------------------------------
        // PRÉPARATION DES DONNÉES
        // ----------------------------------------------------------

        const payload = {
            parcel_id: formData.parcel_id,
            auditor_name: formData.auditor_name.trim(),
            audit_date: formData.audit_date,

            conversion_start_date:
                formData.conversion_start_date || null,

            conversion_status:
                formData.conversion_status,

            inputs_used:
                formData.inputs_used.trim() || null,

            seed_origin:
                formData.seed_origin.trim() || null,

            pest_management_method:
                formData.pest_management_method.trim() || null,

            neighboring_crops:
                formData.neighboring_crops.trim() || null,

            buffer_zone_distance_m:
                formData.buffer_zone_distance_m === ""
                    ? null
                    : Number(formData.buffer_zone_distance_m),

            contamination_risk:
                formData.contamination_risk,

            parcel_register_kept:
                formData.parcel_register_kept,

            inputs_register_kept:
                formData.inputs_register_kept,

            harvest_register_kept:
                formData.harvest_register_kept,

            sales_register_kept:
                formData.sales_register_kept,

            bio_nonbio_separation:
                formData.bio_nonbio_separation.trim() || null,

            storage_handling_notes:
                formData.storage_handling_notes.trim() || null,

            non_conformities:
                formData.non_conformities.trim() || null,

            non_conformity_severity:
                formData.non_conformity_severity,

            corrective_action_plan:
                formData.corrective_action_plan.trim() || null,

            corrective_action_deadline:
                formData.corrective_action_deadline || null,

            overall_status:
                formData.overall_status,

            auditor_signature:
                formData.auditor_signature || null,
        };


        // ----------------------------------------------------------
        // ENREGISTREMENT
        // ----------------------------------------------------------

        try {
            setSaving(true);

            console.log(
                "Données envoyées pour création audit :",
                payload
            );

            const response = await createAudit(payload);

            if (response?.data?.success) {

                toast.success(
                    "Audit créé avec succès."
                );

                setTimeout(() => {
                    navigate("/audits");
                }, 700);

                return;
            }

            toast.error(
                response?.data?.message ||
                "Impossible de créer l'audit."
            );

        } catch (err) {

            // console.error(
            //     "Erreur création audit :",
            //     err
            // );

            toast.error(
                err?.response?.data?.message ||
                "Une erreur est survenue lors de la création de l'audit."
            );

        } finally {
            setSaving(false);
        }
    };


    // ============================================================
    // RENDU
    // ============================================================

    return (
        <div className="min-h-full p-1">

            {/* ======================================================
          EN-TÊTE
      ====================================================== */}

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div className="flex items-center gap-3">

                    <button
                        type="button"
                        onClick={() => navigate("/audits")}
                        className="rounded-lg cursor-pointer border border-gray-300 dark:border-slate-700 p-2 text-gray-600 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    {/* <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
                        <ClipboardCheck size={24} />
                    </div> */}

                    <div>
                        <h1 className="text-2xl font-bold text-[#272739] dark:text-white">
                            Nouvel audit biologique
                        </h1>

                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            Remplissez les informations du contrôle biologique
                        </p>
                    </div>

                </div>

            </div>


            {/* ======================================================
          MESSAGES
      ====================================================== */}

            {error && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-4 text-red-700 dark:text-red-300">

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


            {success && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-emerald-950/40 p-4 text-green-700 dark:text-emerald-300">

                    <CheckCircle2
                        size={20}
                        className="mt-0.5 shrink-0"
                    />

                    <div>
                        <p className="font-medium">
                            Succès
                        </p>

                        <p className="mt-1 text-sm">
                            {success}
                        </p>
                    </div>

                </div>
            )}


            <form
                onSubmit={handleSubmit}
                className="space-y-6"
            >

                {/* ====================================================
            1. INFORMATIONS GÉNÉRALES
        ==================================================== */}

                <section className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">

                    <div className="mb-5 border-b border-gray-100 dark:border-slate-800 pb-4">

                        <h2 className="text-lg font-semibold text-[#272739] dark:text-white">
                            1. Informations générales
                        </h2>

                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            Informations principales concernant l'audit.
                        </p>

                    </div>


                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                        {/* PARCELLE */}

                        <div className="md:col-span-2">

                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                                Parcelle <span className="text-red-500">*</span>
                            </label>

                            <select
                                name="parcel_id"
                                value={formData.parcel_id}
                                onChange={handleChange}
                                disabled={loadingParcels}
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
                            >

                                <option value="">
                                    {loadingParcels
                                        ? "Chargement des parcelles disponibles..."
                                        : parcels.length === 0
                                        ? "Aucune parcelle disponible (toutes sont déjà auditées)"
                                        : "Sélectionner une parcelle"
                                    }
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


                        {/* AUDITEUR */}

                        <div>

                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                                Nom de l'auditeur <span className="text-red-500">*</span>
                            </label>

                            <input
                                type="text"
                                name="auditor_name"
                                value={formData.auditor_name}
                                onChange={handleChange}
                                placeholder="Ex. Jean Rakoto"
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white dark:placeholder:text-slate-500 px-3 py-2.5 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
                            />

                        </div>


                        {/* DATE */}

                        <div>

                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                                Date de l'audit <span className="text-red-500">*</span>
                            </label>

                            <input
                                type="date"
                                name="audit_date"
                                value={formData.audit_date}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
                            />

                        </div>

                    </div>

                </section>


                {/* ====================================================
            2. CONVERSION BIOLOGIQUE
        ==================================================== */}

                <section className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">

                    <div className="mb-5 border-b border-gray-100 dark:border-slate-800 pb-4">

                        <h2 className="text-lg font-semibold text-[#272739] dark:text-white">
                            2. Conversion biologique
                        </h2>

                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            Situation de la parcelle par rapport à la conversion biologique.
                        </p>

                    </div>


                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                        <div>

                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                                Date de début de conversion
                            </label>

                            <input
                                type="date"
                                name="conversion_start_date"
                                value={formData.conversion_start_date}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
                            />

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                                Statut de conversion
                            </label>

                            <select
                                name="conversion_status"
                                value={formData.conversion_status}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
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
            3. PRATIQUES AGRICOLES
        ==================================================== */}

                <section className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">

                    <div className="mb-5 border-b border-gray-100 dark:border-slate-800 pb-4">

                        <h2 className="text-lg font-semibold text-[#272739] dark:text-white">
                            3. Pratiques agricoles
                        </h2>

                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            Informations sur les pratiques utilisées sur la parcelle.
                        </p>

                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        <RichTextEditor
                            label="Intrants utilisés"
                            name="inputs_used"
                            value={formData.inputs_used}
                            onChange={handleChange}
                            placeholder="Décrire les intrants utilisés..."
                        />

                        <RichTextEditor
                            label="Origine des semences"
                            name="seed_origin"
                            value={formData.seed_origin}
                            onChange={handleChange}
                            placeholder="Origine et nature des semences..."
                        />

                        <RichTextEditor
                            label="Méthodes de gestion des ravageurs"
                            name="pest_management_method"
                            value={formData.pest_management_method}
                            onChange={handleChange}
                            placeholder="Décrire les méthodes utilisées..."
                        />

                        <RichTextEditor
                            label="Cultures voisines"
                            name="neighboring_crops"
                            value={formData.neighboring_crops}
                            onChange={handleChange}
                            placeholder="Cultures présentes autour de la parcelle..."
                        />

                    </div>

                </section>


                {/* ====================================================
            4. RISQUE DE CONTAMINATION
        ==================================================== */}

                <section className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">

                    <div className="mb-5 border-b border-gray-100 dark:border-slate-800 pb-4">

                        <h2 className="text-lg font-semibold text-[#272739] dark:text-white">
                            4. Risque de contamination
                        </h2>

                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            Évaluation des risques liés à l'environnement de la parcelle.
                        </p>

                    </div>


                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                        <div>

                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                                Distance de la zone tampon (m)
                            </label>

                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                name="buffer_zone_distance_m"
                                value={formData.buffer_zone_distance_m}
                                onChange={handleChange}
                                placeholder="Ex. 10"
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white dark:placeholder:text-slate-500 px-3 py-2.5 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
                            />

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                                Niveau de risque
                            </label>

                            <select
                                name="contamination_risk"
                                value={formData.contamination_risk}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
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

                    </div>

                </section>


                {/* ====================================================
            5. TRAÇABILITÉ
        ==================================================== */}

                <section className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">

                    <div className="mb-5 border-b border-gray-100 dark:border-slate-800 pb-4">

                        <h2 className="text-lg font-semibold text-[#272739] dark:text-white">
                            5. Traçabilité
                        </h2>

                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            Vérification des registres et de la séparation des produits.
                        </p>

                    </div>


                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-4 transition hover:bg-gray-50 dark:hover:bg-slate-800">

                            <input
                                type="checkbox"
                                name="parcel_register_kept"
                                checked={formData.parcel_register_kept}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 dark:bg-slate-700 text-green-700 focus:ring-green-700"
                            />

                            <span className="text-sm text-gray-700 dark:text-slate-200">
                                Registre de parcelle tenu
                            </span>

                        </label>


                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-4 transition hover:bg-gray-50 dark:hover:bg-slate-800">

                            <input
                                type="checkbox"
                                name="inputs_register_kept"
                                checked={formData.inputs_register_kept}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 dark:bg-slate-700 text-green-700 focus:ring-green-700"
                            />

                            <span className="text-sm text-gray-700 dark:text-slate-200">
                                Registre des intrants tenu
                            </span>

                        </label>


                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-4 transition hover:bg-gray-50 dark:hover:bg-slate-800">

                            <input
                                type="checkbox"
                                name="harvest_register_kept"
                                checked={formData.harvest_register_kept}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 dark:bg-slate-700 text-green-700 focus:ring-green-700"
                            />

                            <span className="text-sm text-gray-700 dark:text-slate-200">
                                Registre des récoltes tenu
                            </span>

                        </label>


                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-4 transition hover:bg-gray-50 dark:hover:bg-slate-800">

                            <input
                                type="checkbox"
                                name="sales_register_kept"
                                checked={formData.sales_register_kept}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-gray-300 dark:border-slate-600 dark:bg-slate-700 text-green-700 focus:ring-green-700"
                            />

                            <span className="text-sm text-gray-700 dark:text-slate-200">
                                Registre des ventes tenu
                            </span>

                        </label>

                    </div>


                    <div className="mt-5">

                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                            Séparation biologique / non biologique
                        </label>

                        <RichTextEditor
                            name="bio_nonbio_separation"
                            value={formData.bio_nonbio_separation}
                            onChange={handleChange}
                            placeholder="Décrire les mesures de séparation..."
                            minHeight="100px"
                        />

                    </div>

                </section>


                {/* ====================================================
            6. STOCKAGE
        ==================================================== */}

                <section className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">

                    <div className="mb-5 border-b border-gray-100 dark:border-slate-800 pb-4">

                        <h2 className="text-lg font-semibold text-[#272739] dark:text-white">
                            6. Stockage et manipulation
                        </h2>

                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            Conditions de stockage et de manipulation des produits.
                        </p>

                    </div>


                    <RichTextEditor
                        name="storage_handling_notes"
                        value={formData.storage_handling_notes}
                        onChange={handleChange}
                        placeholder="Décrire les conditions de stockage et de manipulation..."
                        minHeight="120px"
                    />

                </section>


                {/* ====================================================
            7. NON-CONFORMITÉS
        ==================================================== */}

                <section className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">

                    <div className="mb-5 border-b border-gray-100 dark:border-slate-800 pb-4">

                        <h2 className="text-lg font-semibold text-[#272739] dark:text-white">
                            7. Non-conformités et actions correctives
                        </h2>

                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            Identification des éventuelles non-conformités.
                        </p>

                    </div>


                    <div className="space-y-5">

                        <div>

                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                                Non-conformités constatées
                            </label>

                            <RichTextEditor
                                name="non_conformities"
                                value={formData.non_conformities}
                                onChange={handleChange}
                                placeholder="Décrire les non-conformités constatées..."
                                minHeight="120px"
                            />

                        </div>


                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                                    Niveau de non-conformité
                                </label>

                                <select
                                    name="non_conformity_severity"
                                    value={formData.non_conformity_severity}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
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


                            <div>

                                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                                    Date limite de l'action corrective
                                </label>

                                <input
                                    type="date"
                                    name="corrective_action_deadline"
                                    value={formData.corrective_action_deadline}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700"
                                />

                            </div>

                        </div>


                        <div>

                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                                Plan d'action corrective
                            </label>

                            <RichTextEditor
                                name="corrective_action_plan"
                                value={formData.corrective_action_plan}
                                onChange={handleChange}
                                placeholder="Décrire les actions correctives demandées..."
                                minHeight="120px"
                            />

                        </div>

                    </div>

                </section>


                {/* ====================================================
            8. CONCLUSION
        ==================================================== */}

                <section className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">

                    <div className="mb-5 border-b border-gray-100 dark:border-slate-800 pb-4">

                        <h2 className="text-lg font-semibold text-[#272739] dark:text-white">
                            8. Conclusion de l'audit
                        </h2>

                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            Résultat global du contrôle biologique.
                        </p>

                    </div>


                    <div>

                        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                            Statut global
                        </label>

                        <select
                            name="overall_status"
                            value={formData.overall_status}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-green-700 focus:ring-1 focus:ring-green-700 md:w-1/2"
                        >
                            <option value="compliant">
                                Conforme
                            </option>

                            <option value="compliant_with_reservations">
                                Conforme avec réserves
                            </option>

                            <option value="non_compliant">
                                Non conforme
                            </option>
                        </select>

                    </div>

                </section>


                {/* ====================================================
            9. SIGNATURE
        ==================================================== */}

                <section className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">

                    <div className="mb-5 border-b border-gray-100 dark:border-slate-800 pb-4">

                        <h2 className="text-lg font-semibold text-[#272739] dark:text-white">
                            9. Signature de l'auditeur
                        </h2>

                        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                            Dessinez votre signature dans la zone ci-dessous.
                        </p>

                    </div>


                    <div className="overflow-hidden rounded-lg border border-gray-300 dark:border-slate-700 bg-white">

                        <canvas
                            ref={canvasRef}
                            width={900}
                            height={250}
                            onPointerDown={startDrawing}
                            onPointerMove={draw}
                            onPointerUp={stopDrawing}
                            onPointerLeave={stopDrawing}
                            className="h-48 w-full touch-none cursor-crosshair bg-white"
                        />

                    </div>


                    <div className="mt-3 flex justify-end">

                        <button
                            type="button"
                            onClick={clearSignature}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-slate-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-slate-800"
                        >
                            <Eraser size={16} />
                            Effacer la signature
                        </button>

                    </div>

                </section>


                {/* ====================================================
            BOUTONS
        ==================================================== */}

                <div className="flex flex-col-reverse gap-3 pb-8 sm:flex-row sm:justify-end">

                    <button
                        type="button"
                        onClick={() => navigate("/audits")}
                        disabled={saving}
                        className="rounded-lg cursor-pointer border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-200 transition hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                    >
                        Annuler
                    </button>


                    <button
                        type="submit"
                        disabled={saving || loadingParcels}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-green-700 dark:bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-800 dark:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                                Enregistrer l'audit
                            </>
                        )}

                    </button>

                </div>

            </form>

        </div>
    );
}