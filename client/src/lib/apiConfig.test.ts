import { describe, it, expect } from 'vitest';
import {
  resolveBackendOrigin,
  resolveApiBaseUrl,
  resolveUploadedDocumentUrl,
} from './apiConfig';
import { formatINR, calculateEstimateTotals } from './utils';

describe('Separate Frontend & Backend Deployment URL Resolution', () => {
  it('defaults to relative /api proxy paths when VITE_API_URL is unset', () => {
    expect(resolveBackendOrigin('')).toBe('');
    expect(resolveApiBaseUrl('')).toBe('/api');
    expect(resolveUploadedDocumentUrl('/api/documents/123/file', '')).toBe('/api/documents/123/file');
  });

  it('normalizes trailing slashes and /api suffixes from VITE_API_URL', () => {
    expect(resolveBackendOrigin('https://amendflow-api.onrender.com/')).toBe(
      'https://amendflow-api.onrender.com'
    );
    expect(resolveBackendOrigin('https://amendflow-api.onrender.com/api')).toBe(
      'https://amendflow-api.onrender.com'
    );
    expect(resolveApiBaseUrl('https://amendflow-api.onrender.com')).toBe(
      'https://amendflow-api.onrender.com/api'
    );
  });

  it('resolves document URLs cleanly for both signed S3 URLs and backend API streams', () => {
    const signedS3Url = 'https://amendflow-prod.s3.ap-south-1.amazonaws.com/orgs/1/doc.pdf?X-Amz-Signature=xyz';
    expect(
      resolveUploadedDocumentUrl({ _id: 'abc', fileUrl: signedS3Url }, 'https://amendflow-api.onrender.com')
    ).toBe(signedS3Url);

    expect(
      resolveUploadedDocumentUrl(
        { _id: 'abc', storagePath: '/api/documents/abc/file' },
        'https://amendflow-api.onrender.com'
      )
    ).toBe('https://amendflow-api.onrender.com/api/documents/abc/file');

    expect(
      resolveUploadedDocumentUrl('/uploads/sample-drawing.png', 'https://amendflow-api.onrender.com/')
    ).toBe('https://amendflow-api.onrender.com/uploads/sample-drawing.png');
  });
});

describe('Frontend Minor-Unit Currency & Estimate Formatting', () => {
  it('formats paise into Indian Numbering System accurately', () => {
    expect(formatINR(18500000000, { compact: true })).toBe('₹18.50 Cr');
    expect(formatINR(14750000)).toBe('₹1,47,500.00');
  });

  it('mirrors backend integer-paise overhead, markup, and GST calculations', () => {
    const res = calculateEstimateTotals(69160000, 10, 15, 18);
    expect(res.overheadPaise).toBe(6916000);
    expect(res.markupPaise).toBe(11411400);
    expect(res.taxablePaise).toBe(87487400);
    expect(res.taxPaise).toBe(15747732);
    expect(res.totalProposedPaise).toBe(103235132);
  });
});
