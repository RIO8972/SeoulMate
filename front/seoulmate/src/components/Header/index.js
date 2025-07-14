import "./style.css";
import { Link } from "react-router-dom";
import Logo from "../../images/logo.png";
import Account from "../../images/account.png";
import Menu from "../../images/menu.png";

const Header = () => {
  return (
    <header className="header">
      <Link to="/" className="logo">
        <img src={Logo} alt="로고" />
      </Link>
      <div className="header-btn-layout">
        <div className="login-btn">
          <Link to="/login" className="login-link">
            <img src={Account} alt="로그인" className="header-icon" />
          </Link>
        </div>
        <button className="menu-btn">
          <img src={Menu} alt="메뉴" className="header-icon" />
        </button>
      </div>
    </header>
  );
};

export default Header;
