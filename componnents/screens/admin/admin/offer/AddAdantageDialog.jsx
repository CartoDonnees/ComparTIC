import { Dialog } from 'primereact/dialog'
import { Editor } from 'primereact/editor';
import React, { useEffect, useState } from 'react'

export default function AddAdantageDialog({
    visible,
    setVisible,
    advantage,
    setAdvantage,
    formula,
    onInputChange,
    handleEditAdvantage
}) {

    const [tabAdv, setTabAdv] = useState(null);

    useEffect(() => {
        if (formula?.advantages) {
        }
    }, [formula?.advantages]);

    useEffect(() => {
        if (tabAdv) {
            const _advantages = formula?.advantages
            Object.entries(tabAdv).forEach(([key, v]) => {
                let isPresent = false
                if (_advantages) {
                    _advantages.forEach(adv => {
                        if (isPresent == false) {
                            if (adv?.key == key) {
                                isPresent = true
                                if (v.value == false) {
                                    const _nAdvs = _advantages?.filter(item => item.key != key);
                                    onInputChange('advantages', _nAdvs)
                                }
                            }
                        }
                    })
                    if (isPresent == false) {
                        const _adv = { key: key, name: v.name }
                        onInputChange('advantages', [..._advantages, _adv]);
                    }
                }
                else {
                    const _adv = { key: key, name: v.name }
                    onInputChange('advantages', [ _adv]);
                }
            });
        }
    }, [tabAdv]);

    useEffect(() => {
        if (visible) {
            onClick();
        } else {
            onHide();
        }
    }, [visible]);

    useEffect(() => {
        if (advantage) {
        }
    }, [advantage]);

    const onClick = (position) => {
        setVisible(true);
    };

    const onHide = (name) => {
        setAdvantage(null);
        setVisible(false);
        // setTabAdv(null);
        // handleInitVar()
    };

    const onInputCh = (name, value) => {
        let _advantage = { ...advantage };
        _advantage[`${name}`] = value;
        setAdvantage(_advantage);
    };

    const addAdvantagaeBySelect = (key, name, value) => {
        const _tabAdv = { ...tabAdv }
        _tabAdv[key] = { name: name, value: value,select:true};
        setTabAdv(_tabAdv);
    }

    const handleAddAdvantage = () => {
        if (advantage?.name) {
            const _frm = { ...formula };
            const _advantage = { ...advantage }
            _advantage['key'] = Date.now();
            if (_frm?.advantages) {
                onInputChange('advantages', [..._frm?.advantages, _advantage])
            }
            else {
                onInputChange('advantages', [_advantage])
            }
            // setTabAdv(null);
            setVisible(false);
        }

    }

    return (
        <Dialog
            header={<h5>AJOUTER AUTRES AVANTAGES</h5>}
            visible={visible}
            style={{ width: '65vw' }}
            onHide={() => onHide(false)}
            headerStyle={{
                background: '#343A3F', // Couleur de fond noire
                color: 'white', // Couleur du texte blanc (ou autre couleur de texte lisible)
                padding: 10
            }}
        >
            {!advantage?.key ? <>
            </> : <></>}
            <div className='pt-4'>
                <div className="row">
                    <div className="col-md-4">
                        <div className=' form-group bg-light p-1'>
                            <input
                                id='whatsapp'
                                className="me-2 "
                                type="checkbox"
                                name="whatsapp"
                                checked={tabAdv?.['whatsapp']?.value == true }
                                onChange={(e) => addAdvantagaeBySelect('whatsapp', 'Whatsapp illimité', e.target.checked)}
                            />
                            <label className="form-check-label d-inline " htmlFor="whatsapp">
                                <small style={{ fontSize: 12 }}>Whatsapp illimité</small>
                            </label>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className=' form-group bg-light p-1'>
                            {advantage?.['facebook']?.key}
                            <input
                                id='facebook'
                                className="me-2 "
                                type="checkbox"
                                name="facebook"
                                checked={tabAdv?.['facebook']?.value == true }
                                onChange={(e) => addAdvantagaeBySelect('facebook', 'Facebook illimité', e.target.checked)}
                            />
                            <label className="form-check-label d-inline " htmlFor="facebook">
                                <small style={{ fontSize: 12 }}>Facebook illimité</small>
                            </label>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className=' form-group bg-light p-1'>
                            <input
                                id='tiktok'
                                className="me-2 "
                                type="checkbox"
                                name="tiktok"
                                checked={tabAdv?.['tiktok']?.value == true }
                                onChange={(e) => addAdvantagaeBySelect('tiktok', 'Tiktok illimité', e.target.checked)}
                            />
                            <label className="form-check-label d-inline " htmlFor="tiktok">
                                <small style={{ fontSize: 12 }}>Tiktok illimité</small>
                            </label>
                        </div>
                    </div>
                </div>
                <hr />
                <div>Autres</div>
                <div className=" bg-primary1 p-2">
                    <div className="form-group mb-2 pt-2">
                        <label htmlFor="ladvantage">
                            Nom de l'avantage <span className="text-danger">*</span>
                        </label>
                        <input
                            id="name"
                            type="text"
                            className="form-control"
                            placeholder="Saisir le nom de l'avantage"
                            required
                            value={advantage?.name}
                            onChange={(e) => onInputCh('name', e.target.value)}
                        />
                    </div>
                    <div className="form-group mb-2">
                        <label htmlFor="lname">
                            Description
                        </label>

                        <div className="bg-white">
                            <Editor value={advantage?.description} placeholder="Sair une description de l'avantage..." onTextChange={(e) => onInputCh('description', e.htmlValue)} style={{ height: '250px' }} />
                        </div>
                    </div>
                </div>
                {!advantage?.key ? <>
                    <button
                        className='btn btn-success w-100'
                        onClick={() => handleAddAdvantage()} ><i className="fa fa-save me-2"></i>Enregistrer l'avantage</button>
                </> : <>
                    <button
                        className='btn btn-info w-100'
                        onClick={() => handleEditAdvantage()} ><i className="fa fa-save me-2"></i>Enregistrer la modification de l'avantage</button>
                </>}
            </div>

        </Dialog>
    )
}
