
export const filterOperateurOffer = (operators, filter, offerInitial) => {
    let _operatorOffers = [];

    operators.forEach(operator => {
        if (filter?.['OP-' + operator?.nom]) { //OPERATEURS
            const _res1 = offerInitial.filter(res => operator?.id == res?.operateur?.id)
            if (_res1?.length > 0) { // OPERATEUR AVEC DES OFFRES
                _res1.forEach(el => {
                    _operatorOffers.push(el);
                });
            }
        }
    });

    return _operatorOffers;
}

export const filterTypePayOffer = (filter, offerInitial) => {

    let _typePayOffers = []

    if (filter?.post_p) { //OPERATEUR + POST-PAYE
        const _r = offerInitial.filter(res => res?.type?.type_paie == 2);
        _r.forEach(el => {
            _typePayOffers.push(el);
        })
    }
    if (filter?.pre_p) { //PRE-PAYE
        const _r = offerInitial.filter(res => res?.type?.type_paie == 1);
        _r.forEach(el => {
            _typePayOffers.push(el);
        })
    }

    return _typePayOffers;
}

export const filterBudgetOffer = (filter, offerInitial) => {
    // alert('ok')
    let _budgetOffers = [];
    const _r = offerInitial.filter(res => ((filter?.budg_min <= res?.prix) && (res?.prix <= filter?.budg_max)));
    _r.forEach(el => {
        _budgetOffers.push(el);
    });
    return _budgetOffers;
}

export const filterCallOffer = (filter, offerInitial) => {

    // alert('ok')
    let _callOffers = [];
    const _r = offerInitial.filter(res => {
        return res?.services.some(service => {
            if (service?.fixe !== undefined && service?.debit === undefined) {
                if (filter?.call_volume_max != -1) {
                    return (filter?.call_volume_min <= service?.volume) && (service?.volume <= filter?.call_volume_max);
                } else {
                    return (filter?.call_volume_min <= service?.volume)
                }
            }
            return false;
        });
    });
    _r.forEach(el => {
        _callOffers.push(el);
    })

    return _callOffers
}

export const filterSMSOffer = (filter, offerInitial) => {
    let _smsOffers = [];
    const _r = offerInitial.filter(res => {
        return res?.services.some(service => {
            if (service?.fixe === undefined && service?.debit === undefined) {
                if (filter?.nb_sms_max != -1) {
                    return (filter?.nb_sms_min <= service?.volume) && (service?.volume <= filter?.nb_sms_max);
                } else {
                    return (filter?.nb_sms_min <= service?.volume)
                }
            }
            return false;
        });
    });
    _r.forEach(el => {
        _smsOffers.push(el);
    })

    return _smsOffers
}

export const filterDataOffer = (filter, offerInitial) => {
    let _dataOffers = [];
    const _r = offerInitial.filter(res => {
        return res?.services.some(service => {
            if (service?.fixe != undefined && service?.debit != undefined) {
                if (filter?.nb_sms_max != -1) {
                    return (filter?.data_volume_min <= service?.volume) && (service?.volume <= filter?.data_volume_max);
                } else {
                    return (filter?.data_volume_min <= service?.volume)
                }
            }
            return false;
        });
    });
    _r.forEach(el => {
        _dataOffers.push(el);
    })

    return _dataOffers
}

export const filterPeriodicOffer = (filter, offerInitial) => {
    let _periodOffers = [];

    if (filter?.f_day) {
        const _r = offerInitial.filter(res => res?.type?.duree_value < 7);
        _r.forEach(el => {
            _periodOffers.push(el);
        })
    }
    if (filter?.f_week) {
        const _r1 = offerInitial.filter(res => (7 < res?.type?.duree_value) && (res?.type?.duree_value < 30));
        _r1.forEach(el => {
            _periodOffers.push(el);
        })
    }
    if (filter?.f_month) {
        const _r2 = offerInitial.filter(res => 30 < res?.type?.duree_value);
        _r2.forEach(el => {
            _periodOffers.push(el);
        })
    }

    return _periodOffers;
}

export const filterPerimeter = (filter, offerInitial) => {
    let _perimeterOffers = []
    if (filter?.national) {
        const _r1 = offerInitial.filter(res => res?.perimetre == 1);
        _r1.forEach(el => {
            _perimeterOffers.push(el);
        });
    }
    if (filter?.international) {
        const _r2 = offerInitial.filter(res => res?.perimetre == 2);
        _r2.forEach(el => {
            _perimeterOffers.push(el);
        });
    }
    if (filter?.roaming) {
        const _r3 = offerInitial.filter(res => res?.perimetre == 3);
        _r3.forEach(el => {
            _perimeterOffers.push(el);
        });
    }

    return _perimeterOffers;
}

