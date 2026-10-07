import Link from "next/link";
import React from "react";

export default function ClientAccountSidebar({active}) {
  return (
    <div className="pt-10 pe-lg-10">
      {/* nav item */}
      <ul className="nav flex-column nav-pills nav-pills-dark">
        {/* nav item */}
        {active == 1 ? <>
        <li className="nav-item">
          <Link className="nav-link active" href="/account">
            <i className="bi bi-gear-fill me-2"></i>
            Paramètres
          </Link>
        </li>
        </> : <>
        <li className="nav-item">
          <Link className="nav-link" href="/account">
            <i className="bi bi-gear me-2"></i>
            Paramètres
          </Link>
        </li>
        </>}
        {active == 2 ? <>
        <li className="nav-item">
          <Link className="nav-link active" href="/notifications">
            <i className="bi bi-bell-fill me-2"></i>
            Notifications
          </Link>
        </li>
        </> : <>
        <li className="nav-item">
          <Link className="nav-link" href="/notifications">
            <i className="bi bi-bell me-2"></i>
            Notifications
          </Link>
        </li>
        </>}
        {/* nav item */}
        <li className="nav-item">
          <hr />
        </li>
        {/* nav item */}
        <li className="nav-item">
          <a className="nav-link" href="../index-2.html">
            <i className="bi bi-box-arrow-right me-2"></i>
            Se déconnecter
          </a>
        </li>
      </ul>
    </div>
  );
}
