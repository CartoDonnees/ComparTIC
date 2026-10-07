import { ClientFooter } from "@/componnents/layouts/footer/ClientFooter";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState } from "react";

export default function ClientSubscribe() {
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
    <div>
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
                  Comparer les
                  <br />
                  offres de services{" "}mobiles et fixes
                  en Côte d'Ivoire
                </h1>
                <p>
                  Trouver les offres adaptées à vos besoins et vos budgets en un
                  seul endroit.
                </p>
              </div>
              <div className="d-flex" >
                
                <Link href="/" className="btn btn-dark me-2 justify-content-center align-content-center" style={{width:300, fontSize:20}}>
                  <bi className="bi bi-house-fill me-2"></bi> Accueil
                </Link>
                <Link
                  href="/comparator"
                  className="btn btn-primary"
                  style={{ fontSize: 20 }}
                >
                  <bi className="bi bi-radar me-2"></bi> Comparer maintenant !
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
                <h2 id="form-title">Souscrire à la newsletter </h2>
                <p id="form-subtitle">
                  Veuillez renseigner votre adresse email.
                </p>
              </div>
              {/* TABS */}
              {/* ─── LOGIN PANEL ─── */}

              <form className="signin-form" onSubmit={handleSubmit}>
                <div className="form-body">
                  <div className="field py-5">
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
                  <button className="btn-dark w-100 py-3 rounded" type="submit">
                    <b>Envoyer</b>
                  </button>
                </div>
              </form>
              {/* /panel-signup */}
            </main>
          </div>
        </div>
        {/* ═══════════════ LEFT PANEL ═══════════════ */}
        {/* ═══════════════ RIGHT PANEL ═══════════════ */}
      </div>
      <ClientFooter/>
    </div>
  );
}
