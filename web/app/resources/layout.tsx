import FloatingChatWidget, { ChatProvider } from "@/components/FloatingChatWidget";

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatProvider>
      {children}
      <FloatingChatWidget />
    </ChatProvider>
  );
}
