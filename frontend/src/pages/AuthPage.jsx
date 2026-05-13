import React, { useState } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CarProfile, EnvelopeSimple, Lock, UserCircle } from "@phosphor-icons/react";
import { useAuth } from "../lib/auth";

const HERO = "https://static.prod-images.emergentagent.com/jobs/f513b77d-bb4c-4452-98ea-4337dd59ab15/images/e13de7132f412a56174251e78d62b936ed5c620a6fb06e256d11d29c13e9ca51.png";

export default function AuthPage({ mode = "login" }) {
  const { user, login, register, error } = useAuth();
  const navigate = useNavigate();
  const isLogin = mode === "login";
  const [email, setEmail] = useState(isLogin ? "demo@autovault.app" : "");
  const [password, setPassword] = useState(isLogin ? "demo12345" : "");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const ok = isLogin ? await login(email, password) : await register(name, email, password);
    setBusy(false);
    if (ok) navigate("/");
  };

  return (
    <div className="min-h-screen av-bg text-eggshell flex" data-testid="auth-page">
      {/* Hero */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden">
        <img src={HERO} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/55 to-ink/30" />
        <div className="relative z-10 p-14 flex flex-col justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#3E5C76]/50 border border-[#748CAB]/30">
              <CarProfile size={26} weight="duotone" color="#F0EBD8" />
            </div>
            <div>
              <div className="font-heading text-xl font-semibold">AutoVault</div>
              <div className="av-overline">Digital Garage</div>
            </div>
          </div>
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="font-heading text-5xl xl:text-6xl font-semibold tracking-tight leading-[1.05] max-w-lg"
            >
              Your garage, refined into a single signal.
            </motion.h1>
            <p className="text-eggshell/70 mt-5 max-w-md">
              Track every mile, service and refuel. AutoVault turns scattered receipts into a quiet, precise dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="av-glass w-full max-w-md p-8"
        >
          <div className="av-overline">{isLogin ? "Welcome back" : "Create account"}</div>
          <h2 className="font-heading text-3xl font-semibold mt-2 mb-7">
            {isLogin ? "Sign in to AutoVault" : "Start your digital garage"}
          </h2>

          <form onSubmit={submit} className="space-y-4">
            {!isLogin && (
              <Field icon={UserCircle} label="Name">
                <input
                  required
                  className="av-input"
                  placeholder="Jane Driver"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="register-name-input"
                />
              </Field>
            )}
            <Field icon={EnvelopeSimple} label="Email">
              <input
                required
                type="email"
                className="av-input"
                placeholder="you@autovault.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="auth-email-input"
              />
            </Field>
            <Field icon={Lock} label="Password">
              <input
                required
                minLength={6}
                type="password"
                className="av-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="auth-password-input"
              />
            </Field>

            {error && (
              <div className="text-sm text-[#e8a3a3] bg-[#5b2a2a]/30 border border-[#a05555]/40 rounded-lg px-3 py-2" data-testid="auth-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="av-btn w-full justify-center text-base"
              data-testid="auth-submit-button"
            >
              {busy ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-sm text-eggshell/60 text-center">
            {isLogin ? (
              <>New here? <Link to="/register" className="text-eggshell underline underline-offset-4" data-testid="link-register">Create an account</Link></>
            ) : (
              <>Already have an account? <Link to="/login" className="text-eggshell underline underline-offset-4" data-testid="link-login">Sign in</Link></>
            )}
          </div>

          {isLogin && (
            <div className="mt-5 av-glass-strong rounded-xl px-4 py-3 text-xs text-eggshell/60">
              <span className="av-overline block mb-1">Demo</span>
              demo@autovault.app · demo12345
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <label className="block">
      <span className="av-overline block mb-2">{label}</span>
      <div className="relative">
        <Icon size={18} weight="duotone" className="absolute left-3 top-1/2 -translate-y-1/2 text-denim" />
        <div className="pl-9">{children}</div>
      </div>
    </label>
  );
}
