/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
// Fix: Import the Spinner component to resolve the "Cannot find name 'Spinner'" error.
import Spinner from './Spinner';

interface ManualScanPanelProps {
  onApply: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const ManualScanPanel: React.FC<ManualScanPanelProps> = ({ onApply, onCancel, isLoading }) => {
  const { t } = useTranslation();

  return (
    <div className="w-full bg-black/30 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 backdrop-blur-xl shadow-2xl shadow-black/30">
      <h3 className="text-lg font-semibold text-gray-200">{t('scanManualTitle')}</h3>
      <p className="text-sm text-gray-400 -mt-2 text-center">{t('scanManualDescription')}</p>
      
      <div className="w-full flex flex-col items-center justify-center gap-3 mt-2">
        <button
          onClick={onApply}
          disabled={isLoading}
          className="w-full max-w-xs bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-cyan-400/20 hover:shadow-xl hover:shadow-cyan-400/30 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-blue-800 disabled:to-blue-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none ring-1 ring-white/10"
        >
          {isLoading ? <Spinner className="w-6 h-6"/> : t('scanApplyManual')}
        </button>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="w-full max-w-xs bg-white/5 backdrop-blur-md border border-white/10 text-gray-200 font-semibold py-3 px-6 rounded-lg transition-all duration-200 ease-in-out hover:bg-white/15 active:scale-95 text-base disabled:opacity-50"
        >
          {t('scanCancel')}
        </button>
      </div>
    </div>
  );
};

export default ManualScanPanel;