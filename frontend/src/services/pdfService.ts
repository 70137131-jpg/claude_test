import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface PDFDocument {
  id: string;
  filename: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  page_count?: number;
  file_size: number;
  created_at: string;
  error_message?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface QAResponse {
  status: string;
  question: string;
  answer: string;
  sources: Array<{
    chunk_index: number;
    content: string;
    metadata: any;
  }>;
  pdf_id: string;
}

class PDFService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async uploadPDF(file: File): Promise<PDFDocument> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/api/pdfs/upload`, formData, {
      headers: {
        ...this.getAuthHeader(),
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.pdf;
  }

  async listPDFs(): Promise<PDFDocument[]> {
    const response = await axios.get(`${API_URL}/api/pdfs`, {
      headers: this.getAuthHeader(),
    });

    return response.data.pdfs;
  }

  async getPDF(pdfId: string): Promise<PDFDocument> {
    const response = await axios.get(`${API_URL}/api/pdfs/${pdfId}`, {
      headers: this.getAuthHeader(),
    });

    return response.data;
  }

  async askQuestion(pdfId: string, question: string): Promise<QAResponse> {
    const response = await axios.post(
      `${API_URL}/api/pdfs/${pdfId}/ask`,
      { question },
      {
        headers: this.getAuthHeader(),
      }
    );

    return response.data;
  }

  async getChatHistory(pdfId: string, limit: number = 50): Promise<ChatMessage[]> {
    const response = await axios.get(`${API_URL}/api/pdfs/${pdfId}/history`, {
      params: { limit },
      headers: this.getAuthHeader(),
    });

    return response.data.messages;
  }

  async summarizePDF(pdfId: string): Promise<QAResponse> {
    const response = await axios.post(
      `${API_URL}/api/pdfs/${pdfId}/summary`,
      {},
      {
        headers: this.getAuthHeader(),
      }
    );

    return response.data;
  }

  async deletePDF(pdfId: string): Promise<void> {
    await axios.delete(`${API_URL}/api/pdfs/${pdfId}`, {
      headers: this.getAuthHeader(),
    });
  }
}

export default new PDFService();