export const generalOfferFilter = (filter, offerInitial, operators = null) => {

    if(offerInitial?.length > 0){

        if (Object.keys(filter).length > 0) {
            let _offers = [];
    
            let _opSelcted = false;
            if (operators?.length > 0) {
                operators.forEach(operator => { // Recherche de l'existance d'une selection d'opérateur(s)
                    if (filter?.['OP-' + operator?.nom]) {
                        _opSelcted = true;
                    }
                });
            }
    
            if (_opSelcted) {// Au moins un opérateur est sélectionné
                const _op_offers = filterOperateurOffer(operators, filter, offerInitial,);
                if (_op_offers?.length > 0) {// Au moins une offre est rétournné
                    if (filter?.post_p || filter?.pre_p) { //OPERATEUR + TYPE-PAIE
                        const _opTypePayOfers = filterTypePayOffer(filter, _op_offers);
                        if (_opTypePayOfers?.length > 0) {// Au moins une offre est rétournné
                            if (filter?.budg_min && filter?.budg_max) { //OPERATEUR + TYPE-PAIE + BUDGET
                                const _opTypeBudgetOffers = filterBudgetOffer(filter, _opTypePayOfers);
                                if (_opTypeBudgetOffers?.length > 0) {
                                    if (filter?.call_volume_min && filter?.call_volume_max) { //OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL
                                        const _opTypeCallOffers = filterCallOffer(filter, _opTypeBudgetOffers);
                                        if (_opTypeCallOffers?.length > 0) {
                                            if (filter?.nb_sms_min && filter?.nb_sms_max) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME SMS
                                                const _opTypeCallSmsOffers = filterSMSOffer(filter, _opTypeCallOffers);
                                                if (_opTypeCallSmsOffers?.length > 0) {
                                                    if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA
                                                        const _optypeCallSmsDataOffers = filterDataOffer(filter, _opTypeCallOffers);
                                                        if (_optypeCallSmsDataOffers?.length > 0) {
                                                            if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIODE
                                                                const _opTypeCallSmsDataPeriodOffers = filterPeriodicOffer(filter, _optypeCallSmsDataOffers);
                                                                if (_opTypeCallSmsDataPeriodOffers?.length > 0) {
                                                                    if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIODE + PERIMETRE
                                                                        const _opTypeCallSmsDataPeriodPerimeterOffers = filterPerimeter(filter, _opTypeCallSmsDataPeriodOffers);
                                                                        if (_opTypeCallSmsDataPeriodPerimeterOffers?.length > 0) {
                                                                            _offers = _opTypeCallSmsDataPeriodPerimeterOffers;
                                                                        }
                                                                    }
                                                                    else {
                                                                        _offers = _opTypeCallSmsDataPeriodOffers;
                                                                    }
                                                                }
                                                            }
                                                            else if (filter?.national || filter?.international || filter?.roaming) { //OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIMETRE
                                                                const _opTypeCallSmsDataPerimeterOffers = filterPerimeter(filter, _optypeCallSmsDataOffers);
                                                                if (_opTypeCallSmsDataPerimeterOffers?.length > 0) {
                                                                    _offers = _opTypeCallSmsDataPerimeterOffers;
                                                                }
                                                            }
                                                            else {
                                                                _offers = _optypeCallSmsDataOffers;
                                                            }
                                                        }
                                                    }
                                                    else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + PERIODE
                                                        const _opTypeCallSmsPeriodOffers = filterPeriodicOffer(filter, _opTypeCallSmsOffers);
                                                        if (_opTypeCallSmsPeriodOffers?.length > 0) {
                                                            if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + PERIODE + PERIMETRE
                                                                const _opTypeCallSmsPeriodPerimeterOffers = filterPerimeter(filter, _opTypeCallSmsPeriodOffers)
                                                                if (_opTypeCallSmsPeriodPerimeterOffers?.length > 0) {
                                                                    _offers = _opTypeCallSmsPeriodPerimeterOffers;
                                                                }
                                                            }
                                                            else {
                                                                _offers = _opTypeCallSmsPeriodOffers;
                                                            }
                                                        }
                                                    }
                                                    else if (filter?.national || filter?.international || filter?.roaming) {
                                                        const _opTypeCallSmsPerimeterOffers = filterPerimeter(filter, _opTypeCallSmsOffers);
                                                        if (_opTypeCallSmsPerimeterOffers?.length > 0) {
                                                            _offers = _opTypeCallSmsPerimeterOffers;
                                                        }
                                                    }
                                                    else {
                                                        _offers = _opTypeCallSmsOffers;
                                                    }
                                                }
                                            }
                                            else if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME DATA
                                                const _opTypeCallDataOffers = filterDataOffer(filter, _opTypeCallOffers);
                                                if (_opTypeCallDataOffers?.length > 0) {
                                                    if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME DATA + PERIODE
                                                        const _opTypeCallDataPeriodOffers = filterPeriodicOffer(filter, _opTypeCallDataOffers);
                                                        if (_opTypeCallDataPeriodOffers?.length > 0) {
                                                            if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME DATA + PERIODE + PERIMETRE
                                                                const _opTypeCallDataPeriodPerimeterOffers = filterPerimeter(filter, _opTypeCallDataPeriodOffers);
                                                                if (_opTypeCallDataPeriodPerimeterOffers?.length > 0) {
                                                                    _offers = _opTypeCallDataPeriodPerimeterOffers;
                                                                }
                                                            }
                                                            else {
                                                                _offers = _opTypeCallDataPeriodOffers;
                                                            }
                                                        }
                                                    }
                                                    else if (filter?.national || filter?.international || filter?.roaming) {
                                                        const _opTypeCallDataPerimeterOffers = filterPerimeter(filter, _opTypeCallDataOffers);
                                                        if (_opTypeCallDataPerimeterOffers?.length > 0) {
                                                            _offers = _opTypeCallDataPerimeterOffers;
                                                        }
                                                    }
                                                    else {
                                                        _offers = _opTypeCallDataOffers;
                                                    }
                                                }
                                            }
                                            else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + PERIOD
                                                const _opTypeCallPeriodOffers = filterPeriodicOffer(filter, _opTypeCallOffers);
                                                if (_opTypeCallPeriodOffers?.length > 0) {
                                                    if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + PERIOD + PERIMETRE
                                                        const _opTypeCallPeriodPerimeterOffers = filterPerimeter(filter, _opTypeCallPeriodOffers);
                                                        if (_opTypeCallPeriodPerimeterOffers?.length > 0) {
                                                            _offers = _opTypeCallPeriodPerimeterOffers;
                                                        }
    
                                                    }
                                                    else {
                                                        _offers = _opTypeCallPeriodOffers;
                                                    }
                                                }
                                            }
                                            else if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + PERIMETRE
                                                const _opTypeCallPerimeterOffers = filterPerimeter(filter, _opTypeCallOffers);
                                                if (_opTypeCallPerimeterOffers?.length > 0) {
                                                    _offers = _opTypeCallPerimeterOffers;
                                                }
                                            }
                                            else {
                                                _offers = _opTypeCallOffers;
                                            }
                                        }
                                    }
                                    else {
                                        _offers = _opTypeBudgetOffers;
                                    }
                                }
                            }
                            else if (filter?.call_volume_min && filter?.call_volume_max) { //OPERATEUR + TYPE-PAIE + VOLUME APPEL
                                const _opTypeCallOffers = filterCallOffer(filter, _opTypePayOfers);
                                if (_opTypeCallOffers?.length > 0) {
                                    if (filter?.nb_sms_min && filter?.nb_sms_max) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME SMS
                                        const _opTypeCallSmsOffers = filterSMSOffer(filter, _opTypeCallOffers);
                                        if (_opTypeCallSmsOffers?.length > 0) {
                                            if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME SMS + VOLUME DATA
                                                const _optypeCallSmsDataOffers = filterDataOffer(filter, _opTypeCallOffers);
                                                if (_optypeCallSmsDataOffers?.length > 0) {
                                                    if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIODE
                                                        const _opTypeCallSmsDataPeriodOffers = filterPeriodicOffer(filter, _optypeCallSmsDataOffers);
                                                        if (_opTypeCallSmsDataPeriodOffers?.length > 0) {
                                                            if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIODE + PERIMETRE
                                                                const _opTypeCallSmsDataPeriodPerimeterOffers = filterPerimeter(filter, _opTypeCallSmsDataPeriodOffers);
                                                                if (_opTypeCallSmsDataPeriodPerimeterOffers?.length > 0) {
                                                                    _offers = _opTypeCallSmsDataPeriodPerimeterOffers;
                                                                }
                                                            }
                                                            else {
                                                                _offers = _opTypeCallSmsDataPeriodOffers;
                                                            }
                                                        }
                                                    }
                                                    else if (filter?.national || filter?.international || filter?.roaming) { //OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIMETRE
                                                        const _opTypeCallSmsDataPerimeterOffers = filterPerimeter(filter, _optypeCallSmsDataOffers);
                                                        if (_opTypeCallSmsDataPerimeterOffers?.length > 0) {
                                                            _offers = _opTypeCallSmsDataPerimeterOffers;
                                                        }
                                                    }
                                                    else {
                                                        _offers = _optypeCallSmsDataOffers;
                                                    }
                                                }
                                            }
                                            else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME SMS + PERIODE
                                                const _opTypeCallSmsPeriodOffers = filterPeriodicOffer(filter, _opTypeCallSmsOffers);
                                                if (_opTypeCallSmsPeriodOffers?.length > 0) {
                                                    if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME SMS + PERIODE + PERIMETRE
                                                        const _opTypeCallSmsPeriodPerimeterOffers = filterPerimeter(filter, _opTypeCallSmsPeriodOffers)
                                                        if (_opTypeCallSmsPeriodPerimeterOffers?.length > 0) {
                                                            _offers = _opTypeCallSmsPeriodPerimeterOffers;
                                                        }
                                                    }
                                                    else {
                                                        _offers = _opTypeCallSmsPeriodOffers;
                                                    }
                                                }
                                            }
                                            else if (filter?.national || filter?.international || filter?.roaming) {
                                                const _opTypeCallSmsPerimeterOffers = filterPerimeter(filter, _opTypeCallSmsOffers);
                                                if (_opTypeCallSmsPerimeterOffers?.length > 0) {
                                                    _offers = _opTypeCallSmsPerimeterOffers;
                                                }
                                            }
                                            else {
                                                _offers = _opTypeCallSmsOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME DATA
                                        const _opTypeCallDataOffers = filterDataOffer(filter, _opTypeCallOffers);
                                        if (_opTypeCallDataOffers?.length > 0) {
                                            if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME DATA + PERIODE
                                                const _opTypeCallDataPeriodOffers = filterPeriodicOffer(filter, _opTypeCallDataOffers);
                                                if (_opTypeCallDataPeriodOffers?.length > 0) {
                                                    if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME DATA + PERIODE + PERIMETRE
                                                        const _opTypeCallDataPeriodPerimeterOffers = filterPerimeter(filter, _opTypeCallDataPeriodOffers);
                                                        if (_opTypeCallDataPeriodPerimeterOffers?.length > 0) {
                                                            _offers = _opTypeCallDataPeriodPerimeterOffers;
                                                        }
                                                    }
                                                    else {
                                                        _offers = _opTypeCallDataPeriodOffers;
                                                    }
                                                }
                                            }
                                            else if (filter?.national || filter?.international || filter?.roaming) {
                                                const _opTypeCallDataPerimeterOffers = filterPerimeter(filter, _opTypeCallDataOffers);
                                                if (_opTypeCallDataPerimeterOffers?.length > 0) {
                                                    _offers = _opTypeCallDataPerimeterOffers;
                                                }
                                            }
                                            else {
                                                _offers = _opTypeCallDataOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + PERIOD
                                        const _opTypeCallPeriodOffers = filterPeriodicOffer(filter, _opTypeCallOffers);
                                        if (_opTypeCallPeriodOffers?.length > 0) {
                                            if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + PERIOD + PERIMETRE
                                                const _opTypeCallPeriodPerimeterOffers = filterPerimeter(filter, _opTypeCallPeriodOffers);
                                                if (_opTypeCallPeriodPerimeterOffers?.length > 0) {
                                                    _offers = _opTypeCallPeriodPerimeterOffers;
                                                }
    
                                            }
                                            else {
                                                _offers = _opTypeCallPeriodOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + PERIMETRE
                                        const _opTypeCallPerimeterOffers = filterPerimeter(filter, _opTypeCallOffers);
                                        if (_opTypeCallPerimeterOffers?.length > 0) {
                                            _offers = _opTypeCallPerimeterOffers;
                                        }
                                    }
                                    else {
                                        _offers = _opTypeCallOffers;
                                    }
                                }
                            }
                            else if (filter?.nb_sms_min && filter?.nb_sms_max) {//OPERATEUR + TYPE-PAIE + VOLUME SMS
                                const _opTypePaySmsOfers = filterSMSOffer(filter, _opTypePayOfers);
                                if (_opTypePaySmsOfers?.length > 0) {
                                    if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + TYPE-PAIE + VOLUME SMS + VOLUME DATA
                                        const _opTypePaySmsDataOfers = filterDataOffer(filter, _opTypePaySmsOfers);
                                        if (_opTypePaySmsDataOfers?.length > 0) {
                                            if (filter?.f_day || filter?.f_week || filter?.f_month) { //OPERATEUR + TYPE-PAIE + VOLUME SMS + VOLUME DATA + PERIODE
                                                const _opTypePaySmsDataPeriodOfers = filterPeriodicOffer(filter, _opTypePaySmsDataOfers);
                                                if (_opTypePaySmsDataPeriodOfers?.length > 0) {
                                                    if (filter?.national || filter?.international || filter?.roaming) {  //OPERATEUR + TYPE-PAIE + VOLUME SMS + VOLUME DATA + PERIODE + PERRIMETRE
                                                        const _opTypePaySmsDataPeriodPerimeterOfers = filterPerimeter(filter, _opTypePaySmsDataPeriodOfers);
                                                        if (_opTypePaySmsDataPeriodPerimeterOfers?.length > 0) {
                                                            _offers = _opTypePaySmsDataPeriodPerimeterOfers;
                                                        }
                                                    }
                                                    else {
                                                        _offers = _opTypePaySmsDataPeriodOfers;
                                                    }
                                                }
                                            }
                                            if (filter?.national || filter?.international || filter?.roaming) { //OPERATEUR + TYPE-PAIE + VOLUME SMS + VOLUME DATA + PERIMETRE
                                                const _opTypePaySmsDataPerimeterOfers = filterPerimeter(filter, _opTypePaySmsDataOfers);
                                                if (_opTypePaySmsDataPerimeterOfers?.length > 0) {
                                                    _offers = _opTypePaySmsDataPerimeterOfers;
                                                }
                                            }
                                            else {
                                                _offers = _opTypePaySmsDataOfers;
                                            }
                                        }
                                    }
                                    else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + VOLUME SMS + PERIODE
                                        const _opTypePaySmsPeriodOfers = filterPeriodicOffer(filter, _opTypePaySmsOfers);
                                        if (_opTypePaySmsPeriodOfers?.length > 0) {
                                            if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + VOLUME SMS + PERIODE + PERIMETRE
                                                const _opTypePaySmsPeriodPerimeterOfers = filterPerimeter(filter, _opTypePaySmsPeriodOfers);
                                                if (_opTypePaySmsPeriodPerimeterOfers?.length > 0) {
                                                    _offers = _opTypePaySmsPeriodPerimeterOfers;
                                                }
                                            }
                                            else {
                                                _offers = _opTypePaySmsOfers;
                                            }
                                        }
                                    }
                                    else if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + VOLUME SMS + PERIMETRE
                                        const _opTypePaySmsPerimeterOfers = filterPerimeter(filter, _opTypePaySmsOfers);
                                        if (_opTypePaySmsPerimeterOfers?.length > 0) {
                                            _offers = _opTypePaySmsPerimeterOfers;
                                        }
                                    }
                                    else {
                                        _offers = _opTypePaySmsOfers;
                                    }
                                }
                            }
                            else if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + TYPE-PAIE + VOLUME DATA + PERIOD
                                const _opTypePayDataOfers = filterDataOffer(filter, _opTypePayOfers);
                                if (_opTypePayDataOfers?.length > 0) {
                                    if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + VOLUME DATA + PERIOD + PERIMETRE
                                        const _opTypePayDataPeriodOfers = filterPeriodicOffer(filter, _opTypePayDataOfers);
                                        if (_opTypePayDataPeriodOfers?.length) {
                                            if (filter?.national || filter?.international || filter?.roaming) {
                                                const _opTypePayDataPeriodPermetreOfers = filterPerimeter(filter, _opTypePayDataPeriodOfers);
                                                if (_opTypePayDataPeriodPermetreOfers?.length > 0) {
                                                    _offers = _opTypePayDataPeriodPermetreOfers;
                                                }
                                            }
                                            else {
                                                _offers = _opTypePayDataPeriodOfers;
                                            }
                                        }
                                    }
                                    else if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + VOLUME DATA + PERIMETRE
                                        const _opTypePayDataPerimeterOfers = filterPerimeter(filter, _opTypePaySmsOfers);
                                        if (_opTypePayDataPerimeterOfers?.length > 0) {
                                            _offers = _opTypePayDataPerimeterOfers;
                                        }
                                    }
                                    else {
                                        _offers = _opTypePayDataOfers;
                                    }
                                }
                            }
                            else if (filter?.f_day || filter?.f_week || filter?.f_month) {
                                const _opTypePayPeriodOfers = filterPeriodicOffer(filter, _opTypePayOfers);
                                if (_opTypePayPeriodOfers?.length > 0) {
                                    if (filter?.national || filter?.international || filter?.roaming) {
                                        const _opTypePayPeriodPerimeterOfers = filterPerimeter(filter, _opTypePayPeriodOfers);
                                        if (_opTypePayPeriodPerimeterOfers?.length > 0) {
                                            _offers = _opTypePayPeriodPerimeterOfers;
                                        }
                                    }
                                    else {
                                        _offers = _opTypePayPeriodOfers;
                                    }
                                }
                            }
                            else if (filter?.national || filter?.international || filter?.roaming) {
                                const _opTypePayPerimeterOfers = filterPerimeter(filter, _opTypePayOfers);
                                if (_opTypePayPerimeterOfers?.length > 0) {
                                    _offers = _opTypePayPerimeterOfers;
                                }
                            }
                            else {
                                _offers = _opTypePayOfers;
                            }
                        }
                    }
                    else if (filter?.budg_min && filter?.budg_max) { //OPERATEUR + BUDGET
                        const _opBudgetOffers = filterBudgetOffer(filter, _op_offers);
                        if (_opBudgetOffers?.length > 0) {
                            if (filter?.call_volume_min && filter?.call_volume_max) { //OPERATEUR + BUDGET + VOLUME APPEL
                                const _opCallOffers = filterCallOffer(filter, _opBudgetOffers);
                                if (_opCallOffers?.length > 0) {
                                    if (filter?.nb_sms_min && filter?.nb_sms_max) {//OPERATEUR + BUDGET + VOLUME APPEL + VOLUME SMS
                                        const _opCallSmsOffers = filterSMSOffer(filter, _opCallOffers);
                                        if (_opCallSmsOffers?.length > 0) {
                                            if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA
                                                const _opCallSmsDataOffers = filterDataOffer(filter, _opCallOffers);
                                                if (_opCallSmsDataOffers?.length > 0) {
                                                    if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIODE
                                                        const _opCallSmsDataPeriodOffers = filterPeriodicOffer(filter, _opCallSmsDataOffers);
                                                        if (_opCallSmsDataPeriodOffers?.length > 0) {
                                                            if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIODE + PERIMETRE
                                                                const _opCallSmsDataPeriodPerimeterOffers = filterPerimeter(filter, _opCallSmsDataPeriodOffers);
                                                                if (_opCallSmsDataPeriodPerimeterOffers?.length > 0) {
                                                                    _offers = _opCallSmsDataPeriodPerimeterOffers;
                                                                }
                                                            }
                                                            else {
                                                                _offers = _opCallSmsDataPeriodOffers;
                                                            }
                                                        }
                                                    }
                                                    else if (filter?.national || filter?.international || filter?.roaming) { //OPERATEUR + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIMETRE
                                                        const _opCallSmsDataPerimeterOffers = filterPerimeter(filter, _opCallSmsDataOffers);
                                                        if (_opCallSmsDataPerimeterOffers?.length > 0) {
                                                            _offers = _opCallSmsDataPerimeterOffers;
                                                        }
                                                    }
                                                    else {
                                                        _offers = _opCallSmsDataOffers;
                                                    }
                                                }
                                            }
                                            else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + BUDGET + VOLUME APPEL + VOLUME SMS + PERIODE
                                                const _opCallSmsPeriodOffers = filterPeriodicOffer(filter, _opCallSmsOffers);
                                                if (_opCallSmsPeriodOffers?.length > 0) {
                                                    if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + BUDGET + VOLUME APPEL + VOLUME SMS + PERIODE + PERIMETRE
                                                        const _opCallSmsPeriodPerimeterOffers = filterPerimeter(filter, _opCallSmsPeriodOffers)
                                                        if (_opCallSmsPeriodPerimeterOffers?.length > 0) {
                                                            _offers = _opCallSmsPeriodPerimeterOffers;
                                                        }
                                                    }
                                                    else {
                                                        _offers = _opCallSmsPeriodOffers;
                                                    }
                                                }
                                            }
                                            else if (filter?.national || filter?.international || filter?.roaming) {
                                                const _opCallSmsPerimeterOffers = filterPerimeter(filter, _opCallSmsOffers);
                                                if (_opCallSmsPerimeterOffers?.length > 0) {
                                                    _offers = _opCallSmsPerimeterOffers;
                                                }
                                            }
                                            else {
                                                _offers = _opCallSmsOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + BUDGET + VOLUME APPEL + VOLUME DATA
                                        const _opCallDataOffers = filterDataOffer(filter, _opCallOffers);
                                        if (_opCallDataOffers?.length > 0) {
                                            if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + BUDGET + VOLUME APPEL + VOLUME DATA + PERIODE
                                                const _opCallDataPeriodOffers = filterPeriodicOffer(filter, _opCallDataOffers);
                                                if (_opCallDataPeriodOffers?.length > 0) {
                                                    if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + BUDGET + VOLUME APPEL + VOLUME DATA + PERIODE + PERIMETRE
                                                        const _opCallDataPeriodPerimeterOffers = filterPerimeter(filter, _opCallDataPeriodOffers);
                                                        if (_opCallDataPeriodPerimeterOffers?.length > 0) {
                                                            _offers = _opCallDataPeriodPerimeterOffers;
                                                        }
                                                    }
                                                    else {
                                                        _offers = _opCallDataPeriodOffers;
                                                    }
                                                }
                                            }
                                            else if (filter?.national || filter?.international || filter?.roaming) {
                                                const _opCallDataPerimeterOffers = filterPerimeter(filter, _opCallDataOffers);
                                                if (_opCallDataPerimeterOffers?.length > 0) {
                                                    _offers = _opCallDataPerimeterOffers;
                                                }
                                            }
                                            else {
                                                _offers = _opCallDataOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + BUDGET + VOLUME APPEL + PERIOD
                                        const _opCallPeriodOffers = filterPeriodicOffer(filter, _opCallOffers);
                                        if (_opCallPeriodOffers?.length > 0) {
                                            if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + BUDGET + VOLUME APPEL + PERIOD + PERIMETRE
                                                const _opCallPeriodPerimeterOffers = filterPerimeter(filter, _opCallPeriodOffers);
                                                if (_opCallPeriodPerimeterOffers?.length > 0) {
                                                    _offers = _opCallPeriodPerimeterOffers;
                                                }
    
                                            }
                                            else {
                                                _offers = _opCallPeriodOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + BUDGET + VOLUME APPEL + PERIMETRE
                                        const _opCallPerimeterOffers = filterPerimeter(filter, _opCallOffers);
                                        if (_opCallPerimeterOffers?.length > 0) {
                                            _offers = _opCallPerimeterOffers;
                                        }
                                    }
                                    else {
                                        _offers = _opCallOffers;
                                    }
                                }
                            }
                            else {
                                _offers = _opBudgetOffers;
                            }
                        }
                    }
                    else if (filter?.call_volume_min && filter?.call_volume_max) { //OPERATEUR + VOLUME APPEL
                        const _opCallOffers = filterCallOffer(filter, _op_offers);
                        if (_opCallOffers?.length > 0) {
                            if (filter?.nb_sms_min && filter?.nb_sms_max) {//OPERATEUR + VOLUME APPEL + VOLUME SMS
                                const _opCallSmsOffers = filterSMSOffer(filter, _opCallOffers);
                                if (_opCallSmsOffers?.length > 0) {
                                    if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + VOLUME APPEL + VOLUME SMS + VOLUME DATA
                                        const _opCallSmsDataOffers = filterDataOffer(filter, _opCallOffers);
                                        if (_opCallSmsDataOffers?.length > 0) {
                                            if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIODE
                                                const _opCallSmsDataPeriodOffers = filterPeriodicOffer(filter, _opCallSmsDataOffers);
                                                if (_opCallSmsDataPeriodOffers?.length > 0) {
                                                    if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIODE + PERIMETRE
                                                        const _opCallSmsDataPeriodPerimeterOffers = filterPerimeter(filter, _opCallSmsDataPeriodOffers);
                                                        if (_opCallSmsDataPeriodPerimeterOffers?.length > 0) {
                                                            _offers = _opCallSmsDataPeriodPerimeterOffers;
                                                        }
                                                    }
                                                    else {
                                                        _offers = _opCallSmsDataPeriodOffers;
                                                    }
                                                }
                                            }
                                            else if (filter?.national || filter?.international || filter?.roaming) { //OPERATEUR + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIMETRE
                                                const _opCallSmsDataPerimeterOffers = filterPerimeter(filter, _opCallSmsDataOffers);
                                                if (_opCallSmsDataPerimeterOffers?.length > 0) {
                                                    _offers = _opCallSmsDataPerimeterOffers;
                                                }
                                            }
                                            else {
                                                _offers = _opCallSmsDataOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + VOLUME APPEL + VOLUME SMS + PERIODE
                                        const _opCallSmsPeriodOffers = filterPeriodicOffer(filter, _opCallSmsOffers);
                                        if (_opCallSmsPeriodOffers?.length > 0) {
                                            if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + VOLUME APPEL + VOLUME SMS + PERIODE + PERIMETRE
                                                const _opCallSmsPeriodPerimeterOffers = filterPerimeter(filter, _opCallSmsPeriodOffers)
                                                if (_opCallSmsPeriodPerimeterOffers?.length > 0) {
                                                    _offers = _opCallSmsPeriodPerimeterOffers;
                                                }
                                            }
                                            else {
                                                _offers = _opCallSmsPeriodOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.national || filter?.international || filter?.roaming) {
                                        const _opCallSmsPerimeterOffers = filterPerimeter(filter, _opCallSmsOffers);
                                        if (_opCallSmsPerimeterOffers?.length > 0) {
                                            _offers = _opCallSmsPerimeterOffers;
                                        }
                                    }
                                    else {
                                        _offers = _opCallSmsOffers;
                                    }
                                }
                            }
                            else if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + VOLUME APPEL + VOLUME DATA
                                const _opCallDataOffers = filterDataOffer(filter, _opCallOffers);
                                if (_opCallDataOffers?.length > 0) {
                                    if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + VOLUME APPEL + VOLUME DATA + PERIODE
                                        const _opCallDataPeriodOffers = filterPeriodicOffer(filter, _opCallDataOffers);
                                        if (_opCallDataPeriodOffers?.length > 0) {
                                            if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + VOLUME APPEL + VOLUME DATA + PERIODE + PERIMETRE
                                                const _opCallDataPeriodPerimeterOffers = filterPerimeter(filter, _opCallDataPeriodOffers);
                                                if (_opCallDataPeriodPerimeterOffers?.length > 0) {
                                                    _offers = _opCallDataPeriodPerimeterOffers;
                                                }
                                            }
                                            else {
                                                _offers = _opCallDataPeriodOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.national || filter?.international || filter?.roaming) {
                                        const _opCallDataPerimeterOffers = filterPerimeter(filter, _opCallDataOffers);
                                        if (_opCallDataPerimeterOffers?.length > 0) {
                                            _offers = _opCallDataPerimeterOffers;
                                        }
                                    }
                                    else {
                                        _offers = _opCallDataOffers;
                                    }
                                }
                            }
                            else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + VOLUME APPEL + PERIOD
                                const _opCallPeriodOffers = filterPeriodicOffer(filter, _opCallOffers);
                                if (_opCallPeriodOffers?.length > 0) {
                                    if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + VOLUME APPEL + PERIOD + PERIMETRE
                                        const _opCallPeriodPerimeterOffers = filterPerimeter(filter, _opCallPeriodOffers);
                                        if (_opCallPeriodPerimeterOffers?.length > 0) {
                                            _offers = _opCallPeriodPerimeterOffers;
                                        }
    
                                    }
                                    else {
                                        _offers = _opCallPeriodOffers;
                                    }
                                }
                            }
                            else if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + VOLUME APPEL + PERIMETRE
                                const _opCallPerimeterOffers = filterPerimeter(filter, _opCallOffers);
                                if (_opCallPerimeterOffers?.length > 0) {
                                    _offers = _opCallPerimeterOffers;
                                }
                            }
                            else {
                                _offers = _opCallOffers;
                            }
                        }
                    }
                    else if (filter?.nb_sms_min && filter?.nb_sms_max) {//OPERATEUR + VOLUME SMS
                        const _opSmsOfers = filterSMSOffer(filter, _op_offers);
                        if (_opSmsOfers?.length > 0) {
                            if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + VOLUME SMS + VOLUME DATA
                                const _opSmsDataOfers = filterDataOffer(filter, _opSmsOfers);
                                if (_opSmsDataOfers?.length > 0) {
                                    if (filter?.f_day || filter?.f_week || filter?.f_month) { //OPERATEUR + VOLUME SMS + VOLUME DATA + PERIODE
                                        const _opSmsDataPeriodOfers = filterPeriodicOffer(filter, _opSmsDataOfers);
                                        if (_opSmsDataPeriodOfers?.length > 0) {
                                            if (filter?.national || filter?.international || filter?.roaming) {  //OPERATEUR + VOLUME SMS + VOLUME DATA + PERIODE + PERRIMETRE
                                                const _opSmsDataPeriodPerimeterOfers = filterPerimeter(filter, _opSmsDataPeriodOfers);
                                                if (_opSmsDataPeriodPerimeterOfers?.length > 0) {
                                                    _offers = _opSmsDataPeriodPerimeterOfers;
                                                }
                                            }
                                            else {
                                                _offers = _opSmsDataPeriodOfers;
                                            }
                                        }
                                    }
                                    if (filter?.national || filter?.international || filter?.roaming) { //OPERATEUR + VOLUME SMS + VOLUME DATA + PERIMETRE
                                        const _opSmsDataPerimeterOfers = filterPerimeter(filter, _opSmsDataOfers);
                                        if (_opSmsDataPerimeterOfers?.length > 0) {
                                            _offers = _opSmsDataPerimeterOfers;
                                        }
                                    }
                                    else {
                                        _offers = _opSmsDataOfers;
                                    }
                                }
                            }
                            else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + VOLUME SMS + PERIODE
                                const _opSmsPeriodOfers = filterPeriodicOffer(filter, _opSmsOfers);
                                if (_opSmsPeriodOfers?.length > 0) {
                                    if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + VOLUME SMS + PERIODE + PERIMETRE
                                        const _opSmsPeriodPerimeterOfers = filterPerimeter(filter, _opSmsPeriodOfers);
                                        if (_opSmsPeriodPerimeterOfers?.length > 0) {
                                            _offers = _opSmsPeriodPerimeterOfers;
                                        }
                                    }
                                    else {
                                        _offers = _opSmsOfers;
                                    }
                                }
                            }
                            else if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + VOLUME SMS + PERIMETRE
                                const _opSmsPerimeterOfers = filterPerimeter(filter, _opSmsOfers);
                                if (_opSmsPerimeterOfers?.length > 0) {
                                    _offers = _opSmsPerimeterOfers;
                                }
                            }
                            else {
                                _offers = _opSmsOfers;
                            }
                        }
                    }
                    else if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + VOLUME DATA + PERIOD
                        const _opDataOfers = filterDataOffer(filter, _op_offers);
                        if (_opDataOfers?.length > 0) {
                            if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + VOLUME DATA + PERIOD + PERIMETRE
                                const _opDataPeriodOfers = filterPeriodicOffer(filter, _opDataOfers);
                                if (_opDataPeriodOfers?.length) {
                                    if (filter?.national || filter?.international || filter?.roaming) {
                                        const _opDataPeriodPermetreOfers = filterPerimeter(filter, _opDataPeriodOfers);
                                        if (_opDataPeriodPermetreOfers?.length > 0) {
                                            _offers = _opDataPeriodPermetreOfers;
                                        }
                                    }
                                    else {
                                        _offers = _opDataPeriodOfers;
                                    }
                                }
                            }
                            else if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + VOLUME DATA + PERIMETRE
                                const _opDataPerimeterOfers = filterPerimeter(filter, _opSmsOfers);
                                if (_opDataPerimeterOfers?.length > 0) {
                                    _offers = _opDataPerimeterOfers;
                                }
                            }
                            else {
                                _offers = _opDataOfers;
                            }
                        }
                    }
                    else if (filter?.f_day || filter?.f_week || filter?.f_month) {
                        const _opPeriodOfers = filterPeriodicOffer(filter, _op_offers);
                        if (_opPeriodOfers?.length > 0) {
                            if (filter?.national || filter?.international || filter?.roaming) {
                                const _opPeriodPerimeterOfers = filterPerimeter(filter, _opPeriodOfers);
                                if (_opPeriodPerimeterOfers?.length > 0) {
                                    _offers = _opPeriodPerimeterOfers;
                                }
                            }
                            else {
                                _offers = _opPeriodOfers;
                            }
                        }
                    }
                    else if (filter?.national || filter?.international || filter?.roaming) {
                        const _opPerimeterOfers = filterPerimeter(filter, _op_offers);
                        if (_opPerimeterOfers?.length > 0) {
                            _offers = _opPerimeterOfers;
                        }
                    }
                    else {
                        _offers = _op_offers;
                    }
                }
            }
            else if (filter?.post_p || filter?.pre_p) { //OPERATEUR + TYPE-PAIE
                const _typePayOfers = filterTypePayOffer(filter, offerInitial);
                if (_typePayOfers?.length > 0) {// Au moins une offre est rétournné
                    if (filter?.budg_min != undefined && filter?.budg_max) { //OPERATEUR + TYPE-PAIE + BUDGET
                        const _typeBudgetOffers = filterBudgetOffer(filter, _typePayOfers);
                        if (_typeBudgetOffers?.length > 0) {
                            if (filter?.call_volume_min && filter?.call_volume_max) { //OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL
                                const _typeCallOffers = filterCallOffer(filter, _typeBudgetOffers);
                                if (_typeCallOffers?.length > 0) {
                                    if (filter?.nb_sms_min && filter?.nb_sms_max) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME SMS
                                        const _typeCallSmsOffers = filterSMSOffer(filter, _typeCallOffers);
                                        if (_typeCallSmsOffers?.length > 0) {
                                            if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA
                                                const _typeCallSmsDataOffers = filterDataOffer(filter, _typeCallOffers);
                                                if (_typeCallSmsDataOffers?.length > 0) {
                                                    if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIODE
                                                        const _typeCallSmsDataPeriodOffers = filterPeriodicOffer(filter, _typeCallSmsDataOffers);
                                                        if (_typeCallSmsDataPeriodOffers?.length > 0) {
                                                            if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIODE + PERIMETRE
                                                                const _typeCallSmsDataPeriodPerimeterOffers = filterPerimeter(filter, _typeCallSmsDataPeriodOffers);
                                                                if (_typeCallSmsDataPeriodPerimeterOffers?.length > 0) {
                                                                    _offers = _typeCallSmsDataPeriodPerimeterOffers;
                                                                }
                                                            }
                                                            else {
                                                                _offers = _typeCallSmsDataPeriodOffers;
                                                            }
                                                        }
                                                    }
                                                    else if (filter?.national || filter?.international || filter?.roaming) { //OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIMETRE
                                                        const _typeCallSmsDataPerimeterOffers = filterPerimeter(filter, _typeCallSmsDataOffers);
                                                        if (_typeCallSmsDataPerimeterOffers?.length > 0) {
                                                            _offers = _typeCallSmsDataPerimeterOffers;
                                                        }
                                                    }
                                                    else {
                                                        _offers = _typeCallSmsDataOffers;
                                                    }
                                                }
                                            }
                                            else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + PERIODE
                                                const _typeCallSmsPeriodOffers = filterPeriodicOffer(filter, _typeCallSmsOffers);
                                                if (_typeCallSmsPeriodOffers?.length > 0) {
                                                    if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + PERIODE + PERIMETRE
                                                        const _typeCallSmsPeriodPerimeterOffers = filterPerimeter(filter, _typeCallSmsPeriodOffers)
                                                        if (_typeCallSmsPeriodPerimeterOffers?.length > 0) {
                                                            _offers = _typeCallSmsPeriodPerimeterOffers;
                                                        }
                                                    }
                                                    else {
                                                        _offers = _typeCallSmsPeriodOffers;
                                                    }
                                                }
                                            }
                                            else if (filter?.national || filter?.international || filter?.roaming) {
                                                const _typeCallSmsPerimeterOffers = filterPerimeter(filter, _typeCallSmsOffers);
                                                if (_typeCallSmsPerimeterOffers?.length > 0) {
                                                    _offers = _typeCallSmsPerimeterOffers;
                                                }
                                            }
                                            else {
                                                _offers = _typeCallSmsOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME DATA
                                        const _typeCallDataOffers = filterDataOffer(filter, _typeCallOffers);
                                        if (_typeCallDataOffers?.length > 0) {
                                            if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME DATA + PERIODE
                                                const _typeCallDataPeriodOffers = filterPeriodicOffer(filter, _typeCallDataOffers);
                                                if (_typeCallDataPeriodOffers?.length > 0) {
                                                    if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + VOLUME DATA + PERIODE + PERIMETRE
                                                        const _typeCallDataPeriodPerimeterOffers = filterPerimeter(filter, _typeCallDataPeriodOffers);
                                                        if (_typeCallDataPeriodPerimeterOffers?.length > 0) {
                                                            _offers = _typeCallDataPeriodPerimeterOffers;
                                                        }
                                                    }
                                                    else {
                                                        _offers = _typeCallDataPeriodOffers;
                                                    }
                                                }
                                            }
                                            else if (filter?.national || filter?.international || filter?.roaming) {
                                                const _typeCallDataPerimeterOffers = filterPerimeter(filter, _typeCallDataOffers);
                                                if (_typeCallDataPerimeterOffers?.length > 0) {
                                                    _offers = _typeCallDataPerimeterOffers;
                                                }
                                            }
                                            else {
                                                _offers = _typeCallDataOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + PERIOD
                                        const _typeCallPeriodOffers = filterPeriodicOffer(filter, _typeCallOffers);
                                        if (_typeCallPeriodOffers?.length > 0) {
                                            if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + PERIOD + PERIMETRE
                                                const _TypeCallPeriodPerimeterOffers = filterPerimeter(filter, _typeCallPeriodOffers);
                                                if (_TypeCallPeriodPerimeterOffers?.length > 0) {
                                                    _offers = _TypeCallPeriodPerimeterOffers;
                                                }
    
                                            }
                                            else {
                                                _offers = _typeCallPeriodOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + BUDGET + VOLUME APPEL + PERIMETRE
                                        const _typeCallPerimeterOffers = filterPerimeter(filter, _typeCallOffers);
                                        if (_typeCallPerimeterOffers?.length > 0) {
                                            _offers = _typeCallPerimeterOffers;
                                        }
                                    }
                                    else {
                                        _offers = _typeCallOffers;
                                    }
                                }
                            }
                            else {
                                _offers = _typeBudgetOffers;
                            }
                        }
                    }
                    else if (filter?.call_volume_min && filter?.call_volume_max) { //OPERATEUR + TYPE-PAIE + VOLUME APPEL
                        const _typeCallOffers = filterCallOffer(filter, _typePayOfers);
                        if (_typeCallOffers?.length > 0) {
                            if (filter?.nb_sms_min && filter?.nb_sms_max) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME SMS
                                const _typeCallSmsOffers = filterSMSOffer(filter, _typeCallOffers);
                                if (_typeCallSmsOffers?.length > 0) {
                                    if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME SMS + VOLUME DATA
                                        const _typeCallSmsDataOffers = filterDataOffer(filter, _typeCallOffers);
                                        if (_typeCallSmsDataOffers?.length > 0) {
                                            if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIODE
                                                const _typeCallSmsDataPeriodOffers = filterPeriodicOffer(filter, _typeCallSmsDataOffers);
                                                if (_typeCallSmsDataPeriodOffers?.length > 0) {
                                                    if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIODE + PERIMETRE
                                                        const _typeCallSmsDataPeriodPerimeterOffers = filterPerimeter(filter, _typeCallSmsDataPeriodOffers);
                                                        if (_typeCallSmsDataPeriodPerimeterOffers?.length > 0) {
                                                            _offers = _typeCallSmsDataPeriodPerimeterOffers;
                                                        }
                                                    }
                                                    else {
                                                        _offers = _typeCallSmsDataPeriodOffers;
                                                    }
                                                }
                                            }
                                            else if (filter?.national || filter?.international || filter?.roaming) { //OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIMETRE
                                                const _typeCallSmsDataPerimeterOffers = filterPerimeter(filter, _typeCallSmsDataOffers);
                                                if (_typeCallSmsDataPerimeterOffers?.length > 0) {
                                                    _offers = _typeCallSmsDataPerimeterOffers;
                                                }
                                            }
                                            else {
                                                _offers = _typeCallSmsDataOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME SMS + PERIODE
                                        const _typeCallSmsPeriodOffers = filterPeriodicOffer(filter, _typeCallSmsOffers);
                                        if (_typeCallSmsPeriodOffers?.length > 0) {
                                            if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME SMS + PERIODE + PERIMETRE
                                                const _typeCallSmsPeriodPerimeterOffers = filterPerimeter(filter, _typeCallSmsPeriodOffers)
                                                if (_typeCallSmsPeriodPerimeterOffers?.length > 0) {
                                                    _offers = _typeCallSmsPeriodPerimeterOffers;
                                                }
                                            }
                                            else {
                                                _offers = _typeCallSmsPeriodOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.national || filter?.international || filter?.roaming) {
                                        const _typeCallSmsPerimeterOffers = filterPerimeter(filter, _typeCallSmsOffers);
                                        if (_typeCallSmsPerimeterOffers?.length > 0) {
                                            _offers = _typeCallSmsPerimeterOffers;
                                        }
                                    }
                                    else {
                                        _offers = _typeCallSmsOffers;
                                    }
                                }
                            }
                            else if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME DATA
                                const _typeCallDataOffers = filterDataOffer(filter, _typeCallOffers);
                                if (_typeCallDataOffers?.length > 0) {
                                    if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME DATA + PERIODE
                                        const _typeCallDataPeriodOffers = filterPeriodicOffer(filter, _typeCallDataOffers);
                                        if (_typeCallDataPeriodOffers?.length > 0) {
                                            if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + VOLUME DATA + PERIODE + PERIMETRE
                                                const _typeCallDataPeriodPerimeterOffers = filterPerimeter(filter, _typeCallDataPeriodOffers);
                                                if (_typeCallDataPeriodPerimeterOffers?.length > 0) {
                                                    _offers = _typeCallDataPeriodPerimeterOffers;
                                                }
                                            }
                                            else {
                                                _offers = _typeCallDataPeriodOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.national || filter?.international || filter?.roaming) {
                                        const _typeCallDataPerimeterOffers = filterPerimeter(filter, _typeCallDataOffers);
                                        if (_typeCallDataPerimeterOffers?.length > 0) {
                                            _offers = _typeCallDataPerimeterOffers;
                                        }
                                    }
                                    else {
                                        _offers = _typeCallDataOffers;
                                    }
                                }
                            }
                            else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + PERIOD
                                const _typeCallPeriodOffers = filterPeriodicOffer(filter, _typeCallOffers);
                                if (_typeCallPeriodOffers?.length > 0) {
                                    if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + PERIOD + PERIMETRE
                                        const _TypeCallPeriodPerimeterOffers = filterPerimeter(filter, _typeCallPeriodOffers);
                                        if (_TypeCallPeriodPerimeterOffers?.length > 0) {
                                            _offers = _TypeCallPeriodPerimeterOffers;
                                        }
    
                                    }
                                    else {
                                        _offers = _typeCallPeriodOffers;
                                    }
                                }
                            }
                            else if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + VOLUME APPEL + PERIMETRE
                                const _typeCallPerimeterOffers = filterPerimeter(filter, _typeCallOffers);
                                if (_typeCallPerimeterOffers?.length > 0) {
                                    _offers = _typeCallPerimeterOffers;
                                }
                            }
                            else {
                                _offers = _typeCallOffers;
                            }
                        }
                    }
                    else if (filter?.nb_sms_min && filter?.nb_sms_max) {//OPERATEUR + TYPE-PAIE + VOLUME SMS
                        const _TypePaySmsOfers = filterSMSOffer(filter, _typePayOfers);
                        if (_TypePaySmsOfers?.length > 0) {
                            if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + TYPE-PAIE + VOLUME SMS + VOLUME DATA
                                const _TypePaySmsDataOfers = filterDataOffer(filter, _TypePaySmsOfers);
                                if (_TypePaySmsDataOfers?.length > 0) {
                                    if (filter?.f_day || filter?.f_week || filter?.f_month) { //OPERATEUR + TYPE-PAIE + VOLUME SMS + VOLUME DATA + PERIODE
                                        const _TypePaySmsDataPeriodOfers = filterPeriodicOffer(filter, _TypePaySmsDataOfers);
                                        if (_TypePaySmsDataPeriodOfers?.length > 0) {
                                            if (filter?.national || filter?.international || filter?.roaming) {  //OPERATEUR + TYPE-PAIE + VOLUME SMS + VOLUME DATA + PERIODE + PERRIMETRE
                                                const _TypePaySmsDataPeriodPerimeterOfers = filterPerimeter(filter, _TypePaySmsDataPeriodOfers);
                                                if (_TypePaySmsDataPeriodPerimeterOfers?.length > 0) {
                                                    _offers = _TypePaySmsDataPeriodPerimeterOfers;
                                                }
                                            }
                                            else {
                                                _offers = _TypePaySmsDataPeriodOfers;
                                            }
                                        }
                                    }
                                    if (filter?.national || filter?.international || filter?.roaming) { //OPERATEUR + TYPE-PAIE + VOLUME SMS + VOLUME DATA + PERIMETRE
                                        const _TypePaySmsDataPerimeterOfers = filterPerimeter(filter, _TypePaySmsDataOfers);
                                        if (_TypePaySmsDataPerimeterOfers?.length > 0) {
                                            _offers = _TypePaySmsDataPerimeterOfers;
                                        }
                                    }
                                    else {
                                        _offers = _TypePaySmsDataOfers;
                                    }
                                }
                            }
                            else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + VOLUME SMS + PERIODE
                                const _TypePaySmsPeriodOfers = filterPeriodicOffer(filter, _TypePaySmsOfers);
                                if (_TypePaySmsPeriodOfers?.length > 0) {
                                    if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + VOLUME SMS + PERIODE + PERIMETRE
                                        const _TypePaySmsPeriodPerimeterOfers = filterPerimeter(filter, _TypePaySmsPeriodOfers);
                                        if (_TypePaySmsPeriodPerimeterOfers?.length > 0) {
                                            _offers = _TypePaySmsPeriodPerimeterOfers;
                                        }
                                    }
                                    else {
                                        _offers = _TypePaySmsOfers;
                                    }
                                }
                            }
                            else if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + VOLUME SMS + PERIMETRE
                                const _TypePaySmsPerimeterOfers = filterPerimeter(filter, _TypePaySmsOfers);
                                if (_TypePaySmsPerimeterOfers?.length > 0) {
                                    _offers = _TypePaySmsPerimeterOfers;
                                }
                            }
                            else {
                                _offers = _TypePaySmsOfers;
                            }
                        }
                    }
                    else if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + TYPE-PAIE + VOLUME DATA + PERIOD
                        const _TypePayDataOfers = filterDataOffer(filter, _typePayOfers);
                        if (_TypePayDataOfers?.length > 0) {
                            if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + TYPE-PAIE + VOLUME DATA + PERIOD + PERIMETRE
                                const _TypePayDataPeriodOfers = filterPeriodicOffer(filter, _TypePayDataOfers);
                                if (_TypePayDataPeriodOfers?.length) {
                                    if (filter?.national || filter?.international || filter?.roaming) {
                                        const _TypePayDataPeriodPermetreOfers = filterPerimeter(filter, _TypePayDataPeriodOfers);
                                        if (_TypePayDataPeriodPermetreOfers?.length > 0) {
                                            _offers = _TypePayDataPeriodPermetreOfers;
                                        }
                                    }
                                    else {
                                        _offers = _TypePayDataPeriodOfers;
                                    }
                                }
                            }
                            else if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + TYPE-PAIE + VOLUME DATA + PERIMETRE
                                const _TypePayDataPerimeterOfers = filterPerimeter(filter, _TypePaySmsOfers);
                                if (_TypePayDataPerimeterOfers?.length > 0) {
                                    _offers = _TypePayDataPerimeterOfers;
                                }
                            }
                            else {
                                _offers = _TypePayDataOfers;
                            }
                        }
                    }
                    else if (filter?.f_day || filter?.f_week || filter?.f_month) {
                        const _TypePayPeriodOfers = filterPeriodicOffer(filter, _typePayOfers);
                        if (_TypePayPeriodOfers?.length > 0) {
                            if (filter?.national || filter?.international || filter?.roaming) {
                                const _TypePayPeriodPerimeterOfers = filterPerimeter(filter, _TypePayPeriodOfers);
                                if (_TypePayPeriodPerimeterOfers?.length > 0) {
                                    _offers = _TypePayPeriodPerimeterOfers;
                                }
                            }
                            else {
                                _offers = _TypePayPeriodOfers;
                            }
                        }
                    }
                    else if (filter?.national || filter?.international || filter?.roaming) {
                        const _TypePayPerimeterOfers = filterPerimeter(filter, _typePayOfers);
                        if (_TypePayPerimeterOfers?.length > 0) {
                            _offers = _TypePayPerimeterOfers;
                        }
                    }
                    else {
                        _offers = _typePayOfers;
                    }
                }
            }
            else if (filter?.budg_min != undefined && filter?.budg_max) { //OPERATEUR + BUDGET
                const _BudgetOffers = filterBudgetOffer(filter, offerInitial);
                if (_BudgetOffers?.length > 0) {
                    if (filter?.call_volume_min && filter?.call_volume_max) { //OPERATEUR + BUDGET + VOLUME APPEL
                        const _CallOffers = filterCallOffer(filter, _BudgetOffers);
                        if (_CallOffers?.length > 0) {
                            if (filter?.nb_sms_min && filter?.nb_sms_max) {//OPERATEUR + BUDGET + VOLUME APPEL + VOLUME SMS
                                const _CallSmsOffers = filterSMSOffer(filter, _CallOffers);
                                if (_CallSmsOffers?.length > 0) {
                                    if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA
                                        const _CallSmsDataOffers = filterDataOffer(filter, _CallOffers);
                                        if (_CallSmsDataOffers?.length > 0) {
                                            if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIODE
                                                const _CallSmsDataPeriodOffers = filterPeriodicOffer(filter, _CallSmsDataOffers);
                                                if (_CallSmsDataPeriodOffers?.length > 0) {
                                                    if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIODE + PERIMETRE
                                                        const _CallSmsDataPeriodPerimeterOffers = filterPerimeter(filter, _CallSmsDataPeriodOffers);
                                                        if (_CallSmsDataPeriodPerimeterOffers?.length > 0) {
                                                            _offers = _CallSmsDataPeriodPerimeterOffers;
                                                        }
                                                    }
                                                    else {
                                                        _offers = _CallSmsDataPeriodOffers;
                                                    }
                                                }
                                            }
                                            else if (filter?.national || filter?.international || filter?.roaming) { //OPERATEUR + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIMETRE
                                                const _CallSmsDataPerimeterOffers = filterPerimeter(filter, _CallSmsDataOffers);
                                                if (_CallSmsDataPerimeterOffers?.length > 0) {
                                                    _offers = _CallSmsDataPerimeterOffers;
                                                }
                                            }
                                            else {
                                                _offers = _CallSmsDataOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + BUDGET + VOLUME APPEL + VOLUME SMS + PERIODE
                                        const _CallSmsPeriodOffers = filterPeriodicOffer(filter, _CallSmsOffers);
                                        if (_CallSmsPeriodOffers?.length > 0) {
                                            if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + BUDGET + VOLUME APPEL + VOLUME SMS + PERIODE + PERIMETRE
                                                const _CallSmsPeriodPerimeterOffers = filterPerimeter(filter, _CallSmsPeriodOffers)
                                                if (_CallSmsPeriodPerimeterOffers?.length > 0) {
                                                    _offers = _CallSmsPeriodPerimeterOffers;
                                                }
                                            }
                                            else {
                                                _offers = _CallSmsPeriodOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.national || filter?.international || filter?.roaming) {
                                        const _CallSmsPerimeterOffers = filterPerimeter(filter, _CallSmsOffers);
                                        if (_CallSmsPerimeterOffers?.length > 0) {
                                            _offers = _CallSmsPerimeterOffers;
                                        }
                                    }
                                    else {
                                        _offers = _CallSmsOffers;
                                    }
                                }
                            }
                            else if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + BUDGET + VOLUME APPEL + VOLUME DATA
                                const _CallDataOffers = filterDataOffer(filter, _CallOffers);
                                if (_CallDataOffers?.length > 0) {
                                    if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + BUDGET + VOLUME APPEL + VOLUME DATA + PERIODE
                                        const _CallDataPeriodOffers = filterPeriodicOffer(filter, _CallDataOffers);
                                        if (_CallDataPeriodOffers?.length > 0) {
                                            if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + BUDGET + VOLUME APPEL + VOLUME DATA + PERIODE + PERIMETRE
                                                const _CallDataPeriodPerimeterOffers = filterPerimeter(filter, _CallDataPeriodOffers);
                                                if (_CallDataPeriodPerimeterOffers?.length > 0) {
                                                    _offers = _CallDataPeriodPerimeterOffers;
                                                }
                                            }
                                            else {
                                                _offers = _CallDataPeriodOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.national || filter?.international || filter?.roaming) {
                                        const _CallDataPerimeterOffers = filterPerimeter(filter, _CallDataOffers);
                                        if (_CallDataPerimeterOffers?.length > 0) {
                                            _offers = _CallDataPerimeterOffers;
                                        }
                                    }
                                    else {
                                        _offers = _CallDataOffers;
                                    }
                                }
                            }
                            else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + BUDGET + VOLUME APPEL + PERIOD
                                const _CallPeriodOffers = filterPeriodicOffer(filter, _CallOffers);
                                if (_CallPeriodOffers?.length > 0) {
                                    if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + BUDGET + VOLUME APPEL + PERIOD + PERIMETRE
                                        const _CallPeriodPerimeterOffers = filterPerimeter(filter, _CallPeriodOffers);
                                        if (_CallPeriodPerimeterOffers?.length > 0) {
                                            _offers = _CallPeriodPerimeterOffers;
                                        }
    
                                    }
                                    else {
                                        _offers = _CallPeriodOffers;
                                    }
                                }
                            }
                            else if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + BUDGET + VOLUME APPEL + PERIMETRE
                                const _CallPerimeterOffers = filterPerimeter(filter, _CallOffers);
                                if (_CallPerimeterOffers?.length > 0) {
                                    _offers = _CallPerimeterOffers;
                                }
                            }
                            else {
                                _offers = _CallOffers;
                            }
                        }
                    }
                    else {
                        _offers = _BudgetOffers;
                    }
                }
            }
            else if (filter?.call_volume_min && filter?.call_volume_max) { //OPERATEUR + VOLUME APPEL
                const _CallOffers = filterCallOffer(filter, offerInitial);
                if (_CallOffers?.length > 0) {
                    if (filter?.nb_sms_min && filter?.nb_sms_max) {//OPERATEUR + VOLUME APPEL + VOLUME SMS
                        const _CallSmsOffers = filterSMSOffer(filter, _CallOffers);
                        if (_CallSmsOffers?.length > 0) {
                            if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + VOLUME APPEL + VOLUME SMS + VOLUME DATA
                                const _CallSmsDataOffers = filterDataOffer(filter, _CallOffers);
                                if (_CallSmsDataOffers?.length > 0) {
                                    if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIODE
                                        const _CallSmsDataPeriodOffers = filterPeriodicOffer(filter, _CallSmsDataOffers);
                                        if (_CallSmsDataPeriodOffers?.length > 0) {
                                            if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIODE + PERIMETRE
                                                const _CallSmsDataPeriodPerimeterOffers = filterPerimeter(filter, _CallSmsDataPeriodOffers);
                                                if (_CallSmsDataPeriodPerimeterOffers?.length > 0) {
                                                    _offers = _CallSmsDataPeriodPerimeterOffers;
                                                }
                                            }
                                            else {
                                                _offers = _CallSmsDataPeriodOffers;
                                            }
                                        }
                                    }
                                    else if (filter?.national || filter?.international || filter?.roaming) { //OPERATEUR + VOLUME APPEL + VOLUME SMS + VOLUME DATA + PERIMETRE
                                        const _CallSmsDataPerimeterOffers = filterPerimeter(filter, _CallSmsDataOffers);
                                        if (_CallSmsDataPerimeterOffers?.length > 0) {
                                            _offers = _CallSmsDataPerimeterOffers;
                                        }
                                    }
                                    else {
                                        _offers = _CallSmsDataOffers;
                                    }
                                }
                            }
                            else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + VOLUME APPEL + VOLUME SMS + PERIODE
                                const _CallSmsPeriodOffers = filterPeriodicOffer(filter, _CallSmsOffers);
                                if (_CallSmsPeriodOffers?.length > 0) {
                                    if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + VOLUME APPEL + VOLUME SMS + PERIODE + PERIMETRE
                                        const _CallSmsPeriodPerimeterOffers = filterPerimeter(filter, _CallSmsPeriodOffers)
                                        if (_CallSmsPeriodPerimeterOffers?.length > 0) {
                                            _offers = _CallSmsPeriodPerimeterOffers;
                                        }
                                    }
                                    else {
                                        _offers = _CallSmsPeriodOffers;
                                    }
                                }
                            }
                            else if (filter?.national || filter?.international || filter?.roaming) {
                                const _CallSmsPerimeterOffers = filterPerimeter(filter, _CallSmsOffers);
                                if (_CallSmsPerimeterOffers?.length > 0) {
                                    _offers = _CallSmsPerimeterOffers;
                                }
                            }
                            else {
                                _offers = _CallSmsOffers;
                            }
                        }
                    }
                    else if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + VOLUME APPEL + VOLUME DATA
                        const _CallDataOffers = filterDataOffer(filter, _CallOffers);
                        if (_CallDataOffers?.length > 0) {
                            if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + VOLUME APPEL + VOLUME DATA + PERIODE
                                const _CallDataPeriodOffers = filterPeriodicOffer(filter, _CallDataOffers);
                                if (_CallDataPeriodOffers?.length > 0) {
                                    if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + VOLUME APPEL + VOLUME DATA + PERIODE + PERIMETRE
                                        const _CallDataPeriodPerimeterOffers = filterPerimeter(filter, _CallDataPeriodOffers);
                                        if (_CallDataPeriodPerimeterOffers?.length > 0) {
                                            _offers = _CallDataPeriodPerimeterOffers;
                                        }
                                    }
                                    else {
                                        _offers = _CallDataPeriodOffers;
                                    }
                                }
                            }
                            else if (filter?.national || filter?.international || filter?.roaming) {
                                const _CallDataPerimeterOffers = filterPerimeter(filter, _CallDataOffers);
                                if (_CallDataPerimeterOffers?.length > 0) {
                                    _offers = _CallDataPerimeterOffers;
                                }
                            }
                            else {
                                _offers = _CallDataOffers;
                            }
                        }
                    }
                    else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + VOLUME APPEL + PERIOD
                        const _CallPeriodOffers = filterPeriodicOffer(filter, _CallOffers);
                        if (_CallPeriodOffers?.length > 0) {
                            if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + VOLUME APPEL + PERIOD + PERIMETRE
                                const _CallPeriodPerimeterOffers = filterPerimeter(filter, _CallPeriodOffers);
                                if (_CallPeriodPerimeterOffers?.length > 0) {
                                    _offers = _CallPeriodPerimeterOffers;
                                }
    
                            }
                            else {
                                _offers = _CallPeriodOffers;
                            }
                        }
                    }
                    else if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + VOLUME APPEL + PERIMETRE
                        const _CallPerimeterOffers = filterPerimeter(filter, _CallOffers);
                        if (_CallPerimeterOffers?.length > 0) {
                            _offers = _CallPerimeterOffers;
                        }
                    }
                    else {
                        _offers = _CallOffers;
                    }
                }
            }
            else if (filter?.nb_sms_min && filter?.nb_sms_max) {//OPERATEUR + VOLUME SMS
                const _SmsOfers = filterSMSOffer(filter, offerInitial);
                if (_SmsOfers?.length > 0) {
                    if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + VOLUME SMS + VOLUME DATA
                        const _SmsDataOfers = filterDataOffer(filter, _SmsOfers);
                        if (_SmsDataOfers?.length > 0) {
                            if (filter?.f_day || filter?.f_week || filter?.f_month) { //OPERATEUR + VOLUME SMS + VOLUME DATA + PERIODE
                                const _SmsDataPeriodOfers = filterPeriodicOffer(filter, _SmsDataOfers);
                                if (_SmsDataPeriodOfers?.length > 0) {
                                    if (filter?.national || filter?.international || filter?.roaming) {  //OPERATEUR + VOLUME SMS + VOLUME DATA + PERIODE + PERRIMETRE
                                        const _SmsDataPeriodPerimeterOfers = filterPerimeter(filter, _SmsDataPeriodOfers);
                                        if (_SmsDataPeriodPerimeterOfers?.length > 0) {
                                            _offers = _SmsDataPeriodPerimeterOfers;
                                        }
                                    }
                                    else {
                                        _offers = _SmsDataPeriodOfers;
                                    }
                                }
                            }
                            if (filter?.national || filter?.international || filter?.roaming) { //OPERATEUR + VOLUME SMS + VOLUME DATA + PERIMETRE
                                const _SmsDataPerimeterOfers = filterPerimeter(filter, _SmsDataOfers);
                                if (_SmsDataPerimeterOfers?.length > 0) {
                                    _offers = _SmsDataPerimeterOfers;
                                }
                            }
                            else {
                                _offers = _SmsDataOfers;
                            }
                        }
                    }
                    else if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + VOLUME SMS + PERIODE
                        const _SmsPeriodOfers = filterPeriodicOffer(filter, _SmsOfers);
                        if (_SmsPeriodOfers?.length > 0) {
                            if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + VOLUME SMS + PERIODE + PERIMETRE
                                const _SmsPeriodPerimeterOfers = filterPerimeter(filter, _SmsPeriodOfers);
                                if (_SmsPeriodPerimeterOfers?.length > 0) {
                                    _offers = _SmsPeriodPerimeterOfers;
                                }
                            }
                            else {
                                _offers = _SmsOfers;
                            }
                        }
                    }
                    else if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + VOLUME SMS + PERIMETRE
                        const _SmsPerimeterOfers = filterPerimeter(filter, _SmsOfers);
                        if (_SmsPerimeterOfers?.length > 0) {
                            _offers = _SmsPerimeterOfers;
                        }
                    }
                    else {
                        _offers = _SmsOfers;
                    }
                }
            }
            else if (filter?.data_volume_min && filter?.data_volume_max) {//OPERATEUR + VOLUME DATA + PERIOD
                const _DataOfers = filterDataOffer(filter, offerInitial);
                if (_DataOfers?.length > 0) {
                    if (filter?.f_day || filter?.f_week || filter?.f_month) {//OPERATEUR + VOLUME DATA + PERIOD + PERIMETRE
                        const _DataPeriodOfers = filterPeriodicOffer(filter, _DataOfers);
                        if (_DataPeriodOfers?.length) {
                            if (filter?.national || filter?.international || filter?.roaming) {
                                const _DataPeriodPermetreOfers = filterPerimeter(filter, _DataPeriodOfers);
                                if (_DataPeriodPermetreOfers?.length > 0) {
                                    _offers = _DataPeriodPermetreOfers;
                                }
                            }
                            else {
                                _offers = _DataPeriodOfers;
                            }
                        }
                    }
                    else if (filter?.national || filter?.international || filter?.roaming) {//OPERATEUR + VOLUME DATA + PERIMETRE
                        const _DataPerimeterOfers = filterPerimeter(filter, _SmsOfers);
                        if (_DataPerimeterOfers?.length > 0) {
                            _offers = _DataPerimeterOfers;
                        }
                    }
                    else {
                        _offers = _DataOfers;
                    }
                }
            }
            else if (filter?.f_day || filter?.f_week || filter?.f_month) {
                const _PeriodOfers = filterPeriodicOffer(filter, offerInitial);
                if (_PeriodOfers?.length > 0) {
                    if (filter?.national || filter?.international || filter?.roaming) {
                        const _PeriodPerimeterOfers = filterPerimeter(filter, _PeriodOfers);
                        if (_PeriodPerimeterOfers?.length > 0) {
                            _offers = _PeriodPerimeterOfers;
                        }
                    }
                    else {
                        _offers = _PeriodOfers;
                    }
                }
            }
            else if (filter?.national || filter?.international || filter?.roaming) {
                const _PerimeterOfers = filterPerimeter(filter, offerInitial);
                if (_PerimeterOfers?.length > 0) {
                    _offers = _PerimeterOfers;
                }
            }
    
            return _offers;
        }
    }

}

// `random` : générateur facultatif. Le comparateur web garde Math.random ;
// l'API publique (application mobile) passe un générateur à graine fixe pour
// que l'ordre reste stable d'une page de résultats à l'autre.
export const shuffleArray = (array, random = Math.random) => {
  const arr = [...array]; // copie pour ne pas modifier l’original
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const interleaveOffersByOperator = (offers, random = Math.random) => {
  // 1. Regrouper les offres par operatorId
  const grouped = offers.reduce((acc, item) => {
    const operatorId = item.offer.operatorId;
    if (!acc[operatorId]) acc[operatorId] = [];
    acc[operatorId].push(item);
    return acc;
  }, {});

  const operatorsOffers = shuffleArray(Object.values(grouped), random);

  // 2. Trouver le nombre max d’offres parmi les opérateurs
  const maxLength = Math.max(
    ...operatorsOffers.map(o => o.length)
  );

  // 3. Interleaving (round-robin)
  const result = [];
  for (let i = 0; i < maxLength; i++) {
    for (const opOffers of operatorsOffers) {
      if (opOffers[i]) {
        result.push(opOffers[i]);
      }
    }
  }

  return result;
}

// export const handleFilterOffer = (operators, offerInitial, setOffers, filter) => {
//     let _opSelcted = false;

//     //OFFRE OPERATEUR
//     //On essaie de récupperez les offres liées aux opérateurs sélectionné
//     let _offresOperateurs = [];
//     operators.forEach(operator => {
//         if (filter?.['OP-' + operator?.nom]) { //OPERATEURS
//             const _res1 = offerInitial.filter(res => operator?.id == res?.operateur?.id)
//             if (_res1?.length > 0) { // OPERATEUR AVEC DES OFFRES
//                 _res1.forEach(el => {
//                     _offresOperateurs.push(el);
//                 });
//                 _opSelcted = true;
//             }

//         }
//     });
//     if (_opSelcted) { // Au moins un opérateur a été sélectionné
//         //Vérification post-payé prépayé sur le resultat
//         if (_offresOperateurs?.length > 0) { // Au moins un résultat est rétourné
//             let offerOperTypePaie = [];
//             if (filter?.post_p || filter?.pre_p) {
//                 if (filter?.post_p) { //OPERATEUR + POST-PAYE
//                     const _r = _offresOperateurs.filter(res => res?.type?.type_paie == 2);
//                     _r.forEach(el => {
//                         offerOperTypePaie.push(el);
//                     })
//                 }
//                 if (filter?.pre_p) { //PRE-PAYE
//                     const _r = _offresOperateurs.filter(res => res?.type?.type_paie == 1);
//                     _r.forEach(el => {
//                         offerOperTypePaie.push(el);
//                     })
//                 }
//                 if (offerOperTypePaie?.length > 0) { //Au moins une offre retourné
//                     if (filter?.budg_min) { // OPERATEUR + TYPE_PAIE + BUDGET
//                         let offerOpTypeBudget = [];
//                         const _r1 = offerOperTypePaie.filter(res => (filter?.budg_min <= res?.prix) && (res?.prix >= filter?.budg_max));
//                         _r1.forEach(el => {
//                             offerOpTypeBudget.push(el);
//                         })
//                         if (offerOpTypeBudget?.length > 0) {//Au moins un élément réturné
//                             if (filter?.call_volume_min && filter?.call_volume_max) { //OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL
//                                 let offerOpTypeBudCallVolum = [];
//                                 const _r2 = offerOpTypeBudget.filter(res => {
//                                     res?.services.forEach(service => {
//                                         if (service?.fixe != undefined && service?.debit == undefined) {
//                                             if ((filter?.call_volume_min <= service?.volume) && (service?.volume >= filter?.call_volume_max)) {
//                                                 return res;
//                                             }
//                                         }
//                                     });
//                                 });
//                                 _r2.forEach(el => {
//                                     offerOpTypeBudCallVolum.push(el);
//                                 })
//                                 if (offerOpTypeBudCallVolum?.length > 0) {//Au moins un élément réturné
//                                     if (filter?.nb_sms_min) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS
//                                         let offerOpTypeBudCallSms = [];
//                                         const _r3 = offerOpTypeBudCallVolum.filter(res => {
//                                             res?.services.forEach(service => {
//                                                 if (service?.fixe != undefined && service?.debit == undefined) {
//                                                     if ((filter?.nb_sms_min <= service?.volume) && (service?.volume >= filter?.nb_sms_min)) {
//                                                         return res;
//                                                     }
//                                                 }
//                                             });
//                                         });
//                                         _r3.forEach(el => {
//                                             offerOpTypeBudCallSms.push(el);
//                                         })
//                                         if (offerOpTypeBudCallSms?.length > 0) {//Au moins un élément réturné
//                                             if (filter?.data_volume_min) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA
//                                                 let offerOpTypeBudCallSmsData = [];
//                                                 const _r4 = offerOpTypeBudCallSms.filter(res => {
//                                                     res?.services.forEach(service => {
//                                                         if (service?.fixe != undefined && service?.debit != undefined) {
//                                                             if ((filter?.data_volume_min <= service?.volume) && (service?.volume >= filter?.data_volume_min)) {
//                                                                 return res;
//                                                             }
//                                                         }
//                                                     });
//                                                 });
//                                                 _r4.forEach(el => {
//                                                     offerOpTypeBudCallSmsData.push(el);
//                                                 })
//                                                 if (offerOpTypeBudCallSmsData?.length > 0) {//Au moins un élément réturné
//                                                     if (filter?.f_day) { //OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY
//                                                         let offerOpTypeBudCallSmsDataDay = [];
//                                                         const _r5 = offerOpTypeBudCallSmsData.filter(res => res?.type?.duree_value < 7);
//                                                         _r5.forEach(el => {
//                                                             offerOpTypeBudCallSmsDataDay.push(el);
//                                                         })
//                                                         if (offerOpTypeBudCallSmsDataDay?.length > 0) {//Au moins un élément réturné
//                                                             if (filter?.f_week) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK
//                                                                 let offerOpTypeBudCallSmsDataDayWeek = [];
//                                                                 const _r6 = offerOpTypeBudCallSmsDataDay.filter(res => ((7 < res?.type?.duree_value) && (res?.type?.duree_value < 30)));
//                                                                 _r6.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDataDayWeek.push(el);
//                                                                 })
//                                                                 if (offerOpTypeBudCallSmsDataDayWeek?.length > 0) {//Au moins un élément réturné
//                                                                     if (filter?.f_month) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH
//                                                                         let offerOpTypeBudCallSmsDataDayWeekMonth = [];
//                                                                         const _r7 = offerOpTypeBudCallSmsDataDayWeek.filter(res => 30 < res?.type?.duree_value);
//                                                                         _r7.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataDayWeekMonth.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataDayWeekMonth?.length > 0) {//Au moins un élément réturné
//                                                                             if (filter?.national) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH + NATIONAL
//                                                                                 let offerOpTypeBudCallSmsDataDayWeekMonthNat = [];
//                                                                                 const _r8 = offerOpTypeBudCallSmsDataDayWeekMonth.filter(res => res?.perimetre == 1);
//                                                                                 _r8.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDataDayWeekMonthNat.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDataDayWeekMonthNat?.length > 0) {//Au moins un élément réturné
//                                                                                     if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH + NATIONAL + INTERNATIONAL
//                                                                                         let offerOpTypeBudCallSmsDataDayWeekMonthNatInter = [];
//                                                                                         const _r9 = offerOpTypeBudCallSmsDataDayWeekMonthNat.filter(res => res?.perimetre == 2);
//                                                                                         _r9.forEach(el => {
//                                                                                             offerOpTypeBudCallSmsDataDayWeekMonthNatInter.push(el);
//                                                                                         });
//                                                                                         if (offerOpTypeBudCallSmsDataDayWeekMonthNatInter?.length > 0) {//Au moins un élément réturné
//                                                                                             if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH + NATIONAL + INTERNATIONAL + ROAMING
//                                                                                                 let offerOpTypeBudCallSmsDataDayWeekMonthNatInterRoaming = [];
//                                                                                                 const _r10 = offerOpTypeBudCallSmsDataDayWeekMonthNatInter.filter(res => res?.perimetre == 3);
//                                                                                                 _r10.forEach(el => {
//                                                                                                     offerOpTypeBudCallSmsDataDayWeekMonthNatInterRoaming.push(el);
//                                                                                                 });
//                                                                                                 if (offerOpTypeBudCallSmsDataDayWeekMonthNatInterRoaming?.length > 0) {
//                                                                                                     setOffers(offerOpTypeBudCallSmsDataDayWeekMonthNatInterRoaming);
//                                                                                                 }
//                                                                                                 else {
//                                                                                                     setOffers([]);
//                                                                                                 }
//                                                                                             }
//                                                                                         }
//                                                                                         else {
//                                                                                             setOffers([]);
//                                                                                         }
//                                                                                     }
//                                                                                     else if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH + NATIONAL + ROAMING
//                                                                                         let offerOpTypeBudCallSmsDataDayWeekMonthNatRoaming = [];
//                                                                                         const _r10 = offerOpTypeBudCallSmsDataDayWeekMonthNat.filter(res => res?.perimetre == 3);
//                                                                                         _r10.forEach(el => {
//                                                                                             offerOpTypeBudCallSmsDataDayWeekMonthNatRoaming.push(el);
//                                                                                         });
//                                                                                         if (offerOpTypeBudCallSmsDataDayWeekMonthNatRoaming?.length > 0) {
//                                                                                             setOffers(offerOpTypeBudCallSmsDataDayWeekMonthNatRoaming);
//                                                                                         }
//                                                                                         else {
//                                                                                             setOffers([]);
//                                                                                         }
//                                                                                     }
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }
//                                                                             else if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH + NATIONAL + INTERNATIONAL
//                                                                                 let offerOpTypeBudCallSmsDataDayWeekMonthInter = [];
//                                                                                 const _r9 = offerOpTypeBudCallSmsDataDayWeekMonth.filter(res => res?.perimetre == 2);
//                                                                                 _r9.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDataDayWeekMonthInter.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDataDayWeekMonthInter?.length > 0) {//Au moins un élément réturné
//                                                                                     if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH + INTERNATIONAL + ROAMING
//                                                                                         let offerOpTypeBudCallSmsDataDayWeekMonthInterRoaming = [];
//                                                                                         const _r10 = offerOpTypeBudCallSmsDataDayWeekMonthInter.filter(res => res?.perimetre == 3);
//                                                                                         _r10.forEach(el => {
//                                                                                             offerOpTypeBudCallSmsDataDayWeekMonthInterRoaming.push(el);
//                                                                                         });
//                                                                                         if (offerOpTypeBudCallSmsDataDayWeekMonthInterRoaming?.length > 0) {
//                                                                                             setOffers(offerOpTypeBudCallSmsDataDayWeekMonthInterRoaming);
//                                                                                         }
//                                                                                         else {
//                                                                                             setOffers([]);
//                                                                                         }
//                                                                                     }
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }
//                                                                             else if (filter?.roaming) {
//                                                                                 if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH + ROAMING
//                                                                                     let offerOpTypeBudCallSmsDataDayWeekMonthRoaming = [];
//                                                                                     const _r10 = offerOpTypeBudCallSmsDataDayWeekMonth.filter(res => res?.perimetre == 3);
//                                                                                     _r10.forEach(el => {
//                                                                                         offerOpTypeBudCallSmsDataDayWeekMonthRoaming.push(el);
//                                                                                     });
//                                                                                     if (offerOpTypeBudCallSmsDataDayWeekMonthRoaming?.length > 0) {
//                                                                                         setOffers(offerOpTypeBudCallSmsDataDayWeekMonthRoaming);
//                                                                                     }
//                                                                                     else {
//                                                                                         setOffers([]);
//                                                                                     }
//                                                                                 }
//                                                                             }
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                     else if (filter?.national) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + NATIONAL
//                                                                         let offerOpTypeBudCallSmsDataDayWeekNat = [];
//                                                                         const _r7 = offerOpTypeBudCallSmsDataDayWeek.filter(res => res?.perimetre == 1);
//                                                                         _r7.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataDayWeekNat.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataDayWeekNat?.length > 0) {//Au moins un élément réturné
//                                                                             if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + NATIONAL + INTERNATIONAL
//                                                                                 let offerOpTypeBudCallSmsDataDayWeekNatInter = [];
//                                                                                 const _r8 = offerOpTypeBudCallSmsDataDayWeekNat.filter(res => res?.perimetre == 2);
//                                                                                 _r8.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDataDayWeekNatInter.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDataDayWeekNatInter?.length > 0) {//Au moins un élément réturné
//                                                                                     if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH + NATIONAL + INTERNATIONAL + ROAMING
//                                                                                         let offerOpTypeBudCallSmsDataDayWeekNatInterRoaming = [];
//                                                                                         const _r9 = offerOpTypeBudCallSmsDataDayWeekNatInter.filter(res => res?.perimetre == 3);
//                                                                                         _r9.forEach(el => {
//                                                                                             offerOpTypeBudCallSmsDataDayWeekNatInterRoaming.push(el);
//                                                                                         });
//                                                                                         if (offerOpTypeBudCallSmsDataDayWeekNatInterRoaming?.length > 0) {
//                                                                                             setOffers(offerOpTypeBudCallSmsDataDayWeekNatInterRoaming);
//                                                                                         }
//                                                                                         else {
//                                                                                             setOffers([]);
//                                                                                         }
//                                                                                     }
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }
//                                                                             else if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + NATIONAL + ROAMING
//                                                                                 let offerOpTypeBudCallSmsDataDayWeekNatRoaming = [];
//                                                                                 const _r8 = offerOpTypeBudCallSmsDataDayWeekNat.filter(res => res?.perimetre == 3);
//                                                                                 _r8.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDataDayWeekNatRoaming.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDataDayWeekNatRoaming?.length > 0) {
//                                                                                     setOffers(offerOpTypeBudCallSmsDataDayWeekNatRoaming);
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }

