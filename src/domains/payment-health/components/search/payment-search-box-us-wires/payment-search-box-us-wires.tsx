// checked
import { useTransactionSearchUsWiresContext } from '@/domains/payment-health/providers/us-wires/us-wires-transaction-search-provider';
import PaymentSearchBoxBase from '@/domains/payment-health/components/search/payment-search-box-base/payment-search-box-base';
function PaymentSearchBoxUsWires() {
  return (
    <PaymentSearchBoxBase
      contextHook={useTransactionSearchUsWiresContext}
      title="Search for US Wires Transactions"
      description="You can search for a transaction by ID, Amount, or Date Rage."
    />
  );
}

export default PaymentSearchBoxUsWires;
