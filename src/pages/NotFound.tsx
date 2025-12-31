import { Link } from "wouter";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary/20">404</h1>
        <h2 className="text-3xl font-bold mt-4 mb-2">Page Not Found</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-muted transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
