import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function SaveToken() { //인증 후 at를 발급하면 이 컴포넌트를 호출함
    const navigate = useNavigate();
    const { search } = useLocation();

    useEffect(()=> {
        const params = new URLSearchParams(search);
        const token = params.get('accessToken');
        if(token) {
            localStorage.setItem('accessToken', token); //여기서 at 저장
            navigate('/')
        }
        else {
            console.error('토큰이 없습니다.');
        }
    }, [search, navigate]);
    
    return <p> 로그인 중... </p>;

}
export default SaveToken