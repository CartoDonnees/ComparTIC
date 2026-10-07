import React, { useState } from 'react'
import ClientMainContainerPage from '../ClientMainContainerPage'

/**
 * Page « Contactez-nous ».
 *
 * Le formulaire était purement décoratif : aucun état, aucun envoi, le bouton
 * ne faisait rien. Il est désormais relié à `/api/client/contact`, avec
 * contrôle de saisie, message de confirmation, gestion d'erreur et champ
 * piège contre les robots.
 */
export default function ClientContactPage() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', website: '' })
    const [state, setState] = useState('idle') // idle | sending | sent | error
    const [error, setError] = useState(null)

    const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

    const submit = async (e) => {
        e.preventDefault()
        setError(null)

        if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
            setError('Renseignez votre nom, votre adresse e-mail et votre message.')
            return
        }
        if (form.message.trim().length < 10) {
            setError('Votre message est trop court.')
            return
        }

        setState('sending')
        try {
            const res = await fetch('/api/client/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.error || "Votre message n'a pas pu être envoyé.")
            setState('sent')
            setForm({ name: '', email: '', subject: '', message: '', website: '' })
        } catch (err) {
            setState('error')
            setError(err.message)
        }
    }

    return (
        <ClientMainContainerPage activeHeader={'contact'} children={<>
            <main>
                {/* =======================
Page Banner START */}
                <section
                    className=" pb-0 py-5"
                    style={{
                        backgroundImage: "url(assets/images/element/map.svg)",
                        backgroundPosition: "center left",
                        backgroundSize: "cover"
                    }}
                >
                    <div className="container py-2">
                        <div className="row trans-fl-l8">
                            <div className="col-lg-8 col-xl-6 text-center mx-auto">
                                {/* Title */}
                                <h1 className="text-primary">Contactez nous</h1>
                                <h1 className="mb-4">Nous sommes là pour vous aider !</h1>
                            </div>
                        </div>
                        {/* Contact info box */}
                        <div className="row g-4 g-md-5 mt-0 mt-lg-3">
                            {/* Box item */}
                            <div className="col-md-6 mt-lg-0 trans-fl">
                                <div className="card card-body bg-primary shadow py-5 text-center h-100">
                                    {/* Title */}
                                    <h5 className="text-white mb-3">Téléphones</h5>
                                    <div className="d-flex justify-content-center">
                                        <div className='me-2'>
                                            <a href="#" className="text-white">
                                                {" "}
                                                <i className="bi bi-telephone-fill me-2 mt-1" />
                                                +225 27 20 34 43 73
                                            </a>
                                        </div>
                                        <div className='me-2'>
                                            <a href="#" className="text-white">
                                                {" "}
                                                <i className="bi bi-telephone-fill me-2 mt-1" />
                                                +225 27 20 34 43 74
                                            </a>
                                        </div>
                                    </div>
                                    <div className='me-2'>
                                        <a href="#" className="text-white">
                                            {" "}
                                            <i className="fa fa-fax me-2 mt-1" />
                                            Fax: +225 27 20 34 43 74
                                        </a>
                                    </div>
                                </div>
                            </div>
                            {/* Box item */}
                            <div className="col-md-6 mt-lg-0 trans-fr">
                                <div className="card card-body bg-success shadow py-5 text-center ">
                                    {/* Title */}
                                    <h5 className="text-white mb-3">Adresse</h5>
                                    <div className=' w-100'>
                                        <ul className=" mb-0 text-center">
                                            {/* Address */}
                                            <li className="list-item mb-3 text-center">
                                                <a href="#" className="text-white text-center">
                                                    <i className="bi bi-geo-alt-fill me-2 mt-1"></i>
                                                    ARTCI, Marcory Anoumanbo - 18 BP 2203 Abidjan 18
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* ======================= age Banner END */}
                {/* ======================= Image and contact form START */}
                <section>
                    <div className="container">
                        <div className="row g-4 g-lg-0 align-items-center py-4">
                            <div className="col-md-6 align-items-center text-center trans-fr">
                                {/* Image */}
                                <div className="me-4 rounded">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d107555.17367533315!2d-4.039692214671189!3d5.308514779861505!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfc1edf26d73b851%3A0xa6dee8e28a19aae8!2sARTCI!5e1!3m2!1sfr!2sci!4v1754384509482!5m2!1sfr!2sci"
                                        
                                        height={515}
                                        style={{ border: 0, width:'100%'}}
                                        allowFullScreen=""
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        className='rounded'
                                    />

                                </div>
                                {/* Social media button */}
                            </div>
                            {/* Contact form START */}
                            <div className="col-md-6 px-2 trans-fr">
                                {/* Title */}
                                <h2 className="mt-4 mt-md-0">Ecrivez nous</h2>
                                <p>
                                    Pour demander plus d'informations ou une assistance, contactez-nous directement à l'adresse
                                    ou remplissez le formulaire et nous vous répondrons rapidement.
                                </p>
                                {state === 'sent' && (
                                    <div className="alert alert-success" role="status">
                                        Merci, votre message a bien été transmis à l'ARTCI. Une réponse vous parviendra à
                                        l'adresse indiquée.
                                    </div>
                                )}
                                {error && (
                                    <div className="alert alert-danger" role="alert">
                                        {error}
                                    </div>
                                )}
                                <form onSubmit={submit} noValidate>
                                    {/* Name */}
                                    <div className="mb-4 bg-light-input">
                                        <label htmlFor="yourName" className="form-label">
                                            Votre Nom et Prénoms <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg"
                                            id="yourName"
                                            name="name"
                                            autoComplete="name"
                                            maxLength={120}
                                            value={form.name}
                                            onChange={set('name')}
                                            required
                                        />
                                    </div>
                                    {/* Email */}
                                    <div className="mb-4 bg-light-input">
                                        <label htmlFor="emailInput" className="form-label">
                                            Votre adresse mail <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            className="form-control form-control-lg"
                                            id="emailInput"
                                            name="email"
                                            autoComplete="email"
                                            maxLength={160}
                                            value={form.email}
                                            onChange={set('email')}
                                            required
                                        />
                                    </div>
                                    {/* Objet */}
                                    <div className="mb-4 bg-light-input">
                                        <label htmlFor="subjectInput" className="form-label">
                                            Objet
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg"
                                            id="subjectInput"
                                            name="subject"
                                            maxLength={160}
                                            placeholder="Ex. Question sur une offre"
                                            value={form.subject}
                                            onChange={set('subject')}
                                        />
                                    </div>
                                    {/* Message */}
                                    <div className="mb-4 bg-light-input">
                                        <label htmlFor="textareaBox" className="form-label">
                                            Message <span className="text-danger">*</span>
                                        </label>
                                        <textarea
                                            className="form-control"
                                            id="textareaBox"
                                            name="message"
                                            rows={4}
                                            maxLength={4000}
                                            value={form.message}
                                            onChange={set('message')}
                                            required
                                        />
                                        <div className="form-text">{form.message.length} / 4000 caractères</div>
                                    </div>
                                    {/* Champ piège : invisible pour un visiteur, rempli par les robots. */}
                                    <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
                                        <label htmlFor="website">Ne pas remplir</label>
                                        <input
                                            id="website"
                                            name="website"
                                            tabIndex={-1}
                                            autoComplete="off"
                                            value={form.website}
                                            onChange={set('website')}
                                        />
                                    </div>
                                    {/* Button */}
                                    <div className="d-grid">
                                        <button className="btn1 btn-lg btn-dark mb-0" type="submit" disabled={state === 'sending'}>
                                            {state === 'sending' ? 'Envoi en cours…' : 'Envoyer le message'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                            {/* Contact form END */}
                        </div>
                    </div>
                </section>
                {/* =======================
Image and contact form END */}
                {/* =======================
Map START */}
                <section>
                    <div className="container mb-5" style={{height:50}}>
                        <div className="d-sm-flex align-items-center justify-content-center mt-2 mt-sm-4 py-4">
                            <h5 className="mb-0">Suivez-nous:</h5>
                            <ul className="list-inline mb-0 ms-sm-2 text">
                                <li className="list-inline-item">
                                    {" "}
                                    <a className="fs-5 me-1 text-facebook" href="#">
                                        <i className="fab fa-fw fa-facebook-square" />
                                    </a>{" "}
                                </li>
                                <li className="list-inline-item">
                                    {" "}
                                    <a className="fs-5 me-1 text-instagram" href="#">
                                        <i className="fab fa-fw fa-instagram" />
                                    </a>{" "}
                                </li>
                                <li className="list-inline-item">
                                    {" "}
                                    <a className="fs-5 me-1 text-twitter" href="#">
                                        <i className="fab fa-fw fa-twitter" />
                                    </a>{" "}
                                </li>
                                <li className="list-inline-item">
                                    {" "}
                                    <a className="fs-5 me-1 text-linkedin" href="#">
                                        <i className="fab fa-fw fa-linkedin-in" />
                                    </a>{" "}
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>
                <section className="py-5">
                    <div className="container">
                        <div className="row">
                            <div className="col-12">
                                <img
                                    src="images/banner/b6.jpeg"
                                    className=""
                                    alt=""
                                    style={{ width: '100%', height: "100%", backgroundSize:'cover', }}
                                />
                            </div>
                        </div>
                    </div>
                </section>
                {/* =======================
Map END */}
            </main>
        </>} />

    )
}
