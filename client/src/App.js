import React, {useCallback, useEffect, useState} from "react";
import MyNavbar from "./components/Navbar";


import {Context} from "./context";

import MyRoutes from "./available_routes";
import PhotoModal from "./modals/PhotoModal";
import axios from "./http/axios";
import ChangePasswordModal from "./modals/ChangePasswordModal";

console.log('react env', process.env);

function App() {
    const storageVariableName = 'userData';

    const [photoModalActive, setPhotoModalActive] = useState(false);
    const [changePasswordModalActive, setChangePasswordModalActive] = useState(false);

    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isDataFetched, setIsDataFetched] = useState(false);
    const [userId, setUserId] = useState(null);


    const login = useCallback(function (userId, accessToken) {
        localStorage.setItem(storageVariableName, JSON.stringify({
            userId,
            accessToken
        }));

        setIsAuthorized(true);
        setUserId(userId);
    }, []);

    const logout = useCallback(async function () {
        await axios.get('/api/auth/logout');
        localStorage.clear();

        setIsAuthorized(false);
        setUserId(null);

        window.location.reload();
    }, []);

    useEffect(function () {
        const data = JSON.parse(localStorage.getItem(storageVariableName));

        if (data) {
            login(data.userId, data.accessToken);
        }
        setIsDataFetched(true);
    }, [login]);


    return (
        <>
            <Context.Provider value={{
                isAuthorized,
                userId,
                login,
                logout,
                photoModalActive,
                setPhotoModalActive,
                changePasswordModalActive,
                setChangePasswordModalActive
            }}>
                <MyNavbar/>

                <PhotoModal/>
                <ChangePasswordModal/>


                {isDataFetched && <MyRoutes isAuthorized={isAuthorized}/>}
            </Context.Provider>
        </>
    );
}

export default App;
