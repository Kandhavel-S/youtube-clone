import React from 'react';
import GroupManager from '../../components/GroupManager';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { useTheme } from '../../components/ThemeProvider';

const GroupsPage = () => {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gray-900 text-white' 
        : 'bg-white text-gray-900'
    }`}>
      <Header />
      <div className="flex">
        <Sidebar />
        <main className={`flex-1 p-6 transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-gray-900 text-white' 
            : 'bg-white text-gray-900'
        }`}>
          <GroupManager />
        </main>
      </div>
    </div>
  );
};

export default GroupsPage;
