import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isAuthChecking } = useWallet();
  const location = useLocation();

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#F8F8FC] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#176B4A] animate-spin" />
          <p className="text-xs font-semibold text-[#5F6878]">
            Verifying workspace credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnToParam = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?returnTo=${returnToParam}`} replace />;
  }

  return <>{children}</>;
}
