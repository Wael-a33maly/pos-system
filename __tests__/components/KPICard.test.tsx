/**
 * KPICard Component Tests
 * اختبارات مكون بطاقة المؤشرات
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { KPICard } from '@/modules/dashboard/components/KPICard';
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
}));

describe('KPICard Component', () => {
  const defaultProps = {
    title: 'إجمالي المبيعات',
    value: 50000,
    icon: DollarSign,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with required props', () => {
      render(<KPICard {...defaultProps} />);

      expect(screen.getByText('إجمالي المبيعات')).toBeInTheDocument();
    });

    it('should render title correctly', () => {
      render(<KPICard {...defaultProps} title='إجمالي العملاء' />);

      expect(screen.getByText('إجمالي العملاء')).toBeInTheDocument();
    });

    it('should render icon', () => {
      const { container } = render(<KPICard {...defaultProps} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Value Formatting', () => {
    it('should format currency value by default', () => {
      render(<KPICard {...defaultProps} value={50000} />);

      // Should show formatted currency (Arabic locale)
      expect(screen.getByText(/50,000/)).toBeInTheDocument();
    });

    it('should format number when format is "number"', () => {
      render(<KPICard {...defaultProps} value={1500} format='number' />);

      expect(screen.getByText(/1,500/)).toBeInTheDocument();
    });

    it('should format percent when format is "percent"', () => {
      render(<KPICard {...defaultProps} value={75.5} format='percent' />);

      expect(screen.getByText(/75.5%/)).toBeInTheDocument();
    });

    it('should handle zero value', () => {
      render(<KPICard {...defaultProps} value={0} />);

      expect(screen.getByText(/0/)).toBeInTheDocument();
    });

    it('should handle large numbers', () => {
      render(<KPICard {...defaultProps} value={1000000} />);

      expect(screen.getByText(/1,000,000/)).toBeInTheDocument();
    });
  });

  describe('Change Indicator', () => {
    it('should show positive change indicator', () => {
      render(<KPICard {...defaultProps} change={15} changeLabel='من الأمس' />);

      expect(screen.getByText('15.0%')).toBeInTheDocument();
      expect(screen.getByText('من الأمس')).toBeInTheDocument();
    });

    it('should show negative change indicator', () => {
      render(<KPICard {...defaultProps} change={-10} />);

      expect(screen.getByText('10.0%')).toBeInTheDocument();
    });

    it('should not show change indicator when change is undefined', () => {
      render(<KPICard {...defaultProps} />);

      expect(screen.queryByText('%')).not.toBeInTheDocument();
    });

    it('should handle zero change', () => {
      render(<KPICard {...defaultProps} change={0} />);

      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });
  });

  describe('Currency Settings', () => {
    it('should use default currency (SAR)', () => {
      render(<KPICard {...defaultProps} value={1000} />);

      // SAR currency symbol or code should appear
      const element = screen.getByText(/1,000/);
      expect(element).toBeInTheDocument();
    });

    it('should accept custom currency settings', () => {
      const customCurrency = {
        code: 'USD',
        symbol: '$',
        decimalPlaces: 2,
      };

      render(<KPICard {...defaultProps} value={1000} currency={customCurrency} />);

      expect(screen.getByText(/1,000/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible with proper structure', () => {
      const { container } = render(<KPICard {...defaultProps} />);

      // Check for card structure
      const card = container.querySelector('[class*="card"]');
      expect(card).toBeInTheDocument();
    });

    it('should have proper text hierarchy', () => {
      render(<KPICard {...defaultProps} title='المبيعات' />);

      const title = screen.getByText('المبيعات');
      expect(title.tagName).toBe('P');
    });
  });

  describe('Different Icons', () => {
    it('should render ShoppingCart icon', () => {
      const { container } = render(<KPICard {...defaultProps} icon={ShoppingCart} />);

      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render Users icon', () => {
      const { container } = render(<KPICard {...defaultProps} icon={Users} />);

      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render TrendingUp icon', () => {
      const { container } = render(<KPICard {...defaultProps} icon={TrendingUp} />);

      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative values', () => {
      render(<KPICard {...defaultProps} value={-500} />);

      expect(screen.getByText(/500/)).toBeInTheDocument();
    });

    it('should handle decimal values', () => {
      render(<KPICard {...defaultProps} value={1234.56} />);

      expect(screen.getByText(/1,234.56/)).toBeInTheDocument();
    });

    it('should handle very small percentages', () => {
      render(<KPICard {...defaultProps} value={0.05} format='percent' />);

      expect(screen.getByText('0.1%')).toBeInTheDocument();
    });
  });
});
