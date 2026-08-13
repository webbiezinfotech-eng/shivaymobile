import { useLocation, useNavigate } from 'react-router-dom';

export default function BackButton({ fallback, label = '← Back', className = '' }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }
    navigate(-1);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`mb-4 inline-flex text-sm font-semibold text-brand-700 ${className}`}
    >
      {label}
    </button>
  );
}
