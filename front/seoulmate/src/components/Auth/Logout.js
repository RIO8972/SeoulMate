import React from "react";
import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
//import { jwtDecode } from "jwt-decode";

const Logout = () => {
    const location = useLocation();

    useEffect(() => {
        localStorage.removeItem("accessToken");
        //rt도 없애기s
    },[]);

    return <Navigate to="/login" state={{ from: location}} replace />
}

export default Logout;

