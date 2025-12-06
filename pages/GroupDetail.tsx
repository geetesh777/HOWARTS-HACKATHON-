import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Group, User, Expense, SplitType } from '../types';
import BalanceChart from '../components/BalanceChart';
import ExpenseForm from '../components/ExpenseForm';
import { Plus, ArrowLeft, Receipt, Wallet, Banknote } from 'lucide-react';

interface GroupDetailProps {
  groups: Group[];
  users: User[];
  expenses: Expense[];
  currentUser: User;
  onAddExpense: (expense: Expense) => void;
  onSettle: (groupId: string, fromUserId: string, toUserId: string, amount: number) => void;
}

const GroupDetail: React.FC<GroupDetailProps> = ({ groups, users, expenses, currentUser, onAddExpense, onSettle }) => {
  const { groupId } = useParams();
  const group = groups.find(g => g.id === groupId);
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  const groupExpenses = useMemo(() => 
    expenses
      .filter(e => e.groupId === groupId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  , [expenses, groupId]);

  const balances = useMemo(() => {
    if (!group) return [];
    
    // Calculate net balance
    const balMap: Record<string, number> = {};
    group.members.forEach(m => balMap[m] = 0);

    groupExpenses.forEach(exp => {
      const payer = exp.paidByUserId;
      const amount = exp.amount;
      
      // Payer gets positive balance (owed money)
      if (balMap[payer] !== undefined) {
         balMap[payer] += amount;
      }

      // Splitters get negative balance (owe money)
      exp.splits.forEach(split => {
        if (balMap[split.userId] !== undefined) {
          balMap[split.userId] -= split.amount;
        }
      });
    });

    return Object.keys(balMap).map(uid => ({ userId: uid, amount: balMap[uid] }));
  }, [group, groupExpenses]);

  // Suggested settlements (simplified algorithm)
  const settlements = useMemo(() => {
     let debtors = balances.filter(b => b.amount < -0.01).sort((a, b) => a.amount - b.amount);
     let creditors = balances.filter(b => b.amount > 0.01).sort((a, b) => b.amount - a.amount);
     
     const suggestions: {from: string, to: string, amount: number}[] = [];
     
     // Deep copy to not mutate original display balances
     debtors = JSON.parse(JSON.stringify(debtors));
     creditors = JSON.parse(JSON.stringify(creditors));

     let i = 0; 
     let j = 0;

     while (i < debtors.length && j < creditors.length) {
         const debt = Math.abs(debtors[i].amount);
         const credit = creditors[j].amount;
         const amount = Math.min(debt, credit);

         suggestions.push({
             from: debtors[i].userId,
             to: creditors[j].userId,
             amount
         });

         debtors[i].amount += amount;
         creditors[j].amount -= amount;

         if (Math.abs(debtors[i].amount) < 0.01) i++;
         if (creditors[j].amount < 0.01) j++;
     }
     return suggestions;
  }, [balances]);

  if (!group) return <div className="p-8 text-center">Group not found</div>;

  const handleCreateExpense = (desc: string, amount: number, payerId: string, type: SplitType, splits: {userId: string, amount: number}[]) => {
      const newExpense: Expense = {
          id: `e${Date.now()}`,
          groupId: group.id,
          description: desc,
          amount,
          paidByUserId: payerId,
          date: new Date().toISOString(),
          type,
          splits
      };
      onAddExpense(newExpense);
      setIsAddingExpense(false);
  };

  const handleSettleUp = (s: {from: string, to: string, amount: number}) => {
      // Settle up creates an expense where 'from' pays 'to' the full amount, 
      // and the split is assigned entirely to 'from' (so 'from' owes nothing more for this tx, but balances out prev debt).
      // Actually, standard way: 
      // Expense: "Settlement", Amount: X, Paid By: Debtor, Split: [Creditor gets full debt assigned?]
      // Easier: PaidBy Debtor. Split: Creditor owes the full amount.
      // Math: Debtor Paid +X (Bal +X). Creditor Owes X (Bal -X).
      // Net effect: Debtor (was -X, now 0). Creditor (was +X, now 0).
      
      const newExpense: Expense = {
          id: `set${Date.now()}`,
          groupId: group.id,
          description: "Settlement Payment",
          amount: s.amount,
          paidByUserId: s.from, // Debtor pays
          date: new Date().toISOString(),
          type: SplitType.CUSTOM,
          splits: [{ userId: s.to, amount: s.amount }] // Creditor is assigned the "debt" of this payment, canceling their credit
      };
      onAddExpense(newExpense);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
          <ArrowLeft size={24} />
        </Link>
        <div>
           <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
           <p className="text-gray-500 text-sm">{group.members.length} members</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <BalanceChart balances={balances} users={users} />
          
          <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Banknote size={20} className="text-emerald-500"/> Suggested Settlements
              </h3>
              <div className="space-y-3 max-h-52 overflow-y-auto">
                  {settlements.length === 0 ? (
                      <p className="text-gray-400 text-sm italic">All settled up!</p>
                  ) : (
                      settlements.map((s, idx) => {
                          const fromUser = users.find(u => u.id === s.from);
                          const toUser = users.find(u => u.id === s.to);
                          const isCurrentUserDebtor = s.from === currentUser.id;
                          
                          return (
                              <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-100">
                                  <div className="text-sm">
                                      <span className="font-semibold text-gray-800">{fromUser?.name}</span>
                                      <span className="text-gray-500 mx-1">owes</span>
                                      <span className="font-semibold text-gray-800">{toUser?.name}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <span className="font-bold text-gray-800">${s.amount.toFixed(2)}</span>
                                      {isCurrentUserDebtor && (
                                          <button 
                                            onClick={() => handleSettleUp(s)}
                                            className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-200 font-medium"
                                          >
                                              Pay
                                          </button>
                                      )}
                                  </div>
                              </div>
                          );
                      })
                  )}
              </div>
          </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Activity</h3>
          </div>
          <div className="divide-y divide-gray-100">
              {groupExpenses.map(expense => {
                  const payer = users.find(u => u.id === expense.paidByUserId);
                  const isSettlement = expense.description === "Settlement Payment";
                  
                  return (
                      <div key={expense.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-full ${isSettlement ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                  {isSettlement ? <Wallet size={20} /> : <Receipt size={20} />}
                              </div>
                              <div>
                                  <h4 className="font-medium text-gray-900">{expense.description}</h4>
                                  <p className="text-xs text-gray-500">
                                      <span className="font-semibold">{payer?.id === currentUser.id ? 'You' : payer?.name}</span> paid ${expense.amount.toFixed(2)}
                                  </p>
                              </div>
                          </div>
                          <div className="text-right">
                              <span className="text-xs text-gray-400 block mb-1">
                                  {new Date(expense.date).toLocaleDateString()}
                              </span>
                              {/* Show what current user owes/lent for this transaction */}
                              {(() => {
                                  if (expense.paidByUserId === currentUser.id) {
                                      // You paid
                                      const yourSplit = expense.splits.find(s => s.userId === currentUser.id)?.amount || 0;
                                      const lent = expense.amount - yourSplit;
                                      return <span className="text-sm font-semibold text-emerald-600">You lent ${lent.toFixed(2)}</span>
                                  } else {
                                      // Someone else paid
                                      const owed = expense.splits.find(s => s.userId === currentUser.id)?.amount || 0;
                                      if (owed > 0) return <span className="text-sm font-semibold text-orange-600">You owe ${owed.toFixed(2)}</span>
                                      return <span className="text-sm text-gray-400">not involved</span>
                                  }
                              })()}
                          </div>
                      </div>
                  );
              })}
              {groupExpenses.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                      No expenses yet. Tap + to add one.
                  </div>
              )}
          </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsAddingExpense(true)}
        className="fixed bottom-6 right-6 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 transition-transform active:scale-95 flex items-center gap-2"
      >
        <Plus size={24} />
        <span className="font-semibold pr-2">Add Expense</span>
      </button>

      {isAddingExpense && (
          <ExpenseForm 
            group={group} 
            users={users.filter(u => group.members.includes(u.id))}
            currentUser={currentUser}
            onSubmit={handleCreateExpense}
            onCancel={() => setIsAddingExpense(false)}
          />
      )}
    </div>
  );
};

export default GroupDetail;