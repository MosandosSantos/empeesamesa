"use client";

import { useEffect, useState } from "react";

export function useRoleGuard(
  canAccess: (role: string | null) => boolean,
  message: string
) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkRole = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          if (mounted) {
            setError("Nao autorizado.");
            setLoading(false);
          }
          return;
        }

        const data = await response.json();
        const role = data?.user?.role ?? null;
        if (!canAccess(role)) {
          if (mounted) {
            setError(message);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setError("Nao foi possivel validar a permissao.");
          setLoading(false);
        }
      }
    };

    checkRole();
    return () => {
      mounted = false;
    };
  }, [canAccess, message]);

  return { error, loading };
}
