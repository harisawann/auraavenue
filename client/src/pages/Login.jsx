import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Logo from '../components/Logo';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = 'Enter your email';
    if (!form.password) next.password = 'Enter your password';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome back');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'Could not sign in. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper paper-texture px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link to="/">
            <Logo size="lg" />
          </Link>
          <p className="mt-3 text-sm text-ink/60">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-white border border-sand-dark rounded-sm p-8 flex flex-col gap-5">
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
          />
          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            autoComplete="current-password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />

          <Button type="submit" loading={loading} className="w-full mt-2">
            Sign in
          </Button>
        </form>

        <div className="mt-6">
          <GoogleSignInButton onSuccess={() => navigate(redirectTo, { replace: true })} />
        </div>

        <p className="text-center text-sm text-ink/60 mt-6">
          New here?{' '}
          <Link to="/register" className="text-ink font-medium underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
