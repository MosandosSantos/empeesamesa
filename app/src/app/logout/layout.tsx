import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Logout - EsferaORDO",
  description: "Você foi desconectado com sucesso",
};

export default function LogoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
