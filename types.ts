export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Group {
  id: string;
  name: string;
  members: string[]; // user_ids
  created_at: string;
}

export enum SplitType {
  EQUAL = 'EQUAL',
  CUSTOM = 'CUSTOM',
}

export interface Split {
  userId: string;
  amount: number;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  paidByUserId: string;
  date: string;
  type: SplitType;
  splits: Split[];
}

export interface Balance {
  userId: string;
  amount: number; // Positive = Owed to user, Negative = User owes
}

// Gemini specific types for parsing
export interface ParsedExpense {
  description: string;
  amount: number;
  paidBy: string | null; // Name of person
  involvedUsers: string[]; // Names of people
}