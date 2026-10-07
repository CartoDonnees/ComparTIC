import Error404Modal from "@/componnents/modal/error/Error404Modal";
import {
  toastSuccess,
  toastWarning,
} from "@/componnents/notification/notification";
import {
  getAuthUser,
  loginApiService,
  loginClientApiService,
} from "@/services/api/auth/authApiService";
import { USER } from "@/services/tools/constants";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

export default function LoginPage() {
  const [showError, setShowError] = useState(false);

  const router = useRouter();
  const [user, setUser] = useState();

  const [loginResponse, setLoginResponse] = useState();
  const [showPassword, setShowPassword] = useState(false);

  const onInputChange = (e, name) => {
    const val = (e.target && e.target.value) || "";
    let _user = { ...user };

    _user[`${name}`] = val;

    setUser(_user);
  };

  const handleSubmit = async (e) => {
    // alert('OK')
    e.preventDefault();
    if (user?.email.trim()) {
      if (user?.password.trim()) {
        const response = await loginClientApiService(user);
        if (response?.error === false) {
          const _usr = await getAuthUser();
          if (_usr) {
            router.replace("/");
          }
        } else {
          toastWarning(response?.message, 10000);
        }
      }
    } else {
      toastWarning("Veuillez saisir un email valide", 10000);
    }
  };

  return (
    <>
      <div className="page-auth m-0 p-0 ">
        <div className="grid-lines m-O p-0" />
        <div className="row">
          <div className="col-md-5">
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
          <div className="col-md-7  m-0 justify-content-center align-content-center align-items-center">
            <main
              className="panel-right bg-white "
              style={{ borderRadius: "50px 0px 0px 50px" }}
            >
              <div className="form-header">
                <div className="flag-accent">
                  <div className="flag-stripe orange" />
                  <div className="flag-stripe white" />
                  <div className="flag-stripe green" />
                </div>
                <h2 id="form-title">Bienvenue 👋</h2>
                <p id="form-subtitle">
                  Veuillez vous connecter à votre compte..
                </p>
              </div>
              {/* TABS */}
              <div className="tabs">
                <div className="tab p-2" style={{ fontSize: 20 }}>
                  CONNEXION
                </div>
              </div>
              {/* ─── LOGIN PANEL ─── */}

              <form className="signin-form" onSubmit={handleSubmit}>
                <div className="form-body">
                  <div className="field">
                    <label className="text-dark">Adresse email</label>
                    <div className="input-wrap">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        className="form-control rounded"
                        placeholder="Entrer votre email ici..."
                        // className="form-control"
                        onChange={(e) => onInputChange(e, "email")}
                        required
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label className="text-dark">Mot de passe</label>
                    <div
                      className="input-wrap"
                      style={{ position: "relative" }}
                    >
                      <input
                        id="password"
                        name="password"
                        type={!showPassword ? "password" : "text"}
                        placeholder="Entrer votre mot de passe ici..."
                        className="form-control rounded"
                        onChange={(e) => onInputChange(e, "password")}
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
                      Pas encore de compte ?{" "}
                      <Link href="/register" className="text-primlary">
                        Créer un compte
                      </Link>
                    </div>
                  </div>
                </div>
              </form>
              {/* /panel-login */}
              {/* ─── SIGNUP PANEL ─── */}
              <div className="form-panel" id="panel-signup">
                <div className="form-body">
                  <div className="field-row">
                    <div className="field">
                      <label>Prénom</label>
                      <div className="input-wrap">
                        <span className="icon">👤</span>
                        <input type="text" placeholder="Koffi" />
                      </div>
                    </div>
                    <div className="field">
                      <label>Nom</label>
                      <div className="input-wrap">
                        <span className="icon">👤</span>
                        <input type="text" placeholder="Kouamé" />
                      </div>
                    </div>
                  </div>
                  <div className="field">
                    <label>Adresse email</label>
                    <div className="input-wrap">
                      <span className="icon">✉</span>
                      <input type="email" placeholder="vous@exemple.ci" />
                    </div>
                  </div>
                  <div className="field">
                    <label>Numéro de téléphone</label>
                    <div className="input-wrap">
                      <span className="icon">📱</span>
                      <input type="tel" placeholder="+225 07 00 00 00 00" />
                    </div>
                  </div>
                  <div className="field">
                    <label>Opérateur actuel</label>
                    <div className="input-wrap">
                      <span className="icon">📡</span>
                      <select>
                        <option value="">Sélectionner votre opérateur…</option>
                        <option>Orange CI</option>
                        <option>MTN CI</option>
                        <option>Moov Africa CI</option>
                        <option>Wave CI</option>
                        <option>CanalBox</option>
                        <option>Autre</option>
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label>Mot de passe</label>
                    <div
                      className="input-wrap"
                      style={{ position: "relative" }}
                    >
                      <span className="icon">🔒</span>
                      <input
                        type="password"
                        id="signup-pwd"
                        placeholder="Min. 8 caractères"
                        oninput="checkStrength(this.value)"
                      />
                    </div>
                    <div className="strength-bar">
                      <div className="strength-seg" id="seg1" />
                      <div className="strength-seg" id="seg2" />
                      <div className="strength-seg" id="seg3" />
                      <div className="strength-seg" id="seg4" />
                    </div>
                    <div className="strength-txt" id="strength-txt" />
                  </div>
                  <button
                    className="btn-primary"
                    style={{ marginTop: 6 }}
                    onclick="handleSignup()"
                  >
                    Créer mon compte →
                  </button>
                  <div className="agree-txt">
                    En vous inscrivant, vous acceptez nos <a href="#">CGU</a> et
                    notre <a href="#">politique de confidentialité</a>.
                  </div>
                  <div className="switch-link" style={{ marginTop: 14 }}>
                    Déjà un compte ?{" "}
                    <a href="/admin-auth">
                      Se connecter
                    </a>
                  </div>
                </div>
              </div>
              {/* /panel-signup */}
            </main>
          </div>
        </div>
        {/* ═══════════════ LEFT PANEL ═══════════════ */}
        {/* ═══════════════ RIGHT PANEL ═══════════════ */}
      </div>

      {/* <section className="ftco-section" style={{ height: "100vh" }}>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-md-6 text-center mb-2">
                <div className="heading-section ">
                  <div className="" style={{ fontSize: 40 }}>
                    Connexion
                  </div>
                  <div>Veuillez vous connecter à votre compte..</div>
                </div>
              </div>
            </div>
            <div className="row justify-content-center">
              <div className="col-md-12 col-lg-10">
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <div className="tex-center">
                      <img
                        src="./images/logo/logo.png"
                        className="img-logo "
                        alt=""
                      />
                    </div>
                    <Link href="/">
                      <div
                        className="site-logo text-black "
                        target="_self"
                        style={{ fontSize: 20 }}
                      >
                        Compare<em>TIC</em>
                      </div>
                    </Link>
                  </div>
                </div>
                <div
                  className="wrap1 d-md-flex p-5 bg-white"
                  style={{ height: "50vh" }}
                >
                  <div className="login-wrap p-5 p-lg-5 ">
                    <form className="signin-form" onSubmit={handleSubmit}>
                      <div className="form-group1 mb-3">
                        <label className="label" htmlFor="name">
                          Email <span className="text-danger">*</span>
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Entrer votre email ici..."
                          className="form-control"
                          onChange={(e) => onInputChange(e, "email")}
                          required
                        />
                      </div>
                      <div className="form-group1 mb-3">
                        <label className="label" htmlFor="password">
                          Mot de passe <span className="text-danger">*</span>
                        </label>
                        <input
                          id="password"
                          name="password"
                          type={!showPassword ? "password" : "text"}
                          placeholder="Entrer votre mot de passe ici..."
                          className="form-control"
                          onChange={(e) => onInputChange(e, "password")}
                          required
                        />
                      </div>
                      <div className="d-flex justify-content-center">
                        <button
                          className="btn btn-primary text-white submit"
                          type="submit"
                        >
                          Se connecter
                        </button>
                      </div>
                      <div className="form-group1 d-md-flex">
                        <div className="w-50 text-md-right">
                          <a href="#">Mot de passe oublier</a>
                        </div>
                      </div>
                    </form>
                  </div>
                  <div className="text-wrap1 p-4 p-lg-5 text-center d-flex align-items-center order-md-last p-5">
                    <div className="text w-100">
                      <h2>Bienvenue !</h2>
                      <p>
                        Abonnez vous gratuitement pour recevoir des notifications
                        sur les offres disponibles
                      </p>
                      <p>Pas encore inscrit ?</p>
                      <Link href="/register" className="btn1 btn-dark">
                        Inscrivez-vous
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section> */}
      {/* <Error404Modal display={showError} setDisplay={setShowError} /> */}
    </>
  );
}
