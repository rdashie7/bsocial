import React, {useCallback, useEffect, useState} from "react";
import {Container} from "react-bootstrap";

export default function NewsPage() {
    const [news, setNews] = useState([]);
    // const [loadedNewsCount, setLoadedNewsCount] = useState(0);

    const loadNews = useCallback(async function (loadedNewsCount) {
        let res = await fetch(`/api/news/get?start=${loadedNewsCount}&count=10`);
        res = await res.json();

        return res.posts || [];
    }, []);

    useEffect(() => {
        async function fetchData() {
            const result = await loadNews(news.length);
            setNews(prevState => [...prevState, ...result]);
        }
        // fetchData();
    }, [loadNews, news]);

    return (
        <main>
            <Container>
                <h1>News Page</h1>

                <ul className="news">
                    {
                        news.map((element, index) => {
                            return (
                                <li key={index} className="post">
                                    <h3 className="post__title">{element.title}</h3>
                                    <p className="post__text">{element.text}</p>
                                    <p className="post__user-id">{element.user_id}</p>
                                </li>
                            );
                        })
                    }
                </ul>
            </Container>
        </main>
    );
}