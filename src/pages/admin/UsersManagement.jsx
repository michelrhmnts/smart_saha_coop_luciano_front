import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Users,
  UserPlus,
  Shield,
  Briefcase,
  Smartphone,
  ClipboardCheck,
  Search,
  Filter,
  Trash2,
  Edit2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  Phone,
  Lock,
  User,
  ShieldCheck,
  Crown,
  Building2,
  Info,
  Eye,
  Calendar,
} from "lucide-react";
import {
  getAdminUsers,
  createAdminUser,
  updateUserRole,
  deleteAdminUser,
} from "../../services/adminService";
import { getCooperatives } from "../../api/cooperatives";
import { useAuth } from "../../context/AuthContext";

// Tous les rôles possibles pour l'affichage et les filtres
const ROLE_INFO = {
  admin: {
    label: "Administrateur",
    badgeBg: "bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    icon: Crown,
    desc: "Accès complet au système, gestion des comptes et formulaires",
  },
  cooperative_manager: {
    label: "Gestionnaire de coopérative",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    icon: Briefcase,
    desc: "Gestion de ses coopératives, producteurs et parcelles (Web)",
  },
  field_agent: {
    label: "Agent de terrain / Enquêteur",
    badgeBg: "bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: Smartphone,
    desc: "Collecte de données et tracés GPS terrain (App Mobile)",
  },
  bio_auditor: {
    label: "Auditeur bio",
    badgeBg: "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: ClipboardCheck,
    desc: "Réalisation des audits de conformité biologique (App Mobile)",
  },
};

// Rôles disponibles à la création (PAS d'option Administrateur)
const CREATABLE_ROLES = {
  field_agent: {
    label: "Agent de terrain / Enquêteur",
    badgeBg: "bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    icon: Smartphone,
    desc: "Collecte terrain & relevés GPS — Affectation à une coopérative requise",
  },
  bio_auditor: {
    label: "Auditeur bio",
    badgeBg: "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    icon: ClipboardCheck,
    desc: "Audits de conformité biologique — Rôle transversal (sans coopérative)",
  },
  cooperative_manager: {
    label: "Gestionnaire de coopérative",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    icon: Briefcase,
    desc: "Responsable d'exploitation (accès plateforme Web)",
  },
};

const UsersManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [cooperatives, setCooperatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsUser, setDetailsUser] = useState(null);

  // Formulaire création
  const [createForm, setCreateForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    role: "field_agent",
    cooperative_id: "",
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Formulaire changement de rôle
  const [newRole, setNewRole] = useState("cooperative_manager");
  const [submittingRole, setSubmittingRole] = useState(false);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const fetchUsersAndCooperatives = async () => {
    try {
      setLoading(true);
      const [usersRes, coopsRes] = await Promise.all([
        getAdminUsers(),
        getCooperatives(),
      ]);

      if (usersRes.success) {
        setUsers(usersRes.data || []);
      }
      if (coopsRes?.data) {
        setCooperatives(coopsRes.data || []);
      }
    } catch (err) {
      console.error("Erreur récupération données :", err);
      toast.error("Impossible de charger la liste des utilisateurs et coopératives.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndCooperatives();
  }, []);

  // Filtrage
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
    const phone = (u.phone || "").toLowerCase();
    const role = (u.role || "").toLowerCase();
    const coopName = (u.cooperative_name || "").toLowerCase();

    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      phone.includes(searchTerm.toLowerCase()) ||
      role.includes(searchTerm.toLowerCase()) ||
      coopName.includes(searchTerm.toLowerCase());

    const matchesRole =
      selectedRoleFilter === "all" || u.role === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

  // Comptages
  const roleCounts = {
    all: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    cooperative_manager: users.filter((u) => u.role === "cooperative_manager").length,
    field_agent: users.filter((u) => u.role === "field_agent").length,
    bio_auditor: users.filter((u) => u.role === "bio_auditor").length,
  };

  // Création d'un utilisateur
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.email || !createForm.password || !createForm.first_name || !createForm.last_name) {
      toast.error("Veuillez renseigner tous les champs obligatoires.");
      return;
    }
    if (createForm.password.length < 8) {
      toast.error("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    // Règle 1 : Agent de terrain doit obligatoirement avoir une coopérative
    if (createForm.role === "field_agent" && !createForm.cooperative_id) {
      toast.error("Veuillez sélectionner la coopérative à laquelle affecter l'agent de terrain.");
      return;
    }

    // Trouver le nom de la coopérative si applicable
    const selectedCoop = cooperatives.find((c) => c.uuid === createForm.cooperative_id);

    const payload = {
      first_name: createForm.first_name.trim(),
      last_name: createForm.last_name.trim(),
      email: createForm.email.trim(),
      phone: createForm.phone ? createForm.phone.trim() : null,
      password: createForm.password,
      role: createForm.role,
      cooperative_id: createForm.role === "field_agent" ? createForm.cooperative_id : null,
      cooperative_name: createForm.role === "field_agent" ? selectedCoop?.name : null,
    };

    try {
      setSubmittingCreate(true);
      const res = await createAdminUser(payload);
      if (res.success) {
        toast.success("Compte créé avec succès !");
        setShowCreateModal(false);
        setCreateForm({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          password: "",
          role: "field_agent",
          cooperative_id: "",
        });
        fetchUsersAndCooperatives();
      }
    } catch (err) {
      console.error("Erreur création :", err);
      const msg = err.response?.data?.error || "Erreur lors de la création du compte.";
      toast.error(msg);
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Mise à jour du rôle
  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSubmittingRole(true);
      const res = await updateUserRole(selectedUser.id, newRole);
      if (res.success) {
        toast.success("Rôle mis à jour avec succès !");
        setShowRoleModal(false);
        setSelectedUser(null);
        fetchUsersAndCooperatives();
      }
    } catch (err) {
      console.error("Erreur modification rôle :", err);
      toast.error(err.response?.data?.error || "Impossible de modifier le rôle.");
    } finally {
      setSubmittingRole(false);
    }
  };

  // Suppression
  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;

    try {
      setSubmittingDelete(true);
      const res = await deleteAdminUser(selectedUser.id);
      if (res.success) {
        toast.success("Profil utilisateur supprimé avec succès.");
        setShowDeleteModal(false);
        setSelectedUser(null);
        fetchUsersAndCooperatives();
      }
    } catch (err) {
      console.error("Erreur suppression :", err);
      toast.error(err.response?.data?.error || "Impossible de supprimer ce profil.");
    } finally {
      setSubmittingDelete(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. En-tête de la page                                    */}
      {/* ======================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 text-xs font-semibold border border-purple-200 dark:border-purple-800">
              <Crown className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              Espace Administrateur
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight sm:text-3xl">
            Gestion des comptes & Rôles
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Supervisez tous les utilisateurs, affectez les rôles et créez les accès terrain (agents & auditeurs).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchUsersAndCooperatives}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600 dark:text-emerald-400" : ""}`} />
            <span>Actualiser</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nouvel utilisateur</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. Cartes de synthèse des rôles                          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Administrateurs */}
        <div
          onClick={() => setSelectedRoleFilter(selectedRoleFilter === "admin" ? "all" : "admin")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
            selectedRoleFilter === "admin"
              ? "bg-purple-50/80 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 ring-2 ring-purple-500/20 shadow-md"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold">
              <Crown className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{roleCounts.admin}</span>
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">Administrateurs</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Accès Web complet</p>
        </div>

        {/* Gestionnaires */}
        <div
          onClick={() => setSelectedRoleFilter(selectedRoleFilter === "cooperative_manager" ? "all" : "cooperative_manager")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
            selectedRoleFilter === "cooperative_manager"
              ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20 shadow-md"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{roleCounts.cooperative_manager}</span>
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">Gestionnaires coopérative</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Inscription Web libre</p>
        </div>

        {/* Agents de terrain */}
        <div
          onClick={() => setSelectedRoleFilter(selectedRoleFilter === "field_agent" ? "all" : "field_agent")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
            selectedRoleFilter === "field_agent"
              ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20 shadow-md"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{roleCounts.field_agent}</span>
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">Agents terrain / Enquêteurs</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Application Mobile (Par coopérative)</p>
        </div>

        {/* Auditeurs bio */}
        <div
          onClick={() => setSelectedRoleFilter(selectedRoleFilter === "bio_auditor" ? "all" : "bio_auditor")}
          className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 ${
            selectedRoleFilter === "bio_auditor"
              ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20 shadow-md"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-800 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{roleCounts.bio_auditor}</span>
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">Auditeurs bio</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">App Mobile (Transversal)</p>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. Filtres & Barre de recherche                          */}
      {/* ======================================================== */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, téléphone ou coopérative..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedRoleFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                selectedRoleFilter === "all"
                  ? "bg-slate-900 dark:bg-emerald-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              Tous ({roleCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter("admin")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                selectedRoleFilter === "admin"
                  ? "bg-purple-700 dark:bg-purple-600 text-white"
                  : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50"
              }`}
            >
              Admins ({roleCounts.admin})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter("cooperative_manager")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                selectedRoleFilter === "cooperative_manager"
                  ? "bg-emerald-700 dark:bg-emerald-600 text-white"
                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
              }`}
            >
              Gestionnaires ({roleCounts.cooperative_manager})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter("field_agent")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                selectedRoleFilter === "field_agent"
                  ? "bg-blue-700 dark:bg-blue-600 text-white"
                  : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              }`}
            >
              Agents ({roleCounts.field_agent})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRoleFilter("bio_auditor")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                selectedRoleFilter === "bio_auditor"
                  ? "bg-amber-700 dark:bg-amber-600 text-white"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
              }`}
            >
              Auditeurs ({roleCounts.bio_auditor})
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. Tableau des utilisateurs                              */}
      {/* ======================================================== */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3.5">Utilisateur</th>
                <th className="px-6 py-3.5">Rôle</th>
                <th className="px-6 py-3.5">Coopérative affectée</th>
                <th className="px-6 py-3.5">Téléphone</th>
                <th className="px-6 py-3.5">Date de création</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
                      <span className="text-xs">Chargement des utilisateurs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Aucun utilisateur trouvé</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Ajustez vos filtres de recherche ou créez un nouvel utilisateur.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleConfig = ROLE_INFO[u.role] || {
                    label: u.role || "Inconnu",
                    badgeBg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
                    icon: User,
                    desc: "",
                  };
                  const RoleIcon = roleConfig.icon;
                  const isCurrent = currentUser?.id === u.id;
                  const isWebRole = u.role === "admin" || u.role === "cooperative_manager";

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Nom & Avatar */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-sm shadow-xs">
                            {(u.first_name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white truncate">
                                {u.first_name} {u.last_name}
                              </span>
                              {isCurrent && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                  Vous
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 dark:text-slate-500 block truncate font-mono">
                              ID: {u.id?.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Rôle */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${roleConfig.badgeBg}`}
                        >
                          <RoleIcon className="w-3.5 h-3.5" />
                          <span>{roleConfig.label}</span>
                        </span>
                      </td>

                      {/* Coopérative affectée */}
                      <td className="px-6 py-4">
                        {u.role === "field_agent" ? (
                          u.cooperative_name ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-200/80 dark:border-slate-700">
                              <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span className="truncate max-w-[140px]" title={u.cooperative_name}>
                                {u.cooperative_name}
                              </span>
                            </span>
                          ) : (
                            <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/50">
                              Non affectée
                            </span>
                          )
                        ) : u.role === "bio_auditor" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/50">
                            🌐 Transversal (Toutes)
                          </span>
                        ) : u.role === "admin" ? (
                          <span className="text-xs text-purple-700 dark:text-purple-400 font-medium">
                            Supervision globale
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            Gestionnaire
                          </span>
                        )}
                      </td>

                      {/* Téléphone */}
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                          {u.phone || <span className="text-slate-400 dark:text-slate-600 italic">Non renseigné</span>}
                        </span>
                      </td>

                      {/* Date de création */}
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Voir détails */}
                          <button
                            type="button"
                            onClick={() => {
                              setDetailsUser(u);
                              setShowDetailsModal(true);
                            }}
                            title="Voir les détails de l'utilisateur"
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setNewRole(u.role || "cooperative_manager");
                              setShowRoleModal(true);
                            }}
                            title="Modifier le rôle"
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                setShowDeleteModal(true);
                              }}
                              title="Supprimer ce profil"
                              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. Modale Création d'un Utilisateur                      */}
      {/* ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 p-7 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Créer un utilisateur</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Attribution des accès terrain et gestion</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              {/* Choix du rôle (PAS d'option Administrateur) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Type de compte à créer *
                </label>
                <div className="space-y-2 mt-1">
                  {Object.entries(CREATABLE_ROLES).map(([key, config]) => {
                    const isSelected = createForm.role === key;
                    const Icon = config.icon;
                    return (
                      <div
                        key={key}
                        onClick={() => {
                          setCreateForm({
                            ...createForm,
                            role: key,
                            // Si ce n'est pas un agent de terrain, vider le choix de coopérative
                            cooperative_id: key === "field_agent" ? createForm.cooperative_id : "",
                          });
                        }}
                        className={`cursor-pointer rounded-xl border p-3 flex items-start gap-3 transition ${
                          isSelected
                            ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20"
                            : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        <div className="mt-0.5">
                          <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{config.label}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{config.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Champ d'affectation coopérative (Agent de terrain uniquement) */}
              {createForm.role === "field_agent" && (
                <div className="rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 p-4 space-y-2 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-blue-950 dark:text-blue-200">
                    Affecter à une coopérative *
                  </label>
                  <select
                    required
                    value={createForm.cooperative_id}
                    onChange={(e) => setCreateForm({ ...createForm, cooperative_id: e.target.value })}
                    className="w-full rounded-xl border border-blue-300 dark:border-blue-800 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Sélectionnez la coopérative de rattachement</option>
                    {cooperatives.map((c) => (
                      <option key={c.uuid} value={c.uuid}>
                        {c.name} {c.president_name ? `(Président : ${c.president_name})` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                    L'agent de terrain aura pour mission de collecter les données d'enquêtes et tracer les parcelles appartenant à cette coopérative.
                  </p>
                </div>
              )}

              {/* Message indicatif pour l'Auditeur bio */}
              {createForm.role === "bio_auditor" && (
                <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/40 p-3.5 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in duration-200">
                  <ClipboardCheck className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Rôle transversal :</strong> L'Auditeur bio n'est pas affecté à une coopérative spécifique. Il a la visibilité pour réaliser les audits de conformité biologique sur toutes les parcelles.
                  </div>
                </div>
              )}

              {/* Message indicatif pour le Gestionnaire */}
              {createForm.role === "cooperative_manager" && (
                <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-200">
                  <Briefcase className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Espace Gestionnaire :</strong> Ce compte permet de gérer ses propres coopératives, producteurs et parcelles depuis l'interface Web.
                  </div>
                </div>
              )}

              {/* Identité : Nom & Prénom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Rakoto"
                    value={createForm.last_name}
                    onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    placeholder="Jean"
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/15"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Adresse E-mail *</label>
                <input
                  type="email"
                  required
                  placeholder="agent.jean@smartsaha.bio"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/15"
                />
              </div>

              {/* Téléphone & Mot de passe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    placeholder="0341234567"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/15"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mot de passe temporaire *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min. 8 caractères"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-600 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/15"
                  />
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submittingCreate ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Création...</span>
                    </>
                  ) : (
                    <span>Créer le compte</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. Modale Modification du Rôle                          */}
      {/* ======================================================== */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-7 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Modifier le rôle</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedUser.first_name} {selectedUser.last_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRoleSubmit} className="mt-5 space-y-4">
              <div className="space-y-2">
                {Object.entries(ROLE_INFO).map(([key, config]) => {
                  const isSelected = newRole === key;
                  const Icon = config.icon;
                  return (
                    <label
                      key={key}
                      onClick={() => setNewRole(key)}
                      className={`cursor-pointer rounded-xl border p-3 flex items-start gap-3 transition block ${
                        isSelected
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20"
                          : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="user_role"
                        value={key}
                        checked={isSelected}
                        onChange={() => setNewRole(key)}
                        className="mt-1 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{config.label}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{config.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingRole}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submittingRole ? "Enregistrement..." : "Appliquer le rôle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. Modale Confirmation de Suppression                    */}
      {/* ======================================================== */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-7 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/50">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Supprimer cet utilisateur ?</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Êtes-vous sûr de vouloir supprimer le profil de{" "}
                <strong>
                  {selectedUser.first_name} {selectedUser.last_name}
                </strong>{" "}
                ? Cette action est irréversible.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={submittingDelete}
                className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-600/20 disabled:opacity-50 cursor-pointer"
              >
                {submittingDelete ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. Modale Détails Utilisateur                            */}
      {/* ======================================================== */}
      {showDetailsModal && detailsUser && (() => {
        const roleConfig = ROLE_INFO[detailsUser.role] || {
          label: detailsUser.role || "Inconnu",
          badgeBg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          icon: User,
          desc: "",
        };
        const RoleIcon = roleConfig.icon;
        const isWebRole = detailsUser.role === "admin" || detailsUser.role === "cooperative_manager";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              {/* Header de la fiche */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-xl shadow-md">
                    {(detailsUser.first_name || "U").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                      {detailsUser.first_name} {detailsUser.last_name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleConfig.badgeBg}`}>
                        <RoleIcon className="w-3.5 h-3.5" />
                        <span>{roleConfig.label}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Corps des informations détaillées */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Email */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs mb-1">
                      <Mail className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Adresse e-mail</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 break-all">
                      {detailsUser.email || <span className="text-slate-400 dark:text-slate-500 italic">Non renseignée</span>}
                    </p>
                  </div>

                  {/* Téléphone */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs mb-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Numéro de téléphone</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {detailsUser.phone || <span className="text-slate-400 dark:text-slate-500 italic">Non renseigné</span>}
                    </p>
                  </div>

                  {/* Plateforme d'accès */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs mb-1">
                      {isWebRole ? (
                        <Briefcase className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      ) : (
                        <Smartphone className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      )}
                      <span>Environnement / Plateforme</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {isWebRole ? "🌐 Plateforme Web (Gestion)" : "📱 Application Mobile (Terrain)"}
                    </p>
                  </div>

                  {/* Date de création */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs mb-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Date d'inscription</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {detailsUser.created_at
                        ? new Date(detailsUser.created_at).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* Coopérative rattachée */}
                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs mb-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Affectation Coopérative</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {detailsUser.role === "field_agent" ? (
                      detailsUser.cooperative_name || (
                        <span className="text-amber-600 dark:text-amber-400">Aucune coopérative affectée</span>
                      )
                    ) : detailsUser.role === "bio_auditor" ? (
                      <span className="text-amber-700 dark:text-amber-400">Accès transversal (toutes les coopératives)</span>
                    ) : detailsUser.role === "admin" ? (
                      <span className="text-purple-700 dark:text-purple-400">Supervision globale plateforme</span>
                    ) : (
                      detailsUser.cooperative_name || "Gestion d'exploitation"
                    )}
                  </p>
                </div>

                {/* Identifiant Unique */}
                <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Identifiant unique (UUID) :</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{detailsUser.id}</span>
                </div>
              </div>

              {/* Actions du bas */}
              <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
                <button
                  type="button"
                  onClick={() => {
                    const u = detailsUser;
                    setShowDetailsModal(false);
                    setSelectedUser(u);
                    setNewRole(u.role || "cooperative_manager");
                    setShowRoleModal(true);
                  }}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Modifier le rôle</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(false)}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2 text-xs font-semibold text-white shadow-sm transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default UsersManagement;
