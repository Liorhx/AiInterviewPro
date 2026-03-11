import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { BrainCircuit, LogOut, User as UserIcon } from "lucide-react";

export default function Navbar() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-indigo-600">
          <BrainCircuit className="h-8 w-8" />
          <span>InterviewPro</span>
        </Link>

        <div className="flex items-center gap-6">
          {token ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-neutral-600 hover:text-indigo-600">
                Dashboard
              </Link>
              <Link to="/roles" className="text-sm font-medium text-neutral-600 hover:text-indigo-600">
                Practice
              </Link>
              <div className="flex items-center gap-4 border-l border-black/5 pl-6">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-700">{user?.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-red-500 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-neutral-600 hover:text-indigo-600">
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
