import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useState } from "react";
import { createContext } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";
import { useEffect, useContext } from "react";


const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [otpData, setOtpData] = useState(null); // For OTP verification

  const login = (userdata, token) => {
    setUser(userdata);
    localStorage.setItem("user", JSON.stringify(userdata));
    if (token) {
      localStorage.setItem("authToken", token);
    }
  };
  const logout = async () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };
  const handlegooglesignin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseuser = result.user;
      const payload = {
        email: firebaseuser.email,
        name: firebaseuser.displayName,
        image: firebaseuser.photoURL || "https://github.com/shadcn.png",
      };
      const response = await axiosInstance.post("/user/login", payload);
      if (response.data.token) {
        // Direct login with token
        login(response.data.result, response.data.token);
      } else if (response.data.requiresOTP) {
        // Store OTP data for verification
        setOtpData({
          email: payload.email,
          otpMethod: response.data.otpMethod,
          userData: response.data.result,
          token: response.data.token // Store token for after verification
        });
        console.log("OTP required:", response.data.message);
      } else {
        login(response.data.result);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleOTPVerificationSuccess = (userData, token) => {
    login(userData, token);
    setOtpData(null); // Clear OTP data
  };

  const clearOTPData = () => {
    setOtpData(null);
  };

  useEffect(() => {
    // Check for existing user session
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("authToken");
    
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error("Error parsing saved user data:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
      }
    }

    const unsubcribe = onAuthStateChanged(auth, async (firebaseuser) => {
      if (firebaseuser) {
        try {
          const payload = {
            email: firebaseuser.email,
            name: firebaseuser.displayName,
            image: firebaseuser.photoURL || "https://github.com/shadcn.png",
          };
          const response = await axiosInstance.post("/user/login", payload);
          if (response.data.token) {
            // Direct login with token
            login(response.data.result, response.data.token);
          } else if (response.data.requiresOTP) {
            // OTP required - you'll need to handle this in your UI
            console.log("OTP required:", response.data.message);
            // For now, just log the user in without token
            login(response.data.result);
          } else {
            login(response.data.result);
          }
        } catch (error) {
          console.error(error);
          logout();
        }
      }
    });
    return () => unsubcribe();
  }, []);

  return (
    <UserContext.Provider value={{ 
      user, 
      login, 
      logout, 
      handlegooglesignin, 
      otpData, 
      handleOTPVerificationSuccess, 
      clearOTPData 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
