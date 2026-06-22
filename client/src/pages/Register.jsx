import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Logo from '../components/Logo';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Enter your name';
    if (!form.email.trim()) next.email = 'Enter your email';
    if (form.password.length < 8) next.password = 'Use at least 8 characters';
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      toast.success('Account created');
      navigate('/', { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'Could not create your account. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper paper-texture px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <Link to="/">
            <Logo size="lg" />
          </Link>
          <p className="mt-3 text-sm text-ink/60">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="bg-white border border-sand-dark rounded-sm p-8 flex flex-col gap-5">
          <Input
            id="name"
            name="name"
            type="text"
            label="Full name"
            autoComplete="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
          />
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
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
          />
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirm password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />

          <Button type="submit" loading={loading} className="w-full mt-2">
            Create account
          </Button>
        </form>

        <div className="mt-6">
          <GoogleSignInButton onSuccess={() => navigate('/', { replace: true })} />
        </div>

        <p className="text-center text-sm text-ink/60 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-ink font-medium underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
