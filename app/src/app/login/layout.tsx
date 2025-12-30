import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - EsferaORDO",
  description: "Faça login no sistema EsferaORDO",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
