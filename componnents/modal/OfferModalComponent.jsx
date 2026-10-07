
import { handleNumThousand } from "@/services/tools/convertions";
import { Dialog } from "primereact/dialog";
import { useEffect } from "react";

export const OfferModalComponent = ({
  display, setDisplay,
  offer,
}) => {

  const onClick = (position) => {
    setDisplay(true);
  };

  const onHide = (name) => {
    setDisplay(false);
    // handleInitVar()
  };

  useEffect(() => {
    if (display) {
      onClick();
    } else {
      onHide();
    }
  }, [display]);
  return (<>
    <Dialog header={offer?.nom} visible={display} style={{ width: '50vw' }} onHide={() => onHide(false)}>
      <div className="row">
        <div className="col-md-4">
          <div className="logo">
            <img
              width="300"
              height="150"
              // src={urlBaseImage + offer?.operateur?.logo}
              alt="Auchan Telecom"
              className="img-fluid"
              loading="lazy"
            />
          </div>
        </div>
        <div className="col-md-4">
          <ul>
            {offer?.services && offer?.services.map((service, index1) => {
              return (<>
                <li>{service?.nom}</li>
              </>)
            })}
            <li>{offer?.type?.duree}</li>
          </ul>
        </div>
        <div className="col-md-4">
          <div className="inner p-0 m-0">
            <div className="column-price w-100 p-0 m-0">
              <h1 className="price p-0 m-0">
                <span>{handleNumThousand(offer?.prix)} FCFA</span>
              </h1>
          </div>
          </div>
        </div>
      </div>
      <p className="m-0">

      </p>
    </Dialog>
  </>)
}