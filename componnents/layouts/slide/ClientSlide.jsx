// import { localVariables } from '@/services/local/SecureLocalStorageVariable';
import Link from "next/link";
import { useRef } from "react";

export const ClientSlide = () => {
  const type1Ref = useRef(null);
  const type2Ref = useRef(null);
  const type3Ref = useRef(null);

  const handleClickOffer = (type, ref) => {
    try {
      localStorage.setItem("offer_type", type);
      ref.current.click();
    } catch (error) {}
    // localVariables.setItem('type_offer',type);
  };

  return (
    <>
      <section>
        <div className="container">
          <div className="pt-4 pb-3">
            <div className="row p-0">
              <div className="col-md-6">
                <div className="">
                  <h1 className="block-title1 trans-fl-l5 s-title">
                    <span>Comparateur</span> des offres de service des
                    communications électroniques de la Côte d'Ivoire
                  </h1>

                  {/* <a href="#"
                                    className="btn -arrow text-white" target="_self">Comparez toutes les offres</a> */}

                  <video
                    className="card card-body p-2 h-200px  position-relative overflow-hidden mt-2 trans-fl-l8 s-video"
                    width="640"
                    height="500"
                    controls
                    autoPlay={true}
                    muted
                    loop
                    style={{
                      backgroundImage: "url(images/banner/b4.jpg)",
                      backgroundPosition: "center left",
                      backgroundSize: "cover",
                      height: 245,
                      borderRadius: 10,
                    }}
                  >
                    <source src="/videos/v3.mp4" type="video/mp4" />
                    Votre navigateur ne supporte pas la balise vidéo.
                  </video>
                </div>
              </div>
              <div className="col-md-6">
                <h2 className="block-title size-small text-success fs-5 s-btitle text-center">
                  Quelles offres souhaitez-vous comparer ?
                </h2>
                <div className="w-100 pt-2">
                  <div className="block-links w-100">
                    <div>
                      <Link
                        href={{
                          pathname: "/comparator",
                          query: { type: 1 },
                        }}
                        className="item itemm w-100 trans-fr-r5"
                        target="_self"
                      >
                        <div className="d-flex justify-content-between w-100">
                          <div className="align-self-center">
                            <h2 className="">
                              <span className="tt1">Offres Mobiles</span>
                            </h2>
                          </div>
                          <div className="circle align-self-center">
                            <h1>
                              <i className="bi bi-phone fs-icns"></i>
                            </h1>
                          </div>
                        </div>
                        <div ref={type1Ref} className="d-none" />
                      </Link>
                      <Link
                        href={{
                          pathname: "/comparator",
                          query: { type: 2 },
                        }}
                        className="item itemm w-100 trans-fr-r5"
                        target="_self"
                      >
                        <div className="d-flex justify-content-between w-100">
                          <div className="align-self-center">
                            <h2 className="">
                              <span className="tt1">Offres Fixes</span>
                            </h2>
                          </div>
                          <div className="circle align-self-center">
                            <h1>
                              <i className="bi bi-telephone-fill"></i>
                            </h1>
                          </div>
                        </div>
                      </Link>

                      <Link
                        href={{
                          pathname: "/comparator",
                        }}
                        className="item itemm w-100 trans-fr-r5"
                        target="_self"
                      >
                        <div className="d-flex justify-content-between w-100">
                          <div className="align-self-center">
                            <h2 className="">
                              <span className="tt1">Toutes les offres</span>
                            </h2>
                          </div>
                          <div className="circle align-self-center">
                            <h1>
                              <i className="bi-solid bi-star-fill fs-icns"></i>
                            </h1>
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>
                <section className="module-top size-small w-100"></section>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
