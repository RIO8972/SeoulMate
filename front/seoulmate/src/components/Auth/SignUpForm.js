// src/components/Auth/SignUpForm.js
import React, { useState } from 'react';
import styles from './SignUpForm.module.css';
import axios from 'axios';

const SignUpForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUserName] = useState('');
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

      console.log('회원가입 성공:', response.data);
      // 이후 리다이렉트나 상태 초기화 등 처리…

    } catch (error) {
      console.error('회원가입 에러:', error.response || error);
      alert(error.response?.data?.message || '회원가입 중 오류가 발생했습니다.');
    }
  }
  return(<>
     email{' '} 
     <input 
      value={email}
      onChange={
        (e) => {setEmail(e.target.value)}
      }>
        </input> <br/>
    password{' '} 
     <input 
      value={password}
      onChange={
        (e) => {setPassword(e.target.value)}
      }>
        </input> <br/>
      username {' '} 
     <input 
      value={username}
      onChange={
        (e) => {setUserName(e.target.value)}
      }>
        </input> <br/>
    <button type="button" onClick={handleSignUp}>회원가입</button>
  </>)
}
export default SignUpForm