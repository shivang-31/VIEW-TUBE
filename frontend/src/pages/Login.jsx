import React, { useState } from "react";
import axios from "axios";


export const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:3000/api/auth/login", formData, {
        headers: { "Content-Type": "application/json" }
      });

      console.log("✅ Login successful:", res.data);

      // Save token in localStorage
      localStorage.setItem("token", res.data.accessToken);
      console.log("✅ Token saved in localStorage");

      alert("Login successful!");
    } catch (error) {
      console.error("❌ Login failed:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className='flex flex-col bg-gray-800 p-4 rounded-lg w-80 mx-auto mt-10 text-white'
    >
      <label htmlFor="email">Email</label>
      <input 
        type="email" 
        id="email" 
        name="email" 
        value={formData.email} 
        onChange={handleChange} 
        required 
        className='bg-gray-600 rounded p-2 mb-2'
      />

      <label htmlFor="password">Password</label>
      <input 
        type="password" 
        id="password" 
        name="password" 
        value={formData.password} 
        onChange={handleChange} 
        required 
        className='bg-gray-600 rounded p-2 mb-2'
      />

      <button 
        type="submit" 
        className='bg-blue-500 rounded p-2 mt-2 hover:bg-blue-600'
        disabled={loading}
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
};
