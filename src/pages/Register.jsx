import { useState } from "react";
import API from "../services/api";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [form, setForm] = useState({
    name: "", email: "", password: "", program: "", year: ""
  });
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      await API.post("/register", {
        ...form,
        email: form.email.trim().toLowerCase(),
      });
      alert("Registration Successful!");
      navigate("/");
    } catch (err) {
      console.error(err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.sqlMessage ||
        "Registration failed. Try again.";
      alert(message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-tr from-gray-900 via-black to-gray-900 p-4">
      <div className="bg-gray-800/50 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-md border border-gray-700 animate-in slide-in-from-bottom-10 duration-700">
        <h1 className="text-3xl font-extrabold mb-6 text-center bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          Create Account
        </h1>
        <div className="grid gap-4">
          {["name", "email", "program", "year"].map((field) => (
            <input
              key={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              className="w-full p-3 rounded-xl bg-gray-700/50 border border-gray-600 focus:border-green-500 focus:outline-none transition-all capitalize"
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          ))}
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-xl bg-gray-700/50 border border-gray-600 focus:border-green-500 focus:outline-none transition-all"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button
            onClick={handleRegister}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-500/20 transform transition active:scale-95 mt-2"
          >
            Register Now
          </button>
        </div>
        <p className="mt-4 text-center text-gray-400 text-sm">
          Already a member? <Link to="/" className="text-green-400 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
