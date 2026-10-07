import React from "react";
// import "@/styles/Monitoring.module.css";

export default function AdminMonitoringStatistics() {
  return (
    <div>

      <>
        <div className="wrapper">
          {/* ══ KPI STRIP ══ */}
          <div className="kpi-strip">
            <div className="card kpi-card">
              <div
                className="kpi-bar"
                style={{
                  background: "linear-gradient(90deg,var(--green),transparent)",
                }}
              />
              <div className="kpi-label">Total Monitorings</div>
              <div className="kpi-value">12,3M</div>
              <div className="kpi-footer">
                <span className="kpi-delta" style={{ color: "var(--green)" }}>
                  +8,2%
                </span>
                <span className="kpi-period">vs M-1</span>
              </div>
            </div>
            <div className="card kpi-card">
              <div
                className="kpi-bar"
                style={{
                  background: "linear-gradient(90deg,var(--amber),transparent)",
                }}
              />
              <div className="kpi-label">ARPU Moyen</div>
              <div
                className="kpi-value"
                style={{ fontSize: "1.2rem", paddingTop: 3 }}
              >
                4 820 FCFA
              </div>
              <div className="kpi-footer">
                <span className="kpi-delta" style={{ color: "var(--green)" }}>
                  +3,1%
                </span>
                <span className="kpi-period">vs M-1</span>
              </div>
            </div>
            <div className="card kpi-card">
              <div
                className="kpi-bar"
                style={{
                  background: "linear-gradient(90deg,var(--green),transparent)",
                }}
              />
              <div className="kpi-label">Taux de Churn</div>
              <div className="kpi-value">2,74%</div>
              <div className="kpi-footer">
                <span className="kpi-delta" style={{ color: "var(--green)" }}>
                  −0,3pt
                </span>
                <span className="kpi-period">vs M-1</span>
              </div>
            </div>
            <div className="card kpi-card">
              <div
                className="kpi-bar"
                style={{
                  background: "linear-gradient(90deg,var(--cyan),transparent)",
                }}
              />
              <div className="kpi-label">NPS Global</div>
              <div className="kpi-value">61</div>
              <div className="kpi-footer">
                <span className="kpi-delta" style={{ color: "var(--green)" }}>
                  +4 pts
                </span>
                <span className="kpi-period">vs M-1</span>
              </div>
            </div>
          </div>
          {/* ══ MAIN GRID ══ */}
          <div className="main-grid">
            {/* LEFT */}
            <div className="left-col">
              {/* OFFERS TABLE */}
              <div
                className="card"
                style={{ animation: "fadeUp .5s .2s ease both" }}
              >
                <div className="card-pad" style={{ paddingBottom: 12 }}>
                  <span className="sec-label">Offres de télécommunication</span>
                  <span className="sec-sub">· Surveillance en temps réel</span>
                  <div
                    className="filter-bar"
                    style={{ marginTop: 14, marginBottom: 0 }}
                  >
                    <button
                      className="filter-btn active"
                      onclick="filterTable(this,'Tous')"
                    >
                      Tous
                    </button>
                    <button
                      className="filter-btn"
                      onclick="filterTable(this,'Mobile')"
                    >
                      Mobile
                    </button>
                    <button
                      className="filter-btn"
                      onclick="filterTable(this,'Fibre')"
                    >
                      Fibre
                    </button>
                    <button
                      className="filter-btn"
                      onclick="filterTable(this,'Box 4G')"
                    >
                      Box 4G
                    </button>
                    <button
                      className="filter-btn"
                      onclick="filterTable(this,'B2B')"
                    >
                      B2B
                    </button>
                    <span className="filter-count" id="filterCount">
                      7 offres
                    </span>
                  </div>
                </div>
                <div className="offers-table">
                  <div className="table-head">
                    <div className="th">Offre</div>
                    <div className="th">Opérateur</div>
                    <div className="th">Type</div>
                    <div className="th">Prix / mois</div>
                    <div className="th">Abonnés</div>
                    <div className="th">Churn</div>
                    <div className="th">Tendance</div>
                    <div className="th">Statut</div>
                  </div>
                  <div className="table-body" id="tableBody">
                    {/* rows injected by JS */}
                  </div>
                </div>
                {/* DETAIL PANEL */}
                <div className="detail-panel detail-hidden" id="detailPanel">
                  <div className="detail-top">
                    <div>
                      <div className="detail-title" id="dTitle">
                         
                      </div>
                      <div className="detail-op" id="dOp">
                         
                      </div>
                    </div>
                    <button className="close-btn" onclick="closeDetail()">
                      ✕ Fermer
                    </button>
                  </div>
                  <div className="detail-metrics" id="dMetrics" />
                  <div className="detail-trend">
                    <div className="dt-label">Évolution abonnés   12 mois</div>
                    <div className="detail-spark" id="dSpark" />
                  </div>
                </div>
              </div>
              {/* REVENUE CHART */}
              <div
                className="card revenue-card"
                style={{ animation: "fadeUp .5s .35s ease both" }}
              >
                <span className="sec-label">Chiffre d'affaires mensuel</span>
                <span className="sec-sub">· FCFA (Milliards)</span>
                <div className="rev-chart" id="revChart" />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(12,1fr)",
                    gap: 6,
                    marginTop: 0,
                  }}
                  id="revLabels"
                />
              </div>
            </div>
            {/* RIGHT */}
            <div className="right-col">
              {/* MARKET SHARE DONUT */}
              <div
                className="card donut-card"
                style={{ animation: "fadeUp .5s .25s ease both" }}
              >
                <span className="sec-label">Parts de marché</span>
                <span className="sec-sub">· Opérateurs CI</span>
                <div className="donut-inner" style={{ marginTop: 14 }}>
                  <div>
                    <svg
                      width={140}
                      height={140}
                      viewBox="0 0 140 140"
                      id="donutSvg"
                    >
                      {/* injected */}
                    </svg>
                  </div>
                  <div className="donut-legend" id="donutLegend" />
                </div>
              </div>
              {/* NPS GAUGE */}
              <div
                className="card nps-card"
                style={{ animation: "fadeUp .5s .3s ease both" }}
              >
                <span className="sec-label">Satisfaction client</span>
                <span className="sec-sub">· NPS</span>
                <div className="nps-inner">
                  <svg
                    width={180}
                    height={100}
                    viewBox="0 0 180 100"
                    id="npsGauge"
                  />
                  <div className="nps-segments">
                    <div className="nps-seg">
                      <div className="seg-val" style={{ color: "var(--red)" }}>
                        12%
                      </div>
                      <div className="seg-label">Détracteurs</div>
                    </div>
                    <div className="nps-seg">
                      <div
                        className="seg-val"
                        style={{ color: "var(--yellow)" }}
                      >
                        27%
                      </div>
                      <div className="seg-label">Passifs</div>
                    </div>
                    <div className="nps-seg">
                      <div
                        className="seg-val"
                        style={{ color: "var(--green)" }}
                      >
                        61%
                      </div>
                      <div className="seg-label">Promoteurs</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* GROWTH BARS */}
              <div
                className="card growth-card"
                style={{ animation: "fadeUp .5s .35s ease both" }}
              >
                <span className="sec-label">Croissance abonnés</span>
                <span className="sec-sub">· 12 mois</span>
                <div className="bar-list" id="growthBars" />
              </div>
            </div>
          </div>
          {/* ══ BOTTOM ROW ══ */}
          <div className="bottom-row">
            {/* HEATMAP */}
            <div
              className="card heatmap-card"
              style={{ animation: "fadeUp .5s .4s ease both" }}
            >
              <span className="sec-label">Activité réseau</span>
              <span className="sec-sub">· Saturation hebdomadaire (%)</span>
              <div className="hm-grid" id="hmGrid" />
              <div className="hm-labels" id="hmLabels" />
            </div>
            {/* ALERTS */}
            <div
              className="card alerts-card"
              style={{ animation: "fadeUp .5s .45s ease both" }}
            >
              <span className="sec-label">Alertes &amp; Signaux</span>
              <div style={{ marginTop: 14 }}>
                <div className="alert-item">
                  <div className="alert-icon">🔴</div>
                  <div className="alert-body">
                    <div className="alert-text urgent">
                      Churn Telecel CI dépasse 5%   action urgente requise
                    </div>
                    <div className="alert-time">il y a 2h</div>
                  </div>
                </div>
                <div className="alert-item">
                  <div className="alert-icon">🔴</div>
                  <div className="alert-body">
                    <div className="alert-text urgent">
                      Réclamations MTN +12%   enquête en cours
                    </div>
                    <div className="alert-time">il y a 3h</div>
                  </div>
                </div>
                <div className="alert-item">
                  <div className="alert-icon">🟡</div>
                  <div className="alert-body">
                    <div className="alert-text">
                      Moov StarMobile : croissance négative −2,1% au Q1
                    </div>
                    <div className="alert-time">il y a 5h</div>
                  </div>
                </div>
                <div className="alert-item">
                  <div className="alert-icon">🟡</div>
                  <div className="alert-body">
                    <div className="alert-text">
                      Box 4G+ MTN : churn en hausse (+0,8pt)
                    </div>
                    <div className="alert-time">il y a 8h</div>
                  </div>
                </div>
                <div className="alert-item">
                  <div className="alert-icon">🟢</div>
                  <div className="alert-body">
                    <div className="alert-text">
                      Fibre Orange : +34% abonnés, objectif T2 atteint
                    </div>
                    <div className="alert-time">il y a 10h</div>
                  </div>
                </div>
                <div className="alert-item">
                  <div className="alert-icon">🟢</div>
                  <div className="alert-body">
                    <div className="alert-text">
                      B2B Connect NPS record : 81   satisfaction maximale
                    </div>
                    <div className="alert-time">hier</div>
                  </div>
                </div>
              </div>
            </div>
            {/* RECOMMENDATIONS */}
            <div
              className="card reco-card"
              style={{ animation: "fadeUp .5s .5s ease both" }}
            >
              <div className="reco-header">
                <span className="reco-icon">✦</span>
                <span className="sec-label">Recommandations stratégiques</span>
              </div>
              <div className="reco-item">
                <div className="reco-num">01.</div>
                <div className="reco-text">
                  Engager un programme de rétention d'urgence sur{" "}
                  <strong style={{ color: "var(--text-1)" }}>Telecel CI</strong>{" "}
                  (churn 5,2%) avec offres de fidélisation ciblées.
                </div>
              </div>
              <div className="reco-item">
                <div className="reco-num">02.</div>
                <div className="reco-text">
                  Accélérer le déploiement{" "}
                  <strong style={{ color: "var(--text-1)" }}>
                    Fibre 1Gbps
                  </strong>{" "}
                  sur Abidjan Nord pour capitaliser sur la dynamique +34%.
                </div>
              </div>
              <div className="reco-item">
                <div className="reco-num">03.</div>
                <div className="reco-text">
                  Revoir le positionnement prix de{" "}
                  <strong style={{ color: "var(--text-1)" }}>
                    Moov StarMobile
                  </strong>{" "}
                  face à la pression concurrentielle MTN.
                </div>
              </div>
              <div className="reco-item">
                <div className="reco-num">04.</div>
                <div className="reco-text">
                  Investiguer la hausse de réclamations{" "}
                  <strong style={{ color: "var(--text-1)" }}>MTN CI</strong>  
                  risque sur NPS Q2.
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="tooltip" id="tooltip" />
      </>
    </div>
  );
}
