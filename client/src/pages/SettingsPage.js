import React, {useContext, useEffect, useState} from "react";
import {Accordion, Container} from "react-bootstrap";
import 'react-modern-calendar-datepicker/lib/DatePicker.css';
import DatePicker, {utils} from 'react-modern-calendar-datepicker';
import axiosApi from "../http/axios";
import {Context} from "../context";

export default function SettingsPage() {
    const {logout, setChangePasswordModalActive} = useContext(Context);

    const [isDataFetched, setIsDataFetched] = useState(false);

    const [userData, setUserData] = useState({
        firstname: '',
        lastname: '',
        city: ''
    });
    const [selectedDay, setSelectedDay] = useState(null);

    const [validationErrors, setValidationErrors] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    function inputChange(e) {
        setUserData({...userData, [e.target.name]: e.target.value});
    }

    async function editFormSubmit(e) {
        e.preventDefault();

        setValidationErrors(null);
        setSuccessMessage('');

        let data = {
            ...userData,
            birthday: selectedDay && new Date(selectedDay.year, selectedDay.month - 1, selectedDay.day)
        };

        try {
            let res = await axiosApi.post('/api/user/edit', data);
            setSuccessMessage(res.data.message);
        } catch (e) {
            if (e.response.status === 401) {
                logout();
                return;
            }

            if (e.response.status === 400) {
                let fields = {};
                e.response.data.details.fields.forEach((field) => {
                    fields[field.param] = field.msg;
                });
                setValidationErrors(fields);
            }
        }
    }

    useEffect(() => {
        async function fetchData() {
            try {
                let res = await axiosApi.get('/api/user/data');

                if (res.status === 200) {
                    const {firstname, lastname, city} = res.data.details;
                    setUserData({
                        firstname,
                        lastname,
                        city
                    });

                    if (res.data.details.birthday) {
                        const [year, month, day] = res.data.details.birthday.split('-');
                        setSelectedDay({
                            year: +year,
                            month: +month,
                            day: +day
                        });
                    }
                }

            } catch (e) {
                console.log(e)
                if (e.response.status === 401) {
                    logout();
                }
            } finally {
                setIsDataFetched(true);
            }
        }

        fetchData();
    }, [logout]);



    return (
        <>
            {
                isDataFetched &&
                <main className="settings-page">
                    <Container>
                        <div className="content settings-page__content">
                            <h1>Settings Page</h1>

                            <Accordion defaultActiveKey="0">
                                <Accordion.Item eventKey="0">
                                    <Accordion.Header>Личные данные</Accordion.Header>
                                    <Accordion.Body>
                                        <form id="general-data-form" className="custom-form m-0"
                                              onSubmit={editFormSubmit}>
                                            <div className="field-group">
                                                <label htmlFor="firstname">Имя</label>
                                                <input type="text" id="firstname" name="firstname"
                                                       value={userData.firstname} onChange={inputChange}/>
                                                {validationErrors?.['firstname'] &&
                                                    <p className="validation-message">{validationErrors?.['firstname']}</p>}
                                            </div>

                                            <div className="field-group">
                                                <label htmlFor="lastname">Фамилия</label>
                                                <input type="text" id="lastname" name="lastname"
                                                       value={userData.lastname} onChange={inputChange}/>
                                                {validationErrors?.['lastname'] &&
                                                    <p className="validation-message">{validationErrors?.['lastname']}</p>}
                                            </div>

                                            <div className="field-group">
                                                <label htmlFor="birthday">День рождения</label>
                                                <DatePicker
                                                    value={selectedDay}
                                                    onChange={setSelectedDay}
                                                    maximumDate={utils().getToday()}
                                                    inputPlaceholder="Выберите дату"
                                                    inputClassName="birthday-input"
                                                />
                                            </div>

                                            <div className="field-group">
                                                <label htmlFor="city">Родной город</label>
                                                <input type="text" id="city" name="city" value={userData.city}
                                                       onChange={inputChange}/>
                                                {/*<div>*/}
                                                {/*    <CountryDropdown*/}
                                                {/*        value={country}*/}
                                                {/*        onChange={(val) => {*/}
                                                {/*            setCountry(val);*/}
                                                {/*            setRegion('');*/}
                                                {/*        }} />*/}
                                                {/*    <RegionDropdown*/}
                                                {/*        country={country}*/}
                                                {/*        value={region}*/}
                                                {/*        onChange={(val) => setRegion(val)} />*/}
                                                {/*</div>*/}
                                            </div>


                                            <button type="submit" className="btn btn-success">Сохранить</button>
                                            {successMessage &&
                                                <p className="success-message edit-profile-message">{successMessage}</p>}
                                        </form>
                                    </Accordion.Body>
                                </Accordion.Item>
                                <Accordion.Item eventKey="1" onClick={}>
                                    <Accordion.Header>Безопасность</Accordion.Header>
                                    <Accordion.Body>
                                        <form id="security-data-form" className="custom-form m-0" onSubmit={(e) => {
                                            e.preventDefault();
                                        }}>
                                            <div className="field-group">
                                                <label htmlFor="password">Пароль</label>
                                                <button className="blue-btn" onClick={() => setChangePasswordModalActive(true)}>Изменить пароль</button>
                                            </div>
                                        </form>

                                        <div className="connections">
                                            
                                        </div>
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>


                        </div>
                    </Container>
                </main>
            }
        </>
    );
}