import Link from 'next/link';

/**
 * Custom 404 Not Found page for Next.js App Router.
 * This is a server component.
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-800 p-4">
      <h1 className="text-7xl md:text-9xl font-extrabold text-red-600 mb-4">404</h1>
      <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-6 text-center">Page Not Found</h2>
      
      <p className="text-lg text-gray-600 mb-8">The requested resource could not be found.</p>

      <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 ease-in-out text-lg font-medium">
        Go back home
      </Link>
    </div>
  );
}
