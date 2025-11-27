const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('API Request:', url, options);
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      console.log('API Response:', response.status, response.statusText);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Network error' }));
        // Suppress rate limit messages - user will see a generic error instead
        if (response.status === 429 && error.message?.includes('15 minutes')) {
          throw new Error('Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.');
        }
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
  }) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string) {
    const response = await this.request<{
      accessToken: string;
      refreshToken: string;
      user: any;
      mfaRequired?: boolean;
      tempToken?: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.accessToken && typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      this.token = response.accessToken;
    }

    return response;
  }

  async logout() {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    if (refreshToken) {
      await this.request('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      this.token = null;
    }
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  // Accounts
  async getAccounts() {
    return this.request('/api/accounts');
  }

  async getAccount(id: string) {
    return this.request(`/api/accounts/${id}`);
  }

  async createAccount(data: { accountType: string; initialBalance?: number; currency?: string; branchCode?: string; branchName?: string }) {
    return this.request('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAccount(id: string, data: { isActive?: boolean; isFrozen?: boolean }) {
    return this.request(`/api/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deactivateAccount(id: string) {
    return this.request(`/api/accounts/${id}/deactivate`, {
      method: 'POST',
    });
  }

  // Balances
  async getBalances() {
    return this.request('/api/balances');
  }

  async getAccountBalance(id: string) {
    return this.request(`/api/balances/account/${id}`);
  }

  async getAccountSummary(id: string) {
    return this.request(`/api/balances/account/${id}/summary`);
  }

  // Transactions
  async getTransactions(params?: {
    accountId?: string;
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const queryString = params
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    return this.request(`/api/transactions${queryString}`);
  }

  async getTransaction(id: string) {
    return this.request(`/api/transactions/${id}`);
  }

  // Transfers
  async createTransfer(data: {
    fromAccountId: string;
    toAccountId?: string;
    toAccountIdentifier?: string;
    amount: number;
    description?: string;
  }) {
    return this.request('/api/transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Customers (for employees)
  async getCustomers() {
    return this.request('/api/customers');
  }

  // Bills
  async getBillProviders(city?: string, type?: string) {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (type) params.append('type', type);
    return this.request(`/api/bills/providers?${params.toString()}`);
  }

  async queryBill(data: { city: string; type: string; provider: string; subscriberNumber: string }) {
    return this.request('/api/bills/query', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserBills() {
    return this.request('/api/bills');
  }

  // User profile
  async updateProfile(data: { firstName?: string; lastName?: string; phoneNumber?: string; address?: string; city?: string; postalCode?: string }) {
    return this.request('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.request('/api/user/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifySMSCode(data: { code: string; phoneNumber: string }) {
    return this.request('/api/user/verify-sms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient(API_URL);


