import { useState, useEffect } from "react";
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
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // États d'envoi et alertes
  const [savingInfo, setSavingInfo] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

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
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Le prénom et le nom sont obligatoires.");
      return;
    }

    try {
      setSavingInfo(true);
      const res = await updateUserProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
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

      setSuccessMessage("Vos informations personnelles ont été mises à jour avec succès !");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("❌ Erreur mise à jour profil :", err);
      setErrorMessage(
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
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    try {
      setSavingPassword(true);
      await updateUserProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
        password: newPassword,
      });

      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage("Votre mot de passe a été modifié avec succès !");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("❌ Erreur modification mot de passe :", err);
      setErrorMessage(
        err.response?.data?.error ||
        "Impossible de modifier le mot de passe."
      );
    } finally {
      setSavingPassword(false);
    }
  };

  const initialLetter = (firstName ? firstName.charAt(0) : "U").toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 p-4 sm:p-6 lg:p-1">
      {/* Messages d'alerte */}
      {successMessage && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-sm font-semibold text-emerald-800 dark:text-emerald-300 shadow-sm">
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 p-4 text-sm font-semibold text-red-700 dark:text-red-300 shadow-sm">
          <span>❌</span>
          <span>{errorMessage}</span>
        </div>
      )}

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
                  <label
                    htmlFor="phoneInput"
                    className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-300"
                  >
                    Numéro de téléphone
                  </label>
                  <input
                    id="phoneInput"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                    placeholder="Ex: +261 34 00 000 00"
                  />
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
              <span>Changer de mot de passe</span>
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              Pour renforcer la sécurité de votre compte, choisissez un mot de passe robuste d'au moins 6 caractères.
            </p>

            <form onSubmit={handleSavePassword} className="mt-6 space-y-5">
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
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm pr-10 transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 text-xs"
                    >
                      {showPassword ? "Masquer" : "Afficher"}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPasswordInput"
                    className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-slate-300"
                  >
                    Confirmer le mot de passe *
                  </label>
                  <input
                    id="confirmPasswordInput"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 dark:text-white px-4 py-2.5 text-sm transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={savingPassword || !newPassword}
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
