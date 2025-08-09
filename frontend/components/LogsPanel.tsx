import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Trash2, 
  Filter, 
  Search,
  AlertCircle,
  CheckCircle,
  Info,
  Zap
} from 'lucide-react';
import { useDeployment } from '../contexts/DeploymentContext';

const LogsPanel: React.FC = () => {
  const { logs, clearLogs } = useDeployment();
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'info'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLogType = (log: string): 'success' | 'error' | 'info' | 'warning' => {
    if (log.includes('✅') || log.includes('🎉')) return 'success';
    if (log.includes('❌') || log.includes('⚠️')) return 'error';
    if (log.includes('🔍') || log.includes('📊') || log.includes('📋')) return 'info';
    return 'info';
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || getLogType(log) === filter;
    const matchesSearch = searchTerm === '' || log.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const downloadLogs = () => {
    const logContent = logs.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cryptovault-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const logStats = {
    total: logs.length,
    success: logs.filter(log => getLogType(log) === 'success').length,
    error: logs.filter(log => getLogType(log) === 'error').length,
    info: logs.filter(log => getLogType(log) === 'info').length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">System Logs</h2>
            <p className="text-gray-600 mt-1">
              View all deployment, monitoring, and system activity logs
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-500" />
            <span className="font-medium">{logs.length} Log Entries</span>
          </div>
        </div>
      </div>

      {/* Log Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-gray-900">{logStats.total}</div>
          <div className="text-gray-600 font-medium">Total Logs</div>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{logStats.success}</div>
          <div className="text-gray-600 font-medium">Success</div>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-red-600">{logStats.error}</div>
          <div className="text-gray-600 font-medium">Errors</div>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{logStats.info}</div>
          <div className="text-gray-600 font-medium">Info</div>
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-64"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="input w-32"
              >
                <option value="all">All Logs</option>
                <option value="success">Success</option>
                <option value="error">Errors</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={downloadLogs}
              disabled={logs.length === 0}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            
            <button
              onClick={clearLogs}
              disabled={logs.length === 0}
              className="btn btn-error flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs Display */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Log Entries 
          {filteredLogs.length !== logs.length && (
            <span className="text-sm font-normal text-gray-600 ml-2">
              ({filteredLogs.length} of {logs.length} shown)
            </span>
          )}
        </h3>
        
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Logs Yet</h4>
            <p className="text-gray-600">
              Start deploying or monitoring to see system logs appear here.
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Matching Logs</h4>
            <p className="text-gray-600">
              Try adjusting your search term or filter settings.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.map((log, index) => {
              const logType = getLogType(log);
              const [timestamp, ...messageParts] = log.split('] ');
              const message = messageParts.join('] ');
              
              return (
                <div
                  key={index}
                  className={`flex items-start space-x-3 p-3 rounded-lg border-l-4 ${
                    logType === 'success' ? 'bg-green-50 border-green-500' :
                    logType === 'error' ? 'bg-red-50 border-red-500' :
                    logType === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                    'bg-blue-50 border-blue-500'
                  }`}
                >
                  {getLogIcon(logType)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 font-mono">
                        {timestamp.replace('[', '')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-900 mt-1 font-mono">
                      {message}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Log Export Options */}
      {logs.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Export Options</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={downloadLogs}
              className="btn btn-secondary flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download as TXT</span>
            </button>
            
            <button
              onClick={() => {
                const jsonLogs = logs.map((log, index) => ({
                  id: index,
                  timestamp: log.split('] ')[0].replace('[', ''),
                  message: log.split('] ').slice(1).join('] '),
                  type: getLogType(log)
                }));
                
                const blob = new Blob([JSON.stringify(jsonLogs, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cryptovault-logs-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="btn btn-secondary flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download as JSON</span>
            </button>
            
            <button
              onClick={() => {
                const csvContent = [
                  'Timestamp,Type,Message',
                  ...logs.map(log => {
                    const timestamp = log.split('] ')[0].replace('[', '');
                    const message = log.split('] ').slice(1).join('] ').replace(/"/g, '""');
                    const type = getLogType(log);
                    return `"${timestamp}","${type}","${message}"`;
                  })
                ].join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `cryptovault-logs-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="btn btn-secondary flex items-center justify-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download as CSV</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogsPanel;