import { useState, useRef, useEffect, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import { useSettings } from "@/context/SettingsContext";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

export function FloatingChat() {
  const { theme, aiSettings, isAIReady, getProvider } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("workspace-chat-messages");
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) }));
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem("workspace-chat-messages", JSON.stringify(messages.filter(m => !m.isTyping)));
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const formatContent = (content: string): ReactNode[] => {
    const lines = content.split('\n');
    
    return lines.map((line, lineIndex) => {
      const processedLine = line;
      const elements: ReactNode[] = [];
      let lastIndex = 0;
      
      const inlineCodeRegex = /`([^`]+)`/g;
      let match;
      
      const tempElements: { start: number; end: number; element: ReactNode }[] = [];
      
      while ((match = inlineCodeRegex.exec(processedLine)) !== null) {
        tempElements.push({
          start: match.index,
          end: match.index + match[0].length,
          element: (
            <code key={`code-${lineIndex}-${match.index}`} className={cn("px-1.5 py-0.5 rounded text-xs font-mono", theme.inputBg, theme.textSecondary)}>
              {match[1]}
            </code>
          )
        });
      }
      
      const boldRegex = /\*\*([^*]+)\*\*/g;
      while ((match = boldRegex.exec(processedLine)) !== null) {
        tempElements.push({
          start: match.index,
          end: match.index + match[0].length,
          element: <strong key={`bold-${lineIndex}-${match.index}`} className="font-semibold">{match[1]}</strong>
        });
      }
      
      const italicRegex = /\*([^*]+)\*/g;
      while ((match = italicRegex.exec(processedLine)) !== null) {
        const isPartOfBold = tempElements.some(e => match!.index >= e.start && match!.index < e.end);
        if (!isPartOfBold) {
          tempElements.push({
            start: match.index,
            end: match.index + match[0].length,
            element: <em key={`italic-${lineIndex}-${match.index}`} className="italic">{match[1]}</em>
          });
        }
      }
      
      tempElements.sort((a, b) => a.start - b.start);
      
      const finalElements: { start: number; end: number; element: ReactNode }[] = [];
      for (const el of tempElements) {
        const overlaps = finalElements.some(e => 
          (el.start >= e.start && el.start < e.end) || (el.end > e.start && el.end <= e.end)
        );
        if (!overlaps) {
          finalElements.push(el);
        }
      }
      
      for (const el of finalElements) {
        if (el.start > lastIndex) {
          elements.push(processedLine.slice(lastIndex, el.start));
        }
        elements.push(el.element);
        lastIndex = el.end;
      }
      
      if (lastIndex < processedLine.length) {
        elements.push(processedLine.slice(lastIndex));
      }
      
      if (elements.length === 0) {
        elements.push(processedLine);
      }
      
      if (line.startsWith('# ')) {
        return <div key={lineIndex} className="text-base font-bold mt-2 mb-1">{line.slice(2)}</div>;
      }
      if (line.startsWith('## ')) {
        return <div key={lineIndex} className="text-sm font-bold mt-2 mb-1">{line.slice(3)}</div>;
      }
      if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
        return <div key={lineIndex} className="flex gap-2 ml-2"><span>•</span><span>{elements.slice(0)}</span></div>;
      }
      if (/^\d+\.\s/.test(line)) {
        const num = line.match(/^(\d+)\./)?.[1];
        return <div key={lineIndex} className="flex gap-2 ml-2"><span>{num}.</span><span>{line.replace(/^\d+\.\s/, '')}</span></div>;
      }
      
      return <div key={lineIndex}>{elements}</div>;
    });
  };

  const callAI = async (userMessage: string): Promise<string> => {
    const providerId = aiSettings.providerId;
    const modelId = aiSettings.selectedModelId;
    const rawApiKey = aiSettings.apiKey || "";
    const apiKey = rawApiKey.trim();
    
    // Log for debugging (remove in production)
    console.log("callAI - Provider:", providerId);
    console.log("callAI - Model:", modelId);
    console.log("callAI - API Key present:", apiKey.length > 0, "length:", apiKey.length);
    
    if (!apiKey) {
      throw new Error("No API key configured. Please add your API key in Settings.");
    }

    const systemPrompt = (aiSettings.systemPrompt || "You are a helpful assistant.") + "\n\nIMPORTANT: Do not use HTML tags in your response. Use plain text with markdown-style formatting only (like **bold**, *italic*, `code`, - bullet points).";

    const conversationHistory = messages
      .filter(m => !m.isTyping && m.role !== 'system')
      .slice(-10)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    let url: string;
    let headers: Record<string, string>;
    let body: string;

    if (providerId === 'openrouter') {
      url = 'https://openrouter.ai/api/v1/chat/completions';
      
      // Ensure Authorization header is properly formatted
      const authHeader = `Bearer ${apiKey}`;
      console.log("callAI - Auth header starts with 'Bearer sk-':", authHeader.startsWith("Bearer sk-"));
      
      headers = {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Workspace Chat'
      };
      body = JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: userMessage }
        ],
        max_tokens: 2048
      });
      
      console.log("callAI - Request URL:", url);
      console.log("callAI - Request model:", modelId);
    } else if (providerId === 'gemini') {
      url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
      headers = { 'Content-Type': 'application/json' };
      const contents = [
        ...conversationHistory.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        { role: 'user', parts: [{ text: userMessage }] }
      ];
      body = JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { maxOutputTokens: 2048 }
      });
    } else if (providerId === 'deepseek') {
      url = 'https://api.deepseek.com/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      body = JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: userMessage }
        ],
        max_tokens: 2048
      });
    } else if (providerId === 'groq') {
      url = 'https://api.groq.com/openai/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      body = JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: userMessage }
        ],
        max_tokens: 2048
      });
    } else {
      throw new Error(`Unknown provider: ${providerId}`);
    }

    console.log("callAI - Making fetch request to:", url);
    console.log("callAI - Headers:", JSON.stringify(headers, null, 2));
    
    const response = await fetch(url, { method: 'POST', headers, body });
    
    console.log("callAI - Response status:", response.status);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const responseText = await response.text();
        console.log("callAI - Error response text:", responseText);
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error?.message || errorData.error || errorData.message || responseText;
        } catch {
          errorMessage = responseText || errorMessage;
        }
      } catch {
        // ignore
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("callAI - Response data:", data);

    if (providerId === 'gemini') {
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    } else {
      // OpenAI-compatible format (OpenRouter, DeepSeek, Groq)
      const content = data.choices?.[0]?.message?.content;
      if (data.choices?.[0]?.message?.reasoning_content) {
        return `**Thinking:** ${data.choices[0].message.reasoning_content}\n\n**Answer:** ${content}`;
      }
      return content || 'No response';
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Double check API key before proceeding
    const currentApiKey = aiSettings.apiKey?.trim();
    
    if (!isAIReady()) {
      const keyPreview = currentApiKey 
        ? `Key found (${currentApiKey.substring(0, 10)}...) but not validated.`
        : "No API key found.";
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: `⚠️ AI not ready. ${keyPreview} Please go to Settings → AI Chatbot to validate your API key.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemMessage]);
      setIsLoading(false);
      return;
    }
    
    // Extra safety check - even if isAIReady() passed, verify key exists
    if (!currentApiKey) {
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: `⚠️ API key is missing. Settings may be corrupted. Please re-enter and validate your API key in Settings → AI Chatbot.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemMessage]);
      setIsLoading(false);
      return;
    }

    const typingMessage: Message = {
      id: "typing",
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const response = await callAI(userMessage.content);
      
      setMessages(prev => prev.filter(m => m.id !== "typing"));
      
      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Typewriter effect
      let currentText = "";
      for (let i = 0; i < response.length; i++) {
        currentText += response[i];
        const textToSet = currentText;
        setMessages(prev => 
          prev.map(m => m.id === assistantMessage.id ? { ...m, content: textToSet } : m)
        );
        await new Promise(r => setTimeout(r, 8));
      }
      
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== "typing"));
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: "system",
        content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("workspace-chat-messages");
  };

  const provider = getProvider();

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110",
            "bg-gradient-to-br", theme.accentGradientFrom, theme.accentGradientTo
          )}
        >
          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl border overflow-hidden transition-all duration-300",
            isMinimized ? "h-14 w-80" : "h-[500px] w-96",
            theme.cardBg, theme.cardBorder
          )}
        >
          {/* Header */}
          <div 
            className={cn(
              "flex items-center justify-between px-4 py-3 cursor-pointer",
              "bg-gradient-to-r", theme.accentGradientFrom, theme.accentGradientTo
            )}
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
                <p className="text-xs text-white/70">
                  {isAIReady() 
                    ? `${provider.name} • ${aiSettings.selectedModelId.split('/').pop()?.replace(':free', '')}` 
                    : aiSettings.apiKey 
                      ? "Key found, not validated" 
                      : "No API key"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  {isMinimized ? (
                    <polyline points="15 3 21 3 21 9" />
                  ) : (
                    <polyline points="4 14 10 14 10 20" />
                  )}
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className={cn("flex-1 overflow-y-auto p-4 space-y-3", theme.surfaceBg)}>
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <div className={cn("h-12 w-12 rounded-full flex items-center justify-center mb-3", theme.inputBg)}>
                      <svg className={cn("h-6 w-6", theme.textMuted)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <p className={cn("text-sm font-medium", theme.textSecondary)}>Start a conversation</p>
                    <p className={cn("text-xs mt-1", theme.textMuted)}>
                      {isAIReady() ? "Ask me anything!" : "Configure AI in Settings first"}
                    </p>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                        message.role === "user"
                          ? cn("bg-gradient-to-br text-white", theme.accentGradientFrom, theme.accentGradientTo)
                          : message.role === "system"
                          ? cn("border", theme.cardBg, theme.cardBorder, theme.textSecondary)
                          : cn(theme.cardBg, theme.textPrimary, "border", theme.cardBorder)
                      )}
                    >
                      {message.isTyping ? (
                        <div className="flex items-center gap-1 py-1">
                          <div className={cn("h-2 w-2 rounded-full animate-bounce", theme.accent)} style={{ animationDelay: "0ms" }} />
                          <div className={cn("h-2 w-2 rounded-full animate-bounce", theme.accent)} style={{ animationDelay: "150ms" }} />
                          <div className={cn("h-2 w-2 rounded-full animate-bounce", theme.accent)} style={{ animationDelay: "300ms" }} />
                        </div>
                      ) : message.role === "assistant" ? (
                        <div className="space-y-1 leading-relaxed">
                          {formatContent(message.content)}
                        </div>
                      ) : (
                        <span>{message.content}</span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className={cn("p-3 border-t", theme.cardBg, theme.cardBorder)}>
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className={cn("text-xs mb-2 px-2 py-1 rounded", theme.hoverBg, theme.textMuted, "hover:text-red-500")}
                  >
                    Clear chat
                  </button>
                )}
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className={cn(
                      "flex-1 resize-none rounded-xl px-3 py-2 text-sm outline-none transition-colors",
                      theme.inputBg, theme.inputBorder, theme.textPrimary,
                      "focus:ring-2", theme.inputFocusRing,
                      "placeholder:text-gray-400"
                    )}
                    style={{ maxHeight: "80px" }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                      input.trim() && !isLoading
                        ? cn("bg-gradient-to-br text-white", theme.accentGradientFrom, theme.accentGradientTo)
                        : cn(theme.inputBg, theme.textMuted, "cursor-not-allowed")
                    )}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
