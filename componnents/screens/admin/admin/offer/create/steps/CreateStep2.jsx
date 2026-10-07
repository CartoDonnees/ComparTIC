import { handleNumThousand, strUcFirst } from '@/services/tools/convertions'
import { convertMoToGo } from '@/services/tools/helper'
import React from 'react'

export default function CreateStep2({
    step,
    offer,
    setShowFormulaModal,
    services,
    handleAddNewForm,
    initEdiitFormula,
    handleConfirmRemoveFomula,
    handlePreviousStep,
    handleNextStep,
}) {

    //TEMPLATE FORMULES
    const childrenTemplate = (children) => {
        if (children?.length > 0) {
            return (<div>
                <hr className='m-0' />
                <div className='mt-1'>
                    <small><u><b>Sous-offres:</b></u></small>
                </div>
                <table className='table table-bordered mb-0'>
                    <thead className='p-1'>
                        <tr className='bg-secondary p-1'>
                            <th className='text-white text-center' style={{ width: 50 }}>N°</th>
                            <th className='text-white text-center'>CONTENU</th>
                            <th className='text-white text-center' style={{ width: 150 }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {children?.map((form, i) => {
                            return (<React.Fragment key={"ASS" + i}>
                                <tr>
                                    <td className='p-2 align-content-center align-self-center'><b>{i + 1}</b></td>
                                    <td className="p-1">
                                        {form?.type == 'price' && <>
                                            <div className='px-1 bg-light text-center' style={{ fontSize: 14 }}> {form?.title} </div>
                                            <small>
                                                <b>{handleNumThousand(form.settlement.price)}F </b>| {form.settlement.validity} jour(s)
                                                {services && services?.map((s, ii) => {
                                                    if (form.settlement.services?.[s.title] === true) {
                                                        return (
                                                            <div className='' style={{ paddingLeft: 10 }}>
                                                                <div className='d-flex'>
                                                                    {s.code == 'SER-001' && <span>  <i className="fa-solid fa-phone me-2"></i> {form.settlement.services?.['quantity' + s.title]} minutes d'appel
                                                                        {form.settlement.services?.['bStep' + s.title] && <>| Pas: {form.settlement.services?.['bStep' + s.title]}F/min</>} | {form.settlement.services?.['comType' + s.title] == 'ALL_NET' && 'Tous les réseaux'}
                                                                        {form.settlement.services?.['comType' + s.title] == 'ON_NET' && 'On-Net'}
                                                                        {form.settlement.services?.['comType' + s.title] == 'OFF_NET' && 'Off-Net'}
                                                                    </span>}
                                                                    {s.code == 'SER-010' && <span> <i className="fa-solid fa-comment-sms me-2"></i> {form.settlement.services?.['quantity' + s.title]} SMS
                                                                        {form.settlement.services?.['bStep' + s.title] && <>| Pas: {form.settlement.services?.['bStep' + s.title]}F/sms</>} | {form.settlement.services?.['comType' + s.title] == 'ALL_NET' && 'Tous les réseaux'}
                                                                        {form.settlement.services?.['comType' + s.title] == 'ON_NET' && 'On-Net'}
                                                                        {form.settlement.services?.['comType' + s.title] == 'OFF_NET' && 'Off-Net'}</span>}
                                                                    {s.code == 'SER-100' && <span> <i className="fa-solid fa-globe me-2"></i> Internet {Number(form.settlement.services?.['quantity' + s.title]) >= 1024 ? convertMoToGo(form.settlement.services?.['quantity' + s.title], 2) + ' Go' : form.settlement.services?.['quantity' + s.title] + ' Mo'}
                                                                       {form.settlement.services?.['bStep' + s.title] && <> | Pas: {form.settlement.services?.['bStep' + s.title]}F/Mo</>} </span>}
                                                                </div>

                                                            </div>)
                                                    }

                                                })}
                                            </small>
                                            {form?.advantages?.length >0 && <>
                                                <hr className='m-1' />
                                                <div className="row">
                                                    <div className="col-md-3">

                                                    </div>
                                                    <div className="col-md-9">

                                                    </div>
                                                </div>
                                                <div className="" style={{ paddingLeft: 50 }}>
                                                    <div><small><u> <b>Autres avantages :</b></u> </small> </div>
                                                    <div>
                                                        {form?.advantages?.map((adv, ii) => {
                                                            return (
                                                                <React.Fragment key={'adv' + ii}>
                                                                    <div>
                                                                        <div><small>* {adv?.name} </small> </div>
                                                                    </div>
                                                                </React.Fragment>)

                                                        })}
                                                    </div>
                                                </div>
                                            </>}
                                            <div>
                                                {form?.children && childrenTemplate(form?.children)}
                                            </div>
                                        </>}
                                        {form?.type == 'bill' && <>
                                            <td className='p-1 m-0'>
                                                <div className='px-1 bg-light'>
                                                    <small><b>{form?.title}</b> </small>
                                                </div>
                                                <small>
                                                    <div>
                                                        {form.settlement.validity} jour(s)
                                                    </div>
                                                    <div>
                                                        {services && services?.map((s, ii) => {
                                                            if (s.title === form.settlement.service) {
                                                                return (
                                                                    <div className='' style={{ paddingLeft: 10 }}>
                                                                        <div className='d-flex'>
                                                                            {s.code == 'SER-001' && <span>  <i className="fa-solid fa-phone me-2"></i> {form.settlement?.quantity} minutes d'appel
                                                                                | Pas: {form.settlement?.billingStep}F/Min | {form.settlement?.comType == 'ALL_NET' && 'Tous les réseaux'}
                                                                                {form.settlement?.comType == 'ON_NET' && 'On-Net'}
                                                                                {form.settlement?.comType == 'OFF_NET' && 'Off-Net'}
                                                                            </span>}
                                                                            {s.code == 'SER-010' && <span> <i className="fa-solid fa-comment-sms me-2"></i> {form.settlement.quantity} SMS
                                                                                | Pas: {form.settlement?.billingStep}F/Min | {form.settlement?.comType == 'ALL_NET' && 'Tous les réseaux'}
                                                                                {form.settlement?.comType == 'ON_NET' && 'On-Net'}
                                                                                {form.settlement?.comType == 'OFF_NET' && 'Off-Net'}
                                                                            </span>}
                                                                            {s.code == 'SER-100' && <span> <i className="fa-solid fa-globe me-2"></i> Internet {Number(form.settlement.quantity) >= 1024 ? convertMoToGo(form.settlement.quantity, 2) + ' Go' : form.settlement.quantity + ' Mo'}
                                                                                | Pas: {form.settlement.billingStep}F/Mo
                                                                            </span>}
                                                                        </div>
                                                                    </div>)
                                                            }

                                                        })}
                                                    </div>
                                                    {form?.advantages && <>
                                                        <hr className='m-1' />
                                                        <div className="row">
                                                            <div className="col-md-3">

                                                            </div>
                                                            <div className="col-md-9">

                                                            </div>
                                                        </div>
                                                        <div className="" style={{ paddingLeft: 50 }}>
                                                            <div><small><u> <b>Autres avantages :</b></u> </small> </div>
                                                            <div>
                                                                {form?.advantages?.map((adv, ii) => {
                                                                    return (
                                                                        <React.Fragment key={'adv' + ii}>
                                                                            <div>
                                                                                <div><small>* {adv?.name} </small> </div>
                                                                            </div>
                                                                        </React.Fragment>)

                                                                })}
                                                            </div>
                                                        </div>
                                                    </>}
                                                    {/* {form.settlement?.services.map((s,ii) => {
                                                                                return <div>
    
                                                                                </div>
                                                                            })} */}
                                                </small>
                                                <div>
                                                    {form?.children && childrenTemplate(form?.children)}
                                                </div>
                                            </td>
                                        </>}
                                        {!form?.type && <>
                                            <div className='px-1'>
                                                <small> <b>{form?.title}</b></small>
                                            </div>
                                            <div>
                                                {form?.children && childrenTemplate(form?.children)}
                                            </div>
                                        </>}
                                    </td>
                                    <td className='p-1 m-0 align-content-center align-self-center' >
                                        {step != 5 && <>
                                            {!form?.type && <>
                                                <button className='btn btn-sm btn-warning me-2' onClick={() => handleAddNewForm(form?.key)} ><i className="fa fa-plus"></i></button>
                                            </>}
                                            <button className='btn btn-sm btn-info me-2 mb-1 p-1' onClick={() => initEdiitFormula(form)}><i className="fa fa-edit"></i></button>
                                            <button className='btn btn-sm btn-danger mb-1 p-1' onClick={() => handleConfirmRemoveFomula(form?.key)}><i className="fa fa-trash"></i></button>
                                        </>}
                                    </td>
                                </tr>
                            </React.Fragment>)
                        })}
                    </tbody>
                </table>
            </div>)
        }
    }

    return (
        <div>
            <div className="card-header bg-secondary d-flex justify-content-between">
                <h5 className='p-2 m-0'><strong className="headings-color text-white">Etape 2: Formules liées à l'offre <em><u>{offer?.title}</u></em> </strong></h5>
                <div className='p-2'>
                    <button className='btn btn-sm btn-warning' onClick={() => { setShowFormulaModal(true) }} ><i className="fa fa-plus me-2"></i>Ajouter une nouvelle formule</button>
                </div>
            </div>
            {offer?.formulas?.length > 0 ? <>
                <div className="card mb-2">
                    <div className="card-body">
                    <div className="p-1">
                        {offer?.formulas?.length > 0 ? <>
                            <table className='table table-bordered table-striped'>
                                <thead>
                                    <tr className='bg-dark'>
                                        <th className='text-white text-center' style={{ width: 50 }}>N°</th>
                                        <th className='text-white text-center'>CONTENU</th>
                                        <th className='text-white text-center' style={{ width: 150 }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {offer?.formulas.map((form, i) => {
                                        return (
                                            <React.Fragment key={'frm' + i}>
                                                <tr className='p-0 m-0'>
                                                    <td className='p-2 align-content-center align-self-center' style={{ width: 30 }}>
                                                        <div className="text-center">
                                                            <b>{i + 1} </b>
                                                        </div>
                                                    </td>
                                                    {form?.type == 'price' && <>
                                                        <td className='p-1 m-0 '>
                                                            <div className=' bg-light'>
                                                                <div className="row ">
                                                                    <div className="col-md-9">
                                                                        <div className='px-1 alert alert-info p-1 rounded-0 m-0' style={{ fontSize: 16 }}> <b>{strUcFirst(form?.title)}</b>  </div>
                                                                    </div>
                                                                    <div className="col-md-3">
                                                                        <div className="d-flex justify-content-end">
                                                                            <div>
                                                                                <b> {handleNumThousand(form.settlement.price)} FCFA </b>| Valable <b>{form.settlement.validity} jour(s)</b>  </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div style={{ paddingLeft: 10 }} className='border p-2'>
                                                                <div className="row">
                                                                    <div className="col-md-6">
                                                                        <small>
                                                                            {services && services?.map((s, ii) => {
                                                                                if (form.settlement.services?.[s.title] === true) {
                                                                                    return (
                                                                                        <div key={'bp' + ii} className='' style={{ paddingLeft: 10 }}>
                                                                                            <div className='d-flex'>
                                                                                                {s.code == 'SER-001' && <span>  <i className="fa-solid fa-phone me-2"></i> {form.settlement.services?.['quantity' + s.title]} minutes d'appel
                                                                                                    {form.settlement.services?.['bStep' + s.title] && <>| Pas: {form.settlement.services?.['bStep' + s.title]}F/min</>} | {form.settlement.services?.['comType' + s.title] == 'ALL_NET' && 'Tous les réseaux'}
                                                                                                    {form.settlement.services?.['comType' + s.title] == 'ON_NET' && 'On-Net'}
                                                                                                    {form.settlement.services?.['comType' + s.title] == 'OFF_NET' && 'Off-Net'}
                                                                                                </span>}
                                                                                                {s.code == 'SER-010' && <span> <i className="fa-solid fa-comment-sms me-2"></i> {form.settlement.services?.['quantity' + s.title]} SMS
                                                                                                    {form.settlement.services?.['bStep' + s.title] && <>| Pas: {form.settlement.services?.['bStep' + s.title]}F/sms</>} | {form.settlement.services?.['comType' + s.title] == 'ALL_NET' && 'Tous les réseaux'}
                                                                                                    {form.settlement.services?.['comType' + s.title] == 'ON_NET' && 'On-Net'}
                                                                                                    {form.settlement.services?.['comType' + s.title] == 'OFF_NET' && 'Off-Net'}
                                                                                                </span>}
                                                                                                {s.code == 'SER-100' && <span> <i className="fa-solid fa-globe me-2"></i> Internet {Number(form.settlement.services?.['quantity' + s.title]) >= 1024 ? convertMoToGo(form.settlement.services?.['quantity' + s.title], 2) + ' Go' : form.settlement.services?.['quantity' + s.title] + ' Mo'}
                                                                                                    {form.settlement.services?.['bStep' + s.title] && <>| Pas: {form.settlement.services?.['bStep' + s.title]}F/Mo</>}
                                                                                                </span>}
                                                                                            </div>

                                                                                        </div>)
                                                                                }
                                                                            })}
                                                                        </small>
                                                                    </div>
                                                                    <div className="col-md-6">
                                                                        <div style={{ padding: 2, borderLeft: '1px solid gray' }}>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {form?.advantages && <>
                                                                    <hr className='m-1' />
                                                                    <div className="row">
                                                                        <div className="col-md-3">

                                                                        </div>
                                                                        <div className="col-md-9">

                                                                        </div>
                                                                    </div>
                                                                    <div className="" style={{ paddingLeft: 50 }}>
                                                                        <div><small><u> <b>Autres avantages :</b></u> </small> </div>
                                                                        <div>
                                                                            {form?.advantages?.map((adv, ii) => {
                                                                                return (
                                                                                    <React.Fragment key={'adv' + ii}>
                                                                                        <div>
                                                                                            <div><small>* {adv?.name} </small> </div>
                                                                                        </div>
                                                                                    </React.Fragment>)

                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </>}
                                                                <div>
                                                                    {form?.children && childrenTemplate(form?.children)}
                                                                </div>
                                                                {/* {form.settlement?.services.map((s,ii) => {
                                                                                return <div>
    
                                                                                </div>
                                                                            })} */}
                                                                {/* <div className=''>
                                                                                    10 Min <b style={{ fontSize: 12 }}><em>[2F/Min]</em></b>
                                                                                    -- 50 SMS <b style={{ fontSize: 12 }}><em>[10F/SMS]</em></b>
                                                                                    -- 50Mo <b style={{ fontSize: 12 }}><em>[5F/Mo]</em></b>
                                                                                </div> */}
                                                            </div>
                                                        </td>
                                                    </>}
                                                    {form?.type == 'bill' && <>
                                                        <td className='p-1 m-0'>
                                                            <div className=' bg-light'>
                                                                <div className="row ">
                                                                    <div className="col-md-9">
                                                                        <div className='px-1 alert alert-info p-1 rounded-0 m-0' style={{ fontSize: 16 }}> <b>{strUcFirst(form?.title)}</b>  </div>
                                                                    </div>
                                                                    <div className="col-md-3">
                                                                        <div className="d-flex justify-content-end">
                                                                            <div>
                                                                                Valable <b>{form.settlement.validity} jour(s)</b>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div style={{ paddingLeft: 10 }} className='border p-2'>
                                                                {services && services?.map((s, ii) => {
                                                                    if (s.title === form.settlement.service) {
                                                                        return (
                                                                            <div key={'bF' + ii} className='' style={{ paddingLeft: 10 }}>
                                                                                <small>
                                                                                    <div className='d-flex'>
                                                                                        {s.code == 'SER-001' && <span>  <i className="fa-solid fa-phone me-2"></i> {form.settlement?.quantity} F CFA la minutes d'appel
                                                                                            {form.settlement?.billingStep && <>| Pas: {form.settlement?.billingStep}F/Min</>} | {form.settlement?.comType == 'ALL_NET' && 'Tous les réseaux'}
                                                                                            {form.settlement?.comType == 'ON_NET' && 'On-Net'}
                                                                                            {form.settlement?.comType == 'OFF_NET' && 'Off-Net'}
                                                                                        </span>}
                                                                                        {s.code == 'SER-010' && <span> <i className="fa-solid fa-comment-sms me-2"></i> {form.settlement.quantity} SMS
                                                                                            {form.settlement?.billingStep && <>| Pas: {form.settlement?.billingStep}F/ sms</>} | {form.settlement?.comType == 'ALL_NET' && 'Tous les réseaux'}
                                                                                            {form.settlement?.comType == 'ON_NET' && 'On-Net'}
                                                                                            {form.settlement?.comType == 'OFF_NET' && 'Off-Net'}
                                                                                        </span>}
                                                                                        {s.code == 'SER-100' && <span> <i className="fa-solid fa-globe me-2"></i> Internet {Number(form.settlement.quantity) >= 1024 ? convertMoToGo(form.settlement.quantity, 2) + ' Go' : form.settlement.quantity + ' Mo'}
                                                                                            {form.settlement?.billingStep && <>| Pas: {form.settlement.billingStep}F/Mo</>}
                                                                                        </span>}
                                                                                    </div>
                                                                                </small>
                                                                            </div>)
                                                                    }
                                                                })}
                                                            </div>
                                                            {form?.advantages && <>
                                                                <hr className='m-1' />
                                                                <div className="row">
                                                                    <div className="col-md-3">

                                                                    </div>
                                                                    <div className="col-md-9">

                                                                    </div>
                                                                </div>
                                                                <div className="" style={{ paddingLeft: 50 }}>
                                                                    <div><small><u> <b>Autres avantages :</b></u> </small> </div>
                                                                    <div>
                                                                        {form?.advantages?.map((adv, ii) => {
                                                                            return (
                                                                                <React.Fragment key={'adv' + ii}>
                                                                                    <div>
                                                                                        <div><small>* {adv?.name} </small> </div>
                                                                                    </div>
                                                                                </React.Fragment>)

                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </>}
                                                            {/* {form.settlement?.services.map((s,ii) => {
                                                                                return <div>
    
                                                                                </div>
                                                                            })} */}
                                                        </td>
                                                    </>}
                                                    {!form?.type && <>
                                                        <td className='p-1 m-0 '>
                                                            <div className='px-1'>
                                                                <small> <b>{form?.title}</b></small>
                                                            </div>

                                                            <div>
                                                                {form?.children && childrenTemplate(form?.children)}
                                                            </div>
                                                        </td>
                                                    </>}

                                                    <td className='p-1 m-0 align-content-center align-self-center' style={{ width: 100 }} >
                                                        <div className="d-flex justify-content-center">
                                                            {!form?.type && <>
                                                                <button className='btn btn-sm btn-warning me-2' onClick={() => handleAddNewForm(form?.key)} ><i className="fa fa-plus"></i></button>
                                                            </>}
                                                            <button className='btn btn-sm btn-info me-2' onClick={() => initEdiitFormula(form)} ><i className="fa fa-edit"></i></button>
                                                            <button className='btn btn-sm btn-danger' onClick={() => handleConfirmRemoveFomula(form?.key)}><i className="fa fa-trash"></i></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </> : <>
                        </>}
                    </div>
                    </div>
                </div>
            </> : <>
                <div className='alert alert-warning text-center'>
                    <div className=''>
                        <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 40 }}></i>
                    </div>
                    <div>
                        Aucune formule définie !
                    </div>
                </div>
            </>}
        </div>
    )
}
