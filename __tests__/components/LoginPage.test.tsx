/**
 * LoginPage Component Tests
 * اختبارات مكون صفحة تسجيل الدخول
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { LoginPage } from '@/modules/auth/components/LoginPage';

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: mockPush,
      refresh: mockRefresh,
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('LoginPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Rendering', () => {
    it('should render login form', () => {
      render(<LoginPage />);

      expect(screen.getByText('تسجيل الدخول')).toBeInTheDocument();
      expect(screen.getByLabelText(/البريد الإلكتروني/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/كلمة المرور/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /تسجيل الدخول/i })).toBeInTheDocument();
    });

    it('should render logo and title', () => {
      render(<LoginPage />);

      expect(screen.getByText('تسجيل الدخول')).toBeInTheDocument();
      expect(screen.getByText('أدخل بيانات حسابك للمتابعة')).toBeInTheDocument();
    });

    it('should render footer text', () => {
      render(<LoginPage />);

      expect(screen.getByText('نظام نقاط البيع المتكامل')).toBeInTheDocument();
    });

    it('should have email input with correct attributes', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
    });

    it('should have password input with correct attributes', () => {
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/كلمة المرور/i);
      expect(passwordInput).toHaveAttribute('required');
    });
  });

  describe('Form Interaction', () => {
    it('should allow typing in email field', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should allow typing in password field', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/كلمة المرور/i);
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/كلمة المرور/i);
      const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Click to show password
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click to hide again
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid credentials', async () => {
      const mockResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'ADMIN',
        },
        token: 'test-token',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
      const passwordInput = screen.getByLabelText(/كلمة المرور/i);
      const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123',
          }),
        });
      });
    });

    it('should show loading state during submission', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
      const passwordInput = screen.getByLabelText(/كلمة المرور/i);
      const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Should show loading text
      expect(screen.getByText(/جاري تسجيل الدخول/i)).toBeInTheDocument();
    });

    it('should display error message on failed login', async () => {
      const mockResponse = {
        error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockResponse,
      });

      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
      const passwordInput = screen.getByLabelText(/كلمة المرور/i);
      const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i });

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/البريد الإلكتروني أو كلمة المرور غير صحيحة/i)).toBeInTheDocument();
      });
    });

    it('should handle network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
      const passwordInput = screen.getByLabelText(/كلمة المرور/i);
      const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/حدث خطأ أثناء تسجيل الدخول/i)).toBeInTheDocument();
      });
    });

    it('should redirect after successful login', async () => {
      const mockResponse = {
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
        token: 'test-token',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
      const passwordInput = screen.getByLabelText(/كلمة المرور/i);
      const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Form Validation', () => {
    it('should require email field', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
      expect(emailInput).toBeRequired();
    });

    it('should require password field', () => {
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/كلمة المرور/i);
      expect(passwordInput).toBeRequired();
    });

    it('should disable form elements during loading', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
      const passwordInput = screen.getByLabelText(/كلمة المرور/i);
      const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Form should be disabled during loading
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/البريد الإلكتروني/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/كلمة المرور/i)).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(<LoginPage />);

      const title = screen.getByRole('heading', { name: /تسجيل الدخول/i });
      expect(title).toBeInTheDocument();
    });

    it('should have accessible error alerts', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Error message' }),
      });

      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/البريد الإلكتروني/i);
      const passwordInput = screen.getByLabelText(/كلمة المرور/i);
      const submitButton = screen.getByRole('button', { name: /تسجيل الدخول/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });
  });
});
