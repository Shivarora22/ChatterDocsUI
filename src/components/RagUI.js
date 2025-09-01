import React, { useState } from 'react';
import { Upload, Send, FileText, MessageCircle, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function RagUI() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadStatus({ type: 'error', message: 'Please upload a PDF file only.' });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3000/embed', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus({ 
          type: 'success', 
          message: `Successfully processed "${file.name}" and created embeddings.` 
        });
      } else {
        setUploadStatus({ 
          type: 'error', 
          message: result.message || 'Failed to process the file.' 
        });
      }
    } catch (error) {
      setUploadStatus({ 
        type: 'error', 
        message: 'Network error. Please ensure the server is running on port 3000.' 
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    const currentQuestion = question;
    setQuestion('');

    try {
      const response = await fetch('http://localhost:3000/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: currentQuestion }),
      });

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      const newEntry = {
        id: Date.now(),
        question: currentQuestion,
        answer: result.answer,
        timestamp: new Date().toLocaleTimeString()
      };

      setChatHistory(prev => [newEntry, ...prev]);
      setAnswer(result.answer);
    } catch (error) {
      const errorEntry = {
        id: Date.now(),
        question: currentQuestion,
        answer: 'Error: Unable to get an answer. Please ensure the server is running and you have uploaded documents.',
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      setChatHistory(prev => [errorEntry, ...prev]);
      setAnswer(errorEntry.answer);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleAskQuestion();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <MessageCircle className="inline-block mr-3 text-purple-400" size={40} />
            RAG Document Assistant
          </h1>
          <p className="text-purple-200">Upload PDFs and ask questions about their content</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
              <Upload className="mr-2 text-purple-400" size={24} />
              Upload Documents
            </h2>
            
            <div className="relative">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`
                  flex flex-col items-center justify-center w-full h-32 
                  border-2 border-dashed border-purple-400 rounded-xl
                  bg-purple-500/20 hover:bg-purple-500/30 transition-colors
                  ${isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                `}
              >
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-2" />
                ) : (
                  <FileText className="w-8 h-8 text-purple-400 mb-2" />
                )}
                <span className="text-purple-200 text-sm">
                  {isUploading ? 'Processing...' : 'Click to upload PDF files'}
                </span>
              </label>
            </div>

            {uploadStatus && (
              <div className={`mt-4 p-4 rounded-lg flex items-center ${
                uploadStatus.type === 'success' 
                  ? 'bg-green-500/20 border border-green-500/30' 
                  : 'bg-red-500/20 border border-red-500/30'
              }`}>
                {uploadStatus.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0" />
                )}
                <span className={uploadStatus.type === 'success' ? 'text-green-200' : 'text-red-200'}>
                  {uploadStatus.message}
                </span>
              </div>
            )}
          </div>

          {/* Question Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
              <MessageCircle className="mr-2 text-purple-400" size={24} />
              Ask Questions
            </h2>
            
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about your uploaded documents..."
                  disabled={isLoading}
                  rows={3}
                  className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none disabled:opacity-50"
                />
              </div>
              
              <button
                onClick={handleAskQuestion}
                disabled={isLoading || !question.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                {isLoading ? 'Getting Answer...' : 'Ask Question'}
              </button>
            </div>
          </div>
        </div>

        {/* Current Answer */}
        {answer && (
          <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Current Answer</h3>
            <div className={`p-4 rounded-lg ${
              chatHistory[0]?.isError 
                ? 'bg-red-500/20 border border-red-500/30 text-red-200' 
                : 'bg-green-500/20 border border-green-500/30 text-green-100'
            }`}>
              <p className="whitespace-pre-wrap">{answer}</p>
            </div>
          </div>
        )}

        {/* Chat History */}
        {chatHistory.length > 0 && (
          <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-semibold text-white mb-4">Chat History</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {chatHistory.map((entry, index) => (
                <div key={entry.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-purple-300 font-medium">Q:</span>
                    <span className="text-xs text-purple-400">{entry.timestamp}</span>
                  </div>
                  <p className="text-purple-100 mb-3">{entry.question}</p>
                  
                  <div className="flex items-start mb-2">
                    <span className={`font-medium mr-2 ${entry.isError ? 'text-red-300' : 'text-green-300'}`}>
                      A:
                    </span>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    entry.isError 
                      ? 'bg-red-500/20 border border-red-500/30 text-red-200' 
                      : 'bg-slate-800/50 border border-slate-600/30 text-slate-100'
                  }`}>
                    <p className="whitespace-pre-wrap text-sm">{entry.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-3">How to Use</h3>
          <div className="space-y-2 text-purple-200">
            <p>1. <strong className="text-purple-300">Upload:</strong> Select and upload PDF documents to build your knowledge base</p>
            <p>2. <strong className="text-purple-300">Ask:</strong> Type questions about the content of your uploaded documents</p>
            <p>3. <strong className="text-purple-300">Review:</strong> Get AI-powered answers based on document content</p>
          </div>
          <div className="mt-4 p-3 bg-purple-500/20 rounded-lg border border-purple-500/30">
            <p className="text-purple-200 text-sm">
              <strong>Note:</strong> Ensure your backend server is running on port 3000 with Ollama (Mistral model) available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}