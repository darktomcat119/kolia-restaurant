import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ClipboardList, ChefHat, TrendingUp } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { LoginCarousel } from '../components/LoginCarousel';

const FLOATING_PARTICLES = [
  { size: 3, top: '20%', left: '85%', delay: '0s', duration: '7s' },
  { size: 2, top: '40%', left: '12%', delay: '1.5s', duration: '9s' },
  { size: 4, top: '65%', left: '70%', delay: '0.5s', duration: '8s' },
  { size: 2, top: '80%', left: '30%', delay: '2s', duration: '10s' },
  { size: 3, top: '10%', left: '55%', delay: '3s', duration: '6s' },
  { size: 2, top: '50%', left: '90%', delay: '1s', duration: '7s' },
];

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Veuillez entrer votre adresse e-mail.');
      return;
    }
    setResetLoading(true);
    setError('');
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'envoi du lien de réinitialisation.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-row-reverse bg-[#FAFAF7]">
      {/* Right panel — cinematic hero (green tones) */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden rounded-l-[2.5rem]">
        {/* Cinematic background carousel */}
        <LoginCarousel />

        {/* Multi-layer gradient — green accent */}
        <div className="absolute inset-0 bg-gradient-to-bl from-black/80 via-black/40 to-[#1B5E3A]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Grain texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.5\'/%3E%3C/svg%3E")' }} />

        {/* Floating emerald particles */}
        {FLOATING_PARTICLES.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-emerald-400/80"
            style={{
              width: p.size,
              height: p.size,
              top: p.top,
              left: p.left,
              animation: `float ${p.duration} ease-in-out infinite`,
              animationDelay: p.delay,
            }}
          />
        ))}

        {/* Decorative lines */}
        <div className="absolute right-0 top-[25%] w-28 h-px bg-gradient-to-l from-transparent via-emerald-400/40 to-transparent" />
        <div className="absolute left-0 bottom-[35%] w-20 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          {/* Brand */}
          <div className="animate-blur-in">
            <img src="/images/logo.png" alt="Kolia" className="h-12 w-auto object-contain mb-2 drop-shadow-2xl" />
            <p className="text-white/40 font-body text-xs tracking-[0.3em] uppercase">Espace Restaurant</p>
          </div>

          {/* Quote */}
          <div className="animate-slide-up-fade" style={{ animationDelay: '0.3s' }}>
            <div className="relative max-w-md">
              <div className="absolute -left-6 top-0 bottom-0 w-px bg-gradient-to-b from-emerald-400/80 via-emerald-400/30 to-transparent" />

              <blockquote className="text-white font-display text-4xl leading-[1.2] mb-5">
                "Votre cuisine,
                <br />
                <span className="text-emerald-400">notre plateforme.</span>"
              </blockquote>
              <p className="text-white/40 font-body text-sm leading-relaxed max-w-sm">
                Gérez vos commandes en temps réel, mettez à jour votre menu et suivez vos performances depuis votre tableau de bord.
              </p>
            </div>
          </div>

          {/* Feature cards — glassmorphism */}
          <div className="flex gap-3 animate-slide-up-fade" style={{ animationDelay: '0.6s' }}>
            {[
              { icon: ClipboardList, label: 'Commandes live', desc: 'Notifications instant.' },
              { icon: ChefHat, label: 'Gestion menu', desc: 'Mise à jour facile' },
              { icon: TrendingUp, label: 'Statistiques', desc: 'Performances clés' },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] transition-all duration-300 group cursor-default"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-400/10 flex items-center justify-center group-hover:bg-emerald-400/20 transition-colors">
                  <Icon size={14} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-white/90 text-xs font-semibold font-body">{label}</p>
                  <p className="text-white/30 text-[10px] font-body">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom shimmer */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
      </div>

      {/* Left panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#FAFAF7] relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-secondary/[0.03]" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-emerald-400/[0.04]" />

        <div className="w-full max-w-md relative z-10 animate-slide-up-fade" style={{ animationDelay: '0.2s' }}>
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10">
            <img src="/images/logo.png" alt="Kolia" className="h-12 w-auto object-contain mx-auto mb-2" />
            <p className="text-[#9C9690] font-body text-sm">Espace Restaurant</p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block mb-10">
            <h2 className="font-display text-4xl text-[#1A1A1A] mb-3">Bienvenue</h2>
            <p className="text-[#9C9690] font-body text-sm">Connectez-vous à votre espace restaurant</p>
            <div className="mt-6 h-px w-16 bg-gradient-to-r from-secondary to-transparent rounded-full" />
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-50/80 backdrop-blur-sm border border-red-100 animate-fade-up">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              <p className="text-red-700 text-sm font-body">{error}</p>
            </div>
          )}
          {resetSent && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-green-50/80 backdrop-blur-sm border border-green-100 animate-fade-up">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <p className="text-green-700 text-sm font-body">
                Lien envoyé à <strong>{email}</strong>. Vérifiez votre boîte mail.
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#3D3A37] font-body">
                Adresse e-mail
              </label>
              <div className={`relative rounded-2xl transition-all duration-300 ${focusedField === 'email' ? 'ring-2 ring-secondary/20 shadow-lg shadow-secondary/[0.06]' : ''}`}>
                <Mail size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'email' ? 'text-secondary' : 'text-[#9C9690]'}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="w-full pl-11 pr-4 py-4 rounded-2xl border border-[#E5E3E0] bg-white font-body text-sm text-[#1A1A1A] placeholder:text-[#C4C0BB] focus:outline-none focus:border-secondary transition-all"
                  placeholder="chef@monrestaurant.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-[#3D3A37] font-body">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resetLoading}
                  className="text-xs text-secondary/70 font-body hover:text-secondary transition-colors disabled:opacity-50"
                >
                  {resetLoading ? 'Envoi...' : 'Mot de passe oublié ?'}
                </button>
              </div>
              <div className={`relative rounded-2xl transition-all duration-300 ${focusedField === 'password' ? 'ring-2 ring-secondary/20 shadow-lg shadow-secondary/[0.06]' : ''}`}>
                <Lock size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${focusedField === 'password' ? 'text-secondary' : 'text-[#9C9690]'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                  className="w-full pl-11 pr-12 py-4 rounded-2xl border border-[#E5E3E0] bg-white font-body text-sm text-[#1A1A1A] placeholder:text-[#C4C0BB] focus:outline-none focus:border-secondary transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9C9690] hover:text-[#3D3A37] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-secondary to-secondary-light text-white font-body font-semibold text-sm hover:shadow-xl hover:shadow-secondary/25 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 mt-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Register link — glassmorphism card */}
          <div className="mt-8 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-[#E5E3E0] text-center hover:shadow-md transition-shadow duration-300">
            <p className="text-sm text-[#6B6560] font-body">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-secondary font-semibold hover:underline">
                Inscrire votre restaurant
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#E5E3E0]" />
            <p className="text-[10px] text-[#C4C0BB] font-body tracking-wider uppercase">Kolia Restaurant © {new Date().getFullYear()}</p>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#E5E3E0]" />
          </div>
        </div>
      </div>
    </div>
  );
}
