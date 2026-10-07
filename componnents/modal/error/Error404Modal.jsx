import React, { useEffect, useRef, useState } from "react";
import { Dialog } from "primereact/dialog";

export default function Error404Modal({ display, setDisplay }) {
  const [displayMaximizable, setDisplayMaximizable] = useState(false);
  const [position, setPosition] = useState("center");
  const [beginListen, setbeginListen] = useState(false);
  const stackContainerRef = useRef()

  const onHide = (name) => {
    setDisplay(false);
    setbeginListen(false);
  };

  const handleSwitchShow = (_setState, _state) => {
    if (_state) {
      _setState(false);
    } else {
      _setState(true);
    }
  };

  useEffect(() => {

  }, []);

  const top = <div className="">ERREUR 404</div>;

  return (
    <>
      <div className="stat">
        <Dialog
          header={top}
          visible={display}
          modal={true}
          onHide={() => onHide("")}
          style={{ width: "55vw", right: -10, backgroundColor:"white" }}
          breakpoints={{ "960px": "75vw", "641px": "100vw" }}
          position={position}
          className="mb-5"
        //   draggable={true}
        >
            <div className="container2">

        <div className="error">
            <img src="../images/logo/logo.png" style={{height: "80px", width: "100%"}} />
            <h2 style={{fontSize: "70px",marginTop: "10px"}}>Oups!</h2>
            <h3>404</h3>
            <div style={{fontSize: "20px"}} >En cours de développement.</div>
        </div>
        <div className="stack-container2" ref={stackContainerRef}>
            <div className="card-container">
                <div className="perspec">
                    <div className="card">
                        <div className="writing">
                            <div className="topbar">
                                <div className="red"></div>
                                <div className="yellow"></div>
                                <div className="green"></div>
                            </div>
                            <div className="code">
                                <ul>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="card-container">
                <div className="perspec widowsCard1">
                    <div className="card">
                        <div className="writing">
                            <div className="topbar">
                                <div className="red"></div>
                                <div className="yellow"></div>
                                <div className="green"></div>
                            </div>
                            <div className="code">
                                <ul>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="card-container">
                <div className="perspec widowsCard2">
                    <div className="card">
                        <div className="writing">
                            <div className="topbar">
                                <div className="red"></div>
                                <div className="yellow"></div>
                                <div className="green"></div>
                            </div>
                            <div className="code">
                                <ul>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="card-container">
                <div className="perspec widowsCard3">
                    <div className="card">
                        <div className="writing">
                            <div className="topbar">
                                <div className="red"></div>
                                <div className="yellow"></div>
                                <div className="green"></div>
                            </div>
                            <div className="code">
                                <ul>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
            </div>

        </Dialog>
      </div>
    </>
  );
}
