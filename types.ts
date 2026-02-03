
export interface UserProfile {
  name: string;
  creditScore: number;
  creditLimit: number;
  availableCredit: number;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  description: string;
  category: 'Repayment' | 'Withdrawal' | 'Fee';
}

export interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  dueDate: string;
  status: 'Active' | 'Paid' | 'Pending';
}

export interface Notification {
  id: string;
  type: 'CreditLimit' | 'Marketing' | 'Reminder' | 'Success';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

export type TabType = 'home' | 'loans' | 'apply' | 'advisor' | 'notifications' | 'service' | 'loan-records' | 'loan-details' | 'increase-limit' | 'welfare-center' | 'coupons' | 'short-drama' | 'novel-list';
