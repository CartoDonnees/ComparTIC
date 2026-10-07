import { getClientOperators } from "@/services/api/client/operators/operatorsApiServices";
import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import React, { useEffect, useMemo, useState } from "react";

/**
 * Bandeau des opérateurs partenaires.
 *
 * Remplace l'ancien <Carousel> PrimeReact (défilement par pas, saccadé) par un
 * marquee CSS continu et fluide :
 *  - défilement infini sans à-coups (piste dupliquée + translation -50%)
 *  - pause au survol
 *  - fondu (mask) sur les bords gauche/droit
 *  - cartes modernes (survol : légère élévation)
 *  - respecte prefers-reduced-motion (arrêt de l'animation + retour à la ligne)
 */
export default function ClientPartnerPage() {
  const [operators, setOperators] = useState(null);

  useEffect(() => {
    initF();
  }, []);

  const initF = async () => {
    if (!operators) {
      const _operators = await getClientOperators();
      setOperators(_operators);
    }
  };

  // Construit une piste suffisamment longue puis la duplique pour un
  // défilement continu (la translation -50% recouvre exactement une moitié).
  const { track, duration } = useMemo(() => {
    if (!operators || operators.length === 0) return { track: [], duration: 0 };
    const base = [];
    // Répète les opérateurs jusqu'à avoir assez d'éléments pour remplir l'écran
    while (base.length < Math.max(8, operators.length * 2)) base.push(...operators);
    // Vitesse constante : ~2.8s par élément de la demi-piste
    return { track: [...base, ...base], duration: base.length * 2.8 };
  }, [operators]);

  const OperatorCard = ({ operator }) => (
    <div className="pm-item">
      <div className="pm-card">
        <img
          src={imageUrl(operator?.imagePath)}
          alt={operator?.name || "Opérateur"}
          className="pm-logo"
          loading="lazy"
        />
        <div className="pm-name">{operator?.name}</div>
      </div>
    </div>
  );

  return (
    <section className="pb-2 pt-2 pt-sm-3 pt-md-4 bg-light trans-fb">
      <style>{`
        .pm-wrap { position: relative; overflow: hidden; padding: 8px 0; }
        /* Fondu progressif sur les bords */
        .pm-wrap {
          -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 8%, #000 92%, transparent 100%);
                  mask-image: linear-gradient(90deg, transparent 0, #000 8%, #000 92%, transparent 100%);
        }
        .pm-track {
          display: flex;
          width: max-content;
          gap: 20px;
          will-change: transform;
          animation: pm-scroll linear infinite;
        }
        .pm-wrap:hover .pm-track { animation-play-state: paused; }
        @keyframes pm-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .pm-item { flex: 0 0 auto; }
        .pm-card {
          width: 190px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 22px 18px;
          background: #fff;
          border: 1px solid #eceff3;
          border-radius: 8px;
          box-shadow: 0 1px 2px rgba(16,24,40,.04), 0 1px 3px rgba(16,24,40,.06);
          transition: transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s cubic-bezier(.4,0,.2,1), border-color .25s;
        }
        .pm-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 28px rgba(16,24,40,.14);
          border-color: #e0e4ea;
        }
        .pm-logo {
          height: 64px;
          max-width: 130px;
          object-fit: contain;
        }
        .pm-name {
          font-size: 15px;
          font-weight: 700;
          color: #1a1d21;
          letter-spacing: .2px;
        }
        /* Skeleton de chargement */
        .pm-skeleton {
          width: 190px; height: 138px; flex: 0 0 auto;
          border-radius: 16px;
          background: linear-gradient(90deg,#eef0f3 25%,#e2e5ea 37%,#eef0f3 63%);
          background-size: 400% 100%;
          animation: pm-shimmer 1.4s ease infinite;
        }
        @keyframes pm-shimmer { 0%{background-position:100% 0} 100%{background-position:0 0} }

        @media (prefers-reduced-motion: reduce) {
          .pm-wrap { -webkit-mask-image: none; mask-image: none; }
          .pm-track { animation: none; flex-wrap: wrap; justify-content: center; width: auto; }
          .pm-card:hover { transform: none; }
          .pm-skeleton { animation: none; }
        }
      `}</style>

      <div className="container pb-4 mb-2 mb-lg-3">
        <h2 className="h1 text-center">Les opérateurs</h2>
        <div className="container py-lg-6">
          {operators ? (
            <div className="pm-wrap">
              <div
                className="pm-track"
                style={{ animationDuration: `${duration}s` }}
              >
                {track.map((operator, i) => (
                  <OperatorCard operator={operator} key={"pm" + i} />
                ))}
              </div>
            </div>
          ) : (
            // État de chargement : quelques cartes en skeleton
            <div className="pm-wrap">
              <div className="pm-track" style={{ animation: "none" }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div className="pm-skeleton" key={"pms" + i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
