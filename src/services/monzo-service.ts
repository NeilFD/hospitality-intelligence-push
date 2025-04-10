
import { supabase } from '@/lib/supabase';

export interface MonzoAccount {
  id: string;
  description: string;
  created: string;
}

export interface MonzoBalance {
  balance: number;
  total_balance: number;
  currency: string;
  spend_today: number;
}

export interface MonzoTransaction {
  id: string;
  created: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  merchant?: {
    id: string;
    name: string;
    logo: string;
  };
}

export const monzoApi = {
  async whoAmI(): Promise<{ user_id: string; authenticated: boolean }> {
    const { data, error } = await supabase.functions.invoke('monzo-api', {
      query: { endpoint: 'whoami' },
    });
    
    if (error) throw new Error(error.message);
    return data;
  },
  
  async getAccounts(): Promise<{ accounts: MonzoAccount[] }> {
    const { data, error } = await supabase.functions.invoke('monzo-api', {
      query: { endpoint: 'accounts' },
    });
    
    if (error) throw new Error(error.message);
    return data;
  },
  
  async getBalance(accountId: string): Promise<MonzoBalance> {
    const { data, error } = await supabase.functions.invoke('monzo-api', {
      query: { 
        endpoint: 'balance',
        account_id: accountId
      },
    });
    
    if (error) throw new Error(error.message);
    return data;
  },
  
  async getTransactions(accountId: string): Promise<{ transactions: MonzoTransaction[] }> {
    const { data, error } = await supabase.functions.invoke('monzo-api', {
      query: { 
        endpoint: 'transactions',
        account_id: accountId
      },
    });
    
    if (error) throw new Error(error.message);
    return data;
  },
  
  async getTransactionDetail(transactionId: string): Promise<{ transaction: MonzoTransaction }> {
    const { data, error } = await supabase.functions.invoke('monzo-api', {
      query: { 
        endpoint: 'transaction_detail',
        transaction_id: transactionId
      },
    });
    
    if (error) throw new Error(error.message);
    return data;
  }
};
