import React, {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import {Container} from "react-bootstrap";


export default function RegisterPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstname: '',
        secondname: '',
        email: '',
        password: '',
        'confirm-password': ''
    });
    const [validationErrors, setValidationErrors] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');


    useEffect(() => {
        console.log('rendering')
    })


    function inputChange(e) {
        setFormData({...formData, [e.target.name]: e.target.value});
    }

    async function registerFormSubmit(e) {
        console.log(formData);
        e.preventDefault();


        if (validationErrors) {
            setValidationErrors(null);
        }
        if (errorMessage) {
            setErrorMessage('');
        }


        let res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData),
        });
        let data = await res.json();


        if (res.ok) {
            localStorage.setItem('flash', JSON.stringify({
                email: formData.email
            }));

            navigate("/login", { replace: true });
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
            <main className="register-page">
                <Container>
                    <div className="content register-page__content">
                        <h1>Register Page</h1>

                        <form className="custom-form" onSubmit={registerFormSubmit}>
                            <div className="field-group">
                                <label htmlFor="firstname">Имя</label>
                                <input type="text" id="firstname" name="firstname" onChange={inputChange}/>
                                {validationErrors?.['firstname'] && <p className="validation-message">{validationErrors?.['firstname']}</p>}
                            </div>

                            <div className="field-group">
                                <label htmlFor="secondname">Фамилия</label>
                                <input type="text" id="secondname" name="secondname" onChange={inputChange}/>
                                {validationErrors?.['secondname'] && <p className="validation-message">{validationErrors?.['secondname']}</p>}
                            </div>

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

                            <div className="field-group">
                                <label htmlFor="confirm-password">Подтвердите пароль</label>
                                <input type="password" id="confirm-password" name="confirm-password" onChange={inputChange}/>
                                {validationErrors?.['confirm-password'] && <p className="validation-message">{validationErrors?.['confirm-password']}</p>}
                            </div>

                            <button type="submit" className="btn btn-success">Зарегистрироваться</button>
                        </form>

                        {errorMessage && <p className="error-message">{errorMessage}</p>}
                    </div>
                </Container>
            </main>
        </>
    );
}