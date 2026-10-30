import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Building2,
  AlertCircle,
} from "lucide-react";

import {
  createNewCooperative,
  getCooperativeById,
  updateExistingCooperative,
} from "../../services/cooperativeService";

const CooperativeForm = () => {
  const navigate = useNavigate();
  const { uuid } = useParams();

  const isEditMode = Boolean(uuid);

  const [formData, setFormData] = useState({
    name: "",
    president_name: "",
    email: "",
    mobile: "",
    address: "",
    legal_status: "cooperative",
    year_of_creation: "",
    status: "active",
    main_crop: "",
    second_crop: "",
    third_crop: "",
  });

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // CHARGER LA COOPERATIVE EN MODE MODIFICATION
  // ============================================================

  useEffect(() => {
    if (!isEditMode) {
      return;
    }

    const loadCooperative = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getCooperativeById(uuid);

        console.log(
          "COOPERATIVE A MODIFIER :",
          result
        );

        const cooperative = result?.data || result;

        if (!cooperative) {
          throw new Error(
            "Coopérative introuvable."
          );
        }

        setFormData({
          name: cooperative.name || "",
          president_name:
            cooperative.president_name || "",
          email: cooperative.email || "",
          mobile: cooperative.mobile || "",
          address: cooperative.address || "",
          legal_status:
            cooperative.legal_status || "cooperative",
          year_of_creation:
            cooperative.year_of_creation || "",
          status: cooperative.status || "active",
          main_crop: cooperative.main_crop || "",
          second_crop:
            cooperative.second_crop || "",
          third_crop:
            cooperative.third_crop || "",
        });
      } catch (err) {
        console.error(
          "Erreur lors du chargement de la coopérative :",
          err
        );

        setError(
          err?.response?.data?.error ||
          err?.message ||
          "Impossible de charger la coopérative."
        );
      } finally {
        setLoading(false);
      }
    };

    loadCooperative();
  }, [uuid, isEditMode]);

  // ============================================================
  // MODIFICATION DES CHAMPS
  // ============================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    // Téléphone : chiffres uniquement, 10 chiffres max
    if (name === "mobile") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setFormData((current) => ({
        ...current,
        mobile: digitsOnly,
      }));
      return;
    }

    // Année de création : chiffres uniquement, 4 chiffres max
    if (name === "year_of_creation") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 4);
      setFormData((current) => ({
        ...current,
        year_of_creation: digitsOnly,
      }));
      return;
    }

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ============================================================
  // SOUMISSION
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    // Validation minimale côté frontend
    if (!formData.name.trim()) {
      setError(
        "Le nom de la coopérative est obligatoire."
      );
      return;
    }

    if (!formData.president_name.trim()) {
      setError(
        "Le nom du président est obligatoire."
      );
      return;
    }

    if (!formData.main_crop.trim()) {
      setError(
        "La culture principale est obligatoire."
      );
      return;
    }

    if (formData.mobile && (!/^\d+$/.test(formData.mobile) || formData.mobile.length > 10)) {
      setError(
        "Le numéro de téléphone doit être composé de 10 chiffres maximum."
      );
      return;
    }

    if (!formData.year_of_creation) {
      setError(
        "L'année de création est obligatoire."
      );
      return;
    }

    if (!/^\d{4}$/.test(String(formData.year_of_creation).trim())) {
      setError(
        "L'année de création doit comporter exactement 4 chiffres (ex. 2024)."
      );
      return;
    }

    const year = Number(formData.year_of_creation);
    if (year < 1900 || year > 2100) {
      setError(
        "L'année de création doit être comprise entre 1900 et 2100."
      );
      return;
    }

    try {
      setSaving(true);

      const data = {
        name: formData.name.trim(),

        president_name:
          formData.president_name.trim(),

        email: formData.email.trim() || null,

        mobile: formData.mobile.trim() || null,

        address: formData.address.trim() || null,

        legal_status: formData.legal_status,

        year_of_creation: Number(
          formData.year_of_creation
        ),

        status: formData.status,

        main_crop: formData.main_crop.trim(),

        second_crop:
          formData.second_crop.trim() || null,

        third_crop:
          formData.third_crop.trim() || null,
      };

      console.log(
        isEditMode
          ? "DONNEES MODIFICATION :"
          : "DONNEES CREATION :",
        data
      );

      if (isEditMode) {
        await updateExistingCooperative(
          uuid,
          data
        );
      } else {
        await createNewCooperative(data);
      }

      // Retour vers la liste
      navigate("/cooperatives");
    } catch (err) {
      console.error(
        "Erreur lors de l'enregistrement :",
        err
      );

      setError(
        err?.response?.data?.error ||
        "Une erreur est survenue lors de l'enregistrement."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // CHARGEMENT
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-green-700" />

        <p className="text-sm text-gray-500">
          Chargement de la coopérative...
        </p>
      </div>
    );
  }

  // ============================================================
  // FORMULAIRE
  // ============================================================

  return (
    <div className="mx-auto space-y-6">
      {/* ======================================================
          EN-TÊTE
      ======================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/cooperatives")}
            className="rounded-lg cursor-pointer p-2 text-gray-600 dark:text-slate-300 transition hover:bg-gray-100 dark:hover:bg-slate-800"
            title="Retour"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditMode
                ? "Modifier la coopérative"
                : "Nouvelle coopérative"}
            </h1>

            <p className="text-sm text-gray-500 dark:text-slate-400">
              {isEditMode
                ? "Modifier les informations de la coopérative"
                : "Enregistrer une nouvelle coopérative"}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          ERREUR
      ======================================================= */}

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 text-red-700 dark:text-red-300">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-medium">
              Impossible d'enregistrer
            </p>

            <p className="mt-1 text-sm">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          FORMULAIRE
      ======================================================= */}

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
      >
        {/* ----------------------------------------------------
            INFORMATIONS GENERALES
        ----------------------------------------------------- */}

        <div className="border-b border-gray-200 dark:border-slate-800 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Informations générales
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Informations principales de la coopérative.
          </p>
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
          {/* NOM */}

          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300"
            >
              Nom de la coopérative
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ex. Coopérative Fianarantsoa"
              required
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-900/30"
            />
          </div>

          {/* PRESIDENT */}

          <div>
            <label
              htmlFor="president_name"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300"
            >
              Nom du président
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="president_name"
              name="president_name"
              type="text"
              value={formData.president_name}
              onChange={handleChange}
              placeholder="Ex. Jean Rakoto"
              required
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-900/30"
            />
          </div>

          {/* EMAIL */}

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300"
            >
              Adresse e-mail
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="contact@cooperative.mg"
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-900/30"
            />
          </div>

          {/* TELEPHONE */}

          <div>
            <label
              htmlFor="mobile"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300"
            >
              Téléphone
            </label>

            <input
              id="mobile"
              name="mobile"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              value={formData.mobile}
              onChange={handleChange}
              placeholder="0340000000"
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-900/30"
            />
          </div>

          {/* ADRESSE */}

          <div className="md:col-span-2">
            <label
              htmlFor="address"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300"
            >
              Adresse
            </label>

            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Adresse ou localisation de la coopérative"
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-900/30"
            />
          </div>
        </div>

        {/* ----------------------------------------------------
            INFORMATIONS JURIDIQUES
        ----------------------------------------------------- */}

        <div className="border-y border-gray-200 dark:border-slate-800 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Informations administratives
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Statut juridique et informations administratives.
          </p>
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
          {/* STATUT JURIDIQUE */}

          <div>
            <label
              htmlFor="legal_status"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300"
            >
              Statut juridique
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              id="legal_status"
              name="legal_status"
              value={formData.legal_status}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-900/30"
            >
              <option value="cooperative" className="dark:bg-slate-800">
                Coopérative
              </option>

              <option value="group" className="dark:bg-slate-800">
                Groupement
              </option>

              <option value="other" className="dark:bg-slate-800">
                Autre
              </option>
            </select>
          </div>

          {/* ANNEE */}

          <div>
            <label
              htmlFor="year_of_creation"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300"
            >
              Année de création
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="year_of_creation"
              name="year_of_creation"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength={4}
              value={formData.year_of_creation}
              onChange={handleChange}
              placeholder="Ex. 2024"
              required
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-900/30"
            />
          </div>

          {/* STATUT */}

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300"
            >
              État de la coopérative
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-900/30"
            >
              <option value="active" className="dark:bg-slate-800">
                Active
              </option>

              <option value="not_active" className="dark:bg-slate-800">
                Inactive
              </option>

              <option value="na" className="dark:bg-slate-800">
                N/A
              </option>
            </select>
          </div>
        </div>

        {/* ----------------------------------------------------
            PRODUCTIONS
        ----------------------------------------------------- */}

        <div className="border-y border-gray-200 dark:border-slate-800 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Productions agricoles
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Principales cultures produites par la coopérative.
          </p>
        </div>

        <div className="grid gap-6 px-6 py-6 md:grid-cols-3">
          {/* CULTURE PRINCIPALE */}

          <div>
            <label
              htmlFor="main_crop"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300"
            >
              Culture principale
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="main_crop"
              name="main_crop"
              type="text"
              value={formData.main_crop}
              onChange={handleChange}
              placeholder="Ex. Riz"
              required
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-900/30"
            />
          </div>

          {/* CULTURE SECONDAIRE */}

          <div>
            <label
              htmlFor="second_crop"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300"
            >
              Culture secondaire
            </label>

            <input
              id="second_crop"
              name="second_crop"
              type="text"
              value={formData.second_crop}
              onChange={handleChange}
              placeholder="Ex. Haricot"
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-900/30"
            />
          </div>

          {/* TROISIEME CULTURE */}

          <div>
            <label
              htmlFor="third_crop"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300"
            >
              Troisième culture
            </label>

            <input
              id="third_crop"
              name="third_crop"
              type="text"
              value={formData.third_crop}
              onChange={handleChange}
              placeholder="Ex. Maïs"
              className="w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 outline-none transition focus:border-green-600 dark:focus:border-emerald-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-emerald-900/30"
            />
          </div>
        </div>

        {/* ----------------------------------------------------
            ACTIONS
        ----------------------------------------------------- */}

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-850/80 px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={() => navigate("/cooperatives")}
            className="rounded-lg cursor-pointer border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 transition hover:bg-gray-100 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center cursor-pointer justify-center gap-2 rounded-lg bg-green-700 dark:bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 dark:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                Enregistrement...
              </>
            ) : (
              <>
                <Save size={18} />

                {isEditMode
                  ? "Enregistrer les modifications"
                  : "Créer la coopérative"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CooperativeForm;