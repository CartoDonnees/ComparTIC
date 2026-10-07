import React, { useEffect, useState } from "react";
import ClientMainContainerPage from "../ClientMainContainerPage";
import AdminMainContainerPage from "../../admin/AdminMainContainerPage";
import { useClient } from "@/services/providers/ClientProvider";
import { updateClientApiService } from "@/services/api/auth/authApiService";
import { toastSuccess } from "@/componnents/notification/notification";
import ClientAccountSidebar from "@/componnents/layouts/sidebar/ClientAccountSidebar";

/**
 * « Mon compte ».
 *
 * @param inAdminShell  vrai pour un compte de l espace d administration : le
 *   contenu est alors rendu comme `children` de `AdminMainContainerPage`
 *   (en-tete et barre laterale admin). Sans cela, cliquer « Mon compte »
 *   depuis l administration faisait quitter l espace : la page s affichait
 *   avec l en-tete et le pied de page du site public. Les clients gardent
 *   cette mise en page publique.
 */
export default function ClientAccountPage({ inAdminShell = false }) {
  const { user, stUser } = useClient();

  const [localUser, setLocalUser] = useState(null);
  const [active, setActive] = useState(1);

  // BUGFIX: `init` ne s executait qu au montage. L utilisateur arrivant d un
  // appel reseau, il n etait souvent pas encore disponible : le formulaire
  // restait vide. On le renseigne des qu il est charge.
  useEffect(() => {
    init();
  }, [user]);

  const init = async () => {
    if (user && !localUser) {
      setLocalUser(user);
    }
  };

  const onInputChange = (name, e) => {
    const val = (e.target && e.target.value) || "";
    let _user = { ...localUser };

    _user[`${name}`] = val;

    setLocalUser(_user);
  };

  const handleEditInfo = async (e) => {
    e.preventDefault();
    const _res = await updateClientApiService(localUser);
    if (_res?.error == false) {
      toastSuccess("Informations personelles mis à jour");
    } else {
    }
  };

  const handleChangeActive = (a) => {
    setActive(a);
  };

  const content = (
        <>
          <section>
            {/* container */}
            <div className={inAdminShell ? "container-fluid pt-3" : "container"}>
              {/* row */}
              <div className="row">
                {/* col */}
                {/* col */}
                <div className="col-lg-3 col-md-4 col-12 border-end d-none d-md-block">
                  <div className="pt-10 pe-lg-10">
                    {/* nav item */}
                    <ul className="nav flex-column nav-pills nav-pills-dark">
                      {/* nav item */}
                      {active == 1 ? (
                        <>
                          <li className="nav-item">
                            <a
                              className="nav-link active"
                              href="#"
                              onClick={() => handleChangeActive(1)}
                            >
                              <i className="bi bi-gear-fill me-2"></i>
                              Paramètres
                            </a>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="nav-item">
                            <a
                              className="nav-link"
                              href="#"
                              onClick={() => handleChangeActive(1)}
                            >
                              <i className="bi bi-gear me-2"></i>
                              Paramètres
                            </a>
                          </li>
                        </>
                      )}
                      {active == 2 ? (
                        <>
                          <li className="nav-item">
                            <a
                              className="nav-link active"
                              href="#"
                              onClick={() => handleChangeActive(2)}
                            >
                              <i className="bi bi-bell-fill me-2"></i>
                              Notifications
                            </a>
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="nav-item">
                            <a
                              className="nav-link"
                              href="#"
                              onClick={() => handleChangeActive(2)}
                            >
                              <i className="bi bi-bell me-2"></i>
                              Notifications
                            </a>
                          </li>
                        </>
                      )}
                      {/* nav item */}
                      <li className="nav-item">
                        <hr />
                      </li>
                      {/* nav item */}
                      <li className="nav-item">
                        <a className="nav-link" href="#">
                          <i className="bi bi-box-arrow-right me-2"></i>
                          Se déconnecter
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="col-lg-9 col-md-8 col-12">
                  {active == 1 && (
                    <>
                      <div className="py-6 p-md-6 p-lg-10">
                        <div className="mb-6">
                          {/* heading */}
                          <h2 className="mb-0">Paramètres du compte</h2>
                        </div>
                        <div>
                          {/* heading */}
                          <h5 className="mb-4">Détails du compte</h5>
                          <div className="row">
                            <div className="col-lg-5">
                              {/* form */}
                              <form onSubmit={handleEditInfo}>
                                {/* input */}
                                <div className="mb-3">
                                  <label className="form-label">
                                    Nom <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Entrez un nom"
                                    value={localUser?.lastName}
                                    onChange={(e) =>
                                      onInputChange("lastName", e)
                                    }
                                  />
                                </div>
                                <div className="mb-3">
                                  <label className="form-label">Prénoms</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Entrez un prénoms"
                                    value={localUser?.firstName}
                                    onChange={(e) =>
                                      onInputChange("firstName", e)
                                    }
                                  />
                                </div>
                                {/* input */}
                                <div className="mb-3">
                                  <label className="form-label">
                                    Email <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    type="email"
                                    className="form-control"
                                    placeholder="example@compartic.ci"
                                    value={localUser?.email}
                                    onChange={(e) => onInputChange("email", e)}
                                  />
                                </div>
                                {/* input */}
                                <div className="mb-5">
                                  <label className="form-label">
                                    Téléphone
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Entrer un numéro de téléphone"
                                    value={localUser?.phone}
                                    onChange={(e) => onInputChange("phone", e)}
                                  />
                                </div>
                                {/* button */}
                                <div className="mb-3">
                                  <button
                                    type="submit"
                                    className="btn btn-primary"
                                  >
                                    Enregistrer les détails
                                  </button>
                                </div>
                              </form>
                            </div>
                          </div>
                        </div>
                        <hr className="my-10" />
                        <div className="pe-lg-14">
                          {/* heading */}
                          <h5 className="mb-4">Mot de passe</h5>
                          <form className="row row-cols-1 row-cols-lg-2">
                            {/* input */}
                            <div className="mb-3 col">
                              <label className="form-label">
                                Nouveau meot de passe
                              </label>
                              <input
                                type="password"
                                className="form-control"
                                placeholder="**********"
                              />
                            </div>
                            {/* input */}
                            <div className="mb-3 col">
                              <label className="form-label">
                                Mot de passe actuel
                              </label>
                              <input
                                type="password"
                                className="form-control"
                                placeholder="**********"
                              />
                            </div>
                            {/* input */}
                            <div className="col-12">
                              <p className="mb-4">
                                Vous avez oublié votre mot de passe actuel ?
                                <a href="#">
                                  Réinitialisez votre mot de passe.
                                </a>
                              </p>
                              <a href="#" className="btn btn-primary">
                                Enregistrer le mot de passe
                              </a>
                            </div>
                          </form>
                        </div>
                      </div>
                    </>
                  )}
                  {active == 2 && (
                    <>
                      <div className="py-6 p-md-6 p-lg-10">
                        <div className="mb-6">
                          {/* heading */}
                          <h2 className="mb-0">Paramètres de notification</h2>
                        </div>
                        <div className="mb-10">
                          {/* text */}
                          <div className="border-bottom pb-3 mb-5">
                            <h5 className="mb-0">Notifications par e-mail</h5>
                          </div>
                          {/* text */}
                          <div className="d-flex justify-content-between align-items-center mb-6">
                            <div>
                              <h6 className="mb-1">
                                Notification hebdomadaire
                              </h6>
                              <p className="mb-0">
                                Au fil des ans, différentes versions ont vu le
                                jour, parfois par hasard, parfois de manière
                                délibérée.
                              </p>
                            </div>
                            {/* checkbox */}
                            <div className="form-check form-switch">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id="flexSwitchCheckDefault"
                              />
                              <label
                                className="form-check-label"
                                htmlFor="flexSwitchCheckDefault"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="mb-10">{/* text */}</div>
                        <div className="mb-6">
                          {/* text */}
                          <div className="border-bottom pb-3 mb-5">
                            <h5 className="mb-0">
                              Notification sur le site web
                            </h5>
                          </div>
                          <div>
                            {/* form checkbox */}
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                defaultValue=""
                                id="flexCheckCollection"
                              />
                              <label
                                className="form-check-label"
                                htmlFor="flexCheckCollection"
                              >
                                Ajout d'offre
                              </label>
                            </div>
                            {/* form checkbox */}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        </>
  );

  if (inAdminShell) {
    return <AdminMainContainerPage active="account" children={content} />;
  }

  return <ClientMainContainerPage children={content} />;
}
