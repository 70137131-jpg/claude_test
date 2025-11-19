import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface Documentation {
  id: string;
  type: string;
  title: string;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
  content?: string;
}

interface DriftReport {
  total_documentation: number;
  current: number;
  outdated: number;
  needs_review: number;
  drift_percentage: number;
  recent_drifts: Array<{
    file_path: string;
    severity: string;
    description: string;
    detected_at: string;
  }>;
}

const DocumentationDashboard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Documentation | null>(null);
  const [driftReport, setDriftReport] = useState<DriftReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchDocumentation();
    fetchDriftReport();
  }, [projectId]);

  const fetchDocumentation = async () => {
    try {
      const response = await fetch(`/api/docs/project/${projectId}`);
      const data = await response.json();
      setDocs(data.documentation || []);
    } catch (error) {
      console.error('Error fetching documentation:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDriftReport = async () => {
    try {
      const response = await fetch(`/api/docs/drift/report/${projectId}`);
      const data = await response.json();
      setDriftReport(data);
    } catch (error) {
      console.error('Error fetching drift report:', error);
    }
  };

  const fetchDocContent = async (docId: string) => {
    try {
      const response = await fetch(`/api/docs/${docId}`);
      const data = await response.json();
      setSelectedDoc(data);
    } catch (error) {
      console.error('Error fetching doc content:', error);
    }
  };

  const generateDocumentation = async (docTypes: string[]) => {
    setGenerating(true);
    try {
      const response = await fetch('/api/docs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          doc_types: docTypes
        })
      });

      const data = await response.json();
      alert(`Documentation generation started! Job ID: ${data.job_id}`);

      // Refresh documentation list after a delay
      setTimeout(fetchDocumentation, 3000);
    } catch (error) {
      console.error('Error generating documentation:', error);
      alert('Failed to generate documentation');
    } finally {
      setGenerating(false);
    }
  };

  const installGitHook = async () => {
    try {
      const response = await fetch('/api/docs/hooks/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          hook_type: 'post-commit'
        })
      });

      const data = await response.json();
      alert('Git hook installed successfully! Documentation will auto-update on commits.');
    } catch (error) {
      console.error('Error installing hook:', error);
      alert('Failed to install Git hook');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'current':
        return 'bg-green-100 text-green-800';
      case 'outdated':
        return 'bg-red-100 text-red-800';
      case 'needs_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading documentation...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Technical Documentation</h1>
        <p className="text-gray-600">Auto-generated and always up-to-date</p>
      </div>

      {/* Drift Report Card */}
      {driftReport && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Documentation Health</h2>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{driftReport.total_documentation}</div>
              <div className="text-sm text-gray-600">Total Docs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{driftReport.current}</div>
              <div className="text-sm text-gray-600">Current</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{driftReport.needs_review}</div>
              <div className="text-sm text-gray-600">Needs Review</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{driftReport.outdated}</div>
              <div className="text-sm text-gray-600">Outdated</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Drift Percentage</span>
              <span className="text-sm font-bold">{driftReport.drift_percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  driftReport.drift_percentage > 50 ? 'bg-red-600' :
                  driftReport.drift_percentage > 25 ? 'bg-yellow-600' : 'bg-green-600'
                }`}
                style={{ width: `${driftReport.drift_percentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex gap-3">
          <button
            onClick={() => generateDocumentation(['architecture', 'api_reference', 'onboarding'])}
            disabled={generating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate All Documentation'}
          </button>
          <button
            onClick={() => generateDocumentation(['architecture'])}
            disabled={generating}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            Architecture Overview
          </button>
          <button
            onClick={() => generateDocumentation(['api_reference'])}
            disabled={generating}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            API Reference
          </button>
          <button
            onClick={installGitHook}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Install Git Hook
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Documentation List */}
        <div className="col-span-1 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Documentation</h2>
          {docs.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No documentation yet</p>
              <p className="text-sm mt-2">Click "Generate" to create documentation</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => fetchDocContent(doc.id)}
                  className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${
                    selectedDoc?.id === doc.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="font-medium">{doc.title}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">{doc.type}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">v{doc.version}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documentation Content */}
        <div className="col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Content</h2>
          {selectedDoc ? (
            <div>
              <div className="mb-4 pb-4 border-b">
                <h3 className="text-2xl font-bold">{selectedDoc.title}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedDoc.status)}`}>
                    {selectedDoc.status}
                  </span>
                  <span className="text-sm text-gray-600">Version {selectedDoc.version}</span>
                  <span className="text-sm text-gray-600">
                    Updated: {new Date(selectedDoc.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selectedDoc.content || '' }} />
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <p>Select a document to view its content</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Drift Detections */}
      {driftReport && driftReport.recent_drifts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Recent Drift Detections</h2>
          <div className="space-y-3">
            {driftReport.recent_drifts.map((drift, index) => (
              <div key={index} className="border-l-4 border-yellow-500 pl-4 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{drift.file_path}</span>
                  <span className={`text-sm font-semibold ${getSeverityColor(drift.severity)}`}>
                    {drift.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{drift.description}</p>
                <span className="text-xs text-gray-400">
                  {new Date(drift.detected_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentationDashboard;
