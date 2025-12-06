import React, { useState, useEffect } from 'react';
import { User, Group, SplitType } from '../types';
import { parseExpenseText } from '../services/geminiService';
import { Loader2, Sparkles } from 'lucide-react';

interface ExpenseFormProps {
  group: Group;
  users: User[];
  currentUser: User;
  onSubmit: (description: string, amount: number, payerId: string, type: SplitType, splits: { userId: string, amount: number }[]) => void;
  onCancel: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ group, users, currentUser, onSubmit, onCancel }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [payerId, setPayerId] = useState(currentUser.id);
  const [splitType, setSplitType] = useState<SplitType>(SplitType.EQUAL);
  const [selectedUsers, setSelectedUsers] = useState<string[]>(group.members);
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);

  useEffect(() => {
    // Initialize custom amounts when amount changes or users change
    const numAmount = parseFloat(amount) || 0;
    if (splitType === SplitType.EQUAL) {
        // No op for equal, calculated on submission
    }
  }, [amount, selectedUsers, splitType]);

  const handleAiParse = async () => {
    if (!aiPrompt.trim()) return;
    setIsThinking(true);
    try {
      const result = await parseExpenseText(aiPrompt, users);
      
      if (result) {
        setDescription(result.description);
        setAmount(result.amount.toString());
        
        // Try to match payer
        if (result.payerName) {
           const foundPayer = users.find(u => u.name.toLowerCase() === result.payerName.toLowerCase());
           if (foundPayer) setPayerId(foundPayer.id);
        }

        // Try to match involved users (simple inclusion logic)
        // Reset selected to none first? No, default to all then filter if specific names found
        const foundUserIds: string[] = [];
        if (result.involvedNames && Array.isArray(result.involvedNames)) {
            result.involvedNames.forEach((name: string) => {
                const u = users.find(user => user.name.toLowerCase().includes(name.toLowerCase()));
                if (u) foundUserIds.push(u.id);
            });
        }
        
        // If we found specific people, limit split to them (plus maybe payer if implied?)
        if (foundUserIds.length > 0) {
            setSelectedUsers([...new Set([...foundUserIds])]); 
        }
        
        setShowAiInput(false);
      }
    } catch (e) {
      alert("Failed to understand the expense. Please try manual entry.");
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!description || isNaN(numAmount) || numAmount <= 0) return;

    let finalSplits: { userId: string, amount: number }[] = [];

    if (splitType === SplitType.EQUAL) {
      const splitAmount = numAmount / selectedUsers.length;
      finalSplits = selectedUsers.map(uid => ({ userId: uid, amount: splitAmount }));
    } else {
      let totalSplit = 0;
      finalSplits = Object.entries(customAmounts).map(([uid, amt]) => {
        const val = parseFloat(amt) || 0;
        totalSplit += val;
        return { userId: uid, amount: val };
      });
      
      // Basic validation
      if (Math.abs(totalSplit - numAmount) > 0.05) {
        alert(`Split amounts ($${totalSplit.toFixed(2)}) do not match total ($${numAmount.toFixed(2)})`);
        return;
      }
    }

    onSubmit(description, numAmount, payerId, splitType, finalSplits);
  };

  const toggleUserSelection = (uid: string) => {
    if (selectedUsers.includes(uid)) {
      setSelectedUsers(selectedUsers.filter(id => id !== uid));
    } else {
      setSelectedUsers([...selectedUsers, uid]);
    }
  };

  const handleCustomAmountChange = (uid: string, value: string) => {
    setCustomAmounts(prev => ({ ...prev, [uid]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Add Expense</h2>
            <button 
                onClick={() => setShowAiInput(!showAiInput)}
                className="text-sm flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors"
            >
                <Sparkles size={16} />
                {showAiInput ? "Manual Mode" : "Magic Fill"}
            </button>
          </div>

          {showAiInput && (
              <div className="mb-6 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                  <label className="block text-sm font-medium text-indigo-900 mb-2">
                      Describe the expense naturally
                  </label>
                  <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g., Bob paid 45 for lunch with Alice"
                        className="flex-1 border-indigo-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleAiParse()}
                    />
                    <button 
                        onClick={handleAiParse}
                        disabled={isThinking}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isThinking ? <Loader2 className="animate-spin" /> : 'Parse'}
                    </button>
                  </div>
              </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                required
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 p-2 border"
                placeholder="What is this for?"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                required
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 p-2 border text-lg font-semibold"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Paid By</label>
              <select
                value={payerId}
                onChange={e => setPayerId(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 p-2 border"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="pt-2">
               <label className="block text-sm font-medium text-gray-700 mb-2">Split Type</label>
               <div className="flex gap-2 mb-4">
                   <button
                    type="button"
                    onClick={() => setSplitType(SplitType.EQUAL)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md ${splitType === SplitType.EQUAL ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-transparent'}`}
                   >
                       Equal Split
                   </button>
                   <button
                    type="button"
                    onClick={() => setSplitType(SplitType.CUSTOM)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md ${splitType === SplitType.CUSTOM ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-transparent'}`}
                   >
                       Custom Amounts
                   </button>
               </div>
               
               <div className="space-y-2 max-h-48 overflow-y-auto">
                   {users.map(u => (
                       <div key={u.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                           <div className="flex items-center gap-2">
                               {splitType === SplitType.EQUAL && (
                                   <input 
                                    type="checkbox" 
                                    checked={selectedUsers.includes(u.id)}
                                    onChange={() => toggleUserSelection(u.id)}
                                    className="rounded text-emerald-600 focus:ring-emerald-500"
                                   />
                               )}
                               <span className="text-sm font-medium text-gray-700">{u.name}</span>
                           </div>
                           
                           {splitType === SplitType.EQUAL ? (
                               <span className="text-sm text-gray-500">
                                   {selectedUsers.includes(u.id) 
                                    ? `$${(parseFloat(amount || '0') / (selectedUsers.length || 1)).toFixed(2)}` 
                                    : '$0.00'}
                               </span>
                           ) : (
                               <input 
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="w-24 text-right border border-gray-300 rounded p-1 text-sm"
                                value={customAmounts[u.id] || ''}
                                onChange={(e) => handleCustomAmountChange(u.id, e.target.value)}
                               />
                           )}
                       </div>
                   ))}
               </div>
            </div>

            <div className="flex gap-3 pt-4 border-t mt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;