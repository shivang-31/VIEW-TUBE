import React, { useState } from "react";

export const SignIn = () => {
  // State for form fields
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for cookies!
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log("Registration done");

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Store access token only (refresh token is in httpOnly cookie)
      localStorage.setItem("accessToken", data.accessToken);
      setSuccess("Registration successful! You can now sign in.");
      setFormData({ username: "", email: "", password: "" });
    } catch (err) {
      setError("Error during registration: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col bg-gray-800 p-4 rounded-lg text-white w-80"
    >
      <label htmlFor="username">Username:</label>
      <input
        type="text"
        id="username"
        name="username"
        value={formData.username}
        onChange={handleChange}
        required
        className="bg-gray-400 rounded p-1 mb-2 text-black"
      />

      <label htmlFor="email">Email:</label>
      <input
        type="email"
        id="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        required
        className="bg-gray-400 rounded p-1 mb-2 text-black"
      />

      <label htmlFor="password">Password:</label>
      <input
        type="password"
        id="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        required
        className="bg-gray-400 rounded p-1 mb-2 text-black"
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 rounded p-2 mt-2"
      >
        {loading ? "Registering..." : "Register"}
      </button>

      {error && <p className="text-red-400 mt-2">{error}</p>}
      {success && <p className="text-green-400 mt-2">{success}</p>}
    </form>
  );
};