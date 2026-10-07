"use client";

import React from "react";
import ProfilePage from "@/componnents/screens/admin/profile/ProfilePage";

/** « Mon profil » de l'opérateur : la page de profil commune, dans sa version opérateur. */
export default function OperatorProfilePage() {
  return <ProfilePage variant="operator" />;
}
