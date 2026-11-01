import { Home, Calendar, Users, FileText, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar({ navItems, activeTab, setActiveTab, COLORS }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
    }
  };
  return (
    <aside className="fixed left-0 top-0 h-screen w-68 shadow-sm border-r border-gray-200 flex flex-col z-10" style={{ backgroundColor: COLORS.background }}>
      {/* Logo */}
      <div className="p-2 border-b border-gray-100">
        <div className="flex items-center justify-center gap-3">
          <img src="/assets/logo.png" alt="Al Reems Logo" style={{ width: 120, height: 60, objectFit: 'contain' }} />
        </div>
      </div>
      {/* Navigation */}
      <nav className="flex-1 p-6">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium"
                style={
                  activeTab === item.id
                    ? {
                        backgroundColor: COLORS.secondary,
                        color: COLORS.background,
                        boxShadow: '0 4px 12px rgba(57, 73, 171, 0.15)',
                      }
                    : {
                        color: COLORS.text,
                      }
                }
                onMouseEnter={(e) => {
                  if (activeTab !== item.id) {
                    e.target.style.backgroundColor = '#F9FAFB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== item.id) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
      {/* User Profile */}
      <div className="p-6 border-t border-gray-100">
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <div 
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${COLORS.secondary}, rgba(57, 73, 171, 0.7))`,
              minWidth: '48px',
              minHeight: '48px'
            }}
          >
            <User size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold" style={{ color: COLORS.text }}>
              {user?.name || 'Teacher Name'}
            </p>
            <p 
              className="text-sm truncate" 
              style={{ 
                color: COLORS.text,
                maxWidth: '100%'
              }}
              title={user?.email || "teacher@example.com"}
            >
              {user?.email || "teacher@example.com"}
            </p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 font-medium border"
          style={{ 
            backgroundColor: 'transparent',
            color: COLORS.primary,
            borderColor: COLORS.primary
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = COLORS.primary;
            e.target.style.color = COLORS.background;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = COLORS.primary;
          }}
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
