/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

const Spinner: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`liquid-spinner ${className ?? 'h-16 w-16'}`}></div>
  );
};

export default Spinner;