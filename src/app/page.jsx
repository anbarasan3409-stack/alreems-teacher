'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from "next/image";
import { COLORS } from "@/theme/themeConstants";
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { isAuthenticated, loading, login, justLoggedOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated and hasn't just logged out, redirect to dashboard
    if (isAuthenticated && !justLoggedOut) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, justLoggedOut, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  // If authenticated and not just logged out, don't show login page (will redirect)
  if (isAuthenticated && !justLoggedOut) {
    return null;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: COLORS.background }}>
      <div className="bg-white rounded-3xl shadow-card p-8 flex flex-col items-center gap-6 min-w-[400px] border border-gray-200">
        <Image
          src="/assets/logo.png"
          alt="Al Reems Logo"
          width={120}
          height={70}
          className="mb-4"
        />
        <h1 className="text-3xl font-bold text-center" style={{ color: COLORS.primary }}>
          Alreems Teacher Portal
        </h1>
        <p className="text-base text-gray-700 text-center mb-4 max-w-sm">
          Access your teacher dashboard and manage your courses with ease.
        </p>
        <button
          onClick={login}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-full font-semibold text-lg shadow-card transition-colors hover:opacity-90"
          style={{ backgroundColor: COLORS.secondary, color: COLORS.background }}
        >
          <Image src="/assets/icons/google.png" alt="Google" width={24} height={24} />
          Sign in with Google
        </button>
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg w-full">
          <p className="text-sm text-blue-800 text-center">
            Teacher access required. Please use your authorized Google account.
          </p>
        </div>
      </div>
    </div>
  );
}
