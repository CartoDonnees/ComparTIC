'use client'
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuthSupervisor, loginApiService, logoutApi } from '../api/auth/authApiService'
import { JWT_TOKEN } from '../tools/constants';
import { toastSuccess } from '@/componnents/notification/notification';
import { getOperators } from '../api/client/operators/operatorsApiServices';

const SupervisorContext = createContext();

export const useSupervisor = () => useContext(SupervisorContext);

export const SupervisorProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [operators, setOperators] = useState(null);

  useEffect(() => {
    // Charger les données utilisateur (par ex., à partir du localStorage, cookie ou API)
    init();
  }, []);

  const init = async () => {
    const _operators = await getOperators();
    setOperators(_operators);
  }
  // useEffect(() => {
  // }, [user])

  const login = async (email, password) => {
    if (user) {
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
  }

  const logout = async () => {
    // Logique de déconnexion ici (suppression du token, etc.)
    const res = await logoutApi();
    if (res.error == false) {
      localStorage.removeItem(JWT_TOKEN);
      setUser(null);
      toastSuccess('Vous êtes déconnecté !');
      router.replace("/");
    }
  };

  return (
    <SupervisorContext.Provider value={{
      user,
      setUser,
      loading,
      login,
      logout,
      operators,
    }}
    >
      {children}
    </SupervisorContext.Provider>
  );

}
