export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailProvider = {
  name: string;
  send(message: EmailMessage, from: string): Promise<void>;
};
