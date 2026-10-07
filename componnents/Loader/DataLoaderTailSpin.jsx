import { TailSpin } from "react-loader-spinner";

export function DataLoaderTailSpin() {
    return (
        <>
            <div className='d-flex justify-content-center py-4'>
                <div>
                    <div className='d-flex justify-content-center'>
                        <TailSpin
                            height="60"
                            width="60"
                            color="#f19742"
                            ariaLabel="tail-spin-loading"
                            radius="1"
                            wrapperStyle={{}}
                            wrapperClass=""
                            visible={true}
                        />
                    </div>
                    <div className='text-center'>
                        <h5>Récupération des données...</h5>
                        <p>Veuillez patienter.</p>
                    </div>
                </div>
            </div>
        </>
    )
}