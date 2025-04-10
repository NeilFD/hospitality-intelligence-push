
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { monzoApi } from "@/services/monzo-service";
import { 
  Card, CardContent, CardDescription, 
  CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableStickyHeader
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, RefreshCw, User, CreditCard, List, PiggyBank } from "lucide-react";
import { toast } from "sonner";

const MonzoApi: React.FC = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("accounts");
  
  const { data: whoAmIData, isLoading: whoAmILoading, error: whoAmIError, refetch: refetchWhoAmI } = 
    useQuery({
      queryKey: ["monzo", "whoami"],
      queryFn: monzoApi.whoAmI,
      retry: 1,
    });
    
  const { 
    data: accountsData, 
    isLoading: accountsLoading, 
    error: accountsError, 
    refetch: refetchAccounts 
  } = useQuery({
    queryKey: ["monzo", "accounts"],
    queryFn: monzoApi.getAccounts,
    retry: 1,
  });
  
  const { 
    data: balanceData, 
    isLoading: balanceLoading, 
    error: balanceError,
    refetch: refetchBalance 
  } = useQuery({
    queryKey: ["monzo", "balance", selectedAccountId],
    queryFn: () => {
      if (!selectedAccountId) throw new Error("No account selected");
      return monzoApi.getBalance(selectedAccountId);
    },
    enabled: !!selectedAccountId,
    retry: 1,
  });
  
  const { 
    data: transactionsData, 
    isLoading: transactionsLoading, 
    error: transactionsError,
    refetch: refetchTransactions 
  } = useQuery({
    queryKey: ["monzo", "transactions", selectedAccountId],
    queryFn: () => {
      if (!selectedAccountId) throw new Error("No account selected");
      return monzoApi.getTransactions(selectedAccountId);
    },
    enabled: !!selectedAccountId && selectedTab === "transactions",
    retry: 1,
  });
  
  const handleRefresh = () => {
    refetchWhoAmI();
    refetchAccounts();
    if (selectedAccountId) {
      refetchBalance();
      if (selectedTab === "transactions") {
        refetchTransactions();
      }
    }
    toast.success("Refreshing data from Monzo");
  };
  
  const handleAccountSelection = (accountId: string) => {
    setSelectedAccountId(accountId);
  };
  
  const formatCurrency = (amount: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency,
    });
    return formatter.format(amount / 100); // Monzo amounts are in pence
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const formatTransactionAmount = (amount: number, currency: string) => {
    const isPositive = amount > 0;
    return (
      <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
        {formatCurrency(amount, currency)}
      </span>
    );
  };
  
  if (whoAmIError || accountsError) {
    return (
      <Card className="mx-auto max-w-4xl">
        <CardHeader>
          <CardTitle className="text-red-500">Error connecting to Monzo</CardTitle>
          <CardDescription>
            There was an issue connecting to the Monzo API. Please check your credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-red-500">
            {whoAmIError instanceof Error ? whoAmIError.message : 'Unknown error'}
            {accountsError instanceof Error ? accountsError.message : ''}
          </div>
          <Button className="mt-4" onClick={handleRefresh}>Retry Connection</Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="container py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Monzo API Integration</CardTitle>
            <CardDescription>
              Connect to your Monzo account and view your financial data
            </CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {whoAmILoading ? (
            <div className="flex items-center justify-center h-16">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Connecting to Monzo...</span>
            </div>
          ) : whoAmIData ? (
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Connected as:</p>
                <p className="text-xs text-muted-foreground">User ID: {whoAmIData.user_id}</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts">Accounts & Balance</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="accounts" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" /> Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accountsLoading ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : accountsData?.accounts ? (
                <div className="space-y-4">
                  {accountsData.accounts.map((account) => (
                    <div 
                      key={account.id} 
                      className={`p-4 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedAccountId === account.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => handleAccountSelection(account.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{account.description}</p>
                          <p className="text-xs text-muted-foreground">Created: {formatDate(account.created)}</p>
                        </div>
                        <Button variant="ghost" size="sm">Select</Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No accounts found</p>
              )}
            </CardContent>
          </Card>
          
          {selectedAccountId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PiggyBank className="h-5 w-5 mr-2" /> Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {balanceLoading ? (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : balanceData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-md">
                        <p className="text-sm text-muted-foreground">Current Balance</p>
                        <p className="text-2xl font-bold">{formatCurrency(balanceData.balance, balanceData.currency)}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-md">
                        <p className="text-sm text-muted-foreground">Total Balance</p>
                        <p className="text-2xl font-bold">{formatCurrency(balanceData.total_balance, balanceData.currency)}</p>
                      </div>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-md">
                      <p className="text-sm text-muted-foreground">Spent Today</p>
                      <p className="text-2xl font-bold">{formatCurrency(balanceData.spend_today, balanceData.currency)}</p>
                    </div>
                  </div>
                ) : balanceError ? (
                  <div className="text-red-500">
                    {balanceError instanceof Error ? balanceError.message : 'Error loading balance'}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="transactions" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <List className="h-5 w-5 mr-2" /> Transactions
              </CardTitle>
              <CardDescription>
                {selectedAccountId ? 'Recent transactions for your account' : 'Please select an account first'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedAccountId ? (
                <div className="text-center p-4">
                  <p>Please select an account from the Accounts tab</p>
                </div>
              ) : transactionsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : transactionsData?.transactions && transactionsData.transactions.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableStickyHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableStickyHeader>
                    <TableBody>
                      {transactionsData.transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="whitespace-nowrap">{formatDate(transaction.created)}</TableCell>
                          <TableCell>
                            {transaction.merchant?.name || transaction.description}
                          </TableCell>
                          <TableCell className="capitalize">{transaction.category.replace('_', ' ')}</TableCell>
                          <TableCell className="text-right">
                            {formatTransactionAmount(transaction.amount, transaction.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-4">
                  <p>{transactionsError ? 'Error loading transactions' : 'No transactions found'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonzoApi;
