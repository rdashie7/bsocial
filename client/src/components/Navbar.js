import React, {useContext} from "react";
import {LinkContainer} from "react-router-bootstrap";
import {Container, Dropdown, Navbar} from "react-bootstrap";
import {Context} from "../context";


export default function MyNavbar() {
    const {isAuthorized, logout} = useContext(Context);

    const NavbarIcon = (
        <div className="navbar-image">
            <i className="fas fa-user"/>
        </div>
    );

    return (
        <>
            <Navbar bg="dark" variant="dark" expand="lg">
                <Container>
                    <LinkContainer to="/" activeClassName="">
                        <Navbar.Brand>My Social</Navbar.Brand>
                    </LinkContainer>

                    <Dropdown className="auth-dropdown blue-dropdown">
                        <Dropdown.Toggle id="dropdown-basic" variant="">
                            {NavbarIcon}
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            {
                                isAuthorized ?
                                    (
                                        <>
                                            <LinkContainer to="/profile">
                                                <Dropdown.Item>Профиль</Dropdown.Item>
                                            </LinkContainer>

                                            <LinkContainer to="/settings">
                                                <Dropdown.Item>Настройки</Dropdown.Item>
                                            </LinkContainer>

                                            <Dropdown.Item onClick={logout}>Выход</Dropdown.Item>
                                        </>
                                    ) :
                                    (
                                        <>
                                            <LinkContainer to="/login">
                                                <Dropdown.Item>Войти</Dropdown.Item>
                                            </LinkContainer>

                                            <LinkContainer to="/register">
                                                <Dropdown.Item>Зарегистрироваться</Dropdown.Item>
                                            </LinkContainer>
                                        </>
                                    )
                            }
                        </Dropdown.Menu>
                    </Dropdown>
                </Container>
            </Navbar>
        </>
    );
}