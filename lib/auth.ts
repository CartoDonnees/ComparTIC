import { jwtVerify } from "jose"

interface UserJwtPayload{
    jti:string,
    iat:number
}

export const getJwtSecretKey = () => {
    const secret = process.env.JWT_SECRET;

    if(!secret || secret?.length === 0){
        throw new Error("The environment variable JWT_SECRET is not set");
        
    }
    return secret;
}

export const verifyAuth = async (token:string) => {
    try {
        const verified = await jwtVerify(token,new TextEncoder().encode(getJwtSecretKey()))
        const { profile, userCode } = verified.payload as { profile?: string; userCode?: string };
        if (!profile) {
            throw new Error("Le rôle est manquant dans le token.");
        }
        // Jeton non lié à un compte (émis avant cette version) : refusé.
        if (!userCode) {
            throw new Error("Jeton sans identifiant de compte.");
        }
        return {
            verify: verified.payload as UserJwtPayload,
            profile
        }
    } catch (error) {
        throw new Error("Your tokenn is expired");
        return null;
        
    }
}