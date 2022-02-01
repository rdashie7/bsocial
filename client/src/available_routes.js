import React from "react";
import {Route, Navigate} from "react-router-dom";
import SettingsPage from "./pages/SettingsPage";
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import FriendsPage from "./pages/FriendsPage";
import ProfilePage from "./pages/ProfilePage";
import NewsPage from "./pages/NewsPage";
import {Routes} from 'react-router-dom'
import ConfirmEmailPage from "./pages/ConfirmEmailPage";

export default function MyRoutes({isAuthorized}) {
    if (isAuthorized) {
        return (
            <Routes>
                <Route path="/" element={<NewsPage to="/"/>}/>
                <Route path="/register" element={<Navigate to="/"/>}/>
                <Route path="/login" element={<Navigate to="/"/>}/>
                <Route path="/profile" element={<ProfilePage/>}/>
                <Route path="/friends" element={<FriendsPage/>}/>
                <Route path="/settings" element={<SettingsPage/>}/>
                <Route path="/email/confirm" element={<ConfirmEmailPage/>}/>
            </Routes>
        );
    } else {
        return (
            <Routes>
                <Route path="/" element={<NewsPage/>}/>
                <Route path="/register" element={<RegisterPage/>}/>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/profile" element={<Navigate to="/login"/>}/>
                <Route path="/friends" element={<Navigate to="/login"/>}/>
                <Route path="/settings" element={<Navigate to="/login"/>}/>
                <Route path="/email/confirm" element={<ConfirmEmailPage/>}/>
            </Routes>
        );
    }
}