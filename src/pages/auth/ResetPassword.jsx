import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";
import { resetUserPassword } from "../../services/authService";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
  KeyRound,
  Sun,
  Moon,
} from "lucide-react";
import logoImg from "../../assets/logo.png";
import bgHeroImg from "../../assets/login-bg.jpg";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const [accessToken, setAccessToken] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [urlError, setUrlError] = useState("");

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Extraction du token ou code depuis l'URL au montage du composant
  useEffect(() => {
    // 1. Analyse du hash (ex: #access_token=...&type=recovery ou #error=...)
    const hash = window.location.hash.substring(1);
    const hashParams = new URLSearchParams(hash);

    // 2. Analyse des query params (ex: ?code=... ou ?error=...)
    const searchParams = new URLSearchParams(window.location.search);

    // Détection d'erreurs transmises par Supabase dans l'URL
    const errorParam = hashParams.get("error") || searchParams.get("error");
    const errorDesc =
      hashParams.get("error_description") ||
      searchParams.get("error_description");

    if (errorParam) {
      if (
        errorDesc?.toLowerCase().includes("expired") ||
        errorParam === "otp_expired"
      ) {
        setUrlError(
          "Ce lien de réinitialisation a expiré. Veuillez faire une nouvelle demande."
        );
      } else {
        setUrlError(
          errorDesc
            ? decodeURIComponent(errorDesc.replace(/\+/g, " "))
            : "Ce lien de réinitialisation est invalide ou a déjà été utilisé."
        );
      }
      return;
    }

    // Récupération du token ou du code
    const token =
      hashParams.get("access_token") ||
      searchParams.get("access_token") ||
      hashParams.get("token") ||
      searchParams.get("token");
    const code = searchParams.get("code") || hashParams.get("code");

    if (token) {
      setAccessToken(token);
    } else if (code) {
      setAuthCode(code);
    } else {
      setUrlError(
        "Aucun jeton de réinitialisation trouvé dans le lien. Veuillez utiliser le lien reçu par e-mail ou faire une nouvelle demande."
      );
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const isLengthValid = formData.password.length >= 6;
  const isMatchValid =
    formData.password && formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isLengthValid) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    if (!isMatchValid) {
      setError("Les mots de passe saisis ne correspondent pas.");
      return;
    }

    if (!accessToken && !authCode) {
      setError(
        "Jeton manquant ou expiré. Veuillez refaire une demande de réinitialisation."
      );
      return;
    }

    setLoading(true);
    try {
      const response = await resetUserPassword({
        password: formData.password,
        access_token: accessToken,
        code: authCode,
      });

      setIsSuccess(true);
      toast.success(
        response.message || "Mot de passe réinitialisé avec succès !"
      );

      // Redirection automatique après 3 secondes
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error("Erreur reset password :", err);
      const rawError =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Impossible de réinitialiser le mot de passe. Le lien a peut-être expiré.";
      setError(rawError);
      toast.error(rawError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* ========================================================= */}
      {/* SECTION GAUCHE : Branding & Vitrine SmartSahaBio (Desktop) */}
      {/* ========================================================= */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-[54%] flex-col justify-between p-12 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0">
          <img
            src={bgHeroImg}
            alt="Agriculture biologique et technologie"
            className="w-full h-full object-cover object-center brightness-[0.40] contrast-[1.15]"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#021f18]/95 via-[#063326]/80 to-teal-950/70 mix-blend-multiply" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
        </div>

        {/* Header gauche */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 p-2 backdrop-blur-md border border-white/20 shadow-lg shadow-black/20">
            <img
              src={logoImg}
              alt="SmartSahaBio"
              className="h-full w-full object-contain drop-shadow"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                SmartSaha<span className="text-emerald-400">Bio</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Sparkles className="w-2.5 h-2.5" />
                Sécurité
              </span>
            </div>
            <p className="text-xs text-teal-200/80 font-medium">
              Plateforme Intelligente de Gestion & Certification Bio
            </p>
          </div>
        </div>

        {/* Corps central gauche */}
        <div className="relative z-10 my-auto max-w-xl py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/15 text-xs text-emerald-300 font-medium mb-6">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            Nouveau mot de passe sécurisé
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Définissez votre{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
              nouvelle clé d'accès
            </span>
            .
          </h1>

          <p className="mt-5 text-base xl:text-lg leading-relaxed text-teal-100/85 font-normal">
            Choisissez un mot de passe robuste combinant chiffres et lettres pour garantir l'intégrité de vos accès à la gestion des coopératives, parcelles et audits.
          </p>

          <div className="mt-8 space-y-3 max-w-md">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <p className="text-xs text-teal-100/80">
                Chiffrement conforme aux standards bancaires & RGPD
              </p>
            </div>
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md">
              <CheckCircle2 className="h-5 w-5 text-teal-400 shrink-0" />
              <p className="text-xs text-teal-100/80">
                Session immédiatement renouvelée et sécurisée
              </p>
            </div>
          </div>
        </div>

        {/* Pied de page gauche */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-teal-200/75">
          <span>SmartSahaBio &copy; {new Date().getFullYear()}</span>
          <span>Plateforme Certifiée</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION DROITE : Formulaire de Changement                  */}
      {/* ========================================================= */}
      <div className="w-full lg:w-1/2 xl:w-[46%] flex items-center justify-center px-6 py-12 sm:px-10 lg:px-12 bg-gradient-to-b from-[#f8fafb] via-[#f1f6f6] to-[#e7f1ee] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-screen transition-colors duration-200">
        <div className="w-full max-w-md">
          {/* Header Mobile */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-3xl bg-white dark:bg-slate-900 p-3 shadow-xl shadow-teal-900/10 border border-teal-100 dark:border-slate-800">
              <img
                src={logoImg}
                alt="SmartSahaBio"
                className="h-full w-full object-contain drop-shadow"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              SmartSaha<span className="text-emerald-700 dark:text-emerald-400">Bio</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Réinitialisation de mot de passe
            </p>
          </div>

          {/* Carte Principale */}
          <div className="relative rounded-3xl bg-white/95 dark:bg-slate-900/90 p-8 sm:p-9 shadow-2xl shadow-teal-950/10 dark:shadow-black/40 border border-teal-100/80 dark:border-slate-800/80 backdrop-blur-xl transition-all">
            {/* Bouton Thème */}
            <div className="absolute top-5 right-5">
              <button
                type="button"
                onClick={toggleTheme}
                title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
                className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-teal-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                aria-label="Changer de thème"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            </div>

            {/* CAS 1 : Lien invalide ou expiré */}
            {urlError ? (
              <div className="text-center py-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-inner">
                  <AlertCircle className="h-9 w-9" />
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Lien expiré ou invalide
                </h2>

                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {urlError}
                </p>

                <div className="mt-7 space-y-3">
                  <Link
                    to="/forgot-password"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 dark:from-emerald-600 dark:via-teal-600 dark:to-emerald-700 py-3.5 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 hover:brightness-105 transition-all"
                  >
                    <span>Demander un nouveau lien</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <Link
                    to="/login"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-semibold text-teal-700 dark:text-emerald-400 hover:bg-teal-50 dark:hover:bg-emerald-950/30 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Retour à la page de connexion
                  </Link>
                </div>
              </div>
            ) : isSuccess ? (
              /* CAS 2 : Succès */
              <div className="text-center py-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-inner">
                  <CheckCircle2 className="h-9 w-9" />
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Mot de passe modifié !
                </h2>

                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé vers l'écran de connexion...
                </p>

                <div className="mt-7">
                  <Link
                    to="/login"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 dark:from-emerald-600 dark:via-teal-600 dark:to-emerald-700 py-3.5 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 hover:brightness-105 transition-all"
                  >
                    <span>Se connecter maintenant</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              /* CAS 3 : Formulaire de nouveau mot de passe */
              <>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-50 dark:bg-emerald-950/60 text-teal-800 dark:text-emerald-400 border border-teal-200/70 dark:border-emerald-800/60 mb-3">
                    <KeyRound className="w-3.5 h-3.5" />
                    Nouveau mot de passe
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Réinitialisation
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Saisissez votre nouveau mot de passe ci-dessous pour sécuriser l'accès à votre compte.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/90 dark:bg-red-950/40 p-3.5 text-xs text-red-800 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1 font-medium leading-relaxed">{error}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Champ Nouveau mot de passe */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5"
                    >
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                        <Lock className="h-4 w-4 text-teal-600/70 dark:text-emerald-400/80" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        placeholder="••••••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={loading}
                        className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 pl-10 pr-11 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm transition-all focus:border-teal-600 dark:focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Champ Confirmer le mot de passe */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5"
                    >
                      Confirmer le mot de passe
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                        <Lock className="h-4 w-4 text-teal-600/70 dark:text-emerald-400/80" />
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        required
                        placeholder="••••••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 pl-10 pr-11 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm transition-all focus:border-teal-600 dark:focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Indicateurs de critères */}
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-xs space-y-1.5 border border-slate-200/60 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          isLengthValid
                            ? "bg-emerald-500"
                            : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      />
                      <span
                        className={
                          isLengthValid
                            ? "text-emerald-700 dark:text-emerald-400 font-medium"
                            : "text-slate-500 dark:text-slate-400"
                        }
                      >
                        Au moins 6 caractères
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          isMatchValid
                            ? "bg-emerald-500"
                            : "bg-slate-300 dark:bg-slate-600"
                        }`}
                      />
                      <span
                        className={
                          isMatchValid
                            ? "text-emerald-700 dark:text-emerald-400 font-medium"
                            : "text-slate-500 dark:text-slate-400"
                        }
                      >
                        Les deux mots de passe correspondent
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !isLengthValid || !isMatchValid}
                    className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 dark:from-emerald-600 dark:via-teal-600 dark:to-emerald-700 py-3.5 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 hover:shadow-teal-900/30 hover:brightness-105 active:scale-[0.99] transition-all disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Mise à jour du mot de passe...</span>
                      </>
                    ) : (
                      <>
                        <span>Enregistrer le nouveau mot de passe</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-emerald-400 hover:text-teal-800 dark:hover:text-emerald-300 transition-colors hover:underline"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Annuler et revenir à la connexion
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

