import { NextResponse } from "next/server";
import { verifyToken } from "./jwt";

export function middleware(req) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies['auth-token'];

  if (!token) {
    return NextResponse.redirect('/admin-auth');
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return NextResponse.redirect('/admin-auth');
  }

  return NextResponse.next();

  // return async (req, res) => {
  //   const token = req.headers.authorization?.split(' ')[1];

  //   if (!token) {
  //     return res.status(401).json({ message: 'Authentication token is missing' });
  //   }

  //   const decodedToken = verifyToken(token);

  //   if (!decodedToken) {
  //     return res.status(401).json({ message: 'Invalid or expired token' });
  //   }

  //   // Attach the user data to the request object
  //   req.user = decodedToken;

  //   return handler(req, res);
  // };
};