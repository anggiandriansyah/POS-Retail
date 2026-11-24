import ReceiptPage from '../../../components/ReceiptPage';

export default async function PublicReceiptPage({
  params,
}: {
  params: Promise<{ invoice: string }>;
}) {
  const { invoice } = await params;
  return <ReceiptPage invoiceNumber={decodeURIComponent(invoice)} />;
}
