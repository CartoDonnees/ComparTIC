import Link from "next/link";
import ChatBotButton from "./ChatBotButton";

export const ClientFooter = () => {
  return (
    <>
      <footer className="pt-5 bg-grad-secondary">
        <div className="container text-white">
          {/* Row START */}
          <div className="row g-4">
            {/* Widget 1 START */}
            <div className="col-lg-3">
              {/* logo */}
              <a className="me-0 w-100" href="index.html">
                <img
                  className="dark-mode-item h-40px f-lg "
                  src="images/logo/logo-white.png"
                  alt="logo"
                />
              </a>
              <h1 className="title text-white text-center">
                Compar<em className="text-primary">TIC</em>
              </h1>
              {/* Social media icon */}
              <ul className="list-inline mb-0 mt-3 d-flex justify-content-center">
                <li className="list-inline-item">
                  {" "}
                  <a
                    className="btn btn-white btn-sm shadow px-2 text-facebook"
                    href="#"
                  >
                    <i className="fab fa-fw fa-facebook-f" />
                  </a>{" "}
                </li>
                <li className="list-inline-item">
                  {" "}
                  <a
                    className="btn btn-white btn-sm shadow px-2 text-instagram"
                    href="#"
                  >
                    <i className="fab fa-fw fa-instagram" />
                  </a>{" "}
                </li>
                <li className="list-inline-item">
                  {" "}
                  <a
                    className="btn btn-white btn-sm shadow px-2 text-twitter"
                    href="#"
                  >
                    <i className="fab fa-fw fa-twitter" />
                  </a>{" "}
                </li>
                <li className="list-inline-item">
                  {" "}
                  <a
                    className="btn btn-white btn-sm shadow px-2 text-linkedin"
                    href="#"
                  >
                    <i className="fab fa-fw fa-linkedin-in" />
                  </a>{" "}
                </li>
              </ul>
            </div>
            {/* Widget 1 END */}
            {/* Widget 2 START */}
            <div className="col-lg-6">
              <div className="row g-4">
                {/* Link block */}
                <div className="col-md-8 text-white">
                  <p className="f-cp-g">
                    Le comparateur est un outil gratuit conçu pour
                    vous aider à choisir plus facilement le forfait qui
                    correspond à vos besoins et votre budget. Il offre une vision claire, transparente et objective de
                    l’ensemble des offres disponibles sur le marché : tarifs,
                    volumes d’appels, sms et Internet, durée, conditions
                    d’engagement, et bien plus encore.
                  </p>
                  <p className="f-cp-g">
                    En quelques clics, vous pouvez comparer les offres des
                    différents opérateurs, comprendre les différences entre les
                    forfaits et repérer les offres les plus adaptées à votre
                    budget et à vos usages. 
                  </p>
                  {/* Nous avons sélectionné dans cette rubrique les principales offres de disponibles en Côte d'Ivoire. Afin de bénéficier des meilleurs tarifs et d’avoir des services pour pas cher, les opérateurs Internet Suisse proposent régulièrement des promotions si vous souscrivez en ligne directement sur leur site. */}
                </div>
                {/* Link block */}
                <div className="col-md-4 text-white">
                  <h5 className="mb-2 mb-md-4 f-cp-g">Liens utiles</h5>
                  <ul className="nav flex-column ">
                    <li className="nav-item">
                      <Link className="text-white f-cp-g" href="/about">
                        A propos du comparateur
                      </Link>
                    </li>
                    <li className="nav-item">
                      <Link className="text-white f-cp-g" href="/comparator">
                        Comparer les offres
                      </Link>
                    </li>
                    {/* <li className="nav-item">
                      <Link className="text-white" href="/">
                        Acualités
                      </Link>
                    </li> */}
                    <li className="nav-item">
                      <Link className="text-white" href="/faq">
                        FAQ
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            {/* Widget 2 END */}
            {/* Widget 3 START */}
            <div className="col-lg-3">
              <h5 className="mb-2 mb-md-4">Contact</h5>
              {/* Time */}
              <p className="mb-2">
                Tel:
                <span className="h6 fw-light ms-2">+225 27 20 34 43 73</span>
                <span className="d-block small">+225 27 20 34 43 74</span>
              </p>
              <p className="mb-0">
                Email:
                <span className="h6 fw-light ms-2"> courrier@artci.ci</span>
              </p>
              {/* Row END */}
            </div>
            {/* Widget 3 END */}
          </div>
          {/* Row END */}
          {/* Divider */}
          <hr className="mt-4 mb-0" />
          {/* Bottom footer */}
          <div className="py-3">
            <div className="container px-0 ">
              <div className="d-lg-flex justify-content-between align-items-center py-3 text-center text-md-left">
                {/* copyright text */}
                <div className=" text-white ">
                  <a
                    href="https://www.artci.ci/"
                    target="_blank"
                    className="text-white"
                  >
                    ARTCI,
                  </a>{" "}
                  Copyrights © 2026
                </div>
                {/* copyright links*/}
                <div className="justify-content-center mt-3 mt-lg-0">
                  <ul className="nav list-inline justify-content-center mb-0">
                    <li className="list-inline-item">
                      <a className="nav-link text-white" href="#">
                        Conditions d'utilisation
                      </a>
                    </li>
                    <li className="list-inline-item">
                      <a className="nav-link pe-0 text-white" href="#">
                        Politique de confidentialité
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ChatBotButton />
      </footer>
    </>
  );
};