//                                                                         } else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                     else if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + INTERNATIONAL
//                                                                         let offerOpTypeBudCallSmsDataDayWeekInter = [];
//                                                                         const _r7 = offerOpTypeBudCallSmsDataDayWeek.filter(res => res?.perimetre == 2);
//                                                                         _r7.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataDayWeekInter.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataDayWeekInter?.length > 0) {//Au moins un élément réturné
//                                                                             if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + INTERNATIONAL + ROAMING
//                                                                                 let offerOpTypeBudCallSmsDataDayWeekInterRoaming = [];
//                                                                                 const _r8 = offerOpTypeBudCallSmsDataDayWeekInter.filter(res => res?.perimetre == 3);
//                                                                                 _r8.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDataDayWeekInterRoaming.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDataDayWeekInterRoaming?.length > 0) {
//                                                                                     setOffers(offerOpTypeBudCallSmsDataDayWeekNatInterRoaming);
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                     else if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + ROAMING
//                                                                         let offerOpTypeBudCallSmsDataDayWeekRoaming = [];
//                                                                         const _r8 = offerOpTypeBudCallSmsDataDayWeek.filter(res => res?.perimetre == 3);
//                                                                         _r8.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataDayWeekRoaming.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataDayWeekRoaming?.length > 0) {
//                                                                             setOffers(offerOpTypeBudCallSmsDataDayWeekNatRoaming);
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                             else if (filter?.f_month) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + MONTH
//                                                                 let offerOpTypeBudCallSmsDataDayMonth = [];
//                                                                 const _r6 = offerOpTypeBudCallSmsDataDay.filter(res => 30 < res?.type?.duree_value);
//                                                                 _r6.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDataDayMonth.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDataDayMonth?.length > 0) {//Au moins un élément réturné
//                                                                     if (filter?.national) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + MONTH + NATIONAL
//                                                                         let offerOpTypeBudCallSmsDataDayMonthNat = [];
//                                                                         const _r7 = offerOpTypeBudCallSmsDataDayMonth.filter(res => res?.perimetre == 1);
//                                                                         _r7.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataDayMonthNat.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataDayMonthNat?.length > 0) {//Au moins un élément réturné
//                                                                             if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH + NATIONAL + INTERNATIONAL
//                                                                                 let offerOpTypeBudCallSmsDataDayMonthNatInter = [];
//                                                                                 const _r8 = offerOpTypeBudCallSmsDataDayMonthNat.filter(res => res?.perimetre == 2);
//                                                                                 _r8.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDataDayMonthNatInter.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDataDayMonthNatInter?.length > 0) {//Au moins un élément réturné
//                                                                                     if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH + NATIONAL + INTERNATIONAL + ROAMING
//                                                                                         let offerOpTypeBudCallSmsDataDayMonthNatInterRoaming = [];
//                                                                                         const _r9 = offerOpTypeBudCallSmsDataDayMonthNatInter.filter(res => res?.perimetre == 3);
//                                                                                         _r9.forEach(el => {
//                                                                                             offerOpTypeBudCallSmsDataDayMonthNatInterRoaming.push(el);
//                                                                                         });
//                                                                                         if (offerOpTypeBudCallSmsDataDayMonthNatInterRoaming?.length > 0) {
//                                                                                             setOffers(offerOpTypeBudCallSmsDataDayMonthNatInterRoaming);
//                                                                                         }
//                                                                                         else {
//                                                                                             setOffers([]);
//                                                                                         }
//                                                                                     }
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }
//                                                                             else if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + NATIONAL + ROAMING
//                                                                                 let offerOpTypeBudCallSmsDataDayMonthNatRoaming = [];
//                                                                                 const _r10 = offerOpTypeBudCallSmsDataDayMonthNat.filter(res => res?.perimetre == 3);
//                                                                                 _r10.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDataDayMonthNatRoaming.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDataDayMonthNatRoaming?.length > 0) {
//                                                                                     setOffers(offerOpTypeBudCallSmsDataDayMonthNatRoaming);
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                     else if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + MONTH + NATIONAL + INTERNATIONAL
//                                                                         let offerOpTypeBudCallSmsDataDayMonthMonthInter = [];
//                                                                         const _r9 = offerOpTypeBudCallSmsDataDayMonthMonth.filter(res => res?.perimetre == 2);
//                                                                         _r9.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataDayMonthMonthInter.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataDayMonthMonthInter?.length > 0) {//Au moins un élément réturné
//                                                                             if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + MONTH + INTERNATIONAL + ROAMING
//                                                                                 let offerOpTypeBudCallSmsDataDayMonthMonthInterRoaming = [];
//                                                                                 const _r10 = offerOpTypeBudCallSmsDataDayMonthMonthInter.filter(res => res?.perimetre == 3);
//                                                                                 _r10.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDataDayMonthMonthInterRoaming.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDataDayMonthMonthInterRoaming?.length > 0) {
//                                                                                     setOffers(offerOpTypeBudCallSmsDataDayMonthMonthInterRoaming);
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                     else if (filter?.roaming) {
//                                                                         if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + MONTH + ROAMING
//                                                                             let offerOpTypeBudCallSmsDataDayMonthRoaming = [];
//                                                                             const _r10 = offerOpTypeBudCallSmsDataDayMonth.filter(res => res?.perimetre == 3);
//                                                                             _r10.forEach(el => {
//                                                                                 offerOpTypeBudCallSmsDataDayMonthRoaming.push(el);
//                                                                             });
//                                                                             if (offerOpTypeBudCallSmsDataDayMonthRoaming?.length > 0) {
//                                                                                 setOffers(offerOpTypeBudCallSmsDataDayMonthRoaming);
//                                                                             }
//                                                                             else {
//                                                                                 setOffers([]);
//                                                                             }
//                                                                         }
//                                                                     }
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }

