import { User, Group, Expense, SplitType } from './types';

export const CURRENT_USER_ID = 'u1';

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'You', email: 'you@example.com', avatar: 'https://picsum.photos/seed/u1/200' },
  { id: 'u2', name: 'Alice', email: 'alice@example.com', avatar: 'https://picsum.photos/seed/u2/200' },
  { id: 'u3', name: 'Bob', email: 'bob@example.com', avatar: 'https://picsum.photos/seed/u3/200' },
  { id: 'u4', name: 'Charlie', email: 'charlie@example.com', avatar: 'https://picsum.photos/seed/u4/200' },
];

export const MOCK_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'Vegas Trip 🎲',
    members: ['u1', 'u2', 'u3', 'u4'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'g2',
    name: 'House Expenses 🏠',
    members: ['u1', 'u2'],
    created_at: new Date().toISOString(),
  }
];

export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'e1',
    groupId: 'g1',
    description: 'Hotel Booking',
    amount: 600,
    paidByUserId: 'u1',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    type: SplitType.EQUAL,
    splits: [
      { userId: 'u1', amount: 150 },
      { userId: 'u2', amount: 150 },
      { userId: 'u3', amount: 150 },
      { userId: 'u4', amount: 150 },
    ]
  },
  {
    id: 'e2',
    groupId: 'g1',
    description: 'Dinner at Gordon Ramsay',
    amount: 200,
    paidByUserId: 'u2',
    date: new Date(Date.now() - 86400000).toISOString(),
    type: SplitType.CUSTOM,
    splits: [
      { userId: 'u1', amount: 50 },
      { userId: 'u2', amount: 80 }, // Alice paid for herself + extra
      { userId: 'u3', amount: 35 },
      { userId: 'u4', amount: 35 },
    ]
  }
];