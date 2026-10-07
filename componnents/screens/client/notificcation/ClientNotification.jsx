import React, { useEffect, useState } from "react";
import ClientMainContainerPage from "../ClientMainContainerPage";
import { useClient } from "@/services/providers/ClientProvider";
import { updateClientApiService } from "@/services/api/auth/authApiService";
import { toastSuccess } from "@/componnents/notification/notification";
import ClientAccountSidebar from "@/componnents/layouts/sidebar/ClientAccountSidebar";

export default function ClientNotification() {
  const { user, stUser } = useClient();

  const [localUser, setLocalUser] = useState(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    if (user) {
      setLocalUser(user);
    }
  };

  const onInputChange = (name, e) => {
    const val = (e.target && e.target.value) || "";
    let _user = { ...localUser };

    _user[`${name}`] = val;

    setLocalUser(_user);
  };

  const handleEditInfo = async (e) => {
    e.preventDefault()
    const _res = await updateClientApiService(localUser);
    if (_res?.error == false) {
      toastSuccess("Informations personelles mis à jour");
    } else {
    }
  };

  return (
    <ClientMainContainerPage
      children={
        <>
          <section>
            {/* container */}
            <div className="container">
              {/* row */}
              <div className="row">
                {/* col */}
                {/* col */}
                <div className="col-lg-3 col-md-4 col-12 border-end d-none d-md-block">
                  <ClientAccountSidebar active={2} />
                </div>
                <div className="col-lg-9 col-md-8 col-12">
</div>

              </div>
            </div>
          </section>
        </>
      }
    />
  );
}
