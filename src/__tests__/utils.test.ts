/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { formatCaseRef, compactDate, stableReferenceSuffix, calculateTabbyTamaraPrice } from '../utils';

describe('formatCaseRef', () => {
  it('correctly uses the persisted caseRef if provided', () => {
    const persisted = 'TTR-20231201-12A45';
    expect(formatCaseRef('any-id', 'tt_request', new Date(), persisted)).toBe(persisted);
  });

  it('generates a stable reference based on ID if the ID contains a timestamp', () => {
    const timestamp = '1701388800000'; // Dec 01, 2023
    const id = `tt_${timestamp}-xyz`;
    const ref = formatCaseRef(id, 'tt_request');
    const suffix = stableReferenceSuffix(id);
    expect(ref).toBe(`TTR-20231201-${suffix}`);
  });

  it('generates a ref using createdAt if id has no timestamp', () => {
    const id = `tt_random123`;
    const createdAt = new Date('2024-01-15T12:00:00Z').toISOString();
    const ref = formatCaseRef(id, 'tt_request', createdAt);
    
    // suffix will be stable hash of 'tt_random123'
    const suffix = stableReferenceSuffix(id);
    expect(ref).toBe(`TTR-20240115-${suffix}`);
  });

  it('falls back to today if no timestamp in id and no createdAt', () => {
    const id = `tt_random456`;
    const ref = formatCaseRef(id, 'tt_request');
    
    // Should have today's date formatted
    const suffix = stableReferenceSuffix(id);
    const today = compactDate(Date.now().toString());
    expect(ref).toBe(`TTR-${today}-${suffix}`);
  });
  
  it('handles various entity prefixes correctly', () => {
    const date = new Date('2024-05-10T12:00:00Z').toISOString();
    const id = 'some_id_string';
    const suffix = stableReferenceSuffix(id);

    expect(formatCaseRef(id, 'inq', date)).toBe(`INQ-20240510-${suffix}`);
    expect(formatCaseRef(id, 'tt_request', date)).toBe(`TTR-20240510-${suffix}`);
    expect(formatCaseRef(id, 'tt_complaint', date)).toBe(`TTC-20240510-${suffix}`);
    expect(formatCaseRef(id, 'client_comm', date)).toBe(`COM-20240510-${suffix}`);
    expect(formatCaseRef(id, 'sched', date)).toBe(`SCH-20240510-${suffix}`);
    expect(formatCaseRef(id, 'case', date)).toBe(`CAS-20240510-${suffix}`);
    expect(formatCaseRef(id, 'unknown' as any, date)).toBe(`REF-20240510-${suffix}`);
  });
});

describe('calculateTabbyTamaraPrice', () => {
  it('validates and computes 100', () => {
    const r = calculateTabbyTamaraPrice(100);
    expect(r.valid).toBe(true);
    expect(r.priceBeforeFeeFormatted).toBe('AED 100.00'); // Note: Intl uses non-breaking space
    expect(r.feeAmountFormatted).toBe('AED 5.00');
    expect(r.finalPriceFormatted).toBe('AED 105.00');
  });

  it('validates and computes 1000', () => {
    const r = calculateTabbyTamaraPrice(1000);
    expect(r.finalPriceFormatted).toBe('AED 1,050.00');
  });

  it('validates and computes 1250.50', () => {
    const r = calculateTabbyTamaraPrice(1250.50);
    expect(r.feeAmountFormatted).toBe('AED 62.53');
    expect(r.finalPriceFormatted).toBe('AED 1,313.03');
  });

  it('handles formatted numbers like 1,000.00', () => {
    const r = calculateTabbyTamaraPrice('1,000.00');
    expect(r.finalPriceFormatted).toBe('AED 1,050.00');
  });

  it('rejects an invalid zero price', () => {
    const r = calculateTabbyTamaraPrice(0);
    expect(r.valid).toBe(false);
  });

  it('rejects a negative price', () => {
    const r = calculateTabbyTamaraPrice(-50);
    expect(r.valid).toBe(false);
  });
});
