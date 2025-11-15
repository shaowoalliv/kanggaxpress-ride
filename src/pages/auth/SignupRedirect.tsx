import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function SignupRedirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const role = searchParams.get('role');
    const targetUrl = role ? `/auth?role=${role}` : '/auth';
    navigate(targetUrl, { replace: true });
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
    </div>
  );
}
