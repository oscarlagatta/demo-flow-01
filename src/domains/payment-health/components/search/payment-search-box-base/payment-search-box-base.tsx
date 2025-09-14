'use client';
import { KeyboardEvent, useMemo, useState } from 'react';

import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Make regex case-insensitive to match both upper/lower case
const ID_REGEX = /^[a-z0-9]{6,}$/i;

interface SerachCriteria {
  transactionId: string;
  transactionAmount: string;
  dateStart: string;
  dateEnd: string;
}

interface PaymentSearchBoxBaseProps {
  contextHook: () => {
    searchByAll: (criteria: Partial<SerachCriteria>) => void;
    clear: () => void;
    isFetching: boolean;
  };
  title: string;
  description: string;
}
function PaymentSearchBoxBase({
  contextHook,
  title,
  description,
}: PaymentSearchBoxBaseProps) {
  // Removed unused "active" state

  const [searchCriteria, setSearchCriteria] = useState<SerachCriteria>({
    transactionId: '',
    transactionAmount: '',
    dateStart: '',
    dateEnd: '',
  });

  const { searchByAll, clear: clearTx, isFetching: txFetching } = contextHook();

  const handleInputChange = (field: keyof SerachCriteria, value: string) => {
    setSearchCriteria((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Use onKeyDown in React 19 instead of deprecated onKeyPress
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && hasValidSearch && !isSearching) {
      handleSearch();
    }
  };

  const validId = useMemo(
    () => ID_REGEX.test((searchCriteria.transactionId || '').trim()),
    [searchCriteria.transactionId]
  );

  const hasValidSearch = useMemo(() => {
    const hasId = validId;
    const hasAmount = searchCriteria.transactionAmount.trim() !== '';
    const hasDateRange = Boolean(
      (searchCriteria.dateStart || '').trim() ||
        (searchCriteria.dateEnd || '').trim()
    );
    return hasId || hasAmount || hasDateRange;
  }, [
    validId,
    searchCriteria.transactionAmount,
    searchCriteria.dateStart,
    searchCriteria.dateEnd,
  ]);

  const hasAnyValue = useMemo(
    () => Object.values(searchCriteria).some((v) => v.trim() !== ''),
    [searchCriteria]
  );

  const handleSearch = async () => {
    if (!hasValidSearch) return;

    searchByAll({
      transactionId: searchCriteria.transactionId.trim() || undefined,
      transactionAmount: searchCriteria.transactionAmount.trim() || undefined,
      dateStart: searchCriteria.dateStart || undefined,
      dateEnd: searchCriteria.dateEnd || undefined,
    });
  };

  const handleClear = async () => {
    setSearchCriteria({
      transactionId: '',
      transactionAmount: '',
      dateStart: '',
      dateEnd: '',
    });
    clearTx();
  };

  const isSearching = txFetching;

  return (
    <Card className="bg-white shadow-md" data-tour="search-box">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex max-w-full flex-wrap items-center gap-3">
          {/*Transaction ID*/}
          <div className="grid w-56 shrink-0 items-center gap-1.5 md:w-64 lg:w-72">
            <Label htmlFor="transaction-id">Transaction ID</Label>
            <Input
              id="transaction-id"
              type="text"
              placeholder="Enter transaction ID"
              value={searchCriteria.transactionId}
              onChange={(e) =>
                handleInputChange('transactionId', e.target.value)
              }
              onKeyDown={handleKeyDown}
              disabled={isSearching}
            />
            <div className="h-4" />
          </div>

          {/*Amount*/}
          <div className="grid w-56 shrink-0 items-center gap-1.5 md:w-64 lg:w-72">
            <Label htmlFor="transaction-amount">Transaction Amount</Label>
            <Input
              id="transaction-amount"
              type="text"
              placeholder="Enter transaction amount"
              value={searchCriteria.transactionAmount}
              onChange={(e) =>
                handleInputChange('transactionAmount', e.target.value)
              }
              onKeyDown={handleKeyDown}
              disabled={isSearching}
            />
            <div className="h-4" />
          </div>

          {/*Date Start*/}
          <div className="grid w-56 shrink-0 items-center gap-1.5 md:w-64 lg:w-72">
            <Label htmlFor="date-start">Date Start</Label>
            <Input
              id="date-start"
              type="date"
              placeholder="Enter date start"
              value={searchCriteria.dateStart}
              onChange={(e) => handleInputChange('dateStart', e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSearching}
            />
            <div className="h-4" />
          </div>

          {/*Date End*/}
          <div className="grid w-56 shrink-0 items-center gap-1.5 md:w-64 lg:w-72">
            <Label htmlFor="date-end">Date End</Label>
            <Input
              id="date-end"
              type="date"
              placeholder="Enter date end"
              value={searchCriteria.dateEnd}
              onChange={(e) => handleInputChange('dateEnd', e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSearching}
            />
            <div className="h-4" />
          </div>

          {/*Buttons Group*/}
          <div className="flex shrink-0 items-center gap-3">
            <Button
              size="default"
              disabled={!hasValidSearch || isSearching}
              onClick={handleSearch}
              className="flex h-10 items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {isSearching ? 'Searching...' : 'Search Transaction'}
            </Button>
            {hasAnyValue && (
              <Button
                variant="secondary"
                size="default"
                disabled={isSearching}
                onClick={handleClear}
                className="flex h-10 items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PaymentSearchBoxBase;
