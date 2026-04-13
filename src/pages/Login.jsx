import { useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await API.post("/login", {
        email: email.trim().toLowerCase(),
        password,
      });
      localStorage.setItem("token", res.data.token);
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.sqlMessage ||
        "Login failed! Please check your credentials.";
      alert(message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="bg-gray-800/50 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-96 border border-gray-700 animate-in fade-in zoom-in duration-500">
        <h1 className="text-3xl font-extrabold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Welcome Back
        </h1>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            className="w-full p-3 rounded-xl bg-gray-700/50 border border-gray-600 focus:border-blue-500 focus:outline-none transition-all"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-xl bg-gray-700/50 border border-gray-600 focus:border-blue-500 focus:outline-none transition-all"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transform transition active:scale-95"
          >
            Sign In
          </button>
        </div>
        <p className="mt-6 text-center text-gray-400 text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-400 hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}
