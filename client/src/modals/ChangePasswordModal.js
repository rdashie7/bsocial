import React, {useContext, useEffect, useMemo, useRef, useState} from "react";
import {Context} from "../context";
import {Modal} from "react-bootstrap";
import axiosApi from "../http/axios";

export default function ChangePasswordModal() {
    const {changePasswordModalActive, setChangePasswordModalActive} = useContext(Context);

    const [passwords, setPasswords] = useState({
        'old-password': '',
        'new-password': '',
    });

    const [validationErrors, setValidationErrors] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');


    // useEffect(() => {
    //     setValidationErrors(null);
    //     setErrorMessage('');
    //     setSuccessMessage('');
    //     setPasswords({
    //         'old-password': '',
    //         'new-password': ''
    //     });
    // }, []);

    function modalCloseHandler() {
        setChangePasswordModalActive(false);

        setValidationErrors(null);
        setErrorMessage('');
        setSuccessMessage('');
        setPasswords({
            'old-password': '',
            'new-password': ''
        });
    }

    function inputChange(e) {
        setPasswords({
            ...passwords,
            [e.target.name]: e.target.value
        });
    }

    async function cpmFormSubmit(e) {
        e.preventDefault();

        setValidationErrors(null);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const response = await axiosApi.post('/api/user/change_password', passwords);

            setSuccessMessage(response.data.message);
            setPasswords({
                'old-password': '',
                'new-password': '',
            });
        } catch (e) {
            if (e.response.status === 400) {
                if (e.response.data.details.fields) {
                    let fields = {};
                    e.response.data.details.fields.forEach((field) => {
                        fields[field.param] = field.msg;
                    });
                    setValidationErrors(fields);
                } else {
                    setErrorMessage(e.response.data.message);
                }
            }
        }
    }

    return (
        <Modal show={changePasswordModalActive}
               onHide={modalCloseHandler}
               dialogClassName="change-password-modal">
            <Modal.Header closeButton>
                <Modal.Title>Изменить пароль</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <form className="custom-form" id="cpm-form" onSubmit={cpmFormSubmit}>
                    <label htmlFor="old-password-cpm">Введите старый пароль</label>
                    <input type="text" id="old-password-cpm" name="old-password" value={passwords["old-password"]} onChange={inputChange}/>
                    {validationErrors?.['old-password'] && <p className="validation-message">{validationErrors?.['old-password']}</p>}

                    <label htmlFor="new-password-cpm">Введите новый пароль</label>
                    <input type="text" id="new-password-cpm" name="new-password" value={passwords["new-password"]} onChange={inputChange}/>
                    {validationErrors?.['new-password'] && <p className="validation-message">{validationErrors?.['new-password']}</p>}

                    <button className="blue-btn">Изменить пароль</button>
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}
                </form>
            </Modal.Body>
        </Modal
        >
    );
}