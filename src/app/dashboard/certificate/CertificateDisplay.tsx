import React from 'react';
import { CertificateData } from '@/types/certificates';
import { formatDate } from '@/utils/certificateUtils';
import { cn } from '@/utils/certificateUtils';

interface CertificateDisplayProps {
  data: CertificateData;
  className?: string;
}

export function CertificateDisplay({ data, className }: CertificateDisplayProps) {
  const { student, event } = data;

  const getMedalEmoji = () => {
    if (student.medalType === 'gold') return '🥇';
    if (student.medalType === 'silver') return '🥈';
    if (student.medalType === 'bronze') return '🥉';
    return '⭐';
  };

  return (
    <div className={cn(
      "relative w-[1600px] h-[1131px] bg-white overflow-hidden",
      className
    )}>
      {/* Certificate border effects */}
      <div className="absolute inset-0 p-[14px] rounded-[22px]" style={{
        background: 'linear-gradient(120deg, #e8f4ff, #fff 12%, #fff 88%, #f3f8ff)'
      }}></div>
      <div className="absolute inset-[18px] rounded-[16px] border-[3px] border-[rgba(11,130,182,0.12)]"></div>

      {/* Ribbon at the top */}
      <div className="absolute top-0 left-0 right-0 h-[120px] border-b border-[#dfeefe]" style={{
        background: 'radial-gradient(200% 100% at 50% 0, rgba(14,165,233,0.18), transparent 60%)'
      }}></div>

      {/* Logo and brand name */}
      <div className="absolute top-[48px] left-0 right-0 flex items-center justify-center gap-4">
        <div className="w-16 h-16">
          <img
            src="https://easylearning.live/wp-content/uploads/2024/07/cropped-icon-2.png"
            alt="EasyLearning Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex flex-col items-start">
          <div className="text-[31px] font-bold text-blue-900 tracking-tight">EasyLearning</div>
          <div className="text-[15px] text-gray-500 -mt-1">Making Learning Easy</div>
        </div>
      </div>

      {/* Main content */}
      <div className="absolute left-[80px] right-[80px] top-[160px] bottom-[300px] flex flex-col items-center justify-center gap-[22px]">
        <div className="text-center">
          <h1 className="text-[67px] font-serif font-bold text-blue-900 mb-1">Certificate of Achievement</h1>
          <div className="text-lg font-bold tracking-[6px] uppercase text-blue-700">
            {event.name.toUpperCase()}
          </div>
        </div>

        <div className="text-center">
          <div className="text-gray-500 font-semibold tracking-[2px] uppercase mb-2">THIS IS PROUDLY AWARDED TO</div>
          <div className="text-[63px] font-bold">{student.name}</div>
        </div>

        {/* Medal badge */}
        <div className="flex items-center justify-center w-[200px] h-[200px] rounded-full text-[#4e3a0a] text-[51px] font-bold border-[6px] border-[#f5e6bd]" style={{
          background: 'radial-gradient(circle at 30% 30%, #fff, #f3e9d0 40%, #dfc074 60%, #b78b2c 100%)'
        }}>
          <div>
            {getMedalEmoji()}
            <small className="block text-[19px] tracking-[1px]">RANK {student.rank}</small>
          </div>
        </div>

        {/* Metadata chips */}
        <div className="flex gap-[26px] justify-center flex-wrap">
          <div className="px-4 py-2 rounded-full border border-[#e2ecf7] bg-[#f7fbff] font-semibold flex items-center gap-2">
            🏆 <span>Rank {student.rank}</span>
          </div>
          <div className="px-4 py-2 rounded-full border border-[#e2ecf7] bg-[#f7fbff] font-semibold flex items-center gap-2">
            📝 <span>{student.testsAttempted} Tests Attempted</span>
          </div>
          <div className="px-4 py-2 rounded-full border border-[#e2ecf7] bg-[#f7fbff] font-semibold flex items-center gap-2">
            📅 <span>{formatDate(event.date)}</span>
          </div>
        </div>
      </div>

      {/* Teachers' image */}
      <div className="absolute left-0 right-0 bottom-[25px] flex justify-center">
        <img
          src="https://easylearning.live/wp-content/uploads/2024/01/EasyLearning-Teachers.png"
          alt="EasyLearning Teachers"
          className="max-w-[82%] max-h-[260px] object-contain"
        />
      </div>
    </div>
  );
}