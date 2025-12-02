import React, { useState, useEffect, useRef } from 'react';
import pdfService, { PDFDocument, ChatMessage } from '../services/pdfService';

const PDFChat: React.FC = () => {
  const [pdfs, setPdfs] = useState<PDFDocument[]>([]);
  const [selectedPDF, setSelectedPDF] = useState<PDFDocument | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPDFs();
  }, []);

  useEffect(() => {
    if (selectedPDF) {
      loadChatHistory(selectedPDF.id);
    }
  }, [selectedPDF]);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadPDFs = async () => {
    try {
      const pdfList = await pdfService.listPDFs();
      setPdfs(pdfList);
    } catch (error) {
      console.error('Error loading PDFs:', error);
      alert('Failed to load PDFs');
    }
  };

  const loadChatHistory = async (pdfId: string) => {
    try {
      const history = await pdfService.getChatHistory(pdfId);
      setChatHistory(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please select a PDF file');
      return;
    }

    setUploading(true);
    try {
      const uploadedPDF = await pdfService.uploadPDF(file);
      setPdfs([uploadedPDF, ...pdfs]);
      setSelectedPDF(uploadedPDF);
      alert('PDF uploaded and processed successfully!');
    } catch (error: any) {
      console.error('Error uploading PDF:', error);
      alert(error.response?.data?.error || 'Failed to upload PDF');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPDF || !question.trim()) return;

    setLoading(true);
    const userQuestion = question;
    setQuestion('');

    try {
      const response = await pdfService.askQuestion(selectedPDF.id, userQuestion);

      // Add question and answer to chat history
      const newMessages: ChatMessage[] = [
        {
          id: Date.now().toString(),
          role: 'user',
          content: userQuestion,
          created_at: new Date().toISOString(),
        },
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.answer,
          created_at: new Date().toISOString(),
        },
      ];

      setChatHistory([...chatHistory, ...newMessages]);
    } catch (error: any) {
      console.error('Error asking question:', error);
      alert(error.response?.data?.error || 'Failed to get answer');
      setQuestion(userQuestion); // Restore question on error
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!selectedPDF) return;

    setLoading(true);
    try {
      const response = await pdfService.summarizePDF(selectedPDF.id);

      const newMessages: ChatMessage[] = [
        {
          id: Date.now().toString(),
          role: 'user',
          content: 'Please summarize this document',
          created_at: new Date().toISOString(),
        },
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.answer,
          created_at: new Date().toISOString(),
        },
      ];

      setChatHistory([...chatHistory, ...newMessages]);
    } catch (error: any) {
      console.error('Error summarizing PDF:', error);
      alert(error.response?.data?.error || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - PDF List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800 mb-4">PDF Q&A Assistant</h1>
          <label className="block">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : '+ Upload PDF'}
            </button>
          </label>
        </div>

        <div className="flex-1 overflow-y-auto">
          {pdfs.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">
              <p>No PDFs uploaded yet</p>
              <p className="text-sm mt-2">Upload a PDF to get started</p>
            </div>
          ) : (
            pdfs.map((pdf) => (
              <div
                key={pdf.id}
                onClick={() => setSelectedPDF(pdf)}
                className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                  selectedPDF?.id === pdf.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="font-medium text-gray-800 truncate">{pdf.filename}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {pdf.status === 'ready' ? (
                    <>
                      {pdf.page_count} pages • {formatFileSize(pdf.file_size)}
                    </>
                  ) : (
                    <span className="text-yellow-600">Status: {pdf.status}</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(pdf.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedPDF ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-800">{selectedPDF.filename}</h2>
              <p className="text-sm text-gray-500">
                {selectedPDF.page_count} pages • {formatFileSize(selectedPDF.file_size)}
              </p>
              <button
                onClick={handleSummarize}
                disabled={loading || selectedPDF.status !== 'ready'}
                className="mt-2 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                Generate Summary
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p className="text-lg">Ask a question about this PDF</p>
                  <p className="text-sm mt-2">Try: "What is the main topic of this document?"</p>
                </div>
              ) : (
                chatHistory.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-3xl px-4 py-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                      <div
                        className={`text-xs mt-1 ${
                          msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse">Thinking...</div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={handleAskQuestion} className="flex space-x-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about this PDF..."
                  disabled={loading || selectedPDF.status !== 'ready'}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
                <button
                  type="submit"
                  disabled={loading || !question.trim() || selectedPDF.status !== 'ready'}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="text-xl">Select a PDF or upload a new one to get started</p>
              <p className="text-sm mt-2">Your AI assistant is ready to answer questions</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFChat;
