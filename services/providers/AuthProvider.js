import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { JWT_TOKEN } from '../tools/constants';
import { loginApiService } from '../api/auth/authApiService';
import { toastError, toastSuccess } from '@/components/notification/notification';

const AuthContext = createContext({
    user: null,
    isAuthenticated: false,
    login: () => { },
    logout: () => { },
});

const AuthProvider = ({ children }) => {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null); 

    const login = async (userData) => {
        const { email, password } = userData;
        if (email.trim() && password.trim()) {
            const data = await loginApiService(email, password);
            if (data?.id) {
                setUser(data);
                toastSuccess('Connexion reussi!');
                router.reload();
            }
            else {
                toastError('Echec de l\'authentification');
                router.push('/admin-auth')
            }
        }
    }
    // Logique de connexion ici (appel à une API, stockage du token, etc.)

};

const logout = () => {
    // Logique de déconnexion ici (suppression du token, etc.)
    localStorage.removeItem(JWT_TOKEN);
    setUser(null);
    setIsAuthenticated(false);
};

return (
    <AuthContext.Provider value={{ user,setUser, login, logout }}>
        {children}
    </AuthContext.Provider>

);

export function useAuth() {
    return useContext(AuthContext);
}
