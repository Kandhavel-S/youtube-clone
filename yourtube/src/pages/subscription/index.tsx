import Head from 'next/head';
import SubscriptionManager from '@/components/SubscriptionManager';
import { useTheme } from '@/components/ThemeProvider';

export default function Subscription() {
  const { theme } = useTheme();

  return (
    <>
      <Head>
        <title>Subscription Plans - YouTube Clone</title>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </Head>
      
      <div className={`min-h-screen transition-colors duration-300 ${
        theme === 'dark' 
          ? 'bg-gray-900 text-white' 
          : 'bg-gray-50 text-black'
      }`}>
        <div className="container mx-auto px-4 py-8">
          <SubscriptionManager />
        </div>
      </div>
    </>
  );
}
