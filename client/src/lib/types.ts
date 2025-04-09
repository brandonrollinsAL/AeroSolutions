export interface Platform {
  id: number;
  name: string;
  description: string;
  image: string;
  tags: string[];
}

export interface Testimonial {
  id: number;
  text: string;
  name: string;
  title: string;
  image: string;
}

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  author: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  company: string;
  message: string;
}

export interface ClientCode {
  id: number;
  code: string;
  clientName: string;
  projectId: number;
  expiresAt: Date;
}

export interface CopilotMessage {
  message: string;
}
