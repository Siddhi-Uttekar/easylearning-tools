import React, { useRef, useCallback } from 'react';
import { CertificateDisplay } from './CertificateDisplay';
import { CertificateData } from '@/types/certificates';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface CertificatePreviewProps {
  data: CertificateData | null;
  triggerExport?: 'png' | 'pdf' | null;
  onExportComplete?: () => void;
  isLoading?: boolean;
}

export function CertificatePreview({
  data,
  triggerExport,
  onExportComplete,
  isLoading = false
}: CertificatePreviewProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleExportPNG = useCallback(async () => {
  if (!certificateRef.current || !data) return;
  try {
    const canvas = await html2canvas(certificateRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      ignoreElements: (element) => {
        // Skip elements that might cause issues
        return element.classList?.contains('ignore-export') || false;
      },
      onclone: (clonedDoc) => {
        // Convert any problematic CSS properties in the cloned document
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * {
            color: rgb(from oklch(0.15 0.1 250) r g b) !important;
          }
        `;
        clonedDoc.head.appendChild(style);
      }
    });

    const image = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.href = image;
    link.download = `${data.student.name.replace(/\s+/g, '_')}_certificate.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onExportComplete) onExportComplete();
  } catch (error) {
    console.error('Error exporting PNG:', error);
    alert('Failed to export PNG. Please try again.');
    if (onExportComplete) onExportComplete();
  }
}, [data, onExportComplete]);

const handleExportPDF = useCallback(async () => {
  if (!certificateRef.current || !data) return;
  try {
    const canvas = await html2canvas(certificateRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      ignoreElements: (element) => {
        return element.classList?.contains('ignore-export') || false;
      },
      onclone: (clonedDoc) => {
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * {
            color: rgb(from oklch(0.15 0.1 250) r g b) !important;
          }
        `;
        clonedDoc.head.appendChild(style);
      }
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
    pdf.save(`${data.student.name.replace(/\s+/g, '_')}_certificate.pdf`);
    if (onExportComplete) onExportComplete();
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Failed to export PDF. Please try again.');
    if (onExportComplete) onExportComplete();
  }
}, [data, onExportComplete]);

  // Use useEffect to trigger export when triggerExport changes
  React.useEffect(() => {
    if (triggerExport === 'png') {
      handleExportPNG();
    } else if (triggerExport === 'pdf') {
      handleExportPDF();
    }
  }, [triggerExport, handleExportPNG, handleExportPDF]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">Enter certificate details to see preview</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-auto max-h-[80vh] flex justify-center bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 p-4">
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-lg">
          <div className="text-white text-lg">Generating certificate...</div>
        </div>
      )}
      <div ref={certificateRef} style={{ transform: 'scale(0.5)', transformOrigin: 'top center' }}>
        <CertificateDisplay data={data} />
      </div>
    </div>
  );
}