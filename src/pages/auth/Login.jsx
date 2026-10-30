import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Satellite,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  UserX,
  Sun,
  Moon,
} from "lucide-react";
import logoImg from "../../assets/logo.png";
import bgHeroImg from "../../assets/login-bg.jpg";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const getFriendlyErrorMessage = (err) => {
    // 1. Récupération du message d'erreur de l'API
    const rawError =
      err.response?.data?.error ||
      err.response?.data?.message ||
      err.message ||
      "";

    const status = err.response?.status;

    // Compte réservé au mobile (Agent terrain ou Auditeur bio)
    if (status === 403 || rawError.toLowerCase().includes("mobile") || rawError.toLowerCase().includes("réservé")) {
      return rawError || "Ce compte est réservé à l'application mobile. L'accès Web est réservé aux Administrateurs et Gestionnaires de coopérative.";
    }

    // 2. Erreurs d'authentification Supabase (identifiants inexistants ou mot de passe faux)
    if (
      rawError.toLowerCase().includes("invalid login credentials") ||
      rawError.toLowerCase().includes("aucun compte") ||
      rawError.toLowerCase().includes("invalid_credentials") ||
      status === 401
    ) {
      return "Aucun compte trouvé avec cette adresse e-mail ou le mot de passe est incorrect. Vérifiez vos identifiants ou créez un compte.";
    }

    if (
      rawError.toLowerCase().includes("email not confirmed") ||
      rawError.toLowerCase().includes("non confirmé")
    ) {
      return "Votre adresse e-mail n'a pas encore été confirmée. Veuillez vérifier votre boîte de réception.";
    }

    if (
      rawError.toLowerCase().includes("rate limit") ||
      rawError.toLowerCase().includes("too many requests") ||
      status === 429
    ) {
      return "Trop de tentatives de connexion échouées. Veuillez patienter quelques minutes avant de réessayer.";
    }

    if (
      rawError.toLowerCase().includes("network error") ||
      rawError.toLowerCase().includes("connection refused") ||
      !err.response
    ) {
      return "Impossible de joindre le serveur. Vérifiez votre connexion réseau.";
    }

    if (status === 500) {
      return "Erreur interne du serveur d'authentification. Veuillez réessayer plus tard.";
    }

    return rawError || "Erreur de connexion. Veuillez vérifier vos informations de connexion.";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.email.trim() || !formData.password) {
      const msg = "Veuillez renseigner votre email et mot de passe.";
      setError(msg);
      toast.error(msg);
      return;
    }

    try {
      setLoading(true);
      const result = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (result.access_token && result.user) {
        toast.success("Connexion réussie !");
        navigate("/dashboard");
      } else {
        const errorMsg =
          result.error ||
          result.message ||
          "Aucun compte trouvé avec ces identifiants ou mot de passe incorrect.";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error("Erreur de connexion :", err);
      const friendlyMsg = getFriendlyErrorMessage(err);
      setError(friendlyMsg);
      toast.error(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0c1819] font-sans selection:bg-emerald-500 selection:text-white">
      {/* ========================================================= */}
      {/* SECTION GAUCHE : Branding, Image de fond & Valeur ajoutée */}
      {/* ========================================================= */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-[54%] flex-col justify-between overflow-hidden p-10 xl:p-14 text-white">
        {/* Image de fond en haute définition */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
          style={{ backgroundImage: `url(${bgHeroImg})` }}
        />

        {/* Superposition de dégradés immersifs (Teal sombre, émeraude & vert forêt) */}
        {/* <div className="absolute inset-0 bg-gradient-to-br from-[#041a1c]/94 via-[#062c2f]/88 to-[#032117]/92 backdrop-blur-[2px]" /> */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#041a1c]/84 via-[#062c2f]/78 to-[#032117]/82 backdrop-blur-[1px]" />

        {/* Glows d'ambiance modernes */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        {/* En-tête gauche : Logo & Nom de la plateforme */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4 backdrop-blur-md px-5 py-3 hover:opacity-95 transition-opacity">
            <div className="h-16 w-16 rounded-2xl bg-white/95 p-2 flex items-center justify-center shadow-lg shadow-black/25 shrink-0">
              <img
                src={logoImg}
                alt="SmartSahaBio Logo"
                className="h-full w-full object-contain filter drop-shadow-sm"
              />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-black tracking-tight text-white">
                  SmartSaha<span className="text-emerald-400">Bio</span>
                </span>
              </div>
              <p className="text-xs text-teal-200/90 font-medium">
                Plateforme AgriTech & Traçabilité Biologique
              </p>
            </div>
          </Link>

          <div className="hidden xl:flex items-center gap-2 text-xs text-teal-200/70 bg-black/20 px-3 py-1.5 rounded-full border border-white/10">
            <span>Standard UE 2018/848</span>
          </div>

        </div>

        {/* Contenu central gauche : Textes & Argumentaires */}
        <div className="relative z-10 my-auto py-8 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-300 text-xs font-semibold mb-6 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Gestion Intelligente des Filières Agricoles</span>
          </div>

          <h1 className="text-2xl xl:text-4xl font-extrabold tracking-tight leading-[1.18] text-white">
            L'intelligence technologique au service de{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
              l'agriculture biologique
            </span>
            .
          </h1>

          <p className="mt-5 text-base xl:text-lg leading-relaxed text-teal-100/85 font-normal">
            Supervisez vos coopératives et parcelles, pilotez les audits de conformité
            et anticipez les risques incendie par télédétection satellitaire en temps réel.
          </p>

          {/* Grille de cartes de fonctionnalités intégrées */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="group rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] p-4 backdrop-blur-md border border-white/10 transition-all duration-300">
              <div className="h-9 w-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 mb-3 group-hover:scale-110 transition-transform">
                <Satellite className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Suivi Satellitaire</h3>
              <p className="mt-1 text-xs text-teal-100/70 leading-normal">
                Flux NASA FIRMS & alertes feux actives
              </p>
            </div>

            <div className="group rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] p-4 backdrop-blur-md border border-white/10 transition-all duration-300">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 mb-3 group-hover:scale-110 transition-transform">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Audits & Normes</h3>
              <p className="mt-1 text-xs text-teal-100/70 leading-normal">
                Questionnaires dynamiques & conformité
              </p>
            </div>

            <div className="group rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] p-4 backdrop-blur-md border border-white/10 transition-all duration-300">
              <div className="h-9 w-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mb-3 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Traçabilité SIG</h3>
              <p className="mt-1 text-xs text-teal-100/70 leading-normal">
                Polygones PostGIS & délimitation GPS
              </p>
            </div>
          </div>
        </div>

        {/* Pied de page gauche : Métriques de confiance */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-teal-200/75">
          <div className="flex items-center gap-6">
            <div>
              <span className="block text-lg font-bold text-white">100%</span>
              <span className="text-[11px] text-teal-300/70">Traçabilité Bio</span>
            </div>
            <div className="h-7 w-[1px] bg-white/15" />
            <div>
              <span className="block text-lg font-bold text-white">24/7</span>
              <span className="text-[11px] text-teal-300/70">Veille Incendie</span>
            </div>
            <div className="h-7 w-[1px] bg-white/15" />
            <div>
              <span className="block text-lg font-bold text-white">SIG</span>
              <span className="text-[11px] text-teal-300/70">Cartographie PostGIS</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION DROITE : Formulaire de connexion épuré et moderne */}
      {/* ========================================================= */}
      <div className="w-full lg:w-1/2 xl:w-[46%] flex items-center justify-center px-6 py-12 sm:px-10 lg:px-12 bg-gradient-to-b from-[#f8fafb] via-[#f1f6f6] to-[#e7f1ee] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-screen transition-colors duration-200">
        <div className="w-full max-w-md">
          {/* Header Mobile Uniquement */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-3 flex h-24 w-24 items-center justify-center rounded-3xl bg-white dark:bg-slate-900 p-3 shadow-xl shadow-teal-900/10 border border-teal-100 dark:border-slate-800">
              <img
                src={logoImg}
                alt="SmartSahaBio"
                className="h-full w-full object-contain drop-shadow"
              />
            </div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
              SmartSaha<span className="text-emerald-600 dark:text-emerald-400">Bio</span>
            </h1>
            <p className="mt-1 text-xs text-teal-700/80 dark:text-emerald-400/80 font-medium">
              Plateforme Intelligente de Gestion Agricole
            </p>
          </div>

          {/* Carte Principale de Connexion */}
          <div className="relative rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-8 sm:p-10 shadow-2xl shadow-teal-950/10 dark:shadow-black/40 border border-teal-100/80 dark:border-slate-800 transition-all duration-300 hover:shadow-teal-900/15">
            {/* Décoration d'angle douce */}
            <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-bl from-teal-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/10 rounded-tr-3xl pointer-events-none" />

            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Connexion
                  </h2>
                  <p className="text-xs sm:text-sm text-teal-700 dark:text-emerald-400 font-medium mt-0.5">
                    Portail Sécurisé SmartSahaBio
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    title={isDark ? "Mode clair" : "Mode sombre"}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                  </button>
                  <Link
                    to="/"
                    className="text-xs text-slate-500 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium inline-flex items-center gap-1 transition-colors bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    ← Accueil
                  </Link>
                </div>
              </div>
            </div>

            {/* Alerte d'erreur */}
            {error && (
              <div
                className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/90 dark:bg-red-950/30 p-3.5 text-sm text-red-700 dark:text-red-300 shadow-sm animate-in fade-in duration-200"
                role="alert"
              >
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="leading-snug flex-1">
                  <p>{error}</p>
                  {error.includes("créez un compte") && (
                    <Link
                      to="/register"
                      className="mt-2 inline-flex items-center gap-1 font-semibold text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 underline text-xs"
                    >
                      <span>Créer un compte maintenant</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Champ Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                >
                  Adresse e-mail
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                    <Mail className="h-4 w-4 text-teal-600/70 dark:text-emerald-400/80" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="nom@cooperative.mg"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all duration-200 hover:border-teal-300 dark:hover:border-emerald-500/60 focus:border-teal-600 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-teal-500/15 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Champ Mot de passe */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      alert("Veuillez contacter votre administrateur de coopérative pour réinitialiser vos identifiants.");
                    }}
                    className="text-xs font-medium text-teal-700 dark:text-emerald-400 hover:text-teal-800 dark:hover:text-emerald-300 transition-colors hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 dark:text-slate-500">
                    <Lock className="h-4 w-4 text-teal-600/70 dark:text-emerald-400/80" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 pl-10 pr-11 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all duration-200 hover:border-teal-300 dark:hover:border-emerald-500/60 focus:border-teal-600 dark:focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-teal-500/15 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-teal-700 dark:hover:text-emerald-400 transition-colors focus:outline-none"
                    title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Bouton de Soumission */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full cursor-pointer overflow-hidden rounded-xl bg-gradient-to-r from-[#0c6b75] via-[#057a55] to-[#15803d] p-[1px] font-semibold text-white shadow-lg shadow-teal-900/20 transition-all duration-200 hover:shadow-xl hover:shadow-teal-900/30 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="flex h-full w-full items-center justify-center gap-2 rounded-[11px] bg-gradient-to-r from-[#0b646d] via-[#057a55] to-[#15803d] px-4 py-3 text-sm font-semibold text-white transition-all duration-200 group-hover:bg-opacity-90">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Authentification en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Se connecter à mon espace</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Inscription */}
            <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                Vous n'avez pas encore de compte utilisateur ?
              </p>
              <Link
                to="/register"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                <span>Créer un compte</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Badge de sécurité & copyright en bas */}
          <div className="mt-8 flex flex-col items-center justify-center gap-2 text-center text-xs text-slate-400 dark:text-slate-500">
            <p className="text-[11px]">
              © 2026 SmartSahaBio — Système certifié pour l'agriculture biologique
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
