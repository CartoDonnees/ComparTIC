import React, { useEffect, useState } from "react";
import { BASE_IMG_URL } from "@/services/tools/constants";

/**
 * Logo d'un opérateur, avec repli.
 *
 * Les fichiers référencés en base peuvent manquer (reprise de données, fichier
 * supprimé du serveur) : une image cassée s'affichait alors. À défaut
 * d'image, les initiales de l'opérateur sont montrées dans sa couleur.
 *
 * @param operator { name, color, imagePath }
 * @param size     côté du carré, en pixels
 */
export default function OperatorLogo({ operator, size = 36, className = "", rounded = 10 }) {
  const [failed, setFailed] = useState(false);
  const path = operator?.imagePath;

  // Nouvel opérateur (ou logo remplacé) : on retente l'affichage.
  useEffect(() => setFailed(false), [path]);

  const color = operator?.color || "#475569";
  const initials = (operator?.name || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const style = {
    "--op": color,
    width: size,
    height: size,
    borderRadius: rounded,
    color,
    fontSize: Math.max(10, Math.round(size / 3)),
  };

  return (
    <span className={`oplogo ${className}`} style={style} title={operator?.name || ""}>
      {path && !failed ? (
        <img src={BASE_IMG_URL + encodeURIComponent(path)} alt="" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}
