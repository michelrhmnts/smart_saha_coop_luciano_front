import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import toast from "react-hot-toast";

import {
  getFarmerById,
} from "../../services/farmerService";
import { useAuth } from "../../context/AuthContext";

import {
  ArrowLeft,
  Pencil,
  User,
  Home,
  ShieldCheck,
  CreditCard,
  Users,
  Calendar,
  Heart,
  Loader2,
  UserRound,
  Smartphone,
} from "lucide-react";


function FarmerDetails() {

  const navigate = useNavigate();
  const { user } = useAuth();
  const isBioAuditor = user?.role === "bio_auditor";

  const { uuid } = useParams();

  const [searchParams] = useSearchParams();

  const cooperativeId =
    searchParams.get("cooperative_id");


  // ============================================================
  // ÉTATS
  // ============================================================

  const [farmer, setFarmer] = useState(null);

  const [loading, setLoading] = useState(true);


  // ============================================================
  // CHARGEMENT DE L'AGRICULTEUR
  // ============================================================

  useEffect(() => {

    if (!cooperativeId) {

      toast.error(
        "La coopérative de l'agriculteur est introuvable."
      );

      setLoading(false);

      return;
    }


    const loadFarmer = async () => {

      try {

        setLoading(true);


        const result =
          await getFarmerById(
            cooperativeId,
            uuid
          );


        if (!result?.success || !result?.data) {

          toast.error(
            result?.error ||
            "Agriculteur introuvable."
          );

          return;
        }


        setFarmer(result.data);

      } catch (error) {

        console.error(
          "Erreur chargement agriculteur :",
          error
        );


        toast.error(
          error.response?.data?.error ||
          "Impossible de charger les informations de l'agriculteur."
        );

      } finally {

        setLoading(false);

      }

    };


    loadFarmer();

  }, [
    cooperativeId,
    uuid,
  ]);


  // ============================================================
  // RETOUR
  // ============================================================

  const handleBack = () => {

    navigate("/farmers");

  };


  // ============================================================
  // MODIFICATION
  // ============================================================

  const handleEdit = () => {

    navigate(
      `/farmers/${uuid}/edit?cooperative_id=${cooperativeId}`
    );

  };


  // ============================================================
  // LABELS
  // ============================================================

  const getGenderLabel = (gender) => {

    const labels = {
      male: "Homme",
      female: "Femme",
      other: "Autre",
    };

    return labels[gender] || gender || "N/A";

  };


  const getMaritalStatusLabel = (status) => {

    const labels = {
      single: "Célibataire",
      married: "Marié(e)",
      divorced: "Divorcé(e)",
      widowed: "Veuf / Veuve",
    };

    return labels[status] || status || "N/A";

  };


  const getStatusLabel = (status) => {

    const labels = {
      active: "Actif",
      not_active: "Inactif",
      na: "N/A",
    };

    return labels[status] || status || "N/A";

  };


  const getStatusClasses = (status) => {

    const classes = {
      active:
        "bg-green-100 dark:bg-emerald-950/80 text-green-700 dark:text-emerald-300 border border-green-200 dark:border-emerald-800",

      not_active:
        "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800",

      na:
        "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400",
    };

    return (
      classes[status] ||
      "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
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
            Chargement des informations...
          </p>

        </div>

      </div>

    );

  }


  // ============================================================
  // AGRICULTEUR INTROUVABLE
  // ============================================================

  if (!farmer) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
            <User
              size={26}
              className="text-gray-400 dark:text-slate-500"
            />
          </div>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Agriculteur introuvable
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            Les informations demandées ne sont pas disponibles.
          </p>

          <button
            type="button"
            onClick={handleBack}
            className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-green-700 dark:bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-800 dark:hover:bg-emerald-700"
          >
            <ArrowLeft size={17} />
            Retour aux agriculteurs
          </button>
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
            onClick={handleBack}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {farmer.full_name}
              </h1>

              <p className="text-sm text-gray-500 dark:text-slate-400">
                Détails de l'agriculteur
              </p>
            </div>
          </div>
        </div>

        {/* MODIFIER (Masqué pour auditeur bio) */}
        {!isBioAuditor && (
          <button
            type="button"
            onClick={handleEdit}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-green-700 dark:bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-800 dark:hover:bg-emerald-700"
          >
            <Pencil size={17} />
            Modifier
          </button>
        )}
      </div>

      {/* ======================================================
          IDENTITÉ
      ====================================================== */}

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
              Identité de l'agriculteur
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* NOM */}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
              Nom complet
            </p>

            <p className="mt-1 font-medium text-gray-900 dark:text-white">
              {farmer.full_name || "N/A"}
            </p>
          </div>

          {/* SEXE */}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
              Sexe
            </p>

            <p className="mt-1 text-sm text-gray-700 dark:text-slate-200">
              {getGenderLabel(farmer.gender)}
            </p>
          </div>

          {/* ANNÉE DE NAISSANCE */}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
              Année de naissance
            </p>

            <p className="mt-1 flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
              <Calendar size={16} className="text-gray-400 dark:text-slate-500" />
              {farmer.year_of_birth || "N/A"}
            </p>
          </div>

          {/* CIN */}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
              Numéro de CIN
            </p>

            <p className="mt-1 flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
              <CreditCard size={16} className="text-gray-400 dark:text-slate-500" />
              {farmer.id_card || "N/A"}
            </p>
          </div>

          {/* TÉLÉPHONE (ALERTES SMS) */}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
              Téléphone mobile (SMS)
            </p>

            <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <Smartphone size={16} className="text-emerald-600 dark:text-emerald-400" />
              {farmer.phone ? (
                <a
                  href={`tel:${farmer.phone}`}
                  className="hover:underline"
                  title="Appeler ou envoyer un SMS"
                >
                  {farmer.phone}
                </a>
              ) : (
                <span className="text-xs font-normal italic text-gray-400 dark:text-slate-500">
                  Non renseigné
                </span>
              )}
            </p>
          </div>

          {/* SITUATION */}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
              Situation familiale
            </p>

            <p className="mt-1 flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
              <Heart size={16} className="text-gray-400 dark:text-slate-500" />
              {getMaritalStatusLabel(
                farmer.marital_status
              )}
            </p>
          </div>

          {/* STATUT */}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
              Statut
            </p>

            <span
              className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                farmer.status
              )}`}
            >
              {getStatusLabel(
                farmer.status
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          MÉNAGE
      ====================================================== */}

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
              Composition et situation du foyer
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2">
          {/* MÉNAGE */}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
              Nombre de personnes
            </p>

            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F3EA] dark:bg-emerald-950/70 text-[#1B4332] dark:text-emerald-400">
                <Users size={20} />
              </div>

              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {farmer.household_number || 0}
                </p>

                <p className="text-xs text-gray-500 dark:text-slate-400">
                  personne(s)
                </p>
              </div>
            </div>
          </div>

          {/* HANDICAP */}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
              Situation de handicap
            </p>

            <div className="mt-2">
              {farmer.handicap ? (
                <span className="inline-flex rounded-full bg-orange-100 dark:bg-amber-950/80 px-3 py-1.5 text-xs font-medium text-orange-700 dark:text-amber-300 border border-orange-200 dark:border-amber-800">
                  Oui
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-400">
                  Non
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          INFORMATIONS SYSTÈME
      ====================================================== */}

      <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F3EA] dark:bg-emerald-950/70 text-[#1B4332] dark:text-emerald-400">
            <ShieldCheck size={19} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Informations système
            </h2>

            <p className="text-xs text-gray-500 dark:text-slate-400">
              Identifiants techniques et traçabilité
            </p>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2">
          {/* DATE */}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
              Date d'enregistrement
            </p>

            <p className="mt-1 text-sm text-gray-700 dark:text-slate-200">
              {farmer.created_at
                ? new Date(
                    farmer.created_at
                  ).toLocaleString("fr-FR")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================
          RETOUR
      ====================================================== */}

      <div>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 transition hover:bg-gray-50 dark:hover:bg-slate-700"
        >
          <ArrowLeft size={17} />
          Retour à la liste
        </button>
      </div>
    </div>
  );
}

export default FarmerDetails;