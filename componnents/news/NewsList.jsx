import React from 'react'

export default function NewsList() {
    return (
        <section className="mb-xl-9 my-5 trans-fb">
            <div className="container">
                <div className="py-3">
                    <h2 className="h1 text-center">Actualités</h2>
                    <p className="text-center mb-0">
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Itaque saepe excepturi numquam!
                    </p>
                </div>
                <div className="row g-5">
                    <div className="col-lg-4 col-md-6">
                        <div className="card border-0 shadow-sm card-lift">
                            <figure>
                                <a href="./event-single.html">
                                    <img
                                        src="images/banner/b1.jpg"
                                        alt="event"
                                        className="card-img-top"
                                        style={{ height: 250 }}
                                    />
                                </a>
                            </figure>
                            <div className="card-body h-100 d-flex align-items-start flex-column border rounded-bottom-3 border-top-0">
                                <div className="mb-2">
                                    <h4 className="my-2">
                                        <a href="./event-single.html" className="text-reset">
                                           Lorem ipsum dolor sit amet consectetur, adipisicing elit. Expedita, modi sint harum unde.
                                        </a>
                                    </h4>
                                    <small>1er Août 2025 </small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                        <div className="card border-0 shadow-sm card-lift">
                            <figure>
                                <a href="./event-single.html">
                                    <img
                                        src="images/banner/b1.jpg"
                                        alt="event"
                                        className="card-img-top"
                                        style={{ height: 250 }}
                                    />
                                </a>
                            </figure>
                            <div className="card-body h-100 d-flex align-items-start flex-column border rounded-bottom-3 border-top-0">
                                <div className="mb-2">
                                    <h4 className="my-2">
                                        <a href="./event-single.html" className="text-reset">
                                           Lorem ipsum dolor sit amet consectetur, adipisicing elit. Expedita, modi sint harum unde.
                                        </a>
                                    </h4>
                                    <small>1er Août 2025 </small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4 col-md-6">
                        <div className="card border-0 shadow-sm card-lift">
                            <figure>
                                <a href="./event-single.html">
                                    <img
                                        src="images/banner/b1.jpg"
                                        alt="event"
                                        className="card-img-top"
                                        style={{ height: 250 }}
                                    />
                                </a>
                            </figure>
                            <div className="card-body h-100 d-flex align-items-start flex-column border rounded-bottom-3 border-top-0">
                                <div className="mb-2">
                                    <h4 className="my-2">
                                        <a href="./event-single.html" className="text-reset">
                                           Lorem ipsum dolor sit amet consectetur, adipisicing elit. Expedita, modi sint harum unde.
                                        </a>
                                    </h4>
                                    <small>1er Août 2025 </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='py-4 d-flex justify-content-center'>
                    <button className='btn1 bg-success text-white'>Voir plus d'actualités</button>
                </div>
            </div>
        </section>
    )
}
