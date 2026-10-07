import React, { useState } from "react";
import { ClipLoader, HashLoader } from "react-spinners";

export default function MainLoader({
  title = "Veuillez patienter, chargement des données...!",
  size = 150,
  color = "#ffffff",
}) {
  return (<div>
    <div className="">
      <div>
        <div className="d-flex justify-content-center">
          <HashLoader size={size} color={color} />
        </div>
        <h4 className="text-center"> {title} </h4>
      </div>
    </div>
  </div>)
}
