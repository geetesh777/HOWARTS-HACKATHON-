import React from 'react';
import { Link } from 'react-router-dom';
import { Group, User, Balance, Expense } from '../types';
import { Users, ChevronRight, PlusCircle } from 'lucide-react';

interface DashboardProps {
  groups: Group[];
  currentUser: User;
  expenses: Expense[];
}

const Dashboard: React.FC<DashboardProps> = ({ groups, currentUser, expenses }) => {
  
  const getGroupBalance = (groupId: string): number => {
      // Calculate total net balance for current user in this group
      let balance = 0;
      const groupExpenses = expenses.filter(e => e.groupId === groupId);
      
      groupExpenses.forEach(exp => {
          if (exp.paidByUserId === currentUser.id) {
              balance += exp.amount;
          }
          const mySplit = exp.splits.find(s => s.userId === currentUser.id);
          if (mySplit) {
              balance -= mySplit.amount;
          }
      });
      return balance;
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <header className="flex justify-between items-center mb-8 pt-4">
        <div className="flex items-center gap-3">
            <img src={currentUser.avatar} alt="Profile" className="w-10 h-10 rounded-full border border-gray-200" />
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome, {currentUser.name}</h1>
                <p className="text-gray-500 text-sm">Your Groups</p>
            </div>
        </div>
        <button className="text-emerald-600 hover:text-emerald-700">
            <PlusCircle size={32} />
        </button>
      </header>

      <div className="space-y-4">
        {groups.map(group => {
            const balance = getGroupBalance(group.id);
            return (
              <Link 
                key={group.id} 
                to={`/group/${group.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-5"
              >
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">{group.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">
                                {group.members.length} members
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                             <p className="text-xs text-gray-400 uppercase font-semibold">You are {balance >= 0 ? 'owed' : 'owing'}</p>
                             <p className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                 ${Math.abs(balance).toFixed(2)}
                             </p>
                        </div>
                        <ChevronRight className="text-gray-300" />
                    </div>
                </div>
              </Link>
            );
        })}
      </div>
      
      {groups.length === 0 && (
          <div className="text-center py-20">
              <p className="text-gray-400">You don't have any groups yet.</p>
          </div>
      )}
    </div>
  );
};

export default Dashboard;