import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import styles from './SignUpForm.module.css';
import axios from 'axios';

const SignUpForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUserName] = useState('');
  const navigate = useNavigate();

  const handleSignUp = async () => {
    console.log(email);
    console.log(password);
    console.log(username);
    try {
      // 3) axios.post 호출
      const response = await axios.post(
        'https://seoul-mate.co.kr/auth/signup',
        {
          "email": email,
          "password":password,
          "username": username
        },                             
        {
          headers: {
            'Content-Type': 'application/json',  
          },
        }
      );

      //console.log('회원가입 성공:', response.data);
      alert("회원가입 성공:")
      navigate("/login", { replace: true }); // ← 로그인으로 이동

    } catch (error) {
      console.error('회원가입 에러:', error.response || error);
      alert(error.response?.data?.message || '회원가입 중 오류가 발생했습니다.');
    }
  }
  return(<>
 <div className={styles.main}>
  <div className={styles.container}>
    <div className={styles.wrapper}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>SeoulMate에 가입하세요</p>
      </div>

      <form className={styles.form} onSubmit={(e)=>{e.preventDefault(); handleSignUp();}}>
        <div className={styles.inputControl}>
          <label className={styles.inputLabel}>Email</label>
          <input className={styles.inputField} placeholder="Email Address" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div className={styles.inputControl}>
          <label className={styles.inputLabel}>Password</label>
          <input className={styles.inputField} type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
        <div className={styles.inputControl}>
          <label className={styles.inputLabel}>Username</label>
          <input className={styles.inputField} placeholder="Nickname" value={username} onChange={(e)=>setUserName(e.target.value)} />
        </div>
        <button type="submit" className={styles.inputSubmit}>회원가입</button>
      </form>
    </div>
  </div>
</div>
  </>)
}
export default SignUpForm