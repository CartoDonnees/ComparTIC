import { Dialog } from "primereact/dialog";
import React, { useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
import { BASE_IMG_URL, imageUrl } from "@/services/tools/constants";
import {
  OPERATOR_STATUSES,
  OPERATOR_TYPES,
  validateOperator,
} from "@/services/tools/operatorValidation";

/**
 * Création / modification d'un opérateur.
 *
 * Corrige l'ancien formulaire :
 *  - les valeurs du type de réseau (« MOPBILE », « HYBRID ») n'existaient pas
 *    en base : l'enregistrement échouait ;
 *  - la liste « Statut » écrivait dans le champ « type » ;
 *  - la couleur, obligatoire en base, n'était pas saisissable ;
 *  - aucun contrôle ni message par champ, aucune indication d'enregistrement.
 *
 * @param operator  opérateur à modifier (null : création)
 * @param onSave    async (form) => { error, message?, errors? }
 */
const EMPTY = { code: "", name: "", type: "", color: "#03832E", status: "ENABLE", description: "", imagePath: null };

const PALETTE = ["#FF7900", "#FFCC00", "#0066B3", "#03832E", "#E30613", "#6D28D9", "#0EA5E9", "#475569"];

export default function AdminOperatorDialog({ visible, setVisible, operator, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  const editing = !!operator?.id;

  useEffect(() => {
    if (!visible) return;
    setForm(
      operator?.id
        ? {
            ...EMPTY,
            ...operator,
            color: /^#[0-9a-fA-F]{6}$/.test(operator.color || "") ? operator.color : EMPTY.color,
            description: operator.description || "",
          }
        : { ...EMPTY, code: `OP-${Date.now().toString(36).toUpperCase()}` },
    );
    setErrors({});
    setServerError(null);
    setPreview(null);
  }, [visible, operator]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  };

  const onImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((x) => ({ ...x, imagePath: "Choisissez un fichier image." }));
      return;
    }
    setImageBusy(true);
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 512, useWebWorker: true });
      setForm((f) => ({ ...f, imageFile: compressed }));
      setPreview(URL.createObjectURL(compressed));
      setErrors((x) => ({ ...x, imagePath: undefined }));
    } catch {
      setErrors((x) => ({ ...x, imagePath: "L'image n'a pas pu être préparée." }));
    } finally {
      setImageBusy(false);
      e.target.value = "";
    }
  };

  const removeImage = () => {
    setPreview(null);
    setForm((f) => ({ ...f, imageFile: null, imagePath: null }));
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    const check = validateOperator(form);
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    setSaving(true);
    setServerError(null);
    const res = await onSave(form);
    setSaving(false);
    if (res?.error) {
      setServerError(res.message);
      if (res.errors) setErrors(res.errors);
    }
  };

  const close = () => !saving && setVisible(false);
  const imageSrc = preview || (form.imagePath ? imageUrl(form.imagePath) : null);
  const field = (name) => `form-control${errors[name] ? " is-invalid" : ""}`;

  return (
    <Dialog
      header={editing ? `Modifier l'opérateur ${operator?.name || ""}` : "Ajouter un opérateur"}
      visible={!!visible}
      modal
      onHide={close}
      style={{ width: "min(860px, 96vw)" }}
      breakpoints={{ "641px": "100vw" }}
      footer={
        <div className="d-flex justify-content-between gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={close} disabled={saving}>
            Annuler
          </button>
          <button type="submit" form="operator-form" className="btn btn-primary" disabled={saving || imageBusy}>
            {saving ? (
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
            ) : (
              <i className="fa fa-save me-2" aria-hidden="true"></i>
            )}
            {editing ? "Enregistrer les modifications" : "Créer l'opérateur"}
          </button>
        </div>
      }
    >
      <form id="operator-form" onSubmit={submit} noValidate>
        {serverError && (
          <div className="alert alert-danger py-2" role="alert">
            {serverError}
          </div>
        )}
        <div className="row g-3">
          <div className="col-md-8">
            <div className="mb-3">
              <label className="form-label" htmlFor="op-code">
                Code
              </label>
              <input id="op-code" className="form-control" value={form.code || ""} disabled readOnly />
              <div className="form-text">Référence attribuée automatiquement, non modifiable.</div>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="op-name">
                Nom <span className="text-danger">*</span>
              </label>
              <input
                id="op-name"
                className={field("name")}
                value={form.name || ""}
                maxLength={80}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ex. ORANGE"
                autoFocus
              />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>

            <div className="row g-3 mb-3">
              <div className="col-sm-6">
                <label className="form-label" htmlFor="op-type">
                  Type de réseau <span className="text-danger">*</span>
                </label>
                <select id="op-type" className={field("type")} value={form.type || ""} onChange={(e) => set("type", e.target.value)}>
                  <option value="">Sélectionner…</option>
                  {OPERATOR_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {errors.type && <div className="invalid-feedback">{errors.type}</div>}
              </div>
              <div className="col-sm-6">
                <label className="form-label" htmlFor="op-status">
                  Statut <span className="text-danger">*</span>
                </label>
                <select id="op-status" className={field("status")} value={form.status || "ENABLE"} onChange={(e) => set("status", e.target.value)}>
                  {OPERATOR_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {errors.status && <div className="invalid-feedback">{errors.status}</div>}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="op-color">
                Couleur <span className="text-danger">*</span>
              </label>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <input
                  id="op-color"
                  type="color"
                  className="form-control form-control-color"
                  value={/^#[0-9a-fA-F]{6}$/.test(form.color || "") ? form.color : "#03832E"}
                  onChange={(e) => set("color", e.target.value.toUpperCase())}
                  title="Couleur de l'opérateur dans les graphiques"
                />
                <input
                  className={`${field("color")} w-auto`}
                  value={form.color || ""}
                  maxLength={7}
                  onChange={(e) => set("color", e.target.value.toUpperCase())}
                  aria-label="Code couleur"
                  style={{ maxWidth: 120 }}
                />
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("color", c)}
                    title={c}
                    aria-label={`Couleur ${c}`}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: form.color === c ? "2px solid #0f172a" : "1px solid #cbd5e1",
                      background: c,
                    }}
                  />
                ))}
              </div>
              {errors.color && <div className="text-danger small mt-1">{errors.color}</div>}
              <div className="form-text">Utilisée pour représenter l'opérateur dans les statistiques.</div>
            </div>

            <div>
              <label className="form-label" htmlFor="op-desc">
                Description
              </label>
              <textarea
                id="op-desc"
                rows={4}
                className={field("description")}
                value={form.description || ""}
                maxLength={2000}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Présentation de l'opérateur"
              />
              {errors.description && <div className="invalid-feedback">{errors.description}</div>}
            </div>
          </div>

          <div className="col-md-4">
            <span className="form-label d-block">Logo</span>
            <div
              className="border rounded d-flex align-items-center justify-content-center bg-light mb-2"
              style={{ height: 200, overflow: "hidden" }}
            >
              {imageBusy ? (
                <span className="spinner-border text-secondary" aria-label="Préparation de l'image"></span>
              ) : imageSrc ? (
                <img src={imageSrc} alt={`Logo ${form.name || ""}`} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
              ) : (
                <span className="text-muted small">
                  <i className="bi bi-image me-1" aria-hidden="true"></i> Aucun logo
                </span>
              )}
            </div>
            <input type="file" accept="image/*" className="form-control" onChange={onImage} disabled={saving} aria-label="Choisir un logo" />
            {errors.imagePath && <div className="text-danger small mt-1">{errors.imagePath}</div>}
            {imageSrc && (
              <button type="button" className="btn btn-link btn-sm text-danger px-0" onClick={removeImage} disabled={saving}>
                Retirer le logo
              </button>
            )}
          </div>
        </div>
      </form>
    </Dialog>
  );
}
