import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Users,
  MapPin,
  ShieldCheck,
  Flame,
  Bell,
  ClipboardList,
  User,
  LogOut,
  X,
  ExternalLink,
  ChevronRight,
  UserCog,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import logoImg from "../../assets/logo.png";

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  isCollapsed = false,
  toggleCollapse,
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const location = useLocation();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const firstName =
    user?.first_name ||
    user?.user_metadata?.first_name ||
    "Utilisateur";

  const lastName =
    user?.last_name ||
    user?.user_metadata?.last_name ||
    "";

  const fullName = `${firstName} ${lastName}`.trim();

  // Initiales de l'utilisateur (ex: "RL" pour Randrianasolo Luc)
  const getInitials = () => {
    const f = firstName?.[0] || "";
    const l = lastName?.[0] || "";
    const inits = `${f}${l}`.trim().toUpperCase();
    if (inits) return inits;
    return (user?.email?.[0] || "U").toUpperCase();
  };

  const initials = getInitials();

  const roleLabels = {
    admin: "Administrateur",
    cooperative_manager: "Gestionnaire coopérative",
    field_agent: "Agent de terrain",
    bio_auditor: "Auditeur bio",
    consultant: "Consultant",
  };

  const isAdmin = user?.role === "admin";
  const isBioAuditor = user?.role === "bio_auditor";
  const role = roleLabels[user?.role] || "Membre";

  const navigationSections = [
    ...(isAdmin
      ? [
          {
            title: "Administration",
            items: [
              {
                label: "Gestion des comptes",
                icon: UserCog,
                path: "/admin/users",
                badge: "Admin",
                badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
              },
            ],
          },
        ]
      : []),
    {
      title: "Exploitation & SIG",
      items: [
        {
          label: "Tableau de bord",
          icon: LayoutDashboard,
          path: "/dashboard",
        },
        {
          label: (isAdmin || isBioAuditor) ? "Toutes les coopératives" : "Coopératives",
          icon: Building2,
          path: "/cooperatives",
        },
        {
          label: (isAdmin || isBioAuditor) ? "Tous les agriculteurs" : "Agriculteurs",
          icon: Users,
          path: "/farmers",
        },
        {
          label: (isAdmin || isBioAuditor) ? "Toutes les parcelles" : "Parcelles",
          icon: MapPin,
          path: "/parcels",
        },
      ],
    },
    ...(isBioAuditor
      ? [
          {
            title: "Conformité Bio",
            items: [
              {
                label: "Audits biologiques",
                icon: ShieldCheck,
                path: "/audits",
                badge: "Audit",
                badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
              },
            ],
          },
        ]
      : !isAdmin
      ? [
          {
            title: "Conformité & Veille",
            items: [
              {
                label: "Audits biologiques",
                icon: ShieldCheck,
                path: "/audits",
              },
              {
                label: "Surveillance des feux",
                icon: Flame,
                path: "/fires",
                badge: "NASA",
                badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
              },
              {
                label: "Alertes incendie",
                icon: Bell,
                path: "/fire-alerts",
              },
              {
                label: "Formulaires d'enquête",
                icon: ClipboardList,
                path: "/surveys",
              },
            ],
          },
        ]
      : []),
  ];

  const isActive = (path) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (setSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleCancelLogout = () => {
    if (loggingOut) return;
    setShowLogoutModal(false);
  };

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
    } catch (error) {
      console.error("Erreur de déconnexion :", error);
    } finally {
      setShowLogoutModal(false);
      if (setSidebarOpen) setSidebarOpen(false);
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  return (
    <>
      {/* Overlay sombre sur mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar principale (Thème clair / sombre, accents verts, repliable) */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex flex-col
          bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200
          border-r border-slate-200/80 dark:border-slate-800
          shadow-xs
          transition-all duration-300 ease-in-out
          ${isCollapsed ? "lg:w-20" : "lg:w-64"}
          w-64
          ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* ======================================================== */}
        {/* 1. Header du Sidebar : Logo & Bouton de repliement        */}
        {/* ======================================================== */}
        <div
          className={`
            flex items-center border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900
            transition-all duration-300
            ${isCollapsed ? "h-20 flex-col justify-center px-2 py-3 gap-1.5" : "h-20 justify-between px-4 sm:px-5"}
          `}
        >
          {isCollapsed ? (
            /* Mode replié : Logo compact + bouton d'agrandissement */
            <>
              <Link
                to="/dashboard"
                onClick={() => setSidebarOpen && setSidebarOpen(false)}
                title="SmartSahaBio - Aller au tableau de bord"
                className="w-10 h-10 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 p-1.5 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/50 hover:scale-105 transition-transform"
              >
                <img
                  src={logoImg}
                  alt="SmartSahaBio"
                  className="w-full h-full object-contain"
                />
              </Link>

              <button
                type="button"
                onClick={toggleCollapse}
                title="Agrandir le menu"
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </>
          ) : (
            /* Mode déplié : Logo complet + Nom + Bouton de repliement */
            <>
              <Link
                to="/dashboard"
                onClick={() => setSidebarOpen && setSidebarOpen(false)}
                className="flex items-center gap-2.5 group transition-transform min-w-0"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 p-1.5 flex items-center justify-center border border-emerald-200/70 dark:border-emerald-800/50 shadow-2xs group-hover:scale-105 transition-transform duration-200 shrink-0">
                  <img
                    src={logoImg}
                    alt="SmartSahaBio"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-base font-black tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      SmartSaha<span className="text-emerald-600 dark:text-emerald-400">Bio</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide truncate">
                    AgriTech & Traçabilité
                  </p>
                </div>
              </Link>

              {/* Bouton de repliement sur grand écran (icône comme dans l'image) */}
              <button
                type="button"
                onClick={toggleCollapse}
                title="Plier le menu"
                className="hidden lg:flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>

              {/* Bouton de fermeture sur mobile */}
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 lg:hidden transition-colors"
                title="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* ======================================================== */}
        {/* 2. Menu de Navigation (Liens & Icônes)                    */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
          {navigationSections.map((section, idx) => (
            <div key={idx}>
              {/* Titre de section visible uniquement quand le menu est déplié */}
              {!isCollapsed && (
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {section.title}
                </p>
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  if (isCollapsed) {
                    /* ==============================================
                       MODE REPLIÉ : SEULES LES ICÔNES SONT RESTÉES
                    ============================================== */
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => handleNavigate(item.path)}
                        title={item.label}
                        className={`
                          w-11 h-11 mx-auto flex items-center justify-center
                          rounded-xl transition-all duration-200 cursor-pointer relative group
                          ${active
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs"
                            : "text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-slate-800/60"
                          }
                        `}
                      >
                        <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />

                        {/* Pastille discrète si badge existant */}
                        {item.badge && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                        )}
                      </button>
                    );
                  }

                  /* ==============================================
                     MODE DÉPLIÉ : ICÔNES + TEXTES DANS LE THÈME VERT
                  ============================================== */
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => handleNavigate(item.path)}
                      className={`
                        w-full flex items-center justify-between
                        rounded-xl px-3 py-2.5
                        text-left text-sm font-medium
                        transition-all duration-200 cursor-pointer group
                        ${active
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200/80 dark:border-emerald-800/50 shadow-xs"
                          : "text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-slate-800/60"
                        }
                      `}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`
                            p-1.5 rounded-lg transition-colors
                            ${active
                              ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300"
                              : "text-slate-400 dark:text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 group-hover:bg-emerald-100/50 dark:group-hover:bg-slate-800"
                            }
                          `}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Section Système */}
          <div>
            {!isCollapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Système
              </p>
            )}

            <div className="space-y-1">
              {/* Mon profil */}
              {isCollapsed ? (
                <button
                  type="button"
                  onClick={() => handleNavigate("/profile")}
                  title="Mon profil"
                  className={`
                    w-11 h-11 mx-auto flex items-center justify-center
                    rounded-xl transition-all duration-200 cursor-pointer group
                    ${isActive("/profile")
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-slate-800/60"
                    }
                  `}
                >
                  <User className="w-5 h-5 transition-transform group-hover:scale-110" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNavigate("/profile")}
                  className={`
                    w-full flex items-center justify-between
                    rounded-xl px-3 py-2.5
                    text-left text-sm font-medium
                    transition-all duration-200 cursor-pointer group
                    ${isActive("/profile")
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200/80 dark:border-emerald-800/50 shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-slate-800/60"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isActive("/profile")
                          ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300"
                          : "text-slate-400 dark:text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 group-hover:bg-emerald-100/50 dark:group-hover:bg-slate-800"
                      }`}
                    >
                      <User className="w-4 h-4" />
                    </div>
                    <span>Mon profil</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                </button>
              )}

              {/* Page d'accueil publique */}
              {isCollapsed ? (
                <Link
                  to="/"
                  onClick={() => setSidebarOpen && setSidebarOpen(false)}
                  title="Page d'accueil"
                  className="w-11 h-11 mx-auto flex items-center justify-center rounded-xl text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/"
                  onClick={() => setSidebarOpen && setSidebarOpen(false)}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                    <span>Page d'accueil</span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Accueil</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. Utilisateur Connecté & Profil (Comme dans l'image)    */}
        {/* ======================================================== */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/80">
          {isCollapsed ? (
            /* Mode replié : Avatar rond centré + bouton déconnexion */
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => handleNavigate("/profile")}
                title={`${fullName} (${user?.email || role})`}
                className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs hover:ring-2 hover:ring-emerald-400 transition-all cursor-pointer"
              >
                {initials}
              </button>

              <button
                type="button"
                onClick={handleLogoutClick}
                title="Se déconnecter"
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Mode déplié : Card utilisateur complète avec initiales comme dans l'image */
            <>
              <div className="flex items-center justify-between gap-2.5 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-850 dark:bg-slate-800/60 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleNavigate("/profile")}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer group"
                >
                  {/* Rond avec initiales (ex: RL) */}
                  <div className="w-9 h-9 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs group-hover:scale-105 transition-transform">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {fullName}
                    </p>
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                      {user?.email || role}
                    </p>
                  </div>
                </button>

                {/* Bouton de déconnexion */}
                <button
                  type="button"
                  onClick={handleLogoutClick}
                  title="Se déconnecter"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Mention discrète au bas du sidebar */}
              <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">
                Plateforme SmartSahaBio
              </p>
            </>
          )}
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 4. Modal de confirmation de déconnexion                  */}
      {/* ======================================================== */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs px-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
          >
            {/* Icône avec halo doux */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40 shadow-xs">
              <LogOut className="w-7 h-7" />
            </div>

            {/* Message */}
            <div className="mt-4 text-center">
              <h2
                id="logout-title"
                className="text-xl font-bold text-slate-900 dark:text-white"
              >
                Confirmer la déconnexion
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Êtes-vous sûr de vouloir vous déconnecter de votre compte <strong className="text-slate-800 dark:text-slate-200">SmartSahaBio</strong> ?
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleCancelLogout}
                disabled={loggingOut}
                className="flex-1 cursor-pointer rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleConfirmLogout}
                disabled={loggingOut}
                className="flex-1 cursor-pointer rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 shadow-md shadow-red-600/20 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loggingOut ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Déconnexion...</span>
                  </>
                ) : (
                  <span>Se déconnecter</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;