"use client";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  forgetAuthUser,
  getAuthUser,
  loginApiService,
  logoutApi,
} from "../api/auth/authApiService";
import { JWT_TOKEN } from "../tools/constants";
import {
  toastSuccess,
  toastWarning,
} from "@/componnents/notification/notification";
import { getClientOperators } from "../api/client/operators/operatorsApiServices";
import PageLoader from "@/componnents/Loader/PageLoader";

const ClientContext = createContext({
  selectedSemester: null,
  setSelectedSemester: () => {},
});

export const useClient = () => useContext(ClientContext);

export const ClientProvider = (props) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [operators, setOperators] = useState(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    // Un échec (serveur injoignable, base vide) donne une liste vide : sans
    // cela, ce fournisseur ne rendait RIEN et toute l'application  - pages
    // publiques comprises  - restait blanche.
    const _operators = await getClientOperators().catch(() => null);
    setOperators(Array.isArray(_operators) ? _operators : []);
    await getUsr();
  };

  const getUsr = async () => {
    try {
      const _usr = await getAuthUser();
      setUser(_usr);
    } catch (error) {
      console.error("Erreur lors de la récupération des données :", error);
    }
  };

  const login = async (email, password) => {
    if (email.trim()) {
      if (password.trim()) {
        const response = await loginApiService(user);
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
  };

  const logout = async () => {
    // Logique de déconnexion ici (suppression du token, etc.)
    const res = await logoutApi();
    if (res.error == false) {
      localStorage.removeItem(JWT_TOKEN);
      forgetAuthUser();
      setUser(null);
      toastSuccess("Vous êtes déconnecté !");
      router.replace("/");
    }
  };

  if (operators !== null) {
    return (
      <ClientContext.Provider
        value={{
          user,
          setUser,
          loading,
          login,
          logout,
          operators,
        }}
      >
        {props.children}
      </ClientContext.Provider>
    );
  }
  return <PageLoader title="Chargement de la plateforme…" hint="Récupération des opérateurs et des offres publiées." />;
};
