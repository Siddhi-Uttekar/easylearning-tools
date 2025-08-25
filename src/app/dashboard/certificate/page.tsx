// Updated page.tsx

'use client';

import React, { useState } from 'react';
import { CertificateForm } from './CertificateForm';
import { CertificatePreview } from './CertificatePreview';
import { CertificateData } from '@/types/certificates';

export default function CertificatePage() {
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [triggerExport, setTriggerExport] = useState<'png' | 'pdf' | null>(null);

  const handleFormSubmit = (data: CertificateData) => {
    setCertificateData(data);
  };

  const handleExport = (format: 'png' | 'pdf') => {
    if (!certificateData) return;

    setIsLoading(true);
    setTriggerExport(format);
  };

  const handleExportComplete = () => {
    setIsLoading(false);
    setTriggerExport(null);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Certificate Generator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <CertificateForm
            onSubmit={handleFormSubmit}
            onExport={handleExport}
            isLoading={isLoading}
          />
        </div>

        <div>
          <CertificatePreview
            data={certificateData}
            triggerExport={triggerExport}
            onExportComplete={handleExportComplete}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}