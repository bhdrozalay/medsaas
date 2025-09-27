'use client';

export default function TestRedirect() {
  const handleRedirect = () => {
    console.log('🚀 Testing redirect...');
    alert('Redirecting to subscription page...');
    window.location.href = '/subscription';
  };

  const handleRedirectReplace = () => {
    console.log('🔄 Testing redirect replace...');
    alert('Redirecting with replace...');
    window.location.replace('/subscription');
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Test Redirect</h1>
        <button 
          onClick={handleRedirect}
          className="bg-blue-600 text-white px-4 py-2 rounded mr-4"
        >
          Test window.location.href
        </button>
        <button 
          onClick={handleRedirectReplace}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Test window.location.replace
        </button>
      </div>
    </div>
  );
}