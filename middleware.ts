import { NextResponse } from "next/server";
import { JWT_TOKEN, USER } from "./services/tools/constants";
import { verifyAuth } from "./lib/auth";

const publicRoutes = ["/"];
// Noms de profil (Profile.name) portés par le jeton. Les rôles du workflow
// s'ajoutent aux profils historiques. Ce filtrage n'est qu'un confort de
// navigation : chaque route d'API recontrôle la permission côté serveur.
const ADMINISTRATION = ["SUPER_ADMIN", "ADMINISTRATOR"];
const VALIDATORS = ["VALIDATOR_1", "VALIDATOR_2", "VALIDATOR_3", "VALIDATOR_4"];
const ARTCI_READERS = [...ADMINISTRATION, "SUPERVISOR", ...VALIDATORS];
const BACK_OFFICE = [...ARTCI_READERS, "OPERATOR"];

/**
 * Code de profil (stable) -> nom de profil attendu ci-dessous.
 * Le nom d'un profil peut être modifié en base ; le code, non. On autorise
 * donc d'abord par le code (même référentiel que services/rbac/roles.js),
 * le nom ne servant plus que de repli pour un profil inconnu.
 */
const CODE_TO_PROFILE: Record<string, string> = {
  "PRF-SUPERADMIN": "SUPER_ADMIN",
  "PRF0-TEST": "ADMINISTRATOR",
  "PRF1-TEST": "SUPERVISOR",
  "PRF-VAL1": "VALIDATOR_1",
  "PRF-VAL2": "VALIDATOR_2",
  "PRF-VAL3": "VALIDATOR_3",
  "PRF-VAL4": "VALIDATOR_4",
  "PRF2-TEST": "OPERATOR",
  "PRF3-TEST": "CLIENT",
};

const profileOf = (verifyToken) =>
  CODE_TO_PROFILE[verifyToken?.profile?.code] || verifyToken?.profile?.name || null;

/** Page d'arrivée d'un utilisateur connecté qui revient sur /admin-auth. */
const homeOf = (profile) => {
  if (profile === "OPERATOR") return "/operator-dashboard";
  if (ARTCI_READERS.includes(profile)) return "/admin-dashboard";
  return "/";
};

const profileProtectedRoutes: Record<string, string[]> = {
  "/admin-dashboard": ARTCI_READERS,
  // Gestion des notifications : administration seule (le superviseur, qui
  // partage le menu d administration, en est exclu). La route d API applique
  // le meme controle.
  "/admin-notifications": ADMINISTRATION,
  // Journal d'activité de toute la plateforme : administration seule. La route
  // d'API (/api/admin/activity) exige la permission AUDIT_READ.
  "/admin-activity": ADMINISTRATION,
  // Assistant IA ARTCI et base documentaire : agents de l'ARTCI (les routes
  // d'API exigent KNOWLEDGE_READ, et KNOWLEDGE_MANAGE pour alimenter la base).
  "/admin-artci-assistant": ARTCI_READERS,
  // Statistiques détaillées : lecture ARTCI. Sans cette ligne, la page
  // resterait accessible à tout compte authentifié, opérateurs compris.
  "/admin-statistics": ARTCI_READERS,
  "/admin-create-offer": [...ADMINISTRATION, ...VALIDATORS],
  "/admin-validation": ARTCI_READERS,
  "/admin-list-offer": ARTCI_READERS,
  "/admin-offer-list": ARTCI_READERS,
  "/admin-monitoring": [...ADMINISTRATION, ...VALIDATORS],
  "/admin-user": ADMINISTRATION,
  "/admin-operator": ADMINISTRATION,
  "/admin-areas": ADMINISTRATION,
  "/admin-countries": ADMINISTRATION,
  "/admin-organizations": ADMINISTRATION,
  // Fiche de workflow d'une offre : tout le back-office (l'API limite le point
  // focal à son opérateur).
  "/offer-workflow": BACK_OFFICE,

  "/operator-profile": ["OPERATOR"],
  "/operator-dashboard": ["OPERATOR"],
  "/operator-create-offer": ["OPERATOR"],
  "/operator-list-offer": ["OPERATOR"],
  // Assistant réglementaire : tout le back-office.
  "/admin-assistant": BACK_OFFICE,
  // Journal d'activité du point focal (ses offres uniquement).
  "/operator-activity": ["OPERATOR"],
  "/account": [...BACK_OFFICE, "CLIENT"],
};

export async function middleware(req) {
  const token = req.cookies.get(JWT_TOKEN)?.value;
  const verifyToken = token ? await verifyAuth(token).catch(() => null) : null;
  const response = route(req, verifyToken, Boolean(token));
  // Jeton présent mais invalide (expiré, ancien format) : effacé, sans quoi il
  // était renvoyé à chaque requête et bloquait la reconnexion.
  if (token && !verifyToken) response.cookies.delete(JWT_TOKEN);
  return response;
}

function route(req, verifyToken, hadToken) {
  const { pathname } = req.nextUrl;

  //console.log('T22222222',verifyToken)

  // Si l'utilisateur est sur /login et n'est pas authentifié, on le laisse accéder
  if ((pathname.startsWith("/admin-auth")) && !verifyToken) {
    return NextResponse.next();
  }

  // console.log("VERYFFFF ===>", verifyToken);

  if (!verifyToken?.profile) {
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/operator") ||
      pathname.startsWith("/supervisor") ||
      pathname.startsWith("/offer-workflow") ||
      pathname.startsWith("/account")
    ) {
      // Pas de session (ou session expirée) : vers la page de connexion
      // adaptée plutôt que vers l'accueil.
      const loginPage = pathname.startsWith("/account") ? "/login" : "/admin-auth";
      return NextResponse.redirect(new URL(hadToken ? `${loginPage}?session=expiree` : loginPage, req.url));
    }
  }
  // localStorage.setItem(USER,verifyToken?.userId);
  // console.log('T11111ZZZ111',verifyToken?.profile?.code)

  // Déjà connecté et de retour sur la page de connexion : vers son espace.
  if (pathname.startsWith("/admin-auth")) {
    return NextResponse.redirect(new URL(homeOf(profileOf(verifyToken)), req.url));
  }

  // Récupérer le rôle de l'utilisateur
  const userProfile = profileOf(verifyToken);

  // Vérifier si la route est protégée et si le rôle est autorisé
  for (const route in profileProtectedRoutes) {
    if (pathname.startsWith(route)) {
      const allowedRoles = profileProtectedRoutes[route];
      if (!allowedRoles.includes(userProfile)) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      return NextResponse.next();
    }
  }

  // Si aucune restriction, on continue
  return NextResponse.next();
}

/**
 * Portée du middleware.
 *
 * `config` était déclaré À L'INTÉRIEUR de la fonction : il n'était donc pas
 * exporté et le middleware s'exécutait sur CHAQUE requête, y compris les
 * routes d'API (qui contrôlent déjà la session côté serveur), les fichiers
 * statiques et les images. Il ne s'applique désormais qu'aux pages.
 */
export const config = {
  // Toutes les pages, sauf les routes d'API (protégées côté serveur), les
  // ressources Next, les fichiers statiques et les images.
  matcher: ["/((?!api|_next/static|_next/image|assets|images|uploads|favicon.ico|robots.txt).*)"],
};

/*
import { NextRequest, NextResponse } from 'next/server';
// import { verifyToken } from './services/config/api/jwt';
import { JWT_TOKEN } from './services/tools/constants';
import { verifyAuth } from './lib/auth';


const publicRoutes = ["/login", "/signup", "/"]
const profileProtectedRoutes = {
  "/admin-dashboard": ["ADMIN"],
  "/operator-dashboard": ["OPERATOR"],
  "/supervisor-dashboard": ["ADMIN", "OPERATOR"],
  "/admin-map-limits": ["ADMIN"],
  "/admin-coverage-data": ["ADMIN"],
  "/operator-coverage": ["OPERATOR"],
  "/admin-operators": ["ADMIN"],
  "/admin-newsletters": ["ADMIN"],
  "/profile-settings": ["ADMIN", "OPERATOR", "CLIENT"]
}

export async function middleware(req:NextRequest) {
    const { pathname } = req.nextUrl;
    // const isProtectedRoute = protectedRoutes.includes(path)
    // const isPublicRoute = publicRoutes.includes(path)

    const token = req.cookies.get(JWT_TOKEN)?.value;

    const verifyToken = await verifyAuth(token).catch((err) => {
        // console.log(err);
    });



    if (pathname.startsWith('/login') && !verifyToken) {
        return NextResponse.next();
    }

    //cRYNIjFQzh

    if (pathname.startsWith('/login') && verifyToken ) {
        return NextResponse.redirect(new URL('/admin-dashboard', req.url));
    }

    if(!verifyToken){
        return NextResponse.redirect(new URL('/login', req.url));
    }

    if (pathname.startsWith('/admin') && verifyToken) {
        // console.log('//////// ===>', token)
        return NextResponse.next();
    }
    if (pathname.startsWith('/operator') && verifyToken) {
        // console.log('//////// ===>', token)
        // return NextResponse.next();
    }
}

export const config = {
    matcher:[
        '/login',
        '/admin-map-limits',
        '/admin-dashboard',
        '/operator-dashboard',
        '/admin-coverage-data',
        // '/map-limits'
        '/operator-coverage',
        '/admin-operators',
        '/supervisor-dashboard',
        '/admin-newsletters',
        '/profile-settings',

    ]
}
    */