//                                                             }
//                                                             else if (filter?.national) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + NATIONAL
//                                                                 let offerOpTypeBudCallSmsDataDayNat = [];
//                                                                 const _r7 = offerOpTypeBudCallSmsDataDay.filter(res => res?.perimetre == 1);
//                                                                 _r7.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDataDayNat.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDataDayNat?.length > 0) {//Au moins un élément réturné
//                                                                     if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + NATIONAL + INTERNATIONAL
//                                                                         let offerOpTypeBudCallSmsDataDayNatInter = [];
//                                                                         const _r8 = offerOpTypeBudCallSmsDataDayNat.filter(res => res?.perimetre == 2);
//                                                                         _r8.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataDayNatInter.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataDayNatInter?.length > 0) {//Au moins un élément réturné
//                                                                             if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH + NATIONAL + INTERNATIONAL + ROAMING
//                                                                                 let offerOpTypeBudCallSmsDataDayNatInterRoaming = [];
//                                                                                 const _r9 = offerOpTypeBudCallSmsDataDayNatInter.filter(res => res?.perimetre == 3);
//                                                                                 _r9.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDataDayNatInterRoaming.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDataDayNatInterRoaming?.length > 0) {
//                                                                                     setOffers(offerOpTypeBudCallSmsDataDayNatInterRoaming);
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                     else if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + NATIONAL + ROAMING
//                                                                         let offerOpTypeBudCallSmsDataDayNatRoaming = [];
//                                                                         const _r10 = offerOpTypeBudCallSmsDataDayNatNat.filter(res => res?.perimetre == 3);
//                                                                         _r10.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataDayNatRoaming.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataDayNatRoaming?.length > 0) {
//                                                                             setOffers(offerOpTypeBudCallSmsDataDayNatRoaming);
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                             else if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + INTERNATIONAL
//                                                                 let offerOpTypeBudCallSmsDataDayInter = [];
//                                                                 const _r9 = offerOpTypeBudCallSmsDataDay.filter(res => res?.perimetre == 2);
//                                                                 _r9.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDataDayInter.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDataDayInter?.length > 0) {//Au moins un élément réturné
//                                                                     if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + INTERNATIONAL + ROAMING
//                                                                         let offerOpTypeBudCallSmsDataDayInterRoaming = [];
//                                                                         const _r10 = offerOpTypeBudCallSmsDataDayInter.filter(res => res?.perimetre == 3);
//                                                                         _r10.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataDayInterRoaming.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataDayInterRoaming?.length > 0) {
//                                                                             setOffers(offerOpTypeBudCallSmsDataDayInterRoaming);
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                             else if (filter?.roaming) {
//                                                                 if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + ROAMING
//                                                                     let offerOpTypeBudCallSmsDataDayRoaming = [];
//                                                                     const _r10 = offerOpTypeBudCallSmsDataDay.filter(res => res?.perimetre == 3);
//                                                                     _r10.forEach(el => {
//                                                                         offerOpTypeBudCallSmsDataDayRoaming.push(el);
//                                                                     });
//                                                                     if (offerOpTypeBudCallSmsDataDayRoaming?.length > 0) {
//                                                                         setOffers(offerOpTypeBudCallSmsDataDayRoaming);
//                                                                     }
//                                                                     else {
//                                                                         setOffers([]);
//                                                                     }
//                                                                 }
//                                                             }
//                                                         }
//                                                         else {
//                                                             setOffers([]);
//                                                         }

//                                                     }
//                                                     else if (filter?.f_week) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + WEEK
//                                                         let offerOpTypeBudCallSmsDataWeek = [];
//                                                         const _r6 = offerOpTypeBudCallSmsData.filter(res => ((7 < res?.type?.duree_value) && (res?.type?.duree_value < 30)));
//                                                         _r6.forEach(el => {
//                                                             offerOpTypeBudCallSmsDataWeek.push(el);
//                                                         })
//                                                         if (offerOpTypeBudCallSmsDataWeek?.length > 0) {//Au moins un élément réturné
//                                                             if (filter?.f_month) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH
//                                                                 let offerOpTypeBudCallSmsDataWeekMonth = [];
//                                                                 const _r7 = offerOpTypeBudCallSmsDataWeek.filter(res => 30 < res?.type?.duree_value);
//                                                                 _r7.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDataWeekMonth.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDataWeekMonth?.length > 0) {//Au moins un élément réturné
//                                                                     if (filter?.national) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + WEEK + MONTH + NATIONAL
//                                                                         let offerOpTypeBudCallSmsDataWeekMonthNat = [];
//                                                                         const _r8 = offerOpTypeBudCallSmsDataWeekMonth.filter(res => res?.perimetre == 1);
//                                                                         _r8.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataWeekMonthNat.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataWeekMonthNat?.length > 0) {//Au moins un élément réturné
//                                                                             if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA+ WEEK + MONTH + NATIONAL + INTERNATIONAL
//                                                                                 let offerOpTypeBudCallSmsDataWeekMonthNatInter = [];
//                                                                                 const _r9 = offerOpTypeBudCallSmsDataWeekMonthNat.filter(res => res?.perimetre == 2);
//                                                                                 _r9.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDataWeekMonthNatInter.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDataWeekMonthNatInter?.length > 0) {//Au moins un élément réturné
//                                                                                     if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + WEEK + MONTH + NATIONAL + INTERNATIONAL + ROAMING
//                                                                                         let offerOpTypeBudCallSmsDataWeekMonthNatInterRoaming = [];
//                                                                                         const _r10 = offerOpTypeBudCallSmsDataWeekMonthNatInter.filter(res => res?.perimetre == 3);
//                                                                                         _r10.forEach(el => {
//                                                                                             offerOpTypeBudCallSmsDataWeekMonthNatInterRoaming.push(el);
//                                                                                         });
//                                                                                         if (offerOpTypeBudCallSmsDataWeekMonthNatInterRoaming?.length > 0) {
//                                                                                             setOffers(offerOpTypeBudCallSmsDataWeekMonthNatInterRoaming);
//                                                                                         }
//                                                                                         else {
//                                                                                             setOffers([]);
//                                                                                         }
//                                                                                     }
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }
//                                                                             else if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH + NATIONAL + ROAMING
//                                                                                 let offerOpTypeBudCallSmsDataDayWeekMonthNatRoaming = [];
//                                                                                 const _r10 = offerOpTypeBudCallSmsDataDayWeekMonthNat.filter(res => res?.perimetre == 3);
//                                                                                 _r10.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDataDayWeekMonthNatRoaming.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDataDayWeekMonthNatRoaming?.length > 0) {
//                                                                                     setOffers(offerOpTypeBudCallSmsDataDayWeekMonthNatRoaming);
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                     else if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH + NATIONAL + INTERNATIONAL
//                                                                         let offerOpTypeBudCallSmsDataDayWeekMonthInter = [];
//                                                                         const _r9 = offerOpTypeBudCallSmsDataDayWeekMonth.filter(res => res?.perimetre == 2);
//                                                                         _r9.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataDayWeekMonthInter.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataDayWeekMonthInter?.length > 0) {//Au moins un élément réturné
//                                                                             if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH + INTERNATIONAL + ROAMING
//                                                                                 let offerOpTypeBudCallSmsDataDayWeekMonthInterRoaming = [];
//                                                                                 const _r10 = offerOpTypeBudCallSmsDataDayWeekMonthInter.filter(res => res?.perimetre == 3);
//                                                                                 _r10.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDataDayWeekMonthInterRoaming.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDataDayWeekMonthInterRoaming?.length > 0) {
//                                                                                     setOffers(offerOpTypeBudCallSmsDataDayWeekMonthInterRoaming);
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                     else if (filter?.roaming) {
//                                                                         if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH + ROAMING
//                                                                             let offerOpTypeBudCallSmsDataDayWeekMonthRoaming = [];
//                                                                             const _r10 = offerOpTypeBudCallSmsDataDayWeekMonth.filter(res => res?.perimetre == 3);
//                                                                             _r10.forEach(el => {
//                                                                                 offerOpTypeBudCallSmsDataDayWeekMonthRoaming.push(el);
//                                                                             });
//                                                                             if (offerOpTypeBudCallSmsDataDayWeekMonthRoaming?.length > 0) {
//                                                                                 setOffers(offerOpTypeBudCallSmsDataDayWeekMonthRoaming);
//                                                                             }
//                                                                             else {
//                                                                                 setOffers([]);
//                                                                             }
//                                                                         }
//                                                                     }
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                             else if (filter?.national) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + NATIONAL
//                                                                 let offerOpTypeBudCallSmsDataWeekNat = [];
//                                                                 const _r7 = offerOpTypeBudCallSmsDataDayWeek.filter(res => res?.perimetre == 1);
//                                                                 _r7.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDataWeekNat.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDataWeekNat?.length > 0) {//Au moins un élément réturné
//                                                                     if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + WEEK + NATIONAL + INTERNATIONAL
//                                                                         let offerOpTypeBudCallSmsDataWeekNatInter = [];
//                                                                         const _r8 = offerOpTypeBudCallSmsDataWeekNat.filter(res => res?.perimetre == 2);
//                                                                         _r8.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataWeekNatInter.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataWeekNatInter?.length > 0) {//Au moins un élément réturné
//                                                                             if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + WEEK + MONTH + NATIONAL + INTERNATIONAL + ROAMING
//                                                                                 let offerOpTypeBudCallSmsDataWeekNatInterRoaming = [];
//                                                                                 const _r9 = offerOpTypeBudCallSmsDataWeekNatInter.filter(res => res?.perimetre == 3);
//                                                                                 _r9.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDataWeekNatInterRoaming.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDataWeekNatInterRoaming?.length > 0) {
//                                                                                     setOffers(offerOpTypeBudCallSmsDataWeekNatInterRoaming);
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                     else if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + WEEK + NATIONAL + ROAMING
//                                                                         let offerOpTypeBudCallSmsDataWeekNatRoaming = [];
//                                                                         const _r8 = offerOpTypeBudCallSmsDataWeekNat.filter(res => res?.perimetre == 3);
//                                                                         _r8.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataWeekNatRoaming.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataWeekNatRoaming?.length > 0) {
//                                                                             setOffers(offerOpTypeBudCallSmsDataWeekNatRoaming);
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                 } else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                             else if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + WEEK + INTERNATIONAL
//                                                                 let offerOpTypeBudCallSmsDataDayWeekInter = [];
//                                                                 const _r7 = offerOpTypeBudCallSmsDataDayWeek.filter(res => res?.perimetre == 2);
//                                                                 _r7.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDataDayWeekInter.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDataDayWeekInter?.length > 0) {//Au moins un élément réturné
//                                                                     if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + INTERNATIONAL + ROAMING
//                                                                         let offerOpTypeBudCallSmsDataDayWeekInterRoaming = [];
//                                                                         const _r8 = offerOpTypeBudCallSmsDataDayWeekInter.filter(res => res?.perimetre == 3);
//                                                                         _r8.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataDayWeekInterRoaming.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataDayWeekInterRoaming?.length > 0) {
//                                                                             setOffers(offerOpTypeBudCallSmsDataDayWeekNatInterRoaming);
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                             else if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + WEEK + ROAMING
//                                                                 let offerOpTypeBudCallSmsDataWeekRoaming = [];
//                                                                 const _r8 = offerOpTypeBudCallSmsDataWeek.filter(res => res?.perimetre == 3);
//                                                                 _r8.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDataWeekRoaming.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDataWeekRoaming?.length > 0) {
//                                                                     setOffers(offerOpTypeBudCallSmsDataDWeekRoaming);
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                         }
//                                                         else {
//                                                             setOffers([]);
//                                                         }
//                                                     }
//                                                     else if (filter?.f_month) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + MONTH
//                                                         let offerOpTypeBudCallSmsDataMonth = [];
//                                                         const _r7 = offerOpTypeBudCallSmsData.filter(res => 30 < res?.type?.duree_value);
//                                                         _r7.forEach(el => {
//                                                             offerOpTypeBudCallSmsDataMonth.push(el);
//                                                         });
//                                                         if (offerOpTypeBudCallSmsDataMonth?.length > 0) {//Au moins un élément réturné
//                                                             if (filter?.national) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + MONTH + NATIONAL
//                                                                 let offerOpTypeBudCallSmsDataMonthNat = [];
//                                                                 const _r8 = offerOpTypeBudCallSmsDataMonth.filter(res => res?.perimetre == 1);
//                                                                 _r8.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDataMonthNat.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDataMonthNat?.length > 0) {//Au moins un élément réturné
//                                                                     if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + MONTH + NATIONAL + INTERNATIONAL
//                                                                         let offerOpTypeBudCallSmsDataMonthNatInter = [];
//                                                                         const _r9 = offerOpTypeBudCallSmsDataMonthNat.filter(res => res?.perimetre == 2);
//                                                                         _r9.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataMonthNatInter.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataMonthNatInter?.length > 0) {//Au moins un élément réturné
//                                                                             if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + MONTH + NATIONAL + INTERNATIONAL + ROAMING
//                                                                                 let offerOpTypeBudCallSmsDataMonthNatInterRoaming = [];
//                                                                                 const _r10 = offerOpTypeBudCallSmsDataMonthNatInter.filter(res => res?.perimetre == 3);
//                                                                                 _r10.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDataMonthNatInterRoaming.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDataMonthNatInterRoaming?.length > 0) {
//                                                                                     setOffers(offerOpTypeBudCallSmsDataMonthNatInterRoaming);
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                     else if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + MONTH + NATIONAL + ROAMING
//                                                                         let offerOpTypeBudCallSmsDataDayMonthNatRoaming = [];
//                                                                         const _r9 = offerOpTypeBudCallSmsDataMonthNat.filter(res => res?.perimetre == 3);
//                                                                         _r9.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataDayMonthNatRoaming.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataDayMonthNatRoaming?.length > 0) {
//                                                                             setOffers(offerOpTypeBudCallSmsDataDayMonthNatRoaming);
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                             else if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + MONTH + INTERNATIONAL
//                                                                 let offerOpTypeBudCallSmsDataMonthInter = [];
//                                                                 const _r8 = offerOpTypeBudCallSmsDataMonth.filter(res => res?.perimetre == 2);
//                                                                 _r8.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDataMonthInter.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDataMonthInter?.length > 0) {//Au moins un élément réturné
//                                                                     if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + MONTH + INTERNATIONAL + ROAMING
//                                                                         let offerOpTypeBudCallSmsDataMonthInterRoaming = [];
//                                                                         const _r10 = offerOpTypeBudCallSmsDataDayWeekMonthInter.filter(res => res?.perimetre == 3);
//                                                                         _r10.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataMonthInterRoaming.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataMonthInterRoaming?.length > 0) {
//                                                                             setOffers(offerOpTypeBudCallSmsDataMonthInterRoaming);
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                             else if (filter?.roaming) {
//                                                                 if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + MONTH + ROAMING
//                                                                     let offerOpTypeBudCallSmsDataMonthRoaming = [];
//                                                                     const _r10 = offerOpTypeBudCallSmsDataMonth.filter(res => res?.perimetre == 3);
//                                                                     _r10.forEach(el => {
//                                                                         offerOpTypeBudCallSmsDataMonthRoaming.push(el);
//                                                                     });
//                                                                     if (offerOpTypeBudCallSmsDataMonthRoaming?.length > 0) {
//                                                                         setOffers(offerOpTypeBudCallSmsDataMonthRoaming);
//                                                                     }
//                                                                     else {
//                                                                         setOffers([]);
//                                                                     }
//                                                                 }
//                                                             }
//                                                         }
//                                                         else {
//                                                             setOffers([]);
//                                                         }
//                                                     }
//                                                     else if (filter?.national) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + NATIONAL
//                                                         let offerOpTypeBudCallSmsDataNat = [];
//                                                         const _r7 = offerOpTypeBudCallSmsData.filter(res => res?.perimetre == 1);
//                                                         _r7.forEach(el => {
//                                                             offerOpTypeBudCallSmsDataNat.push(el);
//                                                         });
//                                                         if (offerOpTypeBudCallSmsDataNat?.length > 0) {//Au moins un élément réturné
//                                                             if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + NATIONAL + INTERNATIONAL
//                                                                 let offerOpTypeBudCallSmsDataNatInter = [];
//                                                                 const _r8 = offerOpTypeBudCallSmsDataNat.filter(res => res?.perimetre == 2);
//                                                                 _r8.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDataNatInter.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDataNatInter?.length > 0) {//Au moins un élément réturné
//                                                                     if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + NATIONAL + INTERNATIONAL + ROAMING
//                                                                         let offerOpTypeBudCallSmsDataNatInterRoaming = [];
//                                                                         const _r9 = offerOpTypeBudCallSmsDataNatInter.filter(res => res?.perimetre == 3);
//                                                                         _r9.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataNatInterRoaming.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataNatInterRoaming?.length > 0) {
//                                                                             setOffers(offerOpTypeBudCallSmsDataNatInterRoaming);
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                             else if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + NATIONAL + ROAMING
//                                                                 let offerOpTypeBudCallSmsDataDayNatRoaming = [];
//                                                                 const _r8 = offerOpTypeBudCallSmsDataNat.filter(res => res?.perimetre == 3);
//                                                                 _r8.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDataDayNatRoaming.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDataDayNatRoaming?.length > 0) {
//                                                                     setOffers(offerOpTypeBudCallSmsDataDayNatRoaming);
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                         }
//                                                         else {
//                                                             setOffers([]);
//                                                         }
//                                                     }
//                                                     else if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + INTERNATIONAL
//                                                         let offerOpTypeBudCallSmsDataInter = [];
//                                                         const _r7 = offerOpTypeBudCallSmsData.filter(res => res?.perimetre == 2);
//                                                         _r7.forEach(el => {
//                                                             offerOpTypeBudCallSmsDataInter.push(el);
//                                                         });
//                                                         if (offerOpTypeBudCallSmsDataInter?.length > 0) {//Au moins un élément réturné
//                                                             if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + INTERNATIONAL + ROAMING
//                                                                 let offerOpTypeBudCallSmsDataInterRoaming = [];
//                                                                 const _r8 = offerOpTypeBudCallSmsDataInter.filter(res => res?.perimetre == 3);
//                                                                 _r8.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDataInterRoaming.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDataInterRoaming?.length > 0) {
//                                                                     setOffers(offerOpTypeBudCallSmsDataInterRoaming);
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                         }
//                                                         else {
//                                                             setOffers([]);
//                                                         }
//                                                     }
//                                                     else if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + ROAMING
//                                                         let offerOpTypeBudCallSmsDataRoaming = [];
//                                                         const _r8 = offerOpTypeBudCallSmsData.filter(res => res?.perimetre == 3);
//                                                         _r8.forEach(el => {
//                                                             offerOpTypeBudCallSmsDataRoaming.push(el);
//                                                         });
//                                                         if (offerOpTypeBudCallSmsDataRoaming?.length > 0) {
//                                                             setOffers(offerOpTypeBudCallSmsDataRoaming);
//                                                         }
//                                                         else {
//                                                             setOffers([]);
//                                                         }
//                                                     }
//                                                 }
//                                                 else {
//                                                     setOffers([]);
//                                                 }
//                                             }
//                                             else if (filter?.f_day) { //OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY
//                                                 let offerOpTypeBudCallSmsDay = [];
//                                                 const _r4 = offerOpTypeBudCallSms.filter(res => res?.type?.duree_value < 7);
//                                                 _r4.forEach(el => {
//                                                     offerOpTypeBudCallSmsDay.push(el);
//                                                 })
//                                                 if (offerOpTypeBudCallSmsDay?.length > 0) {//Au moins un élément réturné
//                                                     if (filter?.f_week) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + WEEK
//                                                         let offerOpTypeBudCallSmsDayWeek = [];
//                                                         const _r5 = offerOpTypeBudCallSmsDay.filter(res => ((7 < res?.type?.duree_value) && (res?.type?.duree_value < 30)));
//                                                         _r5.forEach(el => {
//                                                             offerOpTypeBudCallSmsDayWeek.push(el);
//                                                         })
//                                                         if (offerOpTypeBudCallSmsDayWeek?.length > 0) {//Au moins un élément réturné
//                                                             if (filter?.f_month) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + WEEK + MONTH
//                                                                 let offerOpTypeBudCallSmsDayWeekMonth = [];
//                                                                 const _r6 = offerOpTypeBudCallSmsDayWeek.filter(res => 30 < res?.type?.duree_value);
//                                                                 _r6.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDayWeekMonth.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDayWeekMonth?.length > 0) {//Au moins un élément réturné
//                                                                     if (filter?.national) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + WEEK + MONTH + NATIONAL
//                                                                         let offerOpTypeBudCallSmsDayWeekMonthNat = [];
//                                                                         const _r7 = offerOpTypeBudCallSmsDayWeekMonth.filter(res => res?.perimetre == 1);
//                                                                         _r7.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDayWeekMonthNat.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDayWeekMonthNat?.length > 0) {//Au moins un élément réturné
//                                                                             if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + WEEK + MONTH + NATIONAL + INTERNATIONAL
//                                                                                 let offerOpTypeBudCallSmsDayWeekMonthNatInter = [];
//                                                                                 const _r8 = offerOpTypeBudCallSmsDayWeekMonthNat.filter(res => res?.perimetre == 2);
//                                                                                 _r8.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDayWeekMonthNatInter.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDayWeekMonthNatInter?.length > 0) {//Au moins un élément réturné
//                                                                                     if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + WEEK + MONTH + NATIONAL + INTERNATIONAL + ROAMING
//                                                                                         let offerOpTypeBudCallSmsDayWeekMonthNatInterRoaming = [];
//                                                                                         const _r9 = offerOpTypeBudCallSmsDayWeekMonthNatInter.filter(res => res?.perimetre == 3);
//                                                                                         _r9.forEach(el => {
//                                                                                             offerOpTypeBudCallSmsDayWeekMonthNatInterRoaming.push(el);
//                                                                                         });
//                                                                                         if (offerOpTypeBudCallSmsDayWeekMonthNatInterRoaming?.length > 0) {
//                                                                                             setOffers(offerOpTypeBudCallSmsDayWeekMonthNatInterRoaming);
//                                                                                         }
//                                                                                         else {
//                                                                                             setOffers([]);
//                                                                                         }
//                                                                                     }
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }
//                                                                             else if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + WEEK + MONTH + NATIONAL + ROAMING
//                                                                                 let offerOpTypeBudCallSmsDayWeekMonthNatRoaming = [];
//                                                                                 const _r8 = offerOpTypeBudCallSmsDayWeekMonthNat.filter(res => res?.perimetre == 3);
//                                                                                 _r8.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDayWeekMonthNatRoaming.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDayWeekMonthNatRoaming?.length > 0) {
//                                                                                     setOffers(offerOpTypeBudCallSmsDayWeekMonthNatRoaming);
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                     else if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + WEEK + MONTH + NATIONAL + INTERNATIONAL
//                                                                         let offerOpTypeBudCallSmsDayWeekMonthInter = [];
//                                                                         const _r7 = offerOpTypeBudCallSmsDayWeekMonth.filter(res => res?.perimetre == 2);
//                                                                         _r7.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDayWeekMonthInter.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDayWeekMonthInter?.length > 0) {//Au moins un élément réturné
//                                                                             if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH + INTERNATIONAL + ROAMING
//                                                                                 let offerOpTypeBudCallSmsDayWeekMonthInterRoaming = [];
//                                                                                 const _r8 = offerOpTypeBudCallSmsDayWeekMonthInter.filter(res => res?.perimetre == 3);
//                                                                                 _r8.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDayWeekMonthInterRoaming.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDayWeekMonthInterRoaming?.length > 0) {
//                                                                                     setOffers(offerOpTypeBudCallSmsDayWeekMonthInterRoaming);
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                     else if (filter?.roaming) {
//                                                                         if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + WEEK + MONTH + ROAMING
//                                                                             let offerOpTypeBudCallSmsDayWeekMonthRoaming = [];
//                                                                             const _r7 = offerOpTypeBudCallSmsDayWeekMonth.filter(res => res?.perimetre == 3);
//                                                                             _r7.forEach(el => {
//                                                                                 offerOpTypeBudCallSmsDayWeekMonthRoaming.push(el);
//                                                                             });
//                                                                             if (offerOpTypeBudCallSmsDayWeekMonthRoaming?.length > 0) {
//                                                                                 setOffers(offerOpTypeBudCallSmsDayWeekMonthRoaming);
//                                                                             }
//                                                                             else {
//                                                                                 setOffers([]);
//                                                                             }
//                                                                         }
//                                                                     }
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                             else if (filter?.national) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + WEEK + NATIONAL
//                                                                 let offerOpTypeBudCallSmsDayWeekNat = [];
//                                                                 const _r6 = offerOpTypeBudCallSmsDayWeek.filter(res => res?.perimetre == 1);
//                                                                 _r6.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDayWeekNat.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDayWeekNat?.length > 0) {//Au moins un élément réturné
//                                                                     if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + WEEK + NATIONAL + INTERNATIONAL
//                                                                         let offerOpTypeBudCallSmsDayWeekNatInter = [];
//                                                                         const _r7 = offerOpTypeBudCallSmsDayWeekNat.filter(res => res?.perimetre == 2);
//                                                                         _r7.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDayWeekNatInter.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDayWeekNatInter?.length > 0) {//Au moins un élément réturné
//                                                                             if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + WEEK + MONTH + NATIONAL + INTERNATIONAL + ROAMING
//                                                                                 let offerOpTypeBudCallSmsDayWeekNatInterRoaming = [];
//                                                                                 const _r8 = offerOpTypeBudCallSmsDayWeekNatInter.filter(res => res?.perimetre == 3);
//                                                                                 _r8.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDayWeekNatInterRoaming.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDayWeekNatInterRoaming?.length > 0) {
//                                                                                     setOffers(offerOpTypeBudCallSmsDayWeekNatInterRoaming);
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                     else if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + NATIONAL + ROAMING
//                                                                         let offerOpTypeBudCallSmsDayWeekNatRoaming = [];
//                                                                         const _r7 = offerOpTypeBudCallSmsDayWeekNat.filter(res => res?.perimetre == 3);
//                                                                         _r7.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDayWeekNatRoaming.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDayWeekNatRoaming?.length > 0) {
//                                                                             setOffers(offerOpTypeBudCallSmsDayWeekNatRoaming);
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                 } else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                             else if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + WEEK + INTERNATIONAL
//                                                                 let offerOpTypeBudCallSmsDayWeekInter = [];
//                                                                 const _r6 = offerOpTypeBudCallSmsDayWeek.filter(res => res?.perimetre == 2);
//                                                                 _r6.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDayWeekInter.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDayWeekInter?.length > 0) {//Au moins un élément réturné
//                                                                     if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + WEEK + INTERNATIONAL + ROAMING
//                                                                         let offerOpTypeBudCallSmsDayWeekInterRoaming = [];
//                                                                         const _r7 = offerOpTypeBudCallSmsDayWeekInter.filter(res => res?.perimetre == 3);
//                                                                         _r7.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDayWeekInterRoaming.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDayWeekInterRoaming?.length > 0) {
//                                                                             setOffers(offerOpTypeBudCallSmsDayWeekInterRoaming);
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                             else if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + WEEK + ROAMING
//                                                                 let offerOpTypeBudCallSmsDayWeekRoaming = [];
//                                                                 const _r8 = offerOpTypeBudCallSmsDataDayWeek.filter(res => res?.perimetre == 3);
//                                                                 _r8.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDayWeekRoaming.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDayWeekRoaming?.length > 0) {
//                                                                     setOffers(offerOpTypeBudCallSmsDayWeekRoaming);
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                         }
//                                                         else {
//                                                             setOffers([]);
//                                                         }
//                                                     }
//                                                     else if (filter?.f_month) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + MONTH
//                                                         let offerOpTypeBudCallSmsDayMonth = [];
//                                                         const _r5 = offerOpTypeBudCallSmsDay.filter(res => 30 < res?.type?.duree_value);
//                                                         _r5.forEach(el => {
//                                                             offerOpTypeBudCallSmsDayMonth.push(el);
//                                                         });
//                                                         if (offerOpTypeBudCallSmsDayMonth?.length > 0) {//Au moins un élément réturné
//                                                             if (filter?.national) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + MONTH + NATIONAL
//                                                                 let offerOpTypeBudCallSmsDayMonthNat = [];
//                                                                 const _r6 = offerOpTypeBudCallSmsDayMonth.filter(res => res?.perimetre == 1);
//                                                                 _r6.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDayMonthNat.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDayMonthNat?.length > 0) {//Au moins un élément réturné
//                                                                     if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + WEEK + MONTH + NATIONAL + INTERNATIONAL
//                                                                         let offerOpTypeBudCallSmsDayMonthNatInter = [];
//                                                                         const _r7 = offerOpTypeBudCallSmsDayMonthNat.filter(res => res?.perimetre == 2);
//                                                                         _r7.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDayMonthNatInter.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDayMonthNatInter?.length > 0) {//Au moins un élément réturné
//                                                                             if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + WEEK + MONTH + NATIONAL + INTERNATIONAL + ROAMING
//                                                                                 let offerOpTypeBudCallSmsDayMonthNatInterRoaming = [];
//                                                                                 const _r8 = offerOpTypeBudCallSmsDayMonthNatInter.filter(res => res?.perimetre == 3);
//                                                                                 _r8.forEach(el => {
//                                                                                     offerOpTypeBudCallSmsDayMonthNatInterRoaming.push(el);
//                                                                                 });
//                                                                                 if (offerOpTypeBudCallSmsDayMonthNatInterRoaming?.length > 0) {
//                                                                                     setOffers(offerOpTypeBudCallSmsDayMonthNatInterRoaming);
//                                                                                 }
//                                                                                 else {
//                                                                                     setOffers([]);
//                                                                                 }
//                                                                             }
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                     else if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + WEEK + NATIONAL + ROAMING
//                                                                         let offerOpTypeBudCallSmsDayMonthNatRoaming = [];
//                                                                         const _r10 = offerOpTypeBudCallSmsDayMonthNat.filter(res => res?.perimetre == 3);
//                                                                         _r10.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDayMonthNatRoaming.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDayMonthNatRoaming?.length > 0) {
//                                                                             setOffers(offerOpTypeBudCallSmsDayMonthNatRoaming);
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                             else if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + MONTH + NATIONAL + INTERNATIONAL
//                                                                 let offerOpTypeBudCallSmsDayMonthMonthInter = [];
//                                                                 const _r6 = offerOpTypeBudCallSmsDayMonth.filter(res => res?.perimetre == 2);
//                                                                 _r6.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDayMonthMonthInter.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDayMonthMonthInter?.length > 0) {//Au moins un élément réturné
//                                                                     if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + MONTH + INTERNATIONAL + ROAMING
//                                                                         let offerOpTypeBudCallSmsDayMonthMonthInterRoaming = [];
//                                                                         const _r7 = offerOpTypeBudCallSmsDayMonthMonthInter.filter(res => res?.perimetre == 3);
//                                                                         _r7.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDayMonthMonthInterRoaming.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDayMonthMonthInterRoaming?.length > 0) {
//                                                                             setOffers(offerOpTypeBudCallSmsDayMonthMonthInterRoaming);
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                             else if (filter?.roaming) {
//                                                                 if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + MONTH + ROAMING
//                                                                     let offerOpTypeBudCallSmsDayMonthRoaming = [];
//                                                                     const _r6 = offerOpTypeBudCallSmsDayMonth.filter(res => res?.perimetre == 3);
//                                                                     _r6.forEach(el => {
//                                                                         offerOpTypeBudCallSmsDayMonthRoaming.push(el);
//                                                                     });
//                                                                     if (offerOpTypeBudCallSmsDayMonthRoaming?.length > 0) {
//                                                                         setOffers(offerOpTypeBudCallSmsDayMonthRoaming);
//                                                                     }
//                                                                     else {
//                                                                         setOffers([]);
//                                                                     }
//                                                                 }
//                                                             }
//                                                         }
//                                                         else {
//                                                             setOffers([]);
//                                                         }

//                                                     }
//                                                     else if (filter?.national) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + NATIONAL
//                                                         let offerOpTypeBudCallSmsDayNat = [];
//                                                         const _r5 = offerOpTypeBudCallSmsDay.filter(res => res?.perimetre == 1);
//                                                         _r5.forEach(el => {
//                                                             offerOpTypeBudCallSmsDayNat.push(el);
//                                                         });
//                                                         if (offerOpTypeBudCallSmsDayNat?.length > 0) {//Au moins un élément réturné
//                                                             if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY + NATIONAL + INTERNATIONAL
//                                                                 let offerOpTypeBudCallSmsDataDayNatInter = [];
//                                                                 const _r8 = offerOpTypeBudCallSmsDayNat.filter(res => res?.perimetre == 2);
//                                                                 _r8.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDataDayNatInter.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDataDayNatInter?.length > 0) {//Au moins un élément réturné
//                                                                     if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + WEEK + MONTH + NATIONAL + INTERNATIONAL + ROAMING
//                                                                         let offerOpTypeBudCallSmsDataDayNatInterRoaming = [];
//                                                                         const _r9 = offerOpTypeBudCallSmsDataDayNatInter.filter(res => res?.perimetre == 3);
//                                                                         _r9.forEach(el => {
//                                                                             offerOpTypeBudCallSmsDataDayNatInterRoaming.push(el);
//                                                                         });
//                                                                         if (offerOpTypeBudCallSmsDataDayNatInterRoaming?.length > 0) {
//                                                                             setOffers(offerOpTypeBudCallSmsDataDayNatInterRoaming);
//                                                                         }
//                                                                         else {
//                                                                             setOffers([]);
//                                                                         }
//                                                                     }
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                             else if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + NATIONAL + ROAMING
//                                                                 let offerOpTypeBudCallSmsDataDayNatRoaming = [];
//                                                                 const _r10 = offerOpTypeBudCallSmsDataDayNatNat.filter(res => res?.perimetre == 3);
//                                                                 _r10.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDataDayNatRoaming.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDataDayNatRoaming?.length > 0) {
//                                                                     setOffers(offerOpTypeBudCallSmsDataDayNatRoaming);
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                         }
//                                                         else {
//                                                             setOffers([]);
//                                                         }
//                                                     }
//                                                     else if (filter?.international) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + INTERNATIONAL
//                                                         let offerOpTypeBudCallSmsDataDayInter = [];
//                                                         const _r9 = offerOpTypeBudCallSmsDataDay.filter(res => res?.perimetre == 2);
//                                                         _r9.forEach(el => {
//                                                             offerOpTypeBudCallSmsDataDayInter.push(el);
//                                                         });
//                                                         if (offerOpTypeBudCallSmsDataDayInter?.length > 0) {//Au moins un élément réturné
//                                                             if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + INTERNATIONAL + ROAMING
//                                                                 let offerOpTypeBudCallSmsDataDayInterRoaming = [];
//                                                                 const _r10 = offerOpTypeBudCallSmsDataDayInter.filter(res => res?.perimetre == 3);
//                                                                 _r10.forEach(el => {
//                                                                     offerOpTypeBudCallSmsDataDayInterRoaming.push(el);
//                                                                 });
//                                                                 if (offerOpTypeBudCallSmsDataDayInterRoaming?.length > 0) {
//                                                                     setOffers(offerOpTypeBudCallSmsDataDayInterRoaming);
//                                                                 }
//                                                                 else {
//                                                                     setOffers([]);
//                                                                 }
//                                                             }
//                                                         }
//                                                         else {
//                                                             setOffers([]);
//                                                         }
//                                                     }
//                                                     else if (filter?.roaming) {
//                                                         if (filter?.roaming) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + VOLUME DATA + DAY + ROAMING
//                                                             let offerOpTypeBudCallSmsDataDayRoaming = [];
//                                                             const _r10 = offerOpTypeBudCallSmsDataDay.filter(res => res?.perimetre == 3);
//                                                             _r10.forEach(el => {
//                                                                 offerOpTypeBudCallSmsDataDayRoaming.push(el);
//                                                             });
//                                                             if (offerOpTypeBudCallSmsDataDayRoaming?.length > 0) {
//                                                                 setOffers(offerOpTypeBudCallSmsDataDayRoaming);
//                                                             }
//                                                             else {
//                                                                 setOffers([]);
//                                                             }
//                                                         }
//                                                     }
//                                                 }
//                                                 else {
//                                                     setOffers([]);
//                                                 }

//                                             }
//                                             else if (filter?.f_week) {

//                                             }
//                                             else if (filter?.f_month) {

//                                             }
//                                             else if (filter?.national) {

//                                             }
//                                             else if (filter?.international) {

//                                             }
//                                             else if (filter?.roaming) {

//                                             }

//                                         } else {
//                                             //Aucun résultat rétourné
//                                             setOffers([]);
//                                         }
//                                     }
//                                     else if (filter?.f_day) { //OPERATEUR + TYPE_PAIE + BUDGET + VOLUME APPEL + VOLUME SMS + DAY

//                                     }

//                                 } else {
//                                     //Aucun résultat rétourné
//                                     setOffers([]);
//                                 }
//                             }
//                             else if (filter?.data_volume_min) {

//                             }

//                         }
//                         else {
//                             //Aucun résultat rétourné
//                             setOffers([]);
//                         }

//                     } else if (filter?.nb_sms_min) {//OPERATEUR + TYPE_PAIE + BUDGET + VOLUME SMS

//                     }
//                 } else {
//                     //Aucun résultat rétourné
//                     setOffers([]);
//                 }
//             }
//             else if (filter?.call_volume_min) { //OPERATEUR + TYPE_PAIE + VOLUME MIN

//             }
//         } else {
//             //Aucun résultat rétourné
//             setOffers([]);
//         }
//     }
//     else if (filter?.budg_min) { //OPERATEUR + BUDGET

//     }
// }
//     else {
//     //OFFRE POST-PAYE ET PRE-PAYE
//     if (filter?.post_p || filter?.pre_p) {
//         if (filter?.post_p) { //POST-PAYE
//             const _r = offerInitial.filter(res => res?.type?.type_paie == 2);
//             _r.forEach(el => {
//                 _selection.push(el);
//             })
//         }
//         if (filter?.pre_p) { //PRE-PAYE
//             const _r = offerInitial.filter(res => res?.type?.type_paie == 1);
//             _r.forEach(el => {
//                 _selection.push(el);
//             })
//         }
//     }

//     //BUDGET
//     if (filter?.budg_min) { //BUDGET
//         const _r = offerInitial.filter(res => (filter?.budg_min <= res?.prix) && (res?.prix >= filter?.budg_max));
//         _r.forEach(el => {
//             _selection.push(el);
//         })
//     }

//     //VOLUME APPEL
//     if (filter?.call_volume_min) { //VOLUME APPEL
//         const _r = offerInitial.filter(res => (filter?.call_volume_min <= res?.prix) && (res?.prix >= filter?.call_volume_max));
//         _r.forEach(el => {
//             _selection.push(el);
//         })
//     }

//     //VOLUME SMS
//     if (filter?.nb_sms_min) { //VOLUME SMS
//         const _r = offerInitial.filter(res => (filter?.nb_sms_min <= res?.prix) && (res?.prix >= filter?.nb_sms_max));
//         _r.forEach(el => {
//             _selection.push(el);
//         })
//     }

//     //VOLUME INTERNET
//     if (filter?.data_volume_min) { //VOLUME INTERNET
//         const _r = offerInitial.filter(res => (filter?.data_volume_min <= res?.prix) && (res?.prix >= filter?.data_volume_min));
//         _r.forEach(el => {
//             _selection.push(el);
//         })
//     }

//     //PERIODE
//     if (filter?.f_day) {

//     }

//     if (filter?.f_week) {

//     }

//     if (filter?.f_month) {

//     }

//     //AUTRES

//     if (filter?.national) {

//     }
//     if (filter?.international) {

//     }

//     if (filter?.roaming) {

//     }
// }
// }

