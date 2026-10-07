import React from "react";
import { levelProgressLabel, workflowStatusOf } from "@/services/tools/workflowLabels";

/**
 * Statut de workflow d'une offre, avec le niveau attendu lorsqu'elle est en
 * cours de validation (« Niveau 2 / 4 »).
 */
export default function WorkflowStatusBadge({ offer, finalLevel = null, showLevel = true, published = false }) {
  if (!offer) return null;
  const style = workflowStatusOf(offer.workflowStatus);
  const level = showLevel ? levelProgressLabel(offer, finalLevel) : null;
  const deactivatedByMonitoring =
    offer.workflowStatus === "DEACTIVATED" && offer.deactivationReason === "MONITORING";

  return (
    <span>
      <span className={`wf-badge wf-tone-${style.tone}`}>
        <i className={`bi ${style.icon}`} aria-hidden="true"></i>
        {style.label}
      </span>
      {level && <span className="wf-badge-level">{level}</span>}
      {deactivatedByMonitoring && (
        <span className="wf-badge-level">
          {published ? "Remplacée   toujours au comparateur" : "Remplacée par une nouvelle version"}
        </span>
      )}
    </span>
  );
}
