'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardContent from '@/components/DashboardContent';
import StudentProfile from '@/components/StudentProfile';
import StudentList from '@/components/StudentList';
import MySessions from '@/components/MySessions';
import Assignments from '@/components/Assignments';
import Materials from '@/components/Materials';
import ProtectedRoute from '@/components/ProtectedRoute';
import { COLORS } from '@/theme/themeConstants';
import { Home, Calendar, Users, FileText, BookOpen } from 'lucide-react';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'sessions', label: 'My Sessions', icon: Calendar },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'materials', label: 'Materials', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: FileText },
  ];

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
  };

  const handleBackToList = () => {
    setSelectedStudent(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />;
      case 'sessions':
        return <MySessions />;
      case 'students':
        if (selectedStudent) {
          return (
            <div className="p-8">
              <button
                onClick={handleBackToList}
                className="mb-6 flex items-center gap-2 px-4 py-2 text-secondary hover:bg-secondary/10 rounded-lg transition-colors"
              >
                ← Back to Students List
              </button>
              <StudentProfile student={selectedStudent} />
            </div>
          );
        }
        return <StudentList onStudentSelect={handleStudentSelect} />;
      case 'materials':
        return <Materials />;
      case 'assignments':
        return <Assignments />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: COLORS.background }}>
      <Sidebar navItems={navItems} activeTab={activeTab} setActiveTab={setActiveTab} COLORS={COLORS} />
      <main className="flex-1 ml-64">
        {renderContent()}
      </main>
    </div>
  );
}

export default function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
