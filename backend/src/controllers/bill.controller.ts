import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

// Mock bill providers by city
const billProviders: Record<string, Record<string, string[]>> = {
  'İstanbul': {
    'ELECTRICITY': ['BEDAŞ', 'AYEDAŞ', 'GEDAŞ'],
    'WATER': ['İSKİ', 'SASKI'],
    'GAS': ['İGDAŞ'],
    'INTERNET': ['Türk Telekom', 'Turkcell Superonline', 'D-Smart', 'Vodafone'],
    'PHONE': ['Türk Telekom', 'Turkcell', 'Vodafone'],
    'TV': ['D-Smart', 'Digiturk', 'Türksat'],
  },
  'Ankara': {
    'ELECTRICITY': ['BEDAŞ', 'AYEDAŞ'],
    'WATER': ['ASKİ'],
    'GAS': ['BAŞKENTGAZ'],
    'INTERNET': ['Türk Telekom', 'Turkcell Superonline', 'D-Smart'],
    'PHONE': ['Türk Telekom', 'Turkcell', 'Vodafone'],
    'TV': ['D-Smart', 'Digiturk'],
  },
  'İzmir': {
    'ELECTRICITY': ['GEDAŞ', 'AYEDAŞ'],
    'WATER': ['İZSU'],
    'GAS': ['İZGAZ'],
    'INTERNET': ['Türk Telekom', 'Turkcell Superonline', 'D-Smart'],
    'PHONE': ['Türk Telekom', 'Turkcell', 'Vodafone'],
    'TV': ['D-Smart', 'Digiturk'],
  },
  'Bursa': {
    'ELECTRICITY': ['BEDAŞ', 'AYEDAŞ'],
    'WATER': ['BUSKİ'],
    'GAS': ['BURSA GAZ'],
    'INTERNET': ['Türk Telekom', 'Turkcell Superonline'],
    'PHONE': ['Türk Telekom', 'Turkcell', 'Vodafone'],
    'TV': ['D-Smart', 'Digiturk'],
  },
  'Antalya': {
    'ELECTRICITY': ['AYEDAŞ'],
    'WATER': ['ASAT'],
    'GAS': ['ANTALYA GAZ'],
    'INTERNET': ['Türk Telekom', 'Turkcell Superonline'],
    'PHONE': ['Türk Telekom', 'Turkcell', 'Vodafone'],
    'TV': ['D-Smart', 'Digiturk'],
  },
};

const defaultCity = 'İstanbul';

/**
 * Get bill providers by city and type
 */
export const getBillProviders = async (req: AuthRequest, res: Response) => {
  try {
    const { city, type } = req.query;

    const selectedCity = (city as string) || defaultCity;
    const billType = (type as string) || 'ELECTRICITY';

    const providers = billProviders[selectedCity]?.[billType] || billProviders[defaultCity][billType] || [];

    res.json({
      city: selectedCity,
      type: billType,
      providers,
      allCities: Object.keys(billProviders),
      allTypes: ['ELECTRICITY', 'WATER', 'GAS', 'INTERNET', 'PHONE', 'TV'],
    });
  } catch (error) {
    console.error('Get bill providers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Query bill by subscriber number
 */
export const queryBill = async (req: AuthRequest, res: Response) => {
  try {
    const { city, type, provider, subscriberNumber } = req.body;

    if (!city || !type || !provider || !subscriberNumber) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['city', 'type', 'provider', 'subscriberNumber'],
      });
    }

    // Generate random bill amount based on type
    const amountRanges: Record<string, { min: number; max: number }> = {
      'ELECTRICITY': { min: 150, max: 800 },
      'WATER': { min: 50, max: 300 },
      'GAS': { min: 200, max: 600 },
      'INTERNET': { min: 100, max: 500 },
      'PHONE': { min: 50, max: 400 },
      'TV': { min: 80, max: 350 },
    };

    const range = amountRanges[type] || { min: 100, max: 500 };
    const amount = Math.round((Math.random() * (range.max - range.min) + range.min) * 100) / 100;

    // Generate due date (7-30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 23) + 7);

    // Check if bill already exists (in real system, this would check database)
    // For now, we'll generate a new bill each time

    const bill = {
      id: `BILL-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      city,
      type,
      provider,
      subscriberNumber,
      amount,
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'PENDING',
      description: getBillDescription(type),
      createdAt: new Date().toISOString(),
    };

    res.json({ bill });
  } catch (error) {
    console.error('Query bill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user's bills
 */
export const getUserBills = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // In a real system, this would fetch from database
    // For now, return empty array - bills are created via queryBill
    res.json({ bills: [] });
  } catch (error) {
    console.error('Get user bills error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

function getBillDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'ELECTRICITY': 'Elektrik Faturası',
    'WATER': 'Su Faturası',
    'GAS': 'Doğalgaz Faturası',
    'INTERNET': 'İnternet Faturası',
    'PHONE': 'Telefon Faturası',
    'TV': 'TV Abonelik Faturası',
  };
  return descriptions[type] || 'Fatura';
}

