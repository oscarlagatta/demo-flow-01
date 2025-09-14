import ServiceTable from '@/domains/payment-health/components/tables/service-table/service-table';

function PaymentHealthDashboard() {
  return (
    <div className="min-h-screen">
      <main className="flex flex-1 flex-col gap-4 pt-0 pl-4">
        <div>
          <ServiceTable />
        </div>
      </main>
    </div>
  );
}
export default PaymentHealthDashboard;
