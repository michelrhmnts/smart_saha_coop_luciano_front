import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";
import { requestPasswordReset } from "../../services/authService";
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Satellite,
  ShieldCheck,
  FileCheck2,
  Sun,
  Moon,
  RefreshCw,
} from "lucide-react";
import logoImg from "../../assets/logo.png";
import bgHeroImg from "../../assets/login-bg.jpg";

const ForgotPassword = () => {
  const { isDark, toggleTheme } = useTheme();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError("Veuillez renseigner votre adresse e-mail.");
      return;
    }

    // Validation basique du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Veuillez renseigner une adresse e-mail valide.");
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(trimmedEmail);
      setSubmittedEmail(trimmedEmail);
      setSubmitted(true);
      toast.success("Demande envoyée ! Vérifiez votre boîte de réception.");
    } catch (err) {
      console.error("Erreur réinitialisation :", err);
      const rawError =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Impossible d'envoyer l'e-mail de réinitialisation. Veuillez réessayer plus tard.";
      setError(rawError);
      toast.error(rawError);
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setSubmitted(false);
    setError("");
  };

  return (
    <div className="min-h-screen flex w-full bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* ========================================================= */}
      {/* SECTION GAUCHE : Branding & Vitrine SmartSahaBio (Desktop) */}
      {/* ========================================================= */}
      <div className="relative hidden lg:flex lg:w-1/2 xl:w-[54%] flex-col justify-between p-12 overflow-hidden bg-slate-950">
        {/* Image de fond avec filtre et overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={bgHeroImg}
            alt="Agriculture biologique et technologie"
            className="w-full h-full object-cover object-center brightness-[0.40] contrast-[1.15] scale-105 transform hover:scale-100 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#021f18]/95 via-[#063326]/80 to-teal-950/70 mix-blend-multiply" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
        </div>

        {/* Header gauche : Logo et Titre */}
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

        {/* Corps central gauche : Description & Avantages */}
        <div className="relative z-10 my-auto max-w-xl py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/15 text-xs text-emerald-300 font-medium mb-6">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Récupération de compte sécurisée
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Accédez à vos données en toute{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">
              sérénité et sécurité
            </span>
            .
          </h1>

          <p className="mt-5 text-base xl:text-lg leading-relaxed text-teal-100/85 font-normal">
            La protection de vos données de parcelles, d'audits et de producteurs est au cœur de notre architecture.
            En cas d'oubli de mot de passe, un lien chiffré à usage unique vous est transmis par e-mail.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="rounded-2xl bg-white/[0.07] p-4 backdrop-blur-md border border-white/10">
              <div className="h-9 w-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 mb-3">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Chiffrement AES</h3>
              <p className="mt-1 text-xs text-teal-100/70">
                Jetons cryptographiques à durée de validité limitée
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.07] p-4 backdrop-blur-md border border-white/10">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 mb-3">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Lien à usage unique</h3>
              <p className="mt-1 text-xs text-teal-100/70">
                Désactivation automatique dès réinitialisation
              </p>
            </div>

            <div className="rounded-2xl bg-white/[0.07] p-4 backdrop-blur-md border border-white/10">
              <div className="h-9 w-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mb-3">
                <Satellite className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Assistance 24/7</h3>
              <p className="mt-1 text-xs text-teal-100/70">
                Notification instantanée de sécurité
              </p>
            </div>
          </div>
        </div>

        {/* Pied de page gauche */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-teal-200/75">
          <span>SmartSahaBio &copy; {new Date().getFullYear()}</span>
          <span>Authentification & Télédétection Sécurisées</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION DROITE : Formulaire Mot de passe oublié            */}
      {/* ========================================================= */}
      <div className="w-full lg:w-1/2 xl:w-[46%] flex items-center justify-center px-6 py-12 sm:px-10 lg:px-12 bg-gradient-to-b from-[#f8fafb] via-[#f1f6f6] to-[#e7f1ee] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 min-h-screen transition-colors duration-200">
        <div className="w-full max-w-md">
          {/* Header Mobile Uniquement */}
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
              Récupération de mot de passe
            </p>
          </div>

          {/* Carte Principale */}
          <div className="relative rounded-3xl bg-white/95 dark:bg-slate-900/90 p-8 sm:p-9 shadow-2xl shadow-teal-950/10 dark:shadow-black/40 border border-teal-100/80 dark:border-slate-800/80 backdrop-blur-xl transition-all">
            {/* Bouton Thème Sombre / Clair en haut à droite */}
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

            {/* État 1 : Message de confirmation après envoi */}
            {submitted ? (
              <div className="text-center py-3">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shadow-inner">
                  <CheckCircle2 className="h-9 w-9" />
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Vérifiez votre boîte e-mail
                </h2>

                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Un lien sécurisé de réinitialisation vient d'être envoyé à l'adresse <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">{submittedEmail}</strong>.
                </p>

                <div className="mt-5 rounded-2xl bg-teal-50/60 dark:bg-slate-800/50 p-4 border border-teal-100 dark:border-slate-700/60 text-left">
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    💡 <strong className="font-semibold text-slate-800 dark:text-slate-200">Conseil :</strong> Vérifiez vos dossiers <span className="font-medium text-teal-700 dark:text-emerald-400">Courriers indésirables / Spams</span> si vous ne recevez rien dans les 2 minutes. Ce lien expirera après un délai d'une heure.
                  </p>
                </div>

                <div className="mt-7 space-y-3">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Renvoyer un e-mail ou modifier l'adresse
                  </button>

                  <Link
                    to="/login"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-semibold text-teal-700 dark:text-emerald-400 hover:bg-teal-50 dark:hover:bg-emerald-950/30 transition-colors"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Retour à la page de connexion
                  </Link>
                </div>
              </div>
            ) : (
              /* État 2 : Formulaire de demande */
              <>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-50 dark:bg-emerald-950/60 text-teal-800 dark:text-emerald-400 border border-teal-200/70 dark:border-emerald-800/60 mb-3">
                    <Mail className="w-3.5 h-3.5" />
                    Récupération de compte
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Mot de passe oublié ?
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    Entrez votre adresse e-mail. Nous vous enverrons un lien sécurisé pour créer un nouveau mot de passe.
                  </p>
                </div>

                {/* Message d'erreur */}
                {error && (
                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/90 dark:bg-red-950/40 p-3.5 text-xs text-red-800 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1 font-medium leading-relaxed">{error}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5"
                    >
                      Adresse e-mail du compte
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
                        required
                        placeholder="nom@cooperative.mg"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError("");
                        }}
                        disabled={loading}
                        className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 pl-10 pr-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-sm transition-all focus:border-teal-600 dark:focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:opacity-70"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 dark:from-emerald-600 dark:via-teal-600 dark:to-emerald-700 py-3.5 px-4 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 hover:shadow-teal-900/30 hover:brightness-105 active:scale-[0.99] transition-all disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                        <span>Envoi du lien en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Envoyer le lien de réinitialisation</span>
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
                      Retour à l'écran de connexion
                    </Link>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Liens légaux / Aide en bas */}
          <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
            Besoin d'aide ? Contactez l'administrateur de votre coopérative.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

