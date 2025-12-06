import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import GroupDetail from './pages/GroupDetail';
import { MOCK_GROUPS, MOCK_USERS, MOCK_EXPENSES, CURRENT_USER_ID } from './constants';
import { Group, User, Expense } from './types';

const App: React.FC = () => {
  // Global State (Mocking a backend)
  const [users] = useState<User[]>(MOCK_USERS);
  const [groups] = useState<Group[]>(MOCK_GROUPS);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  
  const currentUser = users.find(u => u.id === CURRENT_USER_ID) || users[0];

  const handleAddExpense = (expense: Expense) => {
    setExpenses(prev => [...prev, expense]);
  };

  const handleSettle = (groupId: string, fromUserId: string, toUserId: string, amount: number) => {
      // Handled within GroupDetail logic which calls addExpense with a settlement type
      console.log(`Settling ${amount} from ${fromUserId} to ${toUserId}`);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Routes>
          <Route 
            path="/" 
            element={
              <Dashboard 
                groups={groups} 
                currentUser={currentUser} 
                expenses={expenses}
              />
            } 
          />
          <Route 
            path="/group/:groupId" 
            element={
              <GroupDetail 
                groups={groups} 
                users={users} 
                expenses={expenses}
                currentUser={currentUser}
                onAddExpense={handleAddExpense}
                onSettle={handleSettle}
              />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;