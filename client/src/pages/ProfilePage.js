import React, {useContext, useEffect, useState} from "react";
import {Container} from "react-bootstrap";
import axiosApi from "../http/axios";
import galleryImg from "../img/gallery.png";
import {Context} from "../context";

export default function ProfilePage() {
    const {setPhotoModalActive, logout} = useContext(Context);

    const [isDataFetched, setIsDataFetched] = useState(false);
    const [userData, setUserData] = useState({
        name: '',
        photo: '',
        posts: []
    });

    useEffect(() => {
        async function fetchData() {
            try {
                let res = await axiosApi.get('/api/user');
                console.log(res);

                if (res.status === 200) {
                    setUserData({
                        name: res.data.firstname + ' ' + res.data.lastname,
                        photo: res.data.photo,
                        posts: res.data.posts
                    });
                }
            } catch (e) {
                if (e.response.status === 401) {
                    logout();
                }
            } finally {
                setIsDataFetched(true);
            }
        }

        fetchData();
    }, [logout]);

    // useEffect(() => {
    //     console.log('render')
    // })

    return (
        <>
            {
                isDataFetched &&
                <main>
                    <Container>
                        <div className="content profile-page__content">
                            <div className="left">
                                <div className="profile__photo">
                                    <img src={process.env.REACT_APP_STORAGE_URL + '/api/img/' + userData.photo} alt="avatar" className="photo__img"/>
                                    <button className="photo__gallery__wrap"
                                            onClick={() => setPhotoModalActive(true)}>
                                        <img src={galleryImg} alt="Gallery" className="photo__gallery"/>
                                    </button>
                                </div>
                            </div>

                            <div className="right">
                                <h1 className="profile__name">{userData.name}</h1>
                                <div className="profile__about">

                                </div>

                                <ul className="posts">
                                    {
                                        userData.posts.map((post, index) => {
                                            return (
                                                <li key={index} className="posts__item">
                                                    <h3 className="post__title">{post.title}</h3>
                                                    <p className="post__text">{post.text}</p>
                                                    <p className="post__user-id">{post.user_id}</p>
                                                </li>
                                            );
                                        })
                                    }
                                </ul>
                            </div>
                        </div>
                    </Container>
                </main>
            }
        </>
    );
}