import React, { useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth.jsx";
import axios from "axios";

const Header = () => {
  const { user, logout, token } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        // If no token, try to get name from user object
        setName(user?.username || user?.email?.split("@")[0] || "User");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setName(response.data.user?.username || response.data.user?.email?.split("@")[0] || "User");
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        // Fallback to user data from useAuth
        setName(user?.username || user?.email?.split("@")[0] || "User");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, user]);

  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Loading...</h1>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Welcome back, {name}
          </h1>
          <p className="text-gray-500">Here's what's happening today</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">{user?.email}</span>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;