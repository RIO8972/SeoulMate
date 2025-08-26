import React, { useState } from 'react';
import styles from './LoginForm.module.css';
import { useNavigate } from "react-router-dom";
import useLogin from "../../hooks/useLogin"; // 추가

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useLogin();        //  훅 사용
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await login(email, password);             //  저장은 훅이 처리
      navigate('/');
    } catch (err) {
      if (err?.response) {
        alert(`로그인 에러: ${err.response.data?.error || '알 수 없는 오류'}`);
      } else {
        alert(err?.message || '서버 연결에 실패했습니다.');
      }
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <section className={styles.wrapper}>
          <div className={styles.heading}>
            <h1 className={styles['text-large']}>SeoulMate</h1>
            <p className={styles['text-normal']}><span><a href="#" className={styles['text-links']}></a></span></p>
          </div>

          <form name="signin" className={styles.form} onSubmit={e => e.preventDefault()}>
            <div className={styles['input-control']}>
              <label htmlFor="email" className={styles['input-label']} hidden>Email Address</label>
              <input
                type="email"
                id="email"
                className={styles['input-field']}
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className={styles['input-control']}>
              <label htmlFor="password" className={styles['input-label']} hidden>Password</label>
              <input
                type="password"
                id="password"
                className={styles['input-field']}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div className={styles['input-control']}>
              <a href="#" className={styles['text-links']}>Create an account</a>
              <button
                type="button"
                className={styles['input-submit']}
                onClick={handleLogin}
                disabled={!email || !password || loading}
              >
                {loading ? '로그인 중…' : '로그인'}
              </button>
            </div>
          </form>

          {/* 소셜 로그인 영역은 기존 그대로 */}
          <div className={styles.striped}>
            <span className={styles['striped-line']} />
            <span className={styles['striped-text']}>Or</span>
            <span className={styles['striped-line']} />
          </div>

          <div className={styles.method}>
            <div className={styles['method-control']}>
              <a href="https://seoul-mate.co.kr/auth/oauth2/authorization/google" className={styles['method-action']}>
                <i className="ion ion-logo-google" /><span>Sign in with Google</span>
              </a>
            </div>
            <div className={styles['method-control']}>
              <a href="https://seoul-mate.co.kr/auth/oauth2/authorization/naver" className={styles['method-action']}>
                <i className="ion ion-logo-facebook" /><span>Sign in with Naver</span>
              </a>
            </div>
            <div className={styles['method-control']}>
              <a href="https://seoul-mate.co.kr/auth/oauth2/authorization/kakao" className={styles['method-action']}>
                <i className="ion ion-logo-apple" /><span>Sign in with Kakao</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default LoginForm;
