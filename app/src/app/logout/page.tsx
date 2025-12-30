"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogIn, CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function LogoutPage() {
  const router = useRouter();

  // Executar logout ao carregar a página
  useEffect(() => {
    const performLogout = async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
        });
      } catch (error) {
        console.error("Erro ao fazer logout:", error);
      }
    };

    performLogout();
  }, []);

  const handleBackToLogin = () => {
    router.push("/login");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/img/login.png"
          alt="Background"
          fill
          priority
          className="object-cover"
          quality={100}
        />
        {/* Green Overlay */}
        <div className="absolute inset-0 bg-rer-green/80 backdrop-blur-sm" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4 py-6">
        <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-white/30 shadow-2xl p-6 md:p-8">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rer-green/20 border-4 border-rer-green shadow-lg">
              <CheckCircle2 className="h-10 w-10 text-rer-green" strokeWidth={2.5} />
            </div>
          </div>

          {/* Message */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Até logo!
            </h1>
            <p className="text-base text-gray-700 mb-1.5">
              Obrigado por usar o <span className="font-semibold text-rer-green">EsferaORDO</span>
            </p>
            <p className="text-sm text-gray-600">
              Você foi desconectado com sucesso do sistema.
            </p>
          </div>

          {/* Decorative Element */}
          <div className="mb-6 flex justify-center">
            <div className="h-1 w-20 rounded-full bg-gradient-to-r from-rer-green/0 via-rer-green to-rer-green/0" />
          </div>

          {/* Additional Message */}
          <div className="bg-rer-green/10 border border-rer-green/30 rounded-xl p-4 mb-6">
            <p className="text-center text-sm text-gray-700">
              Que a Luz continue a guiar seus passos.
              <br />
              Até a próxima sessão!
            </p>
          </div>

          {/* Back to Login Button */}
          <Button
            onClick={handleBackToLogin}
            className="w-full bg-rer-green hover:bg-rer-green/90 text-white h-10 text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Voltar ao Login
          </Button>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} EsferaORDO - Sistema de Gestão RER
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
