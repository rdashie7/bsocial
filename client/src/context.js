import {createContext} from "react";

function noop() {}

export const Context = createContext({
    userId: null,
    isAuthorized: false,
    login: noop,
    logout: noop
});
