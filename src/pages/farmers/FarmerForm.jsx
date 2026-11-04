import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import toast from "react-hot-toast";

import {
  createNewFarmer,
  getFarmerById,
  updateExistingFarmer,
} from "../../services/farmerService";
import { getAllCooperatives } from "../../services/cooperativeService";

import {
  ArrowLeft,
  Save,
  UserPlus,
  Loader2,
  User,
  Home,
  ShieldCheck,
  Building2,
  Smartphone,
} from "lucide-react";


// ============================================================
// VALEUR PAR DÉFAUT
// ============================================================

const initialForm = {
  full_name: "",
  gender: "",
  year_of_birth: "",
  id_card: "",
  phone: "",
  marital_status: "",
  household_number: "",
  handicap: false,
  status: "active",
};


function FarmerForm() {

  const navigate = useNavigate();

  const { uuid } = useParams();

  const [searchParams] = useSearchParams();

  // Mode modification
  const isEditMode = Boolean(uuid);

  // Coopératives
  const [cooperatives, setCooperatives] = useState([]);
  const [loadingCooperatives, setLoadingCooperatives] = useState(false);
  const [cooperativeId, setCooperativeId] = useState(
    searchParams.get("cooperative_id") || ""
  );

  // ============================================================
  // ÉTATS
  // ============================================================

  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);


  // ============================================================
  // CHARGEMENT DES COOPÉRATIVES
  // ============================================================

  useEffect(() => {
    const loadCooperatives = async () => {
      try {
        setLoadingCooperatives(true);
        const result = await getAllCooperatives();
        const data = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : [];

        setCooperatives(data);

        // Si une coopérative est déjà sélectionnée ou dans l'URL et valide
        if (cooperativeId && data.some((coop) => coop.uuid === cooperativeId)) {
          return;
        }

        // Si aucune sélection et une seule coopérative existe
        if (!cooperativeId && data.length === 1) {
          setCooperativeId(data[0].uuid);
        }
      } catch (error) {
        console.error("Erreur chargement coopératives :", error);
        toast.error("Impossible de charger les coopératives.");
      } finally {
        setLoadingCooperatives(false);
      }
    };

    loadCooperatives();
  }, []);


  // ============================================================
  // CHARGEMENT DE L'AGRICULTEUR
  // ============================================================

  useEffect(() => {

    if (!isEditMode) {
      return;
    }

    if (!cooperativeId) {
      toast.error(
        "La coopérative de l'agriculteur est introuvable."
      );

      return;
    }


    const loadFarmer = async () => {

      try {

        setLoading(true);

        const result = await getFarmerById(
          cooperativeId,
          uuid
        );


        const farmer = result?.data;


        if (!farmer) {

          toast.error(
            "Agriculteur introuvable."
          );

          navigate("/farmers");

          return;
        }


        setForm({
          full_name: farmer.full_name || "",
          gender: farmer.gender || "",
          year_of_birth:
            farmer.year_of_birth || "",
          id_card: farmer.id_card || "",
          phone: farmer.phone || "",
          marital_status:
            farmer.marital_status || "",
          household_number:
            farmer.household_number ?? "",
          handicap:
            farmer.handicap ?? false,
          status:
            farmer.status || "active",
        });

      } catch (error) {

        console.error(
          "Erreur chargement agriculteur :",
          error
        );

        toast.error(
          error.response?.data?.error ||
          "Impossible de charger l'agriculteur."
        );

      } finally {

        setLoading(false);

      }

    };


    loadFarmer();

  }, [
    isEditMode,
    cooperativeId,
    uuid,
    navigate,
  ]);


  // ============================================================
  // MODIFICATION DU FORMULAIRE
  // ============================================================

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    // Année de naissance : uniquement des chiffres, 4 chiffres max
    if (name === "year_of_birth") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 4);
      setForm((previous) => ({
        ...previous,
        [name]: digitsOnly,
      }));
      return;
    }

    // Numéro de CIN : uniquement des chiffres, 12 chiffres max
    if (name === "id_card") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 12);
      setForm((previous) => ({
        ...previous,
        [name]: digitsOnly,
      }));
      return;
    }

    // Téléphone : uniquement des chiffres, 10 chiffres max
    if (name === "phone") {
      const onlyDigits = value.replace(/\D/g, "").slice(0, 10);
      setForm((previous) => ({
        ...previous,
        [name]: onlyDigits,
      }));
      return;
    }

    // Nombre de personnes dans le ménage : uniquement des chiffres (pas de lettres)
    if (name === "household_number") {
      const digitsOnly = value.replace(/\D/g, "");
      setForm((previous) => ({
        ...previous,
        [name]: digitsOnly,
      }));
      return;
    }

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ============================================================
  // VALIDATION
  // ============================================================

  const validateForm = () => {
    if (!cooperativeId) {
      toast.error("Veuillez sélectionner une coopérative.");
      return false;
    }

    if (!form.full_name.trim()) {
      toast.error("Le nom complet est obligatoire.");
      return false;
    }

    if (!form.gender) {
      toast.error("Veuillez sélectionner le sexe.");
      return false;
    }

    // --- Validation Année de naissance (4 chiffres, min: année-100, max: année-10) ---
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 100;
    const maxYear = currentYear - 10;

    if (!form.year_of_birth) {
      toast.error("L'année de naissance est obligatoire.");
      return false;
    }

    const birthStr = String(form.year_of_birth).trim();
    if (birthStr.length !== 4 || !/^\d{4}$/.test(birthStr)) {
      toast.error("L'année de naissance doit comporter exactement 4 chiffres.");
      return false;
    }

    const year = Number(birthStr);
    if (!Number.isInteger(year) || year < minYear || year > maxYear) {
      toast.error(
        `L'année de naissance doit être comprise entre ${minYear} et ${maxYear} (maximum ${maxYear} et minimum ${minYear}).`
      );
      return false;
    }

    // --- Validation Numéro de CIN (12 chiffres exactement) ---
    const cinStr = String(form.id_card || "").trim();
    if (!cinStr) {
      toast.error("Le numéro de CIN est obligatoire.");
      return false;
    }

    if (cinStr.length !== 12 || !/^\d{12}$/.test(cinStr)) {
      toast.error("Le numéro de CIN doit comporter exactement 12 chiffres (uniquement des chiffres).");
      return false;
    }

    // --- Validation Nombre de personnes dans le ménage (chiffres uniquement, >= 1) ---
    if (!form.household_number || String(form.household_number).trim() === "") {
      toast.error("Le nombre de personnes dans le ménage est obligatoire.");
      return false;
    }

    const household = Number(form.household_number);
    if (!Number.isInteger(household) || household < 1) {
      toast.error("Le nombre de personnes dans le ménage doit être un nombre supérieur ou égal à 1.");
      return false;
    }

    // --- Validation Téléphone (10 chiffres exactement si renseigné) ---
    const phoneStr = String(form.phone || "").replace(/\D/g, "");
    if (phoneStr && phoneStr.length !== 10) {
      toast.error("Le numéro de téléphone doit comporter exactement 10 chiffres (format : 03XXXXXXXX).");
      return false;
    }

    return true;
  };


  // ============================================================
  // ENREGISTREMENT
  // ============================================================

  const handleSubmit = async (event) => {

    event.preventDefault();


    if (!validateForm()) {
      return;
    }


    try {

      setSaving(true);


      const data = {

        full_name:
          form.full_name.trim(),

        gender:
          form.gender,

        year_of_birth:
          Number(form.year_of_birth),

        id_card:
          form.id_card.trim() || null,

        phone:
          form.phone.trim() || null,

        marital_status:
          form.marital_status || null,

        household_number:
          Number(form.household_number),

        handicap:
          Boolean(form.handicap),

        status:
          form.status,

      };


      let result;


      // ========================================================
      // MODIFICATION
      // ========================================================

      if (isEditMode) {

        result =
          await updateExistingFarmer(
            cooperativeId,
            uuid,
            data
          );


        if (!result?.success) {

          throw new Error(
            result?.error ||
            "La modification a échoué."
          );

        }


        toast.success(
          "Agriculteur modifié avec succès."
        );

      }


      // ========================================================
      // CRÉATION
      // ========================================================

      else {

        result =
          await createNewFarmer(
            cooperativeId,
            data
          );


        if (!result?.success) {

          throw new Error(
            result?.error ||
            "La création a échoué."
          );

        }


        toast.success(
          "Agriculteur créé avec succès."
        );

      }


      // Petite pause pour laisser voir le toast
      setTimeout(() => {
        navigate(
          cooperativeId
            ? `/farmers?cooperative_id=${cooperativeId}`
            : "/farmers"
        );
      }, 500);


    } catch (error) {

      console.error(
        "Erreur enregistrement agriculteur :",
        error
      );


      toast.error(
        error.response?.data?.error ||
        error.message ||
        "Une erreur est survenue."
      );

    } finally {

      setSaving(false);

    }

  };


  // ============================================================
  // ANNULATION
  // ============================================================

  const handleCancel = () => {

    navigate(
      cooperativeId
        ? `/farmers?cooperative_id=${cooperativeId}`
        : "/farmers"
    );

  };


  // ============================================================
  // CHARGEMENT
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            size={32}
            className="animate-spin text-green-700 dark:text-emerald-500"
          />
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Chargement de l'agriculteur...
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <div className="space-y-6">
      {/* ======================================================
          EN-TÊTE
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="flex h-10 cursor-pointer w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditMode
                  ? "Modifier l'agriculteur"
                  : "Nouvel agriculteur"}
              </h1>

              <p className="text-sm text-gray-500 dark:text-slate-400">
                {isEditMode
                  ? "Modifier les informations de l'agriculteur"
                  : "Enregistrer un nouvel agriculteur"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          FORMULAIRE
      ====================================================== */}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* ====================================================
            COOPÉRATIVE DE RATTACHEMENT
        ==================================================== */}

        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F3EA] dark:bg-emerald-950/70 text-[#1B4332] dark:text-emerald-400">
              <Building2 size={19} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Coopérative
              </h2>

              <p className="text-xs text-gray-500 dark:text-slate-400">
                Coopérative de rattachement de l'agriculteur
              </p>
            </div>
          </div>

          <div className="p-6">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
              Coopérative
              <span className="ml-1 text-red-500">*</span>
            </label>

            <select
              name="cooperative_id"
              value={cooperativeId}
              onChange={(e) => setCooperativeId(e.target.value)}
              disabled={loadingCooperatives || saving || isEditMode}
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-500/20 disabled:bg-gray-100 dark:disabled:bg-slate-800/50 disabled:text-gray-500 dark:disabled:text-slate-500"
            >
              <option value="" className="dark:bg-slate-800">
                {loadingCooperatives
                  ? "Chargement des coopératives..."
                  : "Sélectionner une coopérative"}
              </option>

              {cooperatives.map((cooperative) => (
                <option
                  key={cooperative.uuid}
                  value={cooperative.uuid}
                  className="dark:bg-slate-800"
                >
                  {cooperative.name}
                </option>
              ))}
            </select>

            {isEditMode && (
              <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                La coopérative ne peut pas être modifiée pour un agriculteur existant.
              </p>
            )}
          </div>
        </div>

        {/* ====================================================
            INFORMATIONS PERSONNELLES
        ==================================================== */}

        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F3EA] dark:bg-emerald-950/70 text-[#1B4332] dark:text-emerald-400">
              <User size={19} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Informations personnelles
              </h2>

              <p className="text-xs text-gray-500 dark:text-slate-400">
                Informations générales de l'agriculteur
              </p>
            </div>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            {/* NOM COMPLET */}

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Nom complet
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Ex : Rakoto Jean Modeste"
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-500/20"
              />
            </div>

            {/* SEXE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Sexe
                <span className="ml-1 text-red-500">*</span>
              </label>

              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-500/20"
              >
                <option value="" className="dark:bg-slate-800">
                  Sélectionner
                </option>

                <option value="male" className="dark:bg-slate-800">
                  Homme
                </option>

                <option value="female" className="dark:bg-slate-800">
                  Femme
                </option>

                <option value="other" className="dark:bg-slate-800">
                  Autre
                </option>
              </select>
            </div>

            {/* ANNÉE DE NAISSANCE */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Année de naissance
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                name="year_of_birth"
                value={form.year_of_birth}
                onChange={handleChange}
                placeholder={`Ex : ${new Date().getFullYear() - 35}`}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-500/20"
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                4 chiffres requis (entre {new Date().getFullYear() - 100} et {new Date().getFullYear() - 10})
              </p>
            </div>

            {/* CIN */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Numéro de CIN
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <span
                  className={`text-xs ${
                    String(form.id_card || "").length === 12
                      ? "font-semibold text-emerald-600 dark:text-emerald-400"
                      : "text-gray-400 dark:text-slate-500"
                  }`}
                >
                  {String(form.id_card || "").length}/12 chiffres
                </span>
              </div>

              <input
                type="text"
                inputMode="numeric"
                maxLength={12}
                name="id_card"
                value={form.id_card}
                onChange={handleChange}
                placeholder="Ex : 101234567890 (12 chiffres)"
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-500/20"
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                Exactement 12 chiffres numériques (uniquement des chiffres)
              </p>
            </div>

            {/* NUMÉRO DE TÉLÉPHONE (POUR ALERTES SMS) */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <Smartphone className="h-4 w-4 text-[#1B4332] dark:text-emerald-400" />
                  <span>Numéro de téléphone mobile</span>
                </label>
                <span
                  className={`text-xs ${
                    String(form.phone || "").length === 10
                      ? "font-semibold text-emerald-600 dark:text-emerald-400"
                      : "text-gray-400 dark:text-slate-500"
                  }`}
                >
                  {String(form.phone || "").length}/10 chiffres
                </span>
              </div>

              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Ex : 0341234567 ou 032..., 033..., 038..."
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-500/20"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                📱 Requis pour recevoir les alertes incendie par SMS (sms.mg - Telma / Orange / Airtel)
              </p>
            </div>

            {/* SITUATION MATRIMONIALE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Situation familiale
              </label>

              <select
                name="marital_status"
                value={form.marital_status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-500/20"
              >
                <option value="" className="dark:bg-slate-800">
                  Sélectionner
                </option>

                <option value="single" className="dark:bg-slate-800">
                  Célibataire
                </option>

                <option value="married" className="dark:bg-slate-800">
                  Marié(e)
                </option>

                <option value="divorced" className="dark:bg-slate-800">
                  Divorcé(e)
                </option>

                <option value="widowed" className="dark:bg-slate-800">
                  Veuf / Veuve
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* ====================================================
            INFORMATIONS DU MÉNAGE
        ==================================================== */}

        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F3EA] dark:bg-emerald-950/70 text-[#1B4332] dark:text-emerald-400">
              <Home size={19} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Informations du ménage
              </h2>

              <p className="text-xs text-gray-500 dark:text-slate-400">
                Informations concernant le foyer
              </p>
            </div>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            {/* NOMBRE DE PERSONNES */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Nombre de personnes dans le ménage
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                type="text"
                inputMode="numeric"
                name="household_number"
                value={form.household_number}
                onChange={handleChange}
                placeholder="Ex : 5"
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-500/20"
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-slate-500">
                Nombre entier (chiffres uniquement, supérieur ou égal à 1)
              </p>
            </div>

            {/* HANDICAP */}

            <div className="flex items-center">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  name="handicap"
                  checked={form.handicap}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 dark:border-slate-700 text-green-700 focus:ring-green-600 dark:bg-slate-800"
                />

                <span className="text-sm text-gray-700 dark:text-slate-300">
                  Personne en situation de handicap
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* ====================================================
            STATUT
        ==================================================== */}

        <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F3EA] dark:bg-emerald-950/70 text-[#1B4332] dark:text-emerald-400">
              <ShieldCheck size={19} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Statut
              </h2>

              <p className="text-xs text-gray-500 dark:text-slate-400">
                État actuel de l'agriculteur
              </p>
            </div>
          </div>

          <div className="p-6">
            <div className="max-w-md">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                Statut
              </label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-500/20"
              >
                <option value="active" className="dark:bg-slate-800">
                  Actif
                </option>

                <option value="not_active" className="dark:bg-slate-800">
                  Inactif
                </option>

                <option value="na" className="dark:bg-slate-800">
                  N/A
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* ====================================================
            BOUTONS
        ==================================================== */}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="rounded-lg cursor-pointer border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center cursor-pointer justify-center gap-2 rounded-lg bg-green-700 dark:bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 dark:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Enregistrement...
              </>
            ) : (
              <>
                <Save size={18} />
                {isEditMode
                  ? "Enregistrer les modifications"
                  : "Créer l'agriculteur"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>

  );

}


export default FarmerForm;