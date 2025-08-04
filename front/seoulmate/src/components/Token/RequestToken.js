import React from'react';
import axios from 'axios';
import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';


const RequestToken = () => {
useEffect(() => {
  axios.post(
    'https://seoul-mate.co.kr/auth/token/refresh',
    {},                     // 바디가 필요 없으면 빈 객체
    { 
      withCredentials: true // 쿠키 포함
    }
  )
  .then((res) => {
     const token = res.data.accessToken;
      console.log('at>>', token)
      localStorage.setItem('accessToken', token); // at 갱신
  })
  .catch(err => {
  if (err.response) {
    console.log('status:', err.response.status);           // 401
    console.log('response data:', err.response.data);      // 서버가 보낸 에러 메시지 객체
    
  } else {
    console.error('network or other error', err); 
  }
});
}, []);

    return <div>재발급</div>
};

export default RequestToken;
