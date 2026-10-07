import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { forgetAuthUser, getAuthUser, loginApiService, logoutApi } from '../../services/api/auth/authApiService'
import { getOperators } from '../api/client/operators/operatorsApiServices';
import { JWT_TOKEN } from '../tools/constants';
import { toastSuccess } from '@/componnents/notification/notification';
import PageLoader from '@/componnents/Loader/PageLoader';
import { getServices } from '../api/services/servicesApiServices';
import { getCountries } from '../api/countries/countriesApiServices';

const AdminContext = createContext();

/** Pages de l'espace de gestion (une session valide y est indispensable). */
const BACK_OFFICE_PREFIXES = ["/admin", "/operator", "/supervisor", "/offer-workflow", "/account", "/profile-settings"];
const isBackOfficePath = (path = "") =>
  !path.startsWith("/admin-auth") && BACK_OFFICE_PREFIXES.some((p) => path.startsWith(p));

export const useAdmin = () => useContext(AdminContext);

export const AdminProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [operators, setOperators] = useState(null);
  // const [technologies, setTechnologies] = useState(null);

  const [closeSideBar, setCloseSideBar] = useState(false);
  const [sideControl, setSideControl] = useState(null);
  const [showSideBar, setShowSideBar] = useState(null);

  const [services, setServices] = useState(null);
  const [countries, setCountries] = useState(null);
  // Référentiels chargés (avec succès ou non) : l'application peut s'afficher.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Charger les données utilisateur (par ex., à partir du localStorage, cookie ou API)
    init();
  }, []);

  useEffect(() => {
  }, [user])

  const init = async () => {
    const _s = { ...showSideBar }
    _s['collection'] = true;
    _s['showArea'] = true;
    setShowSideBar(_s);

    // Référentiels en parallèle. Un échec (serveur injoignable, base vide…)
    // donne une liste vide : auparavant l'application entière restait blanche,
    // comparateur compris, tant que ces trois appels n'avaient pas abouti.
    const asList = (v) => (Array.isArray(v) ? v : []);
    const [_service, _countries, _operators] = await Promise.all([
      getServices().catch(() => null),
      getCountries().catch(() => null),
      getOperators().catch(() => null),
    ]);
    setServices(asList(_service));
    setCountries(asList(_countries));
    setOperators(asList(_operators));
    setReady(true);

    let hadToken = false;
    try {
      hadToken = !!localStorage.getItem(JWT_TOKEN);
    } catch {
      hadToken = false;
    }
    const _usr = await getAuthUser().catch(() => null);
    if (_usr) {
      setUser(_usr);
    } else if (hadToken && isBackOfficePath(router.pathname)) {
      // Session périmée (base réinitialisée, compte désactivé, jeton expiré) :
      // les pages s'ouvraient mais aucune donnée ne se chargeait.
      router.replace("/admin-auth?session=expiree");
    }
  }

  const handleShowSideBar = (name, value) => {
    const _s = { ...showSideBar }
    _s[name] = value;
    setShowSideBar(_s);
  }

  const login = async (email, password) => {
    if (email.trim()) {
      if (password.trim()) {
        const response = await loginApiService(user)
        if (response?.error === false) {
          toastSuccess("Connexion reussi!");
          setUser(response.user);
          router.replace("/");
          router.reload();
        } else {
          toastWarning(response?.message);
        }
      }
    } else {
      toastWarning("Veuillez saisir un email valide");
    }
  }

  const logout = async () => {
    // Logique de déconnexion ici (suppression du token, etc.)
    const res = await logoutApi();
    if (res.error == false) {
      localStorage.removeItem(JWT_TOKEN);
      forgetAuthUser();
      setUser(null);
      toastSuccess('Vous êtes déconnecté !');
      router.replace("/");
    }
  };

  if (ready) {
    return (
      <AdminContext.Provider value={{
        user,
        setUser,
        loading, 
        login,
        logout,
        operators,
        showSideBar,
        setShowSideBar,
        handleShowSideBar,
        services,
        countries
      }}
      >
        {children}
      </AdminContext.Provider>
    );
  }
  // Référentiels en cours de chargement : attente identifiée plutôt qu'un
  // écran blanc (l'application n'affichait rien du tout).
  return <PageLoader title="Préparation de votre espace…" hint="Chargement des opérateurs et des référentiels." />;
}
