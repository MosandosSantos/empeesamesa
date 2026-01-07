"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogIn, Loader2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao fazer login");
        setIsLoading(false);
        return;
      }

      // Redirecionar para a página de origem ou dashboard
      router.push(from);
      router.refresh();
    } catch (_error) {
      setError("Erro ao conectar com o servidor");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/img/login-bg-templo.png"
          alt="Background"
          fill
          priority
          className="object-cover"
          quality={90}
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="mb-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
            SAL do GOISC
          </h1>
          <p className="mt-1 text-xs text-white/90 drop-shadow leading-relaxed">
            Sistema de Administra??o de Lojas do<br />Grande Oriente Independente de Santa Catarina
          </p>
        </div>

        {/* Glassmorphism Login Card */}
        <div className="rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white drop-shadow-md">
              Bem-vindo
            </h2>
            <p className="mt-1 text-sm text-white/80">
              Fa?a login para acessar o sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-white mb-1.5 drop-shadow"
              >
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full bg-white/20 backdrop-blur-md border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 focus:border-rer-gold focus:ring-rer-gold/50 transition-all duration-200 h-10 text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-white mb-1.5 drop-shadow"
              >
                Senha
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="????????"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full bg-white/20 backdrop-blur-md border-white/30 text-white placeholder:text-white/50 focus:bg-white/30 focus:border-rer-gold focus:ring-rer-gold/50 transition-all duration-200 h-10 text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-rer-red/20 backdrop-blur-md border border-rer-red/30 p-3 shadow-lg">
                <p className="text-xs font-medium text-white drop-shadow">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-login-button/80 hover:bg-login-button-hover/90 text-login-button-foreground h-10 text-sm font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-white/30 backdrop-blur-sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-white/70 drop-shadow">
          <p>&copy; {new Date().getFullYear()} SAL do GOISC. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
