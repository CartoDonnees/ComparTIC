import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || env("JWT_SECRET");

export function signToken(payload) {
  return jwt.sign(payload, secret, { expiresIn: '10h' });
}

export function verifyToken(token) {
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, secret)

    if (!decoded.profile.code) {
      throw new Error("Rôle non défini dans le token.")
    }

    return decoded // Retourne l'objet { id, role }
  } catch (error) {
    console.error("Erreur de vérification du token:", error)
    return null
  }
  
  // try {
  //   return jwt.verify(token, secret);
  // } catch (error) {
  //   console.error('Token verification error:', error);
  //   return null;
  // }
}