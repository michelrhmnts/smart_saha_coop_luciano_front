import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Menu, Moon, Sun } from "lucide-react";

const Header = ({ setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const firstName =
    user?.first_name ||
    user?.user_metadata?.first_name ||
    "Utilisateur";

  const lastName =
    user?.last_name ||
    user?.user_metadata?.last_name ||
    "";

  const fullName = `${firstName} ${lastName}`.trim();

  const roleLabels = {
    admin: "Administrateur",
    cooperative_manager: "Gestionnaire de coopérative",
    field_agent: "Agent de terrain / Enquêteur",
    bio_auditor: "Auditeur bio",
    consultant: "Consultant",
  };

  const role =
    roleLabels[user?.role] || "Utilisateur";

  // Informations du Header selon la page
  const pageInfo = {
    "/dashboard": {
      title: "Tableau de bord",
      description: "Vue d'ensemble de votre activité",
    },

    "/cooperatives": {
      title: "Coopératives",
      description: "Gestion des coopératives enregistrées",
    },

    "/farmers": {
      title: "Agriculteurs",
      description: "Gestion des agriculteurs et producteurs",
    },

    "/parcels": {
      title: "Parcelles",
      description: "Gestion et suivi des parcelles agricoles",
    },
    "/fires": {
      title: "Surveillance des feux",
      description: "Détection et suivi des feux à proximité",
    },

    "/audits": {
      title: "Audits biologiques",
      description: "Suivi des audits et contrôles biologiques",
    },

    "/profile": {
      title: "Mon profil",
      description: "Gestion de vos informations personnelles",
    },
  };

  const currentPage =
    pageInfo[location.pathname] || {
      title: "SmartSahaBio",
      description: "Plateforme de traçabilité biologique",
    };

  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 shadow-xs sm:px-6 lg:px-8 transition-colors">

      {/* Partie gauche */}
      <div className="flex items-center gap-4">

        {/* Menu mobile */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="rounded-xl p-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-700 dark:hover:text-emerald-400 lg:hidden transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Titre dynamique */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {currentPage.title}
          </h2>

          <p className="hidden text-sm text-gray-500 dark:text-slate-400 sm:block">
            {currentPage.description}
          </p>
        </div>
      </div>

      {/* Partie droite : Bouton thème + Profil */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Bouton bascule Mode Sombre / Clair */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
          title={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-xs"
        >
          {isDark ? (
            <Sun className="w-5 h-5 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />
          )}
        </button>

        {/* Profil */}
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="flex items-center gap-3 rounded-xl px-2.5 py-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer"
        >
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">
              {fullName}
            </p>

            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              {role}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 font-bold text-white shadow-xs">
            {firstName.charAt(0).toUpperCase()}
          </div>
        </button>
      </div>

    </header>
  );
};

export default Header;