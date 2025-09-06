import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
}

const defaultAuthContext: AuthContextType = {
  isAuthenticated: false,
  loading: true,
};

// Define the context with a default value
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}): React.ReactNode => {
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    fetch("http://localhost:3999/api/auth/me", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setIsAuthenticated(data.isAuthenticated);
      })
      .catch(() => setIsAuthenticated(false))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};