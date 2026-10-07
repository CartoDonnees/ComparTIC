import React, { useState } from 'react'
import { ClipLoader } from "react-spinners";

export default function DefaultLoader({ title = 'Veuillez patienter, chargement des données...!',titleSize=25, size=150, color="#ffffff",titleColor = "black"  }, ) {

  let [loading, setLoading] = useState(true);
  return (
    <div>
      <div className='' >
        <div>
          <div className='d-flex justify-content-center py-4'>
            <ClipLoader
              size={size}
              color={color}
            />
          </div>
          <h4 className='text-center' style={{color:titleColor, fontSize:titleSize}}> {title} </h4>
        </div>
      </div>
    </div>

  )
}
