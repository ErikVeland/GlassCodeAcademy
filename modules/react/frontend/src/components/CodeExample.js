import React, { useState } from 'react';

const CodeExample = ({ code, output }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
      <div className="bg-gray-800 text-gray-200 px-4 py-2 flex justify-between items-center">
        <span className="text-sm font-medium">Example Code</span>
        <button 
          onClick={copyToClipboard}
          className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-gray-50 p-4 overflow-x-auto">
        <code className="language-jsx text-sm">{code}</code>
      </pre>
      
      {output && (
        <div className="border-t border-gray-200">
          <div className="bg-gray-100 px-4 py-2">
            <span className="text-sm font-medium text-gray-700">Output</span>
          </div>
          <pre className="bg-white p-4 border-l-4 border-blue-500">
            <code className="text-sm">{output}</code>
          </pre>
        </div>
      )}
    </div>
  );
};

export default CodeExample;