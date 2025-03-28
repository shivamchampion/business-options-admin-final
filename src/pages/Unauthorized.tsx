/**
 * Unauthorized page
 * Shows when user tries to access restricted content
 */

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-red-600 mb-4">403</h1>
        <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => window.location.href = '/'}
            className="btn-primary px-6 py-2"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            className="btn-secondary px-6 py-2"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
