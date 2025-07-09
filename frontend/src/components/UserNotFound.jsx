import Link from 'next/link';

export default function UserNotFound() {
  return (
    <div className="user-not-found-container">
      <div className="user-not-found-content">
        <div className="error-code">404</div>
        <h1>User Not Found</h1>
        <p>Sorry, the user you're looking for doesn't exist or has been removed.</p>
        <div className="error-actions">
          <Link href="/" className="btn btn-primary">Go Home</Link>
          <Link href="/Explore" className="btn btn-secondary">Explore Users</Link>
        </div>
      </div>
      <style jsx>{`
        .user-not-found-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 60vh;
          padding: 2rem;
        }
        
        .user-not-found-content {
          text-align: center;
          max-width: 500px;
        }
        
        .error-code {
          font-size: 6rem;
          font-weight: 700;
          color: #e74c3c;
          line-height: 1;
          margin-bottom: 1rem;
        }
        
        .user-not-found-content h1 {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 1rem;
        }
        
        .user-not-found-content p {
          font-size: 1.1rem;
          color: #7f8c8d;
          margin-bottom: 2rem;
          line-height: 1.6;
        }
        
        .error-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
          font-size: 1rem;
          display: inline-block;
        }
        
        .btn-primary {
          background-color: #3498db;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #2980b9;
          transform: translateY(-2px);
        }
        
        .btn-secondary {
          background-color: #95a5a6;
          color: white;
        }
        
        .btn-secondary:hover {
          background-color: #7f8c8d;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
