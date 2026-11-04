import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { updateUserProfile } from "../../services/authService";

const Profile = () => {
  const { user, setUser } = useAuth();

  // Données du formulaire
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  // Mot de passe
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // États d'envoi
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const roleLabels = {
    admin: "Administrateur",
    cooperative_manager: "Gestionnaire de coopérative",
    field_agent: "Agent de terrain / Enquêteur",
    bio_auditor: "Auditeur bio",
    consultant: "Consultant",
  };

  useEffect(() => {
    if (user) {
      const uFirst =
        user.first_name ||
        user.profile?.first_name ||
        user.user_metadata?.first_name ||
        "";
      const uLast =
        user.last_name ||
        user.profile?.last_name ||
        user.user_metadata?.last_name ||
        "";
      const uPhone =
        user.phone ||
        user.profile?.phone ||
        user.user_metadata?.phone ||
        "";
      const uEmail = user.email || "";
      const uRole =
        user.role ||
        user.profile?.role ||
        user.user_metadata?.role ||
        "cooperative_manager";

      setFirstName(uFirst);
      setLastName(uLast);
      setPhone(uPhone);
      setEmail(uEmail);
      setRole(uRole);
    }
  }, [user]);

  // Sauvegarde des informations personnelles
  const handleSaveInfo = async (e) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Le prénom et le nom sont obligatoires.");
      return;
    }

    const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
    if (cleanPhone && cleanPhone.length !== 10) {
      toast.error("Le numéro de téléphone doit comporter exactement 10 chiffres (format : 03XXXXXXXX).");
      return;
    }

    try {
      setSavingInfo(true);
      const res = await updateUserProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: cleanPhone || null,
      });

      if (res.user) {
        setUser((prev) => ({
          ...prev,
          ...res.user,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
        }));
      }

      toast.success("Vos informations personnelles ont été mises à jour avec succès !");
    } catch (err) {
      console.error("❌ Erreur mise à jour profil :", err);
      toast.error(
        err.response?.data?.error ||
        "Impossible d'enregistrer les modifications de profil."
      );
    } finally {
      setSavingInfo(false);
    }
  };

  // Mise à jour du mot de passe
  const handleSavePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Veuillez saisir votre mot de passe actuel.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast.error("Le nouveau mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Les deux nouveaux mots de passe ne correspondent pas.");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("Le nouveau mot de passe doit être différent de votre mot de passe actuel.");
      return;
    }

    try {
      setSavingPassword(true);
      const cleanPhone = phone ? phone.replace(/\D/g, "") : "";
      const res = await updateUserProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: cleanPhone || null,
        current_password: currentPassword,
        password: newPassword,
      });

      if (res?.access_token) {
        localStorage.setItem("access_token", res.access_token);
      }
      if (res?.refresh_token) {
        localStorage.setItem("refresh_token", res.refresh_token);
      }
      if (res?.user) {
        setUser((prev) => ({ ...prev, ...res.user }));
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Votre mot de passe a été modifié avec succès !");
    } catch (err) {
      console.error("❌ Erreur modification mot de passe :", err);
      toast.error(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Impossible de modifier le mot de passe."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const initialLetter = (firstName ? firstName.charAt(0) : "U").toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-1">

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Colonne gauche : Carte récapitulative du profil */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm text-center">
            {/* Avatar */}
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-3xl font-extrabold text-white shadow-md">
              {initialLetter}
            </div>

            <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
              {firstName} {lastName}
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">{email}</p>

            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <span>{roleLabels[role] || role}</span>
            </div>

            <div className="mt-6 border-t border-gray-100 dark:border-slate-800 pt-5 text-left text-xs space-y-3">
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>Statut du compte :</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Actif</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>Rôle système :</span>
                <span className="font-medium text-gray-800 dark:text-slate-200">{role}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>Plateforme :</span>
                <span className="font-medium text-gray-800 dark:text-slate-200">SmartSahaBio</span>
              </div>
            </div>
          </div>

          {/* Aide & Sécurité */}
          <div className="rounded-3xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-6 text-xs text-emerald-900 dark:text-emerald-300">
            <h3 className="font-bold text-sm text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
              <span>Sécurité des données</span>
            </h3>
            <p className="mt-2 leading-relaxed text-emerald-800 dark:text-emerald-400">
              Vos informations sont protégées par le système d'authentification et les politiques de sécurité (RLS) de Supabase.
            </p>
            <p className="mt-2 text-emerald-700 dark:text-emerald-500">
              Pour modifier votre adresse email ou vos privilèges de rôle, contactez l'administrateur principal.
            </p>
          </div>
        </div>

        {/* Colonne droite : Formulaires de modification */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. Informations personnelles */}
          <div className="rounded-3xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>Informations personnelles</span>
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              Mettez à jour vos informations de contact et votre identité.
            </p>

            <form onSubmit={handleSaveInfo} className="mt-6 space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstNameInput"
                    className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-300"
                  >
                    Prénom *
                  </label>
                  <input
                    id="firstNameInput"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                    placeholder="Ex: Jean"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastNameInput"
                    className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-300"
                  >
                    Nom *
                  </label>
                  <input
                    id="lastNameInput"
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                    placeholder="Ex: Dupont"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label
                      htmlFor="phoneInput"
                      className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-300"
                    >
                      Numéro de téléphone
                    </label>
                    <span className="text-[11px] font-mono text-gray-400 dark:text-slate-500">
                      {phone ? `${phone.length}/10` : "Format 03XXXXXXXX"}
                    </span>
                  </div>
                  <input
                    id="phoneInput"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhone(onlyDigits);
                    }}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none font-mono"
                    placeholder="034XXXXXXX"
                  />
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-slate-500">
                    Chiffres uniquement, 10 caractères (ex: 0341234567).
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="emailInput"
                    className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-300"
                  >
                    Adresse email
                  </label>
                  <input
                    id="emailInput"
                    type="email"
                    disabled
                    value={email}
                    className="w-full cursor-not-allowed rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800/60 px-4 py-2.5 text-sm text-gray-500 dark:text-slate-400"
                    title="L'adresse email ne peut pas être modifiée directement."
                  />
                  <span className="mt-1 block text-[11px] text-gray-400 dark:text-slate-500">
                    Identifiant de connexion permanent.
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={savingInfo}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {savingInfo ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <span>Enregistrer les modifications</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 2. Sécurité & Changement de mot de passe */}
          <div className="rounded-3xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Changer de mot de passe</span>
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              Veuillez confirmer votre mot de passe actuel avant de définir votre nouveau mot de passe (au moins 6 caractères).
            </p>

            <form onSubmit={handleSavePassword} className="mt-6 space-y-5" autoComplete="off">
              {/* Pièges anti-remplissage automatique des navigateurs */}
              <input type="text" name="prevent_autofill_user" className="hidden" tabIndex="-1" autoComplete="off" />
              <input type="password" name="prevent_autofill_pwd" className="hidden" tabIndex="-1" autoComplete="off" />

              {/* Mot de passe actuel (Saisie manuelle obligatoire) */}
              <div>
                <label
                  htmlFor="current_auth_password_manual"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-300"
                >
                  Mot de passe actuel *
                </label>
                <div className="relative">
                  <input
                    id="current_auth_password_manual"
                    name="manual_current_password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white px-4 py-2.5 text-sm pr-11 transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                    placeholder="Saisissez votre mot de passe actuel"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                    title={showCurrentPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="mt-1 block text-[11px] text-gray-400 dark:text-slate-500">
                  Par mesure de sécurité, vous devez saisir manuellement votre mot de passe actuel.
                </span>
              </div>

              {/* Nouveau mot de passe & Confirmation */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="newPasswordInput"
                    className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-300"
                  >
                    Nouveau mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      id="newPasswordInput"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white px-4 py-2.5 text-sm pr-11 transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                      placeholder="Minimum 6 caractères"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                      title={showNewPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPasswordInput"
                    className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-300"
                  >
                    Confirmer le nouveau mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPasswordInput"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white px-4 py-2.5 text-sm pr-11 transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                      placeholder="Répétez le nouveau mot de passe"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                      title={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40"
                >
                  {savingPassword ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Mise à jour...</span>
                    </>
                  ) : (
                    <>
                      <span>Mettre à jour le mot de passe</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
