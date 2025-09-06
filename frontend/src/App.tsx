import { Switch, Route } from "wouter";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Comparator from "./pages/Comparator";
import { useEffect, useState } from "react";
import { AuthProvider } from "./utils/auth-middleware";
import { useNavigate } from "react-router-dom";


export function ProtectedRoute() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3000/api/auth/status", {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        setAuthenticated(data.authenticated);
        if (!data.authenticated) {
          navigate("/login"); // redirect if not logged in
        }
      })
      .catch(() => navigate("/login"))
      .finally(() => setLoading(false));
  }, [navigate]);

  return { loading, authenticated };
}



function Router() {
    return (
        <Layout>
            <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/calendar" component={Calendar} />
                <Route path="/comparator" component={Comparator} />
            </Switch>
        </Layout>
    )
}

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}


export default App;