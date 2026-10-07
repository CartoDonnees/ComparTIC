"use client";
import { useState, useCallback, useEffect } from "react";
import DataLoader from "@/componnents/Loader/DataLoader";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  getDay,
  addHours,
  addDays,
  startOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  isSameMonth,
} from "date-fns";
import { fr } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { getAdminOffers } from "@/services/api/offers/offersApiServices";
import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import { formatDateToFrench } from "@/services/tools/helper";
import AdminOfferViewDialog from "../offer/view/AdminOfferViewDialog";
import { STATUS, statusOf } from "@/services/tools/offerStatus";

// ── Localizer (date-fns) ─────────────────────────────────────────
const locales = { fr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// ── Sample events ────────────────────────────────────────────────
const today = startOfDay(new Date());

// ── Statuts ──────────────────────────────────────────────────────
// La table etait definie ici, et une copie divergente vivait dans l ecran de
// suivi. C est cette divergence qui avait fait planter le calendrier : un
// statut absent de la copie locale y etait lu sans garde. Source unique
// desormais partagee (services/tools/offerStatus.js).

// ── Messages FR ──────────────────────────────────────────────────
const messages = {
  allDay: "Journée",
  previous: "‹",
  next: "›",
  today: "Aujourd'hui",
  year: "Année",
  month: "Mois",
  week: "Semaine",
  day: "Jour",
  agenda: "Agenda",
  date: "Date",
  time: "Heure",
  event: "Événement",
  noEventsInRange: "Aucun événement sur cette période.",
  showMore: (total) => `+${total} autres`,
};

// ── Event style ───────────────────────────────────────────────────
function eventPropGetter(event) {
  const status = statusOf(event.status);
  return {
    style: {
      backgroundColor: status.bg,
      borderRadius: "6px",
      border: "none",
      color: "#fff",
      fontSize: "12px",
      fontWeight: 500,
      padding: "2px 6px",
      boxShadow: `0 2px 8px ${status.bg}55`,
    },
  };
}

// ── Vue ANNÉE (custom view react-big-calendar) ───────────────────
// react-big-calendar ne fournit pas de vue "Année" : on en crée une
// (grille des 12 mois). Cliquer sur un mois ouvre la vue Mois ; cliquer
// sur une offre la sélectionne (panneau latéral). Le bouton Préc./Suiv.
// de la barre navigue d'une année à l'autre grâce à YearView.navigate.
const YEAR_VIEW = "year";

function YearView({ date, events = [], onDrillDown, onSelectEvent }) {
  const year = date.getFullYear();
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, m) => new Date(year, m, 1));

  const openMonth = (monthDate) => {
    // Drill-down natif RBC : navigue à la date + bascule en vue Mois
    if (onDrillDown) onDrillDown(monthDate, "month");
  };

  return (
    <div style={{ padding: 16, height: "100%", overflowY: "auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 14,
        }}
      >
        {months.map((monthDate) => {
          const mStart = startOfMonth(monthDate);
          const mEnd = endOfMonth(monthDate);
          // On affiche les offres qui DÉBUTENT ce mois-ci (date de mise en ligne)
          const monthEvents = events
            .filter((e) => e.start >= mStart && e.start <= mEnd)
            .sort((a, b) => +a.start - +b.start);
          // Décompte des offres par statut pour ce mois
          const statusCounts = Object.keys(STATUS).reduce((acc, key) => {
            acc[key] = monthEvents.filter((e) => e.status === key).length;
            return acc;
          }, {});
          const isCurrent = isSameMonth(monthDate, now);
          return (
            <div
              key={monthDate.getMonth()}
              style={{
                background: "#fff",
                border: `1px solid ${isCurrent ? "#0f172a" : "#e2e8f0"}`,
                borderRadius: 8,
                overflow: "hidden",
                boxShadow: isCurrent
                  ? "0 0 0 1px #0f172a"
                  : "0 1px 2px rgba(0,0,0,.04)",
                display: "flex",
                flexDirection: "column",
                minHeight: 120,
              }}
            >
              <button
                onClick={() => openMonth(monthDate)}
                title="Ouvrir le mois"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: isCurrent ? "#0f172a" : "#f8fafc",
                  color: isCurrent ? "#fff" : "#0f172a",
                  border: "none",
                  padding: "8px 12px",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: "capitalize",
                }}
              >
                <span>{format(monthDate, "MMMM", { locale: fr })}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    opacity: 0.8,
                  }}
                >
                  {monthEvents.length || ""}
                </span>
              </button>

              {/* Décompte par statut : En attente / Traitée / Validée / Réfusée / Suspendue */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 4,
                  padding: "6px 8px",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                {Object.entries(STATUS).map(([key, status]) => (
                  <span
                    key={key}
                    title={status.label}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      color: statusCounts[key] ? "#334155" : "#cbd5e1",
                      background: statusCounts[key] ? status.light : "#f8fafc",
                      border: "1px solid #eef2f7",
                      borderRadius: 99,
                      padding: "1px 7px",
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: status.dot,
                        display: "inline-block",
                        opacity: statusCounts[key] ? 1 : 0.4,
                      }}
                    />
                    {status.label}
                    <b style={{ color: status.bg }}>{statusCounts[key]}</b>
                  </span>
                ))}
              </div>

              <div style={{ padding: "6px 8px", flex: 1 }}>
                {monthEvents.length === 0 ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: "#cbd5e1",
                      textAlign: "center",
                      padding: "10px 0",
                    }}
                  >
                     
                  </p>
                ) : (
                  monthEvents.slice(0, 4).map((e) => {
                    const st = statusOf(e.status);
                    return (
                      <button
                        key={e.id}
                        onClick={() => onSelectEvent && onSelectEvent(e)}
                        title={e.title}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          width: "100%",
                          background: "none",
                          border: "none",
                          padding: "3px 4px",
                          cursor: "pointer",
                          textAlign: "left",
                          borderRadius: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: st.bg,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            color: "#334155",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {e.title}
                        </span>
                      </button>
                    );
                  })
                )}
                {monthEvents.length > 4 && (
                  <button
                    onClick={() => openMonth(monthDate)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 11,
                      color: "#64748b",
                      padding: "3px 4px",
                    }}
                  >
                    +{monthEvents.length - 4} autres
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Méthodes statiques requises par react-big-calendar pour une vue custom
YearView.range = (date) => [startOfYear(date)];
YearView.navigate = (date, action) => {
  switch (action) {
    case "PREV":
      return new Date(date.getFullYear() - 1, date.getMonth(), 1);
    case "NEXT":
      return new Date(date.getFullYear() + 1, date.getMonth(), 1);
    case "TODAY":
      return new Date();
    default:
      return date;
  }
};
YearView.title = (date) => `${date.getFullYear()}`;

// ── Main component ────────────────────────────────────────────────
export default function AdminCalendarPage() {
  const [events, setEvents] = useState();
  const [view, setView] = useState(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("dev");
  const [slotInfo, setSlotInfo] = useState(null);

  const [offers, setOffers] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState(null);

  const [showViewDialog, setShowViewDialog] = useState(false);
  const [offer, setOffer] = useState(null);

  const handleSelectEvent = useCallback((event) => {
    setSelected(event);
  }, []);

  const handleSelectSlot = useCallback(({ start, end }) => {
    setSlotInfo({ start, end });
    setSelected(null);
    setShowModal(true);
  }, []);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (offers) {
    }
  }, [offers]);

  const init = async () => {
    const _offers = await getAdminOffers();
    calendarList(_offers);
    setOffers(_offers);
  };

  const calendarList = (ofs) => {
    if (ofs?.length > 0) {
      let _calendarEvents = [];
      ofs.forEach((offer) => {
        const _startDate = new Date(offer?.desiredDate);
        let _endDate = addDays(today, 2000);
        if (offer?.specialPromotion) {
          let newDate = new Date(offer?.desiredDate);

          newDate.setDate(
            newDate.getDate() + offer?.specialPromotion?.duration,
          );
          _endDate = newDate;
        }
        _calendarEvents.push({
          id: offer?.id,
          title: offer?.title,
          start: _startDate,
          end: _endDate,
          category: offer?.category,
          formulas:offer?.formulas,
          promo:offer?.specialPromotion,
          operator: offer?.operator,
          status: offer?.validation ? offer?.validation?.status : offer?.status,
          description: offer?.description,
        });

        setCalendarEvents(_calendarEvents);
      });
    }
  };

  const handleAddEvent = () => {
    if (!newTitle.trim() || !slotInfo) return;
    const newEvent = {
      id: Date.now(),
      title: newTitle,
      start: slotInfo.start,
      end: slotInfo.end,
      category: newCategory,
    };
    setEvents((prev) => [...prev, newEvent]);
    setNewTitle("");
    setShowModal(false);
  };

  const handleDeleteEvent = () => {
    if (!selected) return;
    setEvents((prev) => prev.filter((e) => e.id !== selected.id));
    setSelected(null);
  };

  const handleViewOffer = (id) => {
    const _offer = offers.filter(item => item.id === id)?.[0];
    setOffer(_offer);
    setShowViewDialog(true)
  }

  return (
    <>
      {/* Global override styles */}
      <style>{`
      .rbc-calendar { font-family: 'DM Sans', sans-serif; }
      .rbc-header { background: #f8fafc; color: #475569; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; padding: 10px 0; border-color: #e2e8f0 !important; }
      .rbc-time-header-content { border-color: #e2e8f0 !important; }
      .rbc-time-content { border-color: #e2e8f0 !important; }
      .rbc-time-gutter .rbc-label { font-size: 11px; color: #94a3b8; padding-right: 8px; }
      .rbc-today { background: #fefce8 !important; }
      .rbc-current-time-indicator { background: #ef4444; height: 2px; }
      .rbc-current-time-indicator::before { background: #ef4444; }
      .rbc-toolbar button { font-size: 13px; font-weight: 500; border-radius: 8px !important; border-color: #e2e8f0 !important; color: #475569; padding: 6px 14px; transition: all .15s; }
      .rbc-toolbar button:hover { background: #f1f5f9 !important; color: #0f172a; }
      .rbc-toolbar button.rbc-active { background: #0f172a !important; color: #fff !important; border-color: #0f172a !important; }
      .rbc-slot-selection { background: rgba(99,102,241,.15); border: 1px solid rgba(99,102,241,.4); border-radius: 6px; }
      .rbc-event:focus { outline: 2px solid #6366f1; }
      .rbc-month-view .rbc-event { font-size: 11px !important; }
      .rbc-agenda-view table.rbc-agenda-table { border-color: #e2e8f0; }
      .rbc-agenda-view table.rbc-agenda-table tbody > tr > td { color: #334155; font-size: 13px; }
      .rbc-agenda-view table.rbc-agenda-table .rbc-agenda-time-cell { color: #94a3b8; font-size: 12px; }
    `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ── Top bar ── */}
        <div
          style={{
            background: "#fff",
            borderBottom: "1px solid #e2e8f0",
            padding: "10px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
          className="lcard-bx mb-2"
        >
          <div >
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "#0f172a",
                letterSpacing: "-0.03em",
              }}
            >
              Calendrier des offres se services de télécommunications
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "#94a3b8" }}>
              Cliquez sur un créneau pour ajouter un événement
            </p>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {Object.entries(STATUS).map(([key, status]) => (
              <span
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  color: "#475569",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: status.dot,
                    display: "inline-block",
                  }}
                />
                {status.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Main layout ── */}
        <div style={{ display: "flex", gap: 0, height: "calc(100vh - 73px)" }} className="lcard-bx">
          {/* ── Calendar ── */}
          <div style={{ flex: 1, padding: 20, overflow: "hidden" }}>
            <div
              style={{
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                height: "100%",
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,.06)",
              }}
            >
              {calendarEvents == null ? (
                <DataLoader label="Chargement du calendrier des offres…" variant="cards" rows={4} />
              ) : (
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  view={view}
                  date={date}
                  onView={setView}
                  onNavigate={setDate}
                  // Vues disponibles, incluant la vue Année personnalisée
                  views={{
                    month: true,
                    week: true,
                    day: true,
                    [YEAR_VIEW]: YearView,
                  }}
                  onSelectEvent={handleSelectEvent}
                  onSelectSlot={handleSelectSlot}
                  selectable
                  eventPropGetter={eventPropGetter}
                  messages={messages}
                  culture="fr"
                  style={{ height: "100%", padding: "0 8px 8px" }}
                  defaultView={Views.WEEK}
                  min={
                    new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate(),
                      7,
                      0,
                    )
                  }
                  max={
                    new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate(),
                      22,
                      0,
                    )
                  }
                  step={30}
                  timeslots={2}
                  popup
                  components={{
                    toolbar: (props) => (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 8px 8px",
                          flexWrap: "wrap",
                          gap: 8,
                        }}
                      >
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => props.onNavigate("PREV")}
                            style={{
                              background: "none",
                              border: "1px solid #e2e8f0",
                              borderRadius: 8,
                              padding: "5px 12px",
                              cursor: "pointer",
                              fontSize: 14,
                              color: "#475569",
                            }}
                          >
                            ‹
                          </button>
                          <button
                            onClick={() => props.onNavigate("TODAY")}
                            style={{
                              background: "#0f172a",
                              border: "none",
                              borderRadius: 8,
                              padding: "5px 14px",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#fff",
                            }}
                          >
                            Aujourd'hui
                          </button>
                          <button
                            onClick={() => props.onNavigate("NEXT")}
                            style={{
                              background: "none",
                              border: "1px solid #e2e8f0",
                              borderRadius: 8,
                              padding: "5px 12px",
                              cursor: "pointer",
                              fontSize: 14,
                              color: "#475569",
                            }}
                          >
                            ›
                          </button>
                        </div>
                        <span
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#0f172a",
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {props.label}
                        </span>
                        <div style={{ display: "flex", gap: 4 }}>
                          {[YEAR_VIEW,Views.MONTH, Views.WEEK, Views.DAY].map((v) => (
                            <button
                              key={v}
                              onClick={() => props.onView(v)}
                              style={{
                                background: view === v ? "#0f172a" : "none",
                                color: view === v ? "#fff" : "#475569",
                                border: `1px solid ${
                                  view === v ? "#0f172a" : "#e2e8f0"
                                }`,
                                borderRadius: 8,
                                padding: "5px 12px",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 500,
                              }}
                            >
                              {messages[v]}
                            </button>
                          ))}
                        </div>
                      </div>
                    ),
                  }}
                />
              )}
            </div>
          </div>

          {/* ── Side panel ── */}
          <div
            style={{
              width: 260,
              background: "#fff",
              borderLeft: "1px solid #e2e8f0",
              padding: 20,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
            className="lcard-bx"
          >
            {/* Selected event detail */}
            {selected ? (
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: ".08em",
                    margin: "0 0 10px",
                  }}
                >
                  Offre sélectionnéé
                </p>
                <div
                  style={{
                    background: statusOf(selected.status).light,
                    borderRadius: 8,
                    padding: "14px 16px",
                    borderLeft: `4px solid ${statusOf(selected.status).bg}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <img
                      alt={selected.operator?.name}
                      src={imageUrl(selected.operator?.imagePath)}
                      className={`mr-2 flag me-2 flag-${selected.operator.code.toLowerCase()}`}
                      style={{
                        height: 30,
                        // border: "0.1px solid black",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: statusOf(selected.status).bg,
                        textTransform: "uppercase",
                        letterSpacing: ".06em",
                      }}
                    >
                      <b>{statusOf(selected.status).label}</b>
                    </span>
                    <button
                      onClick={handleDeleteEvent}
                      title="Supprimer"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 14,
                        color: "#94a3b8",
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <p
                    style={{
                      margin: "0 0 6px",
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#0f172a",
                    }}
                  >
                    {selected.title}
                  </p>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: 12,
                      color: "#64748b",
                    }}
                  >
                    🕐 {formatDateToFrench(selected.start)}
                  </p>
                  {selected.promo && <>
                  <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>
                    📅 {formatDateToFrench(selected.end)}
                  </p>
                  </>}
                  {selected.description && (
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: 12,
                        color: "#475569",
                        borderTop: "1px solid rgba(0,0,0,.06)",
                        paddingTop: 8,
                      }}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: selected?.description,
                        }}
                      />
                    </p>
                  )}
                  <div>
                    <button className="btn btn-sm btn-dark btn-block w-100 p-0 px-1" onClick={() => handleViewOffer(selected.id)}>
                      <bi className="bi-eye mr-2"></bi> Voir plus
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px 0",
                  color: "#cbd5e1",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <p style={{ fontSize: 12, margin: 0 }}>
                  Cliquez sur un événement pour voir ses détails
                </p>
              </div>
            )}

            {/* Upcoming events */}
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  margin: "0 0 10px",
                }}
              >
                À venir
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {calendarEvents &&
                  calendarEvents
                    .filter((e) => e.start >= new Date())
                    .sort((a, b) => +a.start - +b.start)
                    .slice(0, 5)
                    .map((e) => {
                      return (
                        <button
                          key={e.id}
                          onClick={() => setSelected(e)}
                          style={{
                            background:
                              selected?.id === e.id ? "#f8fafc" : "none",
                            border: "1px solid #f1f5f9",
                            borderRadius: 8,
                            padding: "8px 10px",
                            cursor: "pointer",
                            textAlign: "left",
                            display: "flex",
                            gap: 8,
                            alignItems: "flex-start",
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              // BUGFIX: indexait STATUS avec e.category
                              // ("MOBILE"/"FIXE"), jamais une clé de statut.
                              background: statusOf(e.status).bg,
                              display: "inline-block",
                              marginTop: 3,
                              flexShrink: 0,
                            }}
                          />
                          <div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#0f172a",
                              }}
                            >
                              {e.title}
                            </p>
                            <p
                              style={{
                                margin: "1px 0 0",
                                fontSize: 11,
                                color: "#94a3b8",
                              }}
                            >
                              {format(e.start, "EEE d MMM · HH:mm", {
                                locale: fr,
                              })}
                            </p>
                          </div>
                        </button>
                      );
                    })}
              </div>
            </div>

            {/* Stats */}
            <div>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: ".08em",
                  margin: "0 0 10px",
                }}
              >
                Répartition
              </p>
              {calendarEvents && (
                <>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {Object.entries(STATUS).map(([key, status]) => {
                      const count = calendarEvents.filter(
                        (e) => e.status === key,
                      ).length;
                      const pct = Math.round(
                        (count / calendarEvents.length) * 100,
                      );
                      return (
                        <div key={key}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 3,
                            }}
                          >
                            <span style={{ fontSize: 11, color: "#475569" }}>
                              {status.label}
                            </span>
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>
                              {count}
                            </span>
                          </div>
                          <div
                            style={{
                              height: 8,
                              background: "#f1f5f9",
                              borderRadius: 99,
                            }}
                          >
                            <div
                              style={{
                                height: 8,
                                width: `${pct}%`,
                                background: status.bg,
                                borderRadius: 99,
                                transition: "width .3s",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Add event modal ── */}
        {showModal && (
          <div
            onClick={() => setShowModal(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15,23,42,.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#fff",
                borderRadius: 8,
                padding: 24,
                width: 340,
                boxShadow: "0 20px 60px rgba(0,0,0,.2)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 4px",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                Nouvel événement
              </h3>
              {slotInfo && (
                <p
                  style={{ margin: "0 0 16px", fontSize: 12, color: "#94a3b8" }}
                >
                  {format(slotInfo.start, "EEEE d MMMM · HH:mm", {
                    locale: fr,
                  })}{" "}
                  – {format(slotInfo.end, "HH:mm")}
                </p>
              )}
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddEvent()}
                placeholder="Titre de l'événement"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  fontSize: 14,
                  color: "#0f172a",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: 12,
                }}
              />
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginBottom: 16,
                }}
              >
                {Object.entries(STATUS).map(([key, status]) => (
                  <button
                    key={key}
                    onClick={() => setNewCategory(key)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 99,
                      border: "none",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      background:
                        newCategory === key ? status.bg : status.light,
                      color: newCategory === key ? "#fff" : status.bg,
                    }}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: "9px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    background: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "#64748b",
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddEvent}
                  style={{
                    flex: 2,
                    padding: "9px",
                    borderRadius: 8,
                    border: "none",
                    background: "#0f172a",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <AdminOfferViewDialog visible={showViewDialog} setVisible={setShowViewDialog} offer={offer}  />
    </>
  );
}
