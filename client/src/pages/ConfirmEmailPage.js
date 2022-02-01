import React, {useEffect, useState} from "react";
import {Container} from "react-bootstrap";

export default function ConfirmEmailPage() {
    const [result, setResult] = useState('');

    useEffect(() => {
        async function confirm() {
            let
                params = new URLSearchParams(window.location.search),
                code = params.get('code'),
                dirus = params.get('dirus');


            try {
                let res = await fetch(`/api/auth/confirm?code=${code}&dirus=${dirus}`),
                    data = await res.json();

                console.log(res)
                if (res.status === 200) {
                    setResult(data.message);
                } else {
                    setResult(data.message);
                }
            } catch (e) {
                console.log(e);
            }
        }
        confirm();
    }, []);

    return (
        <>
            <main>
                <Container>
                    <h1 className="text-center">Confirm Email Page</h1>
                    <p>{result}</p>
                </Container>
            </main>
        </>
    );
}