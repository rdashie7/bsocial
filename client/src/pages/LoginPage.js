import React, {useContext, useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {Context} from "../context";
import {Container} from "react-bootstrap";

export default function LoginPage() {
    const navigate = useNavigate();
    const {login} = useContext(Context);


    const [flash, setFlash] = useState({});
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [validationErrors, setValidationErrors] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let flash = JSON.parse(localStorage.getItem('flash'));
        if (flash) {
            localStorage.removeItem('flash');
            setFlash(flash);
        }
    }, []);


    function inputChange(e) {
        setFormData({...formData, [e.target.name]: e.target.value});
    }

    async function loginFormSubmit(e) {
        e.preventDefault();


        if (validationErrors) {
            setValidationErrors(null);
        }
        if (errorMessage) {
            setErrorMessage('');
        }


        let
            res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData),
            }),
            data = await res.json();

        console.log(res);
        console.log(data);


        if (res.ok) {
            login(data.details.userId, data.details.accessToken);
            navigate("/profile", {replace: true});
        } else {
            if (data.details.fields) {
                let fields = {};
                data.details.fields.forEach((field) => {
                    fields[field.param] = field.msg;
                });
                setValidationErrors(fields);
            } else {
                setErrorMessage(data.message);
            }
        }
    }


    return (
        <>
            <main className="login-page">
                <Container>
                    <div className="content login-page__content">
                        <h1>Login Page</h1>

                        <form id="login-form" className="custom-form" onSubmit={loginFormSubmit}>
                            <div className="field-group">
                                <label htmlFor="email">Почта</label>
                                <input type="email" id="email" name="email" onChange={inputChange}/>
                                {validationErrors?.['email'] && <p className="validation-message">{validationErrors?.['email']}</p>}
                            </div>

                            <div className="field-group">
                                <label htmlFor="password">Пароль</label>
                                <input type="password" id="password" name="password" onChange={inputChange}/>
                                {validationErrors?.['password'] && <p className="validation-message">{validationErrors?.['password']}</p>}
                            </div>

                            <button type="submit" className="btn btn-success">Войти</button>
                        </form>

                        {errorMessage && <p className="error-message">{errorMessage}</p>}

                        {
                            flash.email &&
                            <p className="success-message">
                                На почту {flash.email} было отправлено письмо с подтверждением! Если вам ничего не пришло нажмите
                                на <a href="https://google.com">ссылку</a> для повторной отправки!
                            </p>
                        }
                    </div>
                </Container>
            </main>
        </>
    );
}