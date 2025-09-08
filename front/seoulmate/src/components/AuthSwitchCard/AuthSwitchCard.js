import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./AuthSwitchCard.module.css";

import axios from "axios";
import useLogin from "../../hooks/useLogin";

import FullLogo from "../../images/full-logo.png";
import naverLogo from "../../images/naver.svg";
import kakaoLogo from "../../images/kakao.svg";
import googleLogo from "../../images/google.png";

export default function AuthSwitchCard() {
  // "signin" | "signup" | "reset"
  const [mode, setMode] = useState("signin");
  const isSignUp = mode === "signup";
  const isReset = mode === "reset";

  // 로컬 로그인
  const [inEmail, setInEmail] = useState("");
  const [inPwd, setInPwd] = useState("");
  const { login, loading: signInLoading } = useLogin();

  // 로컬 회원가입
  const [name, setName] = useState("");
  const [upEmail, setUpEmail] = useState("");
  const [upPwd, setUpPwd] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);

  // 비밀번호 재설정
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const navigate = useNavigate();

  const containerClass = useMemo(
    () => [styles.container, isSignUp ? styles.rightPanelActive : ""].join(" "),
    [isSignUp]
  );
  

  // ==== 로컬 로그인 ====
  const handleSubmitSignIn = async (e) => {
    e.preventDefault();
    try {
      await login(inEmail, inPwd);
      navigate("/");
    } catch (err) {
      if (err?.response) {
        alert(`로그인 에러: ${err.response.data?.error || "알 수 없는 오류"}`);
      } else {
        alert(err?.message || "서버 연결에 실패했습니다.");
      }
    }
  };

  // ==== 로컬 회원가입 ====
  const handleSubmitSignUp = async (e) => {
    e.preventDefault();
    try {
      setSignUpLoading(true);
      await axios.post(
        "https://seoul-mate.co.kr/auth/signup",
        { email: upEmail, password: upPwd, username: name },
        { headers: { "Content-Type": "application/json" } }
      );
      alert("회원가입 성공");
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("회원가입 에러:", error?.response || error);
      alert(error?.response?.data?.message || "회원가입 중 오류가 발생했습니다.");
    } finally {
      setSignUpLoading(false);
    }
  };

    // ==== 비밀번호 재설정 ====
    // 1) 인증번호 요청
    const requestResetCode = async () => {
    if (!resetEmail) return;
    try {
        setSendLoading(true);
        await axios.post(
        "https://seoul-mate.co.kr/auth/auth/password/email-code",
        { email: resetEmail },
        { headers: { "Content-Type": "application/json" } }
        // , { withCredentials: true } // 쿠키 필요하면 주석 해제
        );
        setCodeSent(true);
        alert("인증번호를 이메일로 전송했습니다.");
    } catch (error) {
        console.error(error?.response || error);
        alert(error?.response?.data?.message || "코드 전송 중 오류가 발생했습니다.");
    } finally {
        setSendLoading(false);
    }
    };

    // 2) 인증번호 검증 + 임시 비밀번호 발급
    const verifyResetCode = async () => {
    if (!codeSent || !resetCode) return;
    try {
        setVerifyLoading(true);
        await axios.post(
        "https://seoul-mate.co.kr/auth/auth/password/issue-temp",
        { email: resetEmail, code: resetCode },
        { headers: { "Content-Type": "application/json" } }
        // , { withCredentials: true }
        );
        alert("임시 비밀번호를 이메일로 전송했습니다. 이메일을 확인해 주세요.");
        // 임시 비번으로 로그인할 수 있게 로그인 화면으로 이동
        setMode("signin");
    } catch (error) {
        console.error(error?.response || error);
        alert(error?.response?.data?.message || "인증 실패. 다시 시도하세요.");
    } finally {
        setVerifyLoading(false);
    }
    };


  return (
    <main className={styles.main}>
      <div className={containerClass}>
        {/* ====================== Sign Up ====================== */}
        <section className={`${styles.formContainer} ${styles.signUpContainer}`}>
          <form className={styles.form} onSubmit={handleSubmitSignUp}>
            <h1 className={styles.h1}>
              <Link to="/" className={styles.brandLink} aria-label="메인 페이지로 이동">
                <img src={FullLogo} alt="SeoulMate 로고" className={styles.brandLogo} />
              </Link>
            </h1>

            <input
              type="text"
              placeholder="Name"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
            <input
              type="email"
              placeholder="Email"
              className={styles.input}
              value={upEmail}
              onChange={(e) => setUpEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              className={styles.input}
              value={upPwd}
              onChange={(e) => setUpPwd(e.target.value)}
              required
              autoComplete="new-password"
            />

            <button
              type="submit"
              className={styles.button}
              disabled={signUpLoading}
              aria-busy={signUpLoading}
            >
              {signUpLoading ? "가입 중…" : "Sign Up"}
            </button>

            <div className={styles.striped}>
              <span className={styles["striped-line"]} />
              <span className={styles["striped-text"]}>Or</span>
              <span className={styles["striped-line"]} />
            </div>

            {/* SNS 회원가입 */}
            <div className={styles.socialContainer}>
              <a
                href="https://seoul-mate.co.kr/auth/oauth2/authorization/google"
                className={`${styles.social} ${styles.socialGoogle}`}
                aria-label="Google로 로그인"
                title="Google로 로그인"
              >
                <img src={googleLogo} alt="Google" className={styles.socialIcon} />
              </a>
              <a
                href="https://seoul-mate.co.kr/auth/oauth2/authorization/naver"
                className={`${styles.social} ${styles.socialNaver}`}
                aria-label="Naver로 로그인"
                title="Naver로 로그인"
              >
                <img src={naverLogo} alt="Naver" className={styles.socialIcon} />
              </a>
              <a
                href="https://seoul-mate.co.kr/auth/oauth2/authorization/kakao"
                className={`${styles.social} ${styles.socialKakao}`}
                aria-label="Kakao로 로그인"
                title="Kakao로 로그인"
              >
                <img src={kakaoLogo} alt="Kakao" className={styles.socialIcon} />
              </a>
            </div>
          </form>
        </section>

        {/* ====================== Sign In / Reset ====================== */}
        <section className={`${styles.formContainer} ${styles.signInContainer}`}>
          {/* --- Sign In 화면 --- */}
          {!isReset && (
            <form className={styles.form} onSubmit={handleSubmitSignIn}>
              <h1 className={styles.h1}>
                <Link to="/" className={styles.brandLink} aria-label="메인 페이지로 이동">
                  <img src={FullLogo} alt="SeoulMate 로고" className={styles.brandLogo} />
                </Link>
              </h1>

              <input
                type="email"
                placeholder="Email"
                className={styles.input}
                value={inEmail}
                onChange={(e) => setInEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Password"
                className={styles.input}
                value={inPwd}
                onChange={(e) => setInPwd(e.target.value)}
                required
                autoComplete="current-password"
              />

              <button
                type="button"
                className={styles.textButton}
                onClick={() => setMode("reset")}
              >
                Forgot your password?
              </button>

              <button
                type="submit"
                className={styles.button}
                disabled={!inEmail || !inPwd || signInLoading}
                aria-busy={signInLoading}
              >
                {signInLoading ? "로그인 중…" : "Sign In"}
              </button>

              <div className={styles.striped}>
                <span className={styles["striped-line"]} />
                <span className={styles["striped-text"]}>Or</span>
                <span className={styles["striped-line"]} />
              </div>

              <div className={styles.socialContainer}>
                <a
                  href="https://seoul-mate.co.kr/auth/oauth2/authorization/google"
                  className={`${styles.social} ${styles.socialGoogle}`}
                  aria-label="Google로 로그인"
                  title="Google로 로그인"
                >
                  <img src={googleLogo} alt="Google" className={styles.socialIcon} />
                </a>
                <a
                  href="https://seoul-mate.co.kr/auth/oauth2/authorization/naver"
                  className={`${styles.social} ${styles.socialNaver}`}
                  aria-label="Naver로 로그인"
                  title="Naver로 로그인"
                >
                  <img src={naverLogo} alt="Naver" className={styles.socialIcon} />
                </a>
                <a
                  href="https://seoul-mate.co.kr/auth/oauth2/authorization/kakao"
                  className={`${styles.social} ${styles.socialKakao}`}
                  aria-label="Kakao로 로그인"
                  title="Kakao로 로그인"
                >
                  <img src={kakaoLogo} alt="Kakao" className={styles.socialIcon} />
                </a>
              </div>
            </form>
          )}

          {/* --- Reset 화면 --- */}
          {isReset && (
            <div className={styles.form}>
              <h1 className={styles.h1}>
                <Link to="/" className={styles.brandLink} aria-label="메인 페이지로 이동">
                  <img src={FullLogo} alt="SeoulMate 로고" className={styles.brandLogo} />
                </Link>
              </h1>

              {/* 이메일 + 전송 */}
              <label className={styles.inlineLabel}>이메일</label>
              <div className={styles.inlineGroup}>
                <input
                  type="email"
                  placeholder="가입하신 이메일 주소"
                  className={`${styles.input} ${styles.underline}`}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
                <button
                  className={styles.chipButton}
                  onClick={requestResetCode}
                  disabled={!resetEmail || sendLoading}
                >
                  {sendLoading ? "전송 중…" : "전송"}
                </button>
              </div>

              {/* 인증번호 + 확인 */}
              <label className={styles.inlineLabel}>인증번호 입력</label>
              <div className={styles.inlineGroup}>
                <input
                  type="text"
                  placeholder="메일로 받은 인증번호"
                  className={`${styles.input} ${styles.underline}`}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  disabled={!codeSent}
                />
                <button
                  className={styles.chipButton}
                  onClick={verifyResetCode}
                  disabled={!codeSent || !resetCode || verifyLoading}
                >
                  {verifyLoading ? "확인 중…" : "확인"}
                </button>
              </div>

              <button
                type="button"
                className={styles.textButton}
                onClick={() => setMode("signin")}
              >
                ← Back to Sign in
              </button>
            </div>
          )}
        </section>

        {/* ====================== Overlay ====================== */}
        <div className={styles.overlayContainer}>
          <div className={styles.overlay}>
            <div className={`${styles.overlayPanel} ${styles.overlayLeft}`}>
              <h1 className={styles.h1}>SeoulMate</h1>
              <p className={styles.p}>SeoulMate에 로그인하세요!</p>
              <button
                className={`${styles.button} ${styles.ghost}`}
                onClick={() => setMode("signin")}
                type="button"
              >
                Sign In
              </button>
            </div>
            <div className={`${styles.overlayPanel} ${styles.overlayRight}`}>
              <h1 className={styles.h1}>SeoulMate</h1>
              <p className={styles.p}>SeoulMate에 가입하세요!</p>
              <button
                className={`${styles.button} ${styles.ghost}`}
                onClick={() => setMode("signup")}
                type="button"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}




// import React, { useMemo, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import styles from "./AuthSwitchCard.module.css";

// import axios from "axios";
// import useLogin from "../../hooks/useLogin";

// import FullLogo from "../../images/full-logo.png";
// import naverLogo from "../../images/naver.svg";
// import kakaoLogo from "../../images/kakao.svg";
// import googleLogo from "../../images/google.png";

// export default function AuthSwitchCard() {
//   const [mode, setMode] = useState("signin"); // "signin" | "signup"
//   const isSignUp = mode === "signup";

//   // 로컬 로그인
//   const [inEmail, setInEmail] = useState("");
//   const [inPwd, setInPwd] = useState("");
//   const { login, loading: signInLoading } = useLogin();

//   // 로컬 회원가입
//   const [name, setName] = useState("");
//   const [upEmail, setUpEmail] = useState("");
//   const [upPwd, setUpPwd] = useState("");
//   const [signUpLoading, setSignUpLoading] = useState(false);

//   const navigate = useNavigate();

//   const containerClass = useMemo(
//     () => [styles.container, isSignUp ? styles.rightPanelActive : ""].join(" "),
//     [isSignUp]
//   );

//   // ==== 로컬 로그인 ====
//   const handleSubmitSignIn = async (e) => {
//     e.preventDefault();
//     try {
//       await login(inEmail, inPwd);
//       navigate("/");
//     } catch (err) {
//       if (err?.response) {
//         alert(`로그인 에러: ${err.response.data?.error || "알 수 없는 오류"}`);
//       } else {
//         alert(err?.message || "서버 연결에 실패했습니다.");
//       }
//     }
//   };

//   // ==== 로컬 회원가입 ====
//   const handleSubmitSignUp = async (e) => {
//     e.preventDefault();
//     try {
//       setSignUpLoading(true);
//       await axios.post(
//         "https://seoul-mate.co.kr/auth/signup",
//         { email: upEmail, password: upPwd, username: name },
//         { headers: { "Content-Type": "application/json" } }
//       );
//       alert("회원가입 성공");
//       navigate("/login", { replace: true });
//     } catch (error) {
//       console.error("회원가입 에러:", error?.response || error);
//       alert(error?.response?.data?.message || "회원가입 중 오류가 발생했습니다.");
//     } finally {
//       setSignUpLoading(false);
//     }
//   };

//   return (
//     <main className={styles.main}>
//       <div className={containerClass}>
//         {/* ====================== Sign Up ====================== */}
//         <section className={`${styles.formContainer} ${styles.signUpContainer}`}>
//           <form className={styles.form} onSubmit={handleSubmitSignUp}>
//             <h1 className={styles.h1}>
//               <Link to="/" className={styles.brandLink} aria-label="메인 페이지로 이동">
//                 <img src={FullLogo} alt="SeoulMate 로고" className={styles.brandLogo} />
//               </Link>
//             </h1>

//             <input
//               type="text"
//               placeholder="Name"
//               className={styles.input}
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               required
//               autoComplete="name"
//             />
//             <input
//               type="email"
//               placeholder="Email"
//               className={styles.input}
//               value={upEmail}
//               onChange={(e) => setUpEmail(e.target.value)}
//               required
//               autoComplete="email"
//             />
//             <input
//               type="password"
//               placeholder="Password"
//               className={styles.input}
//               value={upPwd}
//               onChange={(e) => setUpPwd(e.target.value)}
//               required
//               autoComplete="new-password"
//             />

//             <button
//               type="submit"
//               className={styles.button}
//               disabled={signUpLoading}
//               aria-busy={signUpLoading}
//             >
//               {signUpLoading ? "가입 중…" : "Sign Up"}
//             </button>

//             <div className={styles.striped}>
//                 <span className={styles["striped-line"]} />
//                 <span className={styles["striped-text"]}>Or</span>
//                 <span className={styles["striped-line"]} />
//             </div>

//             {/* SNS 회원가입(OAuth 시작) */}
//             <div className={styles.socialContainer}>
//                 <a
//                     href="https://seoul-mate.co.kr/auth/oauth2/authorization/google"
//                     className={`${styles.social} ${styles.socialGoogle}`}
//                     aria-label="Google로 로그인"
//                     title="Google로 로그인"
//                 >
//                     <img src={googleLogo} alt="Google" className={styles.socialIcon} />
//                 </a>

//                 <a
//                     href="https://seoul-mate.co.kr/auth/oauth2/authorization/naver"
//                     className={`${styles.social} ${styles.socialNaver}`}
//                     aria-label="Naver로 로그인"
//                     title="Naver로 로그인"
//                 >
//                     <img src={naverLogo} alt="Naver" className={styles.socialIcon} />
//                 </a>

//                 <a
//                     href="https://seoul-mate.co.kr/auth/oauth2/authorization/kakao"
//                     className={`${styles.social} ${styles.socialKakao}`}
//                     aria-label="Kakao로 로그인"
//                     title="Kakao로 로그인"
//                 >
//                     <img src={kakaoLogo} alt="Kakao" className={styles.socialIcon} />
//                 </a>
//             </div>
//           </form>
//         </section>

//         {/* ====================== Sign In ====================== */}
//         <section className={`${styles.formContainer} ${styles.signInContainer}`}>
//           <form className={styles.form} onSubmit={handleSubmitSignIn}>
//             <h1 className={styles.h1}>
//               <Link to="/" className={styles.brandLink} aria-label="메인 페이지로 이동">
//                 <img src={FullLogo} alt="SeoulMate 로고" className={styles.brandLogo} />
//               </Link>
//             </h1>

//             {/* <span className={styles.span}>SNS 계정으로 로그인</span> */}

//             <input
//               type="email"
//               placeholder="Email"
//               className={styles.input}
//               value={inEmail}
//               onChange={(e) => setInEmail(e.target.value)}
//               required
//               autoComplete="email"
//             />
//             <input
//               type="password"
//               placeholder="Password"
//               className={styles.input}
//               value={inPwd}
//               onChange={(e) => setInPwd(e.target.value)}
//               required
//               autoComplete="current-password"
//             />

//             <a href="#" className={styles.link} onClick={(e) => e.preventDefault()}>
//               Forgot your password?
//             </a>

//             <button
//               type="submit"
//               className={styles.button}
//               disabled={!inEmail || !inPwd || signInLoading}
//               aria-busy={signInLoading}
//             >
//               {signInLoading ? "로그인 중…" : "Sign In"}
//             </button>

//             <div className={styles.striped}>
//                 <span className={styles["striped-line"]} />
//                 <span className={styles["striped-text"]}>Or</span>
//                 <span className={styles["striped-line"]} />
//             </div>

//             {/* SNS 로그인(OAuth 시작) */}
//             <div className={styles.socialContainer}>
//             <a
//                 href="https://seoul-mate.co.kr/auth/oauth2/authorization/google"
//                 className={`${styles.social} ${styles.socialGoogle}`}
//                 aria-label="Google로 로그인"
//                 title="Google로 로그인"
//             >
//                 <img src={googleLogo} alt="Google" className={styles.socialIcon} />
//             </a>

//             <a
//                 href="https://seoul-mate.co.kr/auth/oauth2/authorization/naver"
//                 className={`${styles.social} ${styles.socialNaver}`}
//                 aria-label="Naver로 로그인"
//                 title="Naver로 로그인"
//             >
//                 <img src={naverLogo} alt="Naver" className={styles.socialIcon} />
//             </a>

//             <a
//                 href="https://seoul-mate.co.kr/auth/oauth2/authorization/kakao"
//                 className={`${styles.social} ${styles.socialKakao}`}
//                 aria-label="Kakao로 로그인"
//                 title="Kakao로 로그인"
//             >
//                 <img src={kakaoLogo} alt="Kakao" className={styles.socialIcon} />
//             </a>
//             </div>
//           </form>
//         </section>

//         {/* ====================== Overlay ====================== */}
//         <div className={styles.overlayContainer}>
//           <div className={styles.overlay}>
//             <div className={`${styles.overlayPanel} ${styles.overlayLeft}`}>
//               <h1 className={styles.h1}>SeoulMate</h1>
//               <p className={styles.p}>SeoulMate에 로그인하세요!</p>
//               <button
//                 className={`${styles.button} ${styles.ghost}`}
//                 onClick={() => setMode("signin")}
//                 type="button"
//               >
//                 Sign In
//               </button>
//             </div>
//             <div className={`${styles.overlayPanel} ${styles.overlayRight}`}>
//               <h1 className={styles.h1}>Create account</h1>
//               <p className={styles.p}>SeoulMate에 가입하세요!</p>
//               <button
//                 className={`${styles.button} ${styles.ghost}`}
//                 onClick={() => setMode("signup")}
//                 type="button"
//               >
//                 Sign Up
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }
