import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Sprout,
  FileText,
  AlertCircle,
  RefreshCw,
  FileDown,
  LogIn,
} from "lucide-react";

import { getCooperativeById } from "../../services/cooperativeService";
import { downloadCooperativePdf } from "../../utils/cooperativePdf";
import { useAuth } from "../../context/AuthContext";

const CooperativeDetails = () => {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const { user, logout } = useAuth();
  const isBioAuditor = user?.role === "bio_auditor";

  const [cooperative, setCooperative] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ============================================================
  // CHARGEMENT DE LA COOPERATIVE
  // ============================================================

  const loadCooperative = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getCooperativeById(uuid);

      console.log(
        "DETAIL COOPERATIVE :",
        result
      );

      const data = result?.data || result;

      if (!data) {
        throw new Error(
          "Coopérative introuvable."
        );
      }

      setCooperative(data);
    } catch (err) {
      console.error(
        "Erreur lors du chargement de la coopérative :",
        err
      );

      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Impossible de charger les informations de la coopérative."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CHARGEMENT INITIAL
  // ============================================================

  useEffect(() => {
    loadCooperative();
  }, [uuid]);

  // ============================================================
  // STATUT
  // ============================================================

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Active";

      case "not_active":
        return "Inactive";

      case "na":
        return "N/A";

      default:
        return status || "N/A";
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 dark:bg-emerald-950/80 text-green-700 dark:text-emerald-300 border border-green-200 dark:border-emerald-800";

      case "not_active":
        return "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800";

      case "na":
        return "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400";

      default:
        return "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400";
    }
  };

  // ============================================================
  // STATUT JURIDIQUE
  // ============================================================

  const getLegalStatusLabel = (status) => {
    switch (status) {
      case "cooperative":
        return "Coopérative";

      case "group":
        return "Groupement";

      case "other":
        return "Autre";

      default:
        return status || "Non renseigné";
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "Non renseignée";
    }

    try {
      return new Date(date).toLocaleDateString(
        "fr-FR",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      );
    } catch {
      return date;
    }
  };

  // ============================================================
  // CHARGEMENT
  // ============================================================

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 dark:border-slate-800 border-t-green-700 dark:border-t-emerald-500" />

        <p className="text-sm text-gray-500 dark:text-slate-400">
          Chargement des informations...
        </p>
      </div>
    );
  }

  // ============================================================
  // ERREUR
  // ============================================================

  if (error || !cooperative) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate("/cooperatives")}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 transition hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft size={18} />

          Retour aux coopératives
        </button>

        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400">
            <AlertCircle size={28} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Impossible de charger la coopérative
          </h2>

          <p className="mt-2 max-w-md text-sm text-gray-600 dark:text-slate-300">
            {error ||
              "La coopérative demandée est introuvable."}
          </p>

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
            className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-red-700"
          >
            <LogIn size={17} />
            Me reconnecter
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ======================================================
          EN-TÊTE
      ======================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              navigate("/cooperatives")
            }
            className="rounded-lg p-2 text-gray-600 dark:text-slate-300 transition hover:bg-gray-100 dark:hover:bg-slate-800"
            title="Retour"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {cooperative.name}
            </h1>

            <p className="text-sm text-gray-500 dark:text-slate-400">
              Détails de la coopérative
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* BOUTON TELECHARGER PDF */}
          <button
            type="button"
            onClick={() => downloadCooperativePdf(cooperative)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-200 shadow-sm transition hover:bg-gray-50 dark:hover:bg-slate-700"
            title="Télécharger la fiche officielle en PDF"
          >
            <FileDown size={17} className="text-emerald-700 dark:text-emerald-400" />
            PDF
          </button>

          {/* BOUTON MODIFIER (Masqué pour auditeur bio) */}
          {!isBioAuditor && (
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/cooperatives/${cooperative.uuid}/edit`
                )
              }
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-green-700 dark:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-800 dark:hover:bg-emerald-700"
            >
              <Pencil size={17} />
              Modifier
            </button>
          )}
        </div>
      </div>

      {/* ======================================================
          CARTE PRINCIPALE
      ======================================================= */}

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* ----------------------------------------------------
            IDENTITE
        ----------------------------------------------------- */}

        <div className="bg-gray-50 dark:bg-slate-850 px-6 py-6 border-b border-gray-200 dark:border-slate-800">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-emerald-950/70 text-xl font-bold text-green-700 dark:text-emerald-400">
                {cooperative.name
                  ?.charAt(0)
                  ?.toUpperCase() || "C"}
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {cooperative.name}
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  Président :{" "}
                  <span className="font-medium text-gray-700 dark:text-slate-200">
                    {cooperative.president_name ||
                      "Non renseigné"}
                  </span>
                </p>
              </div>
            </div>

            <span
              className={`self-start rounded-full px-3 py-1.5 text-xs font-semibold sm:self-center ${getStatusClasses(
                cooperative.status
              )}`}
            >
              {getStatusLabel(
                cooperative.status
              )}
            </span>
          </div>
        </div>

        {/* ----------------------------------------------------
            INFORMATIONS GENERALES
        ----------------------------------------------------- */}

        <div className="border-t border-gray-200 dark:border-slate-800 px-6 py-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Informations générales
          </h3>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {/* PRESIDENT */}

            <InfoItem
              icon={<Building2 size={18} />}
              label="Président"
              value={
                cooperative.president_name
              }
            />

            {/* EMAIL */}

            <InfoItem
              icon={<Mail size={18} />}
              label="Adresse e-mail"
              value={cooperative.email}
            />

            {/* TELEPHONE */}

            <InfoItem
              icon={<Phone size={18} />}
              label="Téléphone"
              value={cooperative.mobile}
            />

            {/* ADRESSE */}

            <InfoItem
              icon={<MapPin size={18} />}
              label="Adresse"
              value={cooperative.address}
            />
          </div>
        </div>

        {/* ----------------------------------------------------
            INFORMATIONS ADMINISTRATIVES
        ----------------------------------------------------- */}

        <div className="border-t border-gray-200 dark:border-slate-800 px-6 py-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Informations administratives
          </h3>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {/* STATUT JURIDIQUE */}

            <InfoItem
              icon={<FileText size={18} />}
              label="Statut juridique"
              value={getLegalStatusLabel(
                cooperative.legal_status
              )}
            />

            {/* ANNEE */}

            <InfoItem
              icon={<Calendar size={18} />}
              label="Année de création"
              value={
                cooperative.year_of_creation
              }
            />

            {/* DATE ENREGISTREMENT */}

            <InfoItem
              icon={<Calendar size={18} />}
              label="Date d'enregistrement"
              value={formatDate(
                cooperative.created_at
              )}
            />
          </div>
        </div>

        {/* ----------------------------------------------------
            PRODUCTIONS AGRICOLES
        ----------------------------------------------------- */}

        <div className="border-t border-gray-200 dark:border-slate-800 px-6 py-6">
          <div className="flex items-center gap-2">
            <Sprout
              size={20}
              className="text-green-700 dark:text-emerald-400"
            />

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Productions agricoles
            </h3>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <CropCard
              label="Culture principale"
              value={cooperative.main_crop}
            />

            <CropCard
              label="Culture secondaire"
              value={
                cooperative.second_crop
              }
            />

            <CropCard
              label="Troisième culture"
              value={
                cooperative.third_crop
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT INFO ITEM
// ============================================================

const InfoItem = ({
  icon,
  label,
  value,
}) => {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-gray-800 dark:text-slate-200">
          {value || "Non renseigné"}
        </p>
      </div>
    </div>
  );
};

// ============================================================
// COMPOSANT CROP CARD
// ============================================================

const CropCard = ({
  label,
  value,
}) => {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-850 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-base font-semibold text-gray-800 dark:text-slate-200">
        {value || "Non renseignée"}
      </p>
    </div>
  );
};

export default CooperativeDetails;