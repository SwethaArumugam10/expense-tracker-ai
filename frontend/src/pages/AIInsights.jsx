import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { analyzeExpenses, chatWithAI } from '../utils/api';

export default function AIInsights() {
  const [insights, setInsights] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { role: 'model', content: "Hi! I'm your AI finance assistant. Ask me anything about your spending, savings goals, or budgeting tips! 💬" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await analyzeExpenses();
      setInsights(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed. Check your Gemini API key.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    const newHistory = [...chatHistory, { role: 'user', content: userMsg }];
    setChatHistory(newHistory);
    setChatLoading(true);

    try {
      const apiHistory = newHistory.slice(1).map(h => ({ role: h.role, content: h.content }));
      const res = await chatWithAI(userMsg, apiHistory.slice(0, -1));
      setChatHistory([...newHistory, { role: 'model', content: res.data.reply }]);
    } catch {
      setChatHistory([...newHistory, { role: 'model', content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const QUICK_PROMPTS = [
    'How can I reduce my food spending?',
    'What\'s my biggest expense category?',
    'Give me a savings plan for next month',
    'Am I spending too much on entertainment?',
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Insights</h1>
          <p className="page-sub">Powered by Google Gemini 1.5 Flash (Free API)</p>
        </div>
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? '🤖 Analyzing...' : '🤖 Analyze My Spending'}
        </button>
      </div>

      <div className="grid-2">
        {/* Left: AI Analysis Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!insights && !analyzing && (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>🤖</p>
              <h3 style={{ marginBottom: 8 }}>Get AI-Powered Insights</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
                Click "Analyze My Spending" to get personalized financial insights, tips, and a budget health score from Gemini AI.
              </p>
              <button className="btn btn-primary" onClick={handleAnalyze}>Run Analysis</button>
            </div>
          )}

          {analyzing && (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text2)' }}>Gemini AI is analyzing your spending patterns...</p>
            </div>
          )}

          {insights && !analyzing && (
            <>
              {/* Budget Score */}
              {insights.budgetScore !== undefined && (
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(108,99,255,0.05))', borderColor: 'rgba(108,99,255,0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: 48, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: 'var(--accent2)' }}>
                      {insights.budgetScore}/10
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: 4 }}>Budget Health Score</p>
                      <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{insights.budgetScoreReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Analysis */}
              {insights.analysis && (
                <div className="card">
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>Analysis</h3>
                  <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>{insights.analysis}</p>
                </div>
              )}

              {/* Smart Insight */}
              {insights.smartInsight && (
                <div className="card" style={{ borderLeft: '3px solid var(--amber)', borderRadius: '0 12px 12px 0' }}>
                  <p style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600, marginBottom: 6 }}>💡 SMART INSIGHT</p>
                  <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>{insights.smartInsight}</p>
                </div>
              )}

              {/* Tips */}
              {insights.tips?.length > 0 && (
                <div className="card">
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 16 }}>Money-Saving Tips</h3>
                  {insights.tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                      <span style={{ background: 'var(--accent)', color: '#fff', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                      <p style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>{tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: AI Chat */}
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>Finance AI Assistant</p>
              <p style={{ fontSize: 12, color: 'var(--green)' }}>● Online</p>
            </div>
          </div>

          <div className="chat-messages" style={{ flex: 1, minHeight: 300 }}>
            {chatHistory.map((msg, i) => (
              <div key={i} className={`chat-message ${msg.role === 'user' ? 'chat-user' : 'chat-ai'}`}>
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className="chat-message chat-ai" style={{ display: 'flex', gap: 4 }}>
                <span style={{ animation: 'spin 1s infinite' }}>●</span>
                <span style={{ opacity: 0.5 }}>Thinking...</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick prompts */}
          <div style={{ padding: '8px 16px', display: 'flex', gap: 6, flexWrap: 'wrap', borderTop: '1px solid var(--border)' }}>
            {QUICK_PROMPTS.map((p) => (
              <button key={p} className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => setChatInput(p)}>
                {p}
              </button>
            ))}
          </div>

          <form className="chat-input-row" onSubmit={handleChat}>
            <input
              className="form-input"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask about your finances..."
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" disabled={chatLoading || !chatInput.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
