import React, { useState } from 'react'
import { ClipLoader } from "react-spinners";

export default function CircleLoader({ title = 'Veuillez patienter, chargement des données...!', size=150, color="#ffffff"}) {

  let [loading, setLoading] = useState(true);
  return (
    <div>
      <div className='py-4' >
        <div>
          <div className='d-flex justify-content-center'>
            <ClipLoader
              size={size}
              color={color}
            />
          </div>
          <div><small style={{fontSize:"12px"}}>{title}</small>  </div>
        </div>
      </div>
    </div>

  )
}
