import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Copy,
  MoveUp,
  MoveDown,
  Building2,
  Calendar,
  Type,
  AlignLeft,
  Hash,
  CalendarDays,
  Clock,
  ListFilter,
  CheckSquare,
  Star,
  MapPin,
  Camera,
  PenTool,
  Loader2,
  HelpCircle,
  Sparkles,
  Layers,
  Tag,
  X,
  FolderPlus,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getSurveyById,
  createNewSurvey,
  updateExistingSurvey,
} from "../../services/surveyService";
import { getAllCooperatives } from "../../services/cooperativeService";

// Palette de types de champs supportés (Section 11.2)
const FIELD_TYPES = [
  { type: "text", label: "Texte court", icon: Type, description: "Nom, référence, saisie simple" },
  { type: "textarea", label: "Texte long", icon: AlignLeft, description: "Observations, remarques" },
  { type: "number", label: "Nombre", icon: Hash, description: "Quantité, rendement, surface, âge" },
  { type: "date", label: "Date", icon: CalendarDays, description: "Date de récolte, plantation" },
  { type: "time", label: "Heure", icon: Clock, description: "Heure de visite, passage" },
  { type: "select", label: "Choix unique", icon: ListFilter, description: "Menu déroulant (ex: Type de sol)" },
  { type: "multiselect", label: "Choix multiple", icon: CheckSquare, description: "Cases à cocher (ex: Pratiques bio)" },
  { type: "scale", label: "Échelle (1 à 5)", icon: Star, description: "Évaluation, note de satisfaction" },
  { type: "gps", label: "Point GPS", icon: MapPin, description: "Coordonnées de géolocalisation" },
  { type: "photo", label: "Photo", icon: Camera, description: "Capture ou import d'image terrain" },
  { type: "signature", label: "Signature", icon: PenTool, description: "Signature manuscrite de l'agriculteur" },
];

const SurveyFormBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cooperatives, setCooperatives] = useState([]);

  // Formulaire général
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [campaign, setCampaign] = useState("");
  const [cooperativeId, setCooperativeId] = useState("");
  const [status, setStatus] = useState("published");
  const [version, setVersion] = useState(1);

  // Liste des champs dynamiques
  const [fields, setFields] = useState([]);

  // Gestion des groupes / sections
  const [customGroups, setCustomGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("all");

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        const coopsRes = await getAllCooperatives();
        const coopList = Array.isArray(coopsRes) ? coopsRes : Array.isArray(coopsRes?.data) ? coopsRes.data : [];
        setCooperatives(coopList);

        if (isEditMode) {
          const surveyRes = await getSurveyById(id);
          const survey = surveyRes?.data;
          if (!survey) {
            toast.error("Formulaire introuvable.");
            navigate("/surveys");
            return;
          }

          setTitle(survey.title || "");
          setDescription(survey.description || "");
          setCampaign(survey.campaign || "");
          setCooperativeId(survey.cooperative_id || "");
          setStatus(survey.status || "published");
          setVersion(survey.version || 1);

          const loadedFields = Array.isArray(survey.fields) ? survey.fields : [];
          setFields(loadedFields);

          // Extraire les groupes existants dans les champs
          const groupsInFields = [];
          loadedFields.forEach((f) => {
            if (f.group && f.group.trim() && !groupsInFields.includes(f.group.trim())) {
              groupsInFields.push(f.group.trim());
            }
          });
          setCustomGroups(groupsInFields);
        } else {
          // Par défaut : première coopérative
          if (coopList.length > 0) {
            setCooperativeId(coopList[0].uuid);
          }
          setCampaign(new Date().getFullYear() ? `Campagne ${new Date().getFullYear()}` : "Campagne 2026");
        }
      } catch (err) {
        console.error("Erreur chargement constructeur :", err);
        toast.error("Impossible de charger les données du formulaire.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, isEditMode, navigate]);

  // Tous les groupes uniques disponibles
  const allGroups = useMemo(() => {
    const set = new Set(customGroups);
    fields.forEach((f) => {
      if (f.group && f.group.trim()) {
        set.add(f.group.trim());
      }
    });
    return Array.from(set);
  }, [customGroups, fields]);

  // Champs filtrés selon l'onglet de groupe sélectionné
  const displayedFieldsWithIndex = useMemo(() => {
    return fields
      .map((field, originalIndex) => ({ field, originalIndex }))
      .filter(({ field }) => {
        if (selectedGroupFilter === "all") return true;
        if (selectedGroupFilter === "__none__") return !field.group || !field.group.trim();
        return field.group?.trim() === selectedGroupFilter;
      });
  }, [fields, selectedGroupFilter]);

  // ============================================================
  // ============================================================
  // GESTION DES GROUPES
  // ============================================================

  const handleCreateGroup = (name) => {
    const clean = name?.trim();
    if (!clean) return;
    if (allGroups.includes(clean)) {
      toast.error("Ce groupe existe déjà.");
      return;
    }
    setCustomGroups((prev) => [...prev, clean]);
    setSelectedGroupFilter(clean);
    setNewGroupName("");
    toast.success(`Groupe « ${clean} » créé`);
  };

  const handleDeleteGroup = (groupName) => {
    setCustomGroups((prev) => prev.filter((g) => g !== groupName));
    setFields((prev) =>
      prev.map((f) => (f.group === groupName ? { ...f, group: "" } : f))
    );
    if (selectedGroupFilter === groupName) {
      setSelectedGroupFilter("all");
    }
    toast.success(`Groupe « ${groupName} » retiré`);
  };

  // ============================================================
  // GESTION DES CHAMPS DYNAMIQUES
  // ============================================================

  const addField = (fieldType, targetGroup = null) => {
    const newFieldId = `field_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const typeObj = FIELD_TYPES.find((f) => f.type === fieldType) || FIELD_TYPES[0];

    const assignedGroup =
      targetGroup !== null
        ? targetGroup
        : selectedGroupFilter !== "all" && selectedGroupFilter !== "__none__"
        ? selectedGroupFilter
        : "";

    const newField = {
      id: newFieldId,
      type: fieldType,
      label: `Nouveau champ (${typeObj.label})`,
      group: assignedGroup,
      placeholder: "",
      helpText: "",
      required: false,
      options: fieldType === "select" || fieldType === "multiselect" ? ["Option 1", "Option 2"] : [],
      unit: fieldType === "number" ? "" : undefined,
      min: fieldType === "number" || fieldType === "scale" ? 1 : undefined,
      max: fieldType === "scale" ? 5 : undefined,
    };

    setFields((prev) => [...prev, newField]);
    toast.success(`Champ « ${typeObj.label} » ajouté`);
  };

  const updateField = (index, updates) => {
    setFields((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const removeField = (index) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
    toast.success("Champ retiré");
  };

  const duplicateField = (index) => {
    const fieldToDup = fields[index];
    const duplicated = {
      ...fieldToDup,
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      label: `${fieldToDup.label} (copie)`,
      group: fieldToDup.group || "",
    };
    setFields((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, duplicated);
      return copy;
    });
    toast.success("Champ dupliqué");
  };

  const moveField = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    setFields((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Options pour les select / multiselect
  const handleAddOption = (fieldIndex) => {
    const currentOptions = fields[fieldIndex].options || [];
    updateField(fieldIndex, {
      options: [...currentOptions, `Option ${currentOptions.length + 1}`],
    });
  };

  const handleUpdateOption = (fieldIndex, optIndex, value) => {
    const currentOptions = [...(fields[fieldIndex].options || [])];
    currentOptions[optIndex] = value;
    updateField(fieldIndex, { options: currentOptions });
  };

  const handleRemoveOption = (fieldIndex, optIndex) => {
    const currentOptions = [...(fields[fieldIndex].options || [])];
    currentOptions.splice(optIndex, 1);
    updateField(fieldIndex, { options: currentOptions });
  };

  // ============================================================
  // ENREGISTREMENT
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Veuillez saisir un titre pour le formulaire.");
      return;
    }

    if (!cooperativeId) {
      toast.error("Veuillez sélectionner une coopérative.");
      return;
    }

    if (!campaign.trim()) {
      toast.error("Veuillez renseigner la campagne d'enquête.");
      return;
    }

    if (fields.length === 0) {
      toast.error("Ajoutez au moins un champ au formulaire.");
      return;
    }

    // Vérifier que chaque champ a un libellé
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].label?.trim()) {
        toast.error(`Le champ n°${i + 1} n'a pas de libellé.`);
        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        campaign: campaign.trim(),
        cooperative_id: cooperativeId,
        status,
        fields,
      };

      if (isEditMode) {
        await updateExistingSurvey(id, payload);
        toast.success("Formulaire mis à jour avec succès.");
      } else {
        await createNewSurvey(payload);
        toast.success("Formulaire créé avec succès !");
      }

      setTimeout(() => {
        navigate("/surveys");
      }, 500);
    } catch (err) {
      console.error("Erreur enregistrement :", err);
      toast.error(err?.response?.data?.error || err?.message || "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-green-700 dark:text-emerald-500" />
        <p className="text-sm text-gray-500 dark:text-slate-400">Chargement du concepteur de formulaire...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ======================================================
          EN-TÊTE DE LA PAGE
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
              {isEditMode ? `Modifier le formulaire (v${version})` : "Nouveau formulaire d'enquête"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Concepteur dynamique de champs personnalisés
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/surveys")}
            className="rounded-xl cursor-pointer border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-green-700 dark:bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 dark:hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save size={17} />
                {isEditMode ? "Enregistrer les modifications" : "Créer le formulaire"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================
          PARAMÈTRES GÉNÉRAUX DU FORMULAIRE
      ====================================================== */}
      <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-2.5 border-b border-gray-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Informations & Contexte de l'enquête</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">Définissez la coopérative de rattachement et la campagne associée</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Titre */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Titre du formulaire <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex : Enquête Annuelle de Rendement et Pratiques Bio"
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-500/20"
              required
            />
          </div>

          {/* Coopérative */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Coopérative concernée <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={cooperativeId}
                onChange={(e) => setCooperativeId(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-500/20"
                required
              >
                <option value="">Sélectionner une coopérative</option>
                {cooperatives.map((c) => (
                  <option key={c.uuid} value={c.uuid}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Campagne */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Campagne d'enquête <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="Ex : Campagne 2026, Campagne Vanille 2026-2027"
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-500/20"
              required
            />
          </div>

          {/* Statut */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Statut de publication
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-500/20"
            >
              <option value="published">Publié (ouvert à la collecte terrain & web)</option>
              <option value="draft">Brouillon (en cours de rédaction)</option>
              <option value="archived">Archivé (clôturé)</option>
            </select>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Consignes / Description de l'enquête
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions pour les agents enquêteurs sur le terrain..."
              className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-500/20"
            />
          </div>
        </div>
      </div>

      {/* ======================================================
          DISPOSITION PRINCIPALE : PALETTE À GAUCHE | GROUPES & CHAMPS À DROITE
      ====================================================== */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        
        {/* ======================================================
            COLONNE GAUCHE : PALETTE DE TYPES DE CHAMPS (COMPACTE & STICKY)
        ====================================================== */}
        <div className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Palette des champs</h2>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  Cliquez pour ajouter une question
                </p>
              </div>
              <span className="rounded-full bg-green-50 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:text-emerald-400 border border-green-200/50 dark:border-emerald-800/50">
                {FIELD_TYPES.length} types
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {FIELD_TYPES.map((f) => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.type}
                    type="button"
                    onClick={() => addField(f.type)}
                    title={f.description}
                    className="group flex flex-col items-center justify-center rounded-xl border border-gray-200/80 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/60 p-2 text-center transition hover:border-green-600 dark:hover:border-emerald-500 hover:bg-green-50/50 dark:hover:bg-emerald-950/30 cursor-pointer shadow-2xs hover:shadow-xs"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 shadow-2xs transition group-hover:bg-green-700 dark:group-hover:bg-emerald-600 group-hover:text-white">
                      <Icon size={16} />
                    </div>
                    <span className="mt-1.5 text-[11px] font-semibold text-gray-800 dark:text-slate-200 group-hover:text-green-800 dark:group-hover:text-emerald-300 line-clamp-1">
                      {f.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ======================================================
            COLONNE DROITE : GROUPES / SECTIONS + CHAMPS DU FORMULAIRE
        ====================================================== */}
        <div className="flex-1 min-w-0 w-full space-y-6">

          {/* ======================================================
              GESTION DES GROUPES / SECTIONS (STICKY LORS DU DÉFILEMENT)
          ====================================================== */}
          <div className="sticky top-24 z-10 rounded-2xl border border-gray-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 sm:p-5 shadow-sm transition-shadow">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                  <Layers size={19} />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Groupes & Sections de questions</h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Organisez vos questions par thématiques (ex : Données parcelles, Intrants, Rendement)
                  </p>
                </div>
              </div>

              {/* Formulaire ajout rapide de groupe */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateGroup(newGroupName);
                    }
                  }}
                  placeholder="Nouveau nom de groupe..."
                  className="rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 sm:w-56"
                />
                <button
                  type="button"
                  onClick={() => handleCreateGroup(newGroupName)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-purple-700 dark:bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple-800 dark:hover:bg-purple-700"
                >
                  <FolderPlus size={14} />
                  Ajouter
                </button>
              </div>
            </div>

            {/* Suggestions rapides si aucun groupe */}
            {allGroups.length === 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-slate-400">Suggestions :</span>
                {[
                  "Identification & Profil",
                  "Données parcellaires",
                  "Pratiques culturales & Intrants",
                  "Récolte & Vente",
                ].map((suggest) => (
                  <button
                    key={suggest}
                    type="button"
                    onClick={() => handleCreateGroup(suggest)}
                    className="cursor-pointer rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/60 dark:bg-purple-950/40 px-2.5 py-1 text-xs font-medium text-purple-800 dark:text-purple-300 transition hover:bg-purple-100 dark:hover:bg-purple-900/60"
                  >
                    + {suggest}
                  </button>
                ))}
              </div>
            )}

            {/* Onglets de filtrage par groupe */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedGroupFilter("all")}
                className={`cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  selectedGroupFilter === "all"
                    ? "bg-gray-900 dark:bg-slate-700 text-white"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                }`}
              >
                Toutes les questions ({fields.length})
              </button>

              {allGroups.map((g) => {
                const count = fields.filter((f) => f.group === g).length;
                const isSelected = selectedGroupFilter === g;

                return (
                  <div
                    key={g}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                      isSelected
                        ? "border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200"
                        : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedGroupFilter(g)}
                      className="cursor-pointer inline-flex items-center gap-1"
                    >
                      <Tag size={12} className={isSelected ? "text-purple-600 dark:text-purple-400" : "text-gray-400 dark:text-slate-500"} />
                      <span>{g}</span>
                      <span className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                        isSelected ? "bg-purple-200 dark:bg-purple-900/70 text-purple-900 dark:text-purple-200" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300"
                      }`}>
                        {count}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(g)}
                      title="Supprimer ce groupe"
                      className="ml-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </div>
                );
              })}

              {fields.some((f) => !f.group || !f.group.trim()) && (
                <button
                  type="button"
                  onClick={() => setSelectedGroupFilter("__none__")}
                  className={`cursor-pointer inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    selectedGroupFilter === "__none__"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                  }`}
                >
                  Non classées ({fields.filter((f) => !f.group || !f.group.trim()).length})
                </button>
              )}
            </div>
          </div>

          {/* ======================================================
              CONSTRUCTEUR DE CHAMPS (LISTE ORDONNÉE)
          ====================================================== */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Champs du formulaire ({fields.length})
                  {selectedGroupFilter !== "all" && (
                    <span className="ml-2 text-sm font-normal text-purple-700 dark:text-purple-400">
                      • Filtre : {selectedGroupFilter === "__none__" ? "Sans groupe" : selectedGroupFilter} ({displayedFieldsWithIndex.length})
                    </span>
                  )}
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Personnalisez les libellés, validations et groupes de chaque champ
                </p>
              </div>

              {fields.length > 0 && (
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  Utilisez les flèches pour réordonner les champs
                </span>
              )}
            </div>

            {displayedFieldsWithIndex.length === 0 ? (
              <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  {selectedGroupFilter === "all"
                    ? "Aucun champ dans le formulaire"
                    : selectedGroupFilter === "__none__"
                    ? "Aucun champ sans groupe"
                    : `Aucun champ dans le groupe « ${selectedGroupFilter} »`}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                  Cliquez sur un des boutons de la palette ci-dessus pour ajouter une question.
                </p>
              </div>
            ) : (
              displayedFieldsWithIndex.map(({ field, originalIndex }) => {
                const fieldMeta = FIELD_TYPES.find((t) => t.type === field.type) || FIELD_TYPES[0];
                const Icon = fieldMeta.icon;

                return (
                  <div
                    key={field.id}
                    className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs transition hover:border-green-300 dark:hover:border-emerald-600"
                  >
                    {/* En-tête du champ */}
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800 text-xs font-bold text-gray-600 dark:text-slate-300">
                          {originalIndex + 1}
                        </span>
                        <div className="flex items-center gap-1.5 rounded-lg bg-green-50 dark:bg-emerald-950/60 px-2.5 py-1 text-xs font-semibold text-green-800 dark:text-emerald-300">
                          <Icon size={14} />
                          {fieldMeta.label}
                        </div>
                        {field.group && (
                          <span className="flex items-center gap-1 rounded-md bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                            <Layers size={11} />
                            {field.group}
                          </span>
                        )}
                        {field.required && (
                          <span className="rounded-md bg-red-50 dark:bg-red-950/60 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600 dark:text-red-400">
                            Obligatoire
                          </span>
                        )}
                      </div>

                      {/* Boutons d'action du champ */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={originalIndex === 0}
                          onClick={() => moveField(originalIndex, -1)}
                          className="cursor-pointer rounded-lg p-1.5 text-gray-400 dark:text-slate-500 transition hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-300 disabled:opacity-30"
                          title="Monter"
                        >
                          <MoveUp size={16} />
                        </button>
                        <button
                          type="button"
                          disabled={originalIndex === fields.length - 1}
                          onClick={() => moveField(originalIndex, 1)}
                          className="cursor-pointer rounded-lg p-1.5 text-gray-400 dark:text-slate-500 transition hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-300 disabled:opacity-30"
                          title="Descendre"
                        >
                          <MoveDown size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateField(originalIndex)}
                          className="cursor-pointer rounded-lg p-1.5 text-gray-400 dark:text-slate-500 transition hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-300"
                          title="Dupliquer"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeField(originalIndex)}
                          className="cursor-pointer rounded-lg p-1.5 text-gray-400 dark:text-slate-500 transition hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400"
                          title="Supprimer ce champ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Configuration du champ */}
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {/* Libellé */}
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                          Libellé de la question / étiquette <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(originalIndex, { label: e.target.value })}
                          placeholder="Ex : Surface cultivée en vanille"
                          className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
                          required
                        />
                      </div>

                      {/* Groupe / Section */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                          Groupe / Section de question
                        </label>
                        <select
                          value={field.group || ""}
                          onChange={(e) => updateField(originalIndex, { group: e.target.value })}
                          className="w-full cursor-pointer rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white outline-none transition focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                        >
                          <option value="">(Aucun groupe - question générale)</option>
                          {allGroups.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Placeholder */}
                      {["text", "textarea", "number"].includes(field.type) && (
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                            Indication (placeholder)
                          </label>
                          <input
                            type="text"
                            value={field.placeholder || ""}
                            onChange={(e) => updateField(originalIndex, { placeholder: e.target.value })}
                            placeholder="Ex : Ex: 1.5"
                            className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
                          />
                        </div>
                      )}

                      {/* Unité pour les nombres */}
                      {field.type === "number" && (
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                            Unité de mesure
                          </label>
                          <input
                            type="text"
                            value={field.unit || ""}
                            onChange={(e) => updateField(originalIndex, { unit: e.target.value })}
                            placeholder="Ex : hectares, kg, pieds, sacs"
                            className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
                          />
                        </div>
                      )}

                      {/* Texte d'aide */}
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-slate-300">
                          Texte d'aide ou consigne (optionnel)
                        </label>
                        <input
                          type="text"
                          value={field.helpText || ""}
                          onChange={(e) => updateField(originalIndex, { helpText: e.target.value })}
                          placeholder="Ex : Précisez la valeur estimée après séchage"
                          className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 focus:ring-1 focus:ring-green-600"
                        />
                      </div>

                      {/* Obligatoire */}
                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id={`req_${field.id}`}
                          checked={field.required || false}
                          onChange={(e) => updateField(originalIndex, { required: e.target.checked })}
                          className="h-4 w-4 rounded border-gray-300 dark:border-slate-700 text-green-700 focus:ring-green-600"
                        />
                        <label htmlFor={`req_${field.id}`} className="text-xs font-medium text-gray-700 dark:text-slate-300 cursor-pointer">
                          Champ obligatoire pour la soumission
                        </label>
                      </div>

                      {/* Options pour Select et Multiselect */}
                      {["select", "multiselect"].includes(field.type) && (
                        <div className="sm:col-span-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/50 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                              Options proposées ({field.options?.length || 0})
                            </label>
                            <button
                              type="button"
                              onClick={() => handleAddOption(originalIndex)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-green-700 dark:text-emerald-400 shadow-xs border border-gray-200 dark:border-slate-700 hover:bg-green-50 dark:hover:bg-slate-700"
                            >
                              <Plus size={13} />
                              Ajouter une option
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(field.options || []).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 dark:text-slate-500 font-mono w-4">{optIdx + 1}.</span>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => handleUpdateOption(originalIndex, optIdx, e.target.value)}
                                  placeholder={`Option ${optIdx + 1}`}
                                  className="flex-1 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white outline-none focus:border-green-600"
                                />
                                {field.options.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(originalIndex, optIdx)}
                                    className="cursor-pointer text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

export default SurveyFormBuilder;
