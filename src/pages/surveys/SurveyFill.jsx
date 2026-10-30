import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Building2,
  Calendar,
  User,
  MapPin,
  Camera,
  PenTool,
  Loader2,
  Star,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Layers,
} from "lucide-react";
import toast from "react-hot-toast";

import { getSurveyById, submitNewSurveyResponse } from "../../services/surveyService";
import { getAllFarmersByCooperative } from "../../services/farmerService";
import { getParcelsByCooperative } from "../../api/parcels";

const SurveyFill = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [survey, setSurvey] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Métadonnées d'enquête
  const [farmerId, setFarmerId] = useState("");
  const [parcelId, setParcelId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locating, setLocating] = useState(false);

  // Réponses indexées par field.id
  const [answers, setAnswers] = useState({});

  // Canvas signature
  const signatureCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // ============================================================
  // CHARGEMENT
  // ============================================================

  useEffect(() => {
    const loadForm = async () => {
      try {
        setLoading(true);
        const res = await getSurveyById(id);
        const s = res?.data;
        if (!s) {
          toast.error("Formulaire introuvable.");
          navigate("/surveys");
          return;
        }

        setSurvey(s);

        // Charger les agriculteurs et parcelles de la coopérative
        if (s.cooperative_id) {
          try {
            const [farmersRes, parcelsRes] = await Promise.all([
              getAllFarmersByCooperative(s.cooperative_id),
              getParcelsByCooperative(s.cooperative_id),
            ]);

            const fList = Array.isArray(farmersRes) ? farmersRes : Array.isArray(farmersRes?.data) ? farmersRes.data : [];
            const pList = Array.isArray(parcelsRes) ? parcelsRes : Array.isArray(parcelsRes?.data) ? parcelsRes.data : [];

            setFarmers(fList);
            setParcels(pList);
          } catch (err) {
            console.warn("Erreur chargement entités liées :", err);
          }
        }
      } catch (err) {
        console.error("Erreur chargement formulaire :", err);
        toast.error("Impossible de charger le formulaire.");
        navigate("/surveys");
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [id, navigate]);

  // ============================================================
  // GESTION DES RÉPONSES
  // ============================================================

  const handleAnswerChange = (fieldId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleMultiSelectToggle = (fieldId, optionValue) => {
    const current = Array.isArray(answers[fieldId]) ? answers[fieldId] : [];
    if (current.includes(optionValue)) {
      handleAnswerChange(fieldId, current.filter((v) => v !== optionValue));
    } else {
      handleAnswerChange(fieldId, [...current, optionValue]);
    }
  };

  // Géolocalisation par navigateur
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocating(false);
        toast.success("Position GPS relevée avec succès !");
      },
      (err) => {
        setLocating(false);
        console.warn("GPS error:", err);
        toast.error("Impossible d'obtenir la position GPS.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Photo en Base64
  const handlePhotoUpload = (fieldId, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner un fichier image valide.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      handleAnswerChange(fieldId, e.target.result);
      toast.success("Photo ajoutée");
    };
    reader.readAsDataURL(file);
  };

  // Signature canvas
  const startDrawing = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#1B4332";
    ctx.lineWidth = 2;
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = (fieldId) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      handleAnswerChange(fieldId, canvas.toDataURL("image/png"));
    }
  };

  const clearSignature = (fieldId) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    handleAnswerChange(fieldId, null);
  };

  // ============================================================
  // SOUMISSION
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fields = survey?.fields || [];

    // Vérification des champs requis
    for (const f of fields) {
      if (f.required) {
        const ans = answers[f.id];
        if (
          ans === undefined ||
          ans === null ||
          (typeof ans === "string" && !ans.trim()) ||
          (Array.isArray(ans) && ans.length === 0)
        ) {
          toast.error(`Le champ « ${f.label} » est obligatoire.`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);

      const payload = {
        farmer_id: farmerId || null,
        parcel_id: parcelId || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        answers,
      };

      await submitNewSurveyResponse(id, payload);
      toast.success("Enquête soumise et enregistrée avec succès !");

      setTimeout(() => {
        navigate(`/surveys/${id}/responses`);
      }, 600);
    } catch (err) {
      console.error("Erreur soumission enquête :", err);
      toast.error(err?.response?.data?.error || err?.message || "Échec de la soumission de l'enquête.");
    } finally {
      setSubmitting(false);
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
        <p className="text-sm text-gray-500 dark:text-slate-400">Chargement de l'enquête...</p>
      </div>
    );
  }

  const renderQuestionCard = (field, idx) => {
    const val = answers[field.id];

    return (
      <div key={field.id} className="rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/40 dark:bg-slate-800/40 p-4 space-y-2">
        <label className="block text-sm font-semibold text-gray-800 dark:text-slate-200">
          <span className="text-gray-400 dark:text-slate-500 font-normal mr-1">{idx + 1}.</span>
          {field.label}
          {field.required && <span className="ml-1 text-red-500">*</span>}
        </label>

        {field.helpText && (
          <p className="text-xs text-gray-500 dark:text-slate-400">{field.helpText}</p>
        )}

        {/* Champ TEXTE COURT */}
        {field.type === "text" && (
          <input
            type="text"
            value={val || ""}
            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
            placeholder={field.placeholder || "Votre réponse..."}
            className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            required={field.required}
          />
        )}

        {/* Champ TEXTE LONG */}
        {field.type === "textarea" && (
          <textarea
            rows={3}
            value={val || ""}
            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
            placeholder={field.placeholder || "Développez votre réponse ici..."}
            className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            required={field.required}
          />
        )}

        {/* Champ NOMBRE */}
        {field.type === "number" && (
          <div className="relative">
            <input
              type="number"
              step="any"
              value={val !== undefined ? val : ""}
              onChange={(e) => handleAnswerChange(field.id, e.target.value)}
              placeholder={field.placeholder || "0"}
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
              required={field.required}
            />
            {field.unit && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400 dark:text-slate-500">
                {field.unit}
              </span>
            )}
          </div>
        )}

        {/* Champ DATE */}
        {field.type === "date" && (
          <input
            type="date"
            value={val || ""}
            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            required={field.required}
          />
        )}

        {/* Champ HEURE */}
        {field.type === "time" && (
          <input
            type="time"
            value={val || ""}
            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            required={field.required}
          />
        )}

        {/* Champ CHOIX UNIQUE (SELECT) */}
        {field.type === "select" && (
          <select
            value={val || ""}
            onChange={(e) => handleAnswerChange(field.id, e.target.value)}
            className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            required={field.required}
          >
            <option value="">Sélectionner une réponse</option>
            {(field.options || []).map((opt, oIdx) => (
              <option key={oIdx} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )}

        {/* Champ CHOIX MULTIPLE (CHECKBOXES) */}
        {field.type === "multiselect" && (
          <div className="grid gap-2 sm:grid-cols-2 pt-1">
            {(field.options || []).map((opt, oIdx) => {
              const isChecked = Array.isArray(val) && val.includes(opt);
              return (
                <label
                  key={oIdx}
                  className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs font-medium cursor-pointer transition ${
                    isChecked
                      ? "border-green-600 dark:border-emerald-500 bg-green-50/60 dark:bg-emerald-950/40 text-green-900 dark:text-emerald-200"
                      : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleMultiSelectToggle(field.id, opt)}
                    className="h-4 w-4 rounded border-gray-300 dark:border-slate-700 text-green-700 focus:ring-green-600"
                  />
                  <span>{opt}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* Champ ÉCHELLE (1 à 5) */}
        {field.type === "scale" && (
          <div className="flex items-center gap-2 pt-1">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => handleAnswerChange(field.id, score)}
                className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold text-sm transition cursor-pointer ${
                  val === score
                    ? "bg-green-700 dark:bg-emerald-600 text-white shadow-xs"
                    : "border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                }`}
              >
                {score}
              </button>
            ))}
            {val && (
              <span className="text-xs font-semibold text-green-800 dark:text-emerald-300 ml-2">
                Note sélectionnée : {val} / 5
              </span>
            )}
          </div>
        )}

        {/* Champ POINT GPS */}
        {field.type === "gps" && (
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={val || ""}
              onChange={(e) => handleAnswerChange(field.id, e.target.value)}
              placeholder="Latitude, Longitude"
              className="flex-1 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-green-600"
              required={field.required}
            />
            <button
              type="button"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (pos) => {
                      handleAnswerChange(
                        field.id,
                        `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`
                      );
                      toast.success("GPS relevé");
                    },
                    () => toast.error("Position GPS indisponible")
                  );
                }
              }}
              className="inline-flex cursor-pointer items-center gap-1 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-750"
            >
              <MapPin size={14} className="text-green-700 dark:text-emerald-400" />
              Capturer
            </button>
          </div>
        )}

        {/* Champ PHOTO */}
        {field.type === "photo" && (
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload(field.id, e)}
              className="block w-full text-xs text-gray-500 dark:text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-green-50 dark:file:bg-emerald-950/60 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-green-700 dark:file:text-emerald-300 hover:file:bg-green-100 dark:hover:file:bg-emerald-900/60 cursor-pointer"
            />
            {val && (
              <div className="mt-2">
                <img
                  src={val}
                  alt="Aperçu photo"
                  className="h-32 w-48 object-cover rounded-xl border border-gray-200 dark:border-slate-700"
                />
              </div>
            )}
          </div>
        )}

        {/* Champ SIGNATURE ÉLECTRONIQUE */}
        {field.type === "signature" && (
          <div className="space-y-2">
            <div className="border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 p-1 inline-block">
              <canvas
                ref={signatureCanvasRef}
                width={400}
                height={140}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={() => stopDrawing(field.id)}
                onMouseLeave={() => stopDrawing(field.id)}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={() => stopDrawing(field.id)}
                className="cursor-crosshair bg-white rounded-lg border border-dashed border-gray-200"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => clearSignature(field.id)}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                <RotateCcw size={12} />
                Effacer la signature
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/surveys")}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft size={19} />
        </button>

        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            Formulaire actif (v{survey?.version || 1})
          </span>
        </div>
      </div>

      {/* Titre & Coopérative */}
      <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{survey?.title}</h1>
        {survey?.description && (
          <p className="mt-2 text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{survey.description}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 dark:border-slate-800 pt-4 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-slate-800 px-3 py-1 font-medium text-gray-700 dark:text-slate-300">
            <Building2 size={13} className="text-gray-500 dark:text-slate-400" />
            {survey?.cooperative?.name || "Coopérative"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-3 py-1 font-medium text-amber-800 dark:text-amber-300">
            <Calendar size={13} className="text-amber-600 dark:text-amber-400" />
            {survey?.campaign}
          </span>
        </div>
      </div>

      {/* Rattachement contextuel (Producteur & Parcelle optionnels) */}
      <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Rattachement terrain (optionnel)</h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
          Associez cette enquête à un agriculteur ou une parcelle spécifique de la coopérative
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Agriculteur */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-slate-300">
              Agriculteur / Producteur
            </label>
            <select
              value={farmerId}
              onChange={(e) => setFarmerId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            >
              <option value="">Non rattaché à un producteur spécifique</option>
              {farmers.map((f) => (
                <option key={f.uuid} value={f.uuid}>
                  {f.full_name} {f.id_card ? `(${f.id_card})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Parcelle */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-slate-300">
              Parcelle concernée
            </label>
            <select
              value={parcelId}
              onChange={(e) => setParcelId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600"
            >
              <option value="">Non rattaché à une parcelle</option>
              {parcels.map((p) => (
                <option key={p.uuid} value={p.uuid}>
                  {p.name
                    ? `${p.name} (${p.area_ha || "?"} ha)`
                    : `Parcelle #${p.uuid?.substring(0, 8)} (${p.area_ha || "?"} ha)`}
                </option>
              ))}
            </select>
          </div>

          {/* Coordonnées GPS globales */}
          <div className="sm:col-span-2 rounded-xl bg-gray-50 dark:bg-slate-800/60 p-4 border border-gray-200/80 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-800 dark:text-white">Localisation GPS du relevé</p>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  {latitude && longitude
                    ? `Coordonnées enregistrées : ${latitude}, ${longitude}`
                    : "Position non encore relevée"}
                </p>
              </div>

              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locating}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-green-700 dark:text-emerald-400 border border-gray-200 dark:border-slate-700 shadow-xs hover:bg-green-50 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                {locating ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Localisation...
                  </>
                ) : (
                  <>
                    <MapPin size={13} />
                    Relever ma position GPS
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rendu dynamique des questions / champs du formulaire */}
      {hasGroups ? (
        <div className="space-y-6">
          {Object.entries(groupsMap).map(([groupName, items]) => (
            <div
              key={groupName}
              className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-50 dark:bg-emerald-950/60 text-green-700 dark:text-emerald-300 border border-green-100 dark:border-emerald-900/50">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white text-base">{groupName}</h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {items.length} question{items.length > 1 ? "s" : ""} dans cette section
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-green-50 dark:bg-emerald-950/60 px-2.5 py-1 text-xs font-medium text-green-700 dark:text-emerald-300 border border-green-200/50 dark:border-emerald-800/50">
                  Section
                </span>
              </div>

              <div className="space-y-4">
                {items.map(({ field, originalIdx }) => renderQuestionCard(field, originalIdx))}
              </div>
            </div>
          ))}

          {uncategorizedFields.length > 0 && (
            <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white text-base">Autres questions</h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {uncategorizedFields.length} question{uncategorizedFields.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-gray-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-slate-300">
                  Général
                </span>
              </div>

              <div className="space-y-4">
                {uncategorizedFields.map(({ field, originalIdx }) =>
                  renderQuestionCard(field, originalIdx)
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
          <h2 className="font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-800 pb-3">
            Questions de l'enquête ({fields.length})
          </h2>

          <div className="space-y-4">
            {fields.map((field, idx) => renderQuestionCard(field, idx))}
          </div>
        </div>
      )}

      {/* Bouton de soumission */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate("/surveys")}
          className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-green-700 dark:bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 dark:hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Soumission en cours...
            </>
          ) : (
            <>
              <Send size={17} />
              Soumettre l'enquête
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default SurveyFill;
