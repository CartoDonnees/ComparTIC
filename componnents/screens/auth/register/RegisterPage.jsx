import Error404Modal from "@/componnents/modal/error/Error404Modal";
import {
  toastSuccess,
  toastWarning,
} from "@/componnents/notification/notification";
import {
  getAuthUser,
  loginApiService,
} from "@/services/api/auth/authApiService";
import { USER } from "@/services/tools/constants";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function RegisterPage() {
  const [showError, setShowError] = useState(false);
  const router = useRouter();

  const [user, setUser] = useState();
  const [response, setResponse] = useState();
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [acceptCondition, setAcceptCondition] = useState(false);
  const [acceptNotif, setAcceptNotif] = useState(false);

  const [loader, setLoader] = useState(false);

  const onInputChange = (name, e) => {
    const val = (e.target && e.target.value) || "";
    let _user = { ...user };

    _user[`${name}`] = val;

    setUser(_user);
  };

  useEffect(() => {
    if (acceptNotif) {
      let _user = { ...user };

      _user["acceptNotif"] = acceptNotif;

      setUser(_user);
    }
  }, [acceptNotif]);

  useEffect(() => {
    if (success) {
      setLoader(false);
    }
  }, [success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (user?.first_name.trim()) {
      if (isValidEmail(user?.email)) {
        if (user?.password.trim()) {
          if (user?.password == user?.confirmedPassword) {
            if (isValidPassword(user?.password)) {
              if (acceptCondition) {
                setLoader(true);
                const response = await registerApiService(user);
                if (response?.error === false) {
                  toastSuccess(
                    "Inscription reussi! \n Veuillez désormais confirmé votre compte par email",
                  );
                  setSuccess(true);
                } else {
                  setSuccess(false);
                  setLoader(false);
                  toastWarning("Accès incorrect !");
                }
              } else {
                toastWarning(
                  "Pour continuer veuillez accepter les termes et conditions",
                  10000,
                );
              }
            } else {
              toastWarning(
                "Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, un chiffre et un caractère spécial.",
                10000,
              );
            }
          } else {
            toastWarning("Confirmez le mot de passe", 10000);
          }
        } else {
          toastWarning("Veuillez saisir un mot de passe", 10000);
        }
      } else {
        toastWarning("Veuillez saisir un email valide", 10000);
      }
    } else {
      toastWarning("Le prénoms est un champs obligatoire", 10000);
    }
  };
  return (
    <>
      <div className="page-auth m-0 p-0 ">
        <div className="grid-lines m-O p-0" />
        <div className="row">
          <div className="col-md-8  m-0 justify-content-center align-content-center align-items-center">
            <main
              className="panel-right bg-white "
              style={{ borderRadius: "0px 50px 50px 0px" }}
            >
              <div className="form-header mb-0">
                <div className="flag-accent">
                  <div className="flag-stripe orange" />
                  <div className="flag-stripe white" />
                  <div className="flag-stripe green" />
                </div>
                <h2 id="form-title">Inscrivez vous pour ne rien manquer 👋</h2>
                <p id="form-subtitle">
                  Veuillez vsaisir vos informations pour vous inscrire sur la
                  plateforme
                </p>
              </div>
              {/* TABS */}
              <div className="tabs mb-4">
                <div className="tab p-2" style={{ fontSize: 20 }}>
                  INSCRIPTION
                </div>
              </div>
              {/* ─── LOGIN PANEL ─── */}

              <form className="signin-form pt-0 " onSubmit={handleSubmit}>
                <div className="form-body">
                  <div className="row">
                    <div className="col-md-5">
                      <div className="field">
                        <label className="text-dark">
                          Nom <span className="text-danger">*</span>{" "}
                        </label>
                        <div className="input-wrap">
                          <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Entrez votre nom ici..."
                            className="form-control"
                            value={user?.last_name}
                            onChange={(e) => onInputChange("lastName", e)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-md-7">
                      <div className="field">
                        <label className="text-dark">
                          Prénonms <span className="text-danger">*</span>
                        </label>
                        <div className="input-wrap">
                          <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Entrez votre prénoms ici..."
                            className="form-control"
                            value={user?.first_name}
                            onChange={(e) => onInputChange("first_name", e)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="field">
                    <label className="text-dark">
                      Adresse email <span className="text-danger">*</span>
                    </label>
                    <div className="input-wrap">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Entrer votre email ici..."
                        className="form-control"
                        value={user?.email}
                        onChange={(e) => onInputChange("email", e)}
                        required
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="text-dark">
                      Mot de passe <span className="text-danger">*</span>
                    </label>
                    <div
                      className="input-wrap"
                      style={{ position: "relative" }}
                    >
                      <input
                          id="password"
                          name="password"
                          type={!showPassword ? "password" : "text"}
                          placeholder="Entrer votre mot de passe ici..."
                          className="form-control"
                          value={user?.password}
                          onChange={(e) => onInputChange("password", e)}
                          required
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="text-dark">
                      Confirmez le mot de passe{" "}
                      <span className="text-danger">*</span>
                    </label>
                    <div
                      className="input-wrap"
                      style={{ position: "relative" }}
                    >
                      <input
                        id="confirmedPassword"
                        name="confirmedPassword"
                        type={!showPassword ? "password" : "text"}
                        placeholder="Entrer votre mot de passe ici..."
                        className="form-control"
                        onChange={(e) => onInputChange("confirmedPassword", e)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-options">
                    <label className="check-label text-dark">
                      <input type="checkbox" /> Se souvenir de moi
                    </label>
                    <a href="#" className="forgot">
                      Mot de passe oublié ?
                    </a>
                  </div>
                  <button className="btn-primary rounded" type="submit">
                    Se connecter →
                  </button>
                  <div className="mt-5">
                    <div className="text-center" style={{ paddingTop: 30 }}>
                      Déja inscrit ?{" "}
                      <Link href="/login" className="text-primlary">
                        Connectez vous
                      </Link>
                    </div>
                  </div>
                </div>
              </form>
            </main>
          </div>
          <div className="col-md-4">
            <aside className="panel-left " style={{ height: "100vh" }}>
              <div className="brand">
                <div className="tex-center">
                  <img
                    src="./images/logo/logo.png"
                    className=""
                    style={{ height: 50 }}
                    alt=""
                  />
                </div>
                <div className="">
                  <Link href="/">
                    <div
                      className="site-logo text-black "
                      target="_self"
                      style={{ fontSize: 50 }}
                    >
                      Compare<em>TIC</em>
                    </div>
                  </Link>
                </div>
              </div>
              <div className="hero ">
                <h1>
                  Comparez les
                  <br />
                  offres des services de télécomunication{" "}
                  <em>Mobile &amp; Fixe</em>
                  <br />
                  en Côte d'Ivoire
                </h1>
                <p>
                  Trouvez l'offre télécom idéale parmi tous les opérateurs
                  ivoiriens. Forfaits mobile, internet fixe, fibre   tout en un
                  seul endroit.
                </p>
              </div>
              <div className="d-flex">
                <Link href="/" className="btn btn-dark me-2">
                  <bi className="bi bi-house-fill me-2"></bi> Retour à l'accueil
                </Link>
                <Link
                  href="/comparator"
                  className="btn btn-primary"
                  style={{ fontSize: 20 }}
                >
                  <bi className="bi bi-radar me-2"></bi> Comparez des offres
                </Link>
              </div>
            </aside>
          </div>
        </div>
        {/* ═══════════════ LEFT PANEL ═══════════════ */}
        {/* ═══════════════ RIGHT PANEL ═══════════════ */}
      </div>
      <Error404Modal display={showError} setDisplay={setShowError} />
    </>
  );
}
