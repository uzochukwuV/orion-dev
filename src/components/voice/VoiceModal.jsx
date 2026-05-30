/**
 * VoiceModal — Real-time voice with AI loop-back
 * 
 * Flow:
 * 1. User speaks → microphone records
 * 2. Audio → WebSocket → Speechmatics → transcript
 * 3. On final transcript → SuperAgent processes
 * 4. Agent response → TTS playback (Web Speech API)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, X, Loader2, Volume2, Bot } from 'lucide-react';
import { useAuth } from '@/lib/useOrionAuth';

export default function VoiceModal({ isOpen, onClose, onTranscript }) {
  const { business } = useAuth();
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [agentThinking, setAgentThinking] = useState(false);
  const [agentResponse, setAgentResponse] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);

  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const partialBufferRef = useRef('');
  const speechSynthesisRef = useRef(window.speechSynthesis);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);

  // Speak text using Web Speech API
  const speak = useCallback((text) => {
    if (!speechSynthesisRef.current) return;
    
    // Cancel any ongoing speech
    speechSynthesisRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Try to use a good voice
    const voices = speechSynthesisRef.current.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') || v.name.includes('Samantha') || v.lang.startsWith('en')
    );
    if (preferredVoice) utterance.voice = preferredVoice;
    
    speechSynthesisRef.current.speak(utterance);
  }, []);

  // Stop recording and cleanup
  const stopAll = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    
    // Cancel speech synthesis
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
    
    setRecording(false);
    setConnecting(false);
  }, []);

  const startRecording = async () => {
    setConnecting(true);
    setError(null);
    setTranscript('');
    setPartialTranscript('');
    setAgentResponse(null);
    setAgentThinking(false);
    partialBufferRef.current = '';
    
    // Load voices (needed for some browsers)
    if (speechSynthesisRef.current.getVoices().length === 0) {
      speechSynthesisRef.current.onvoiceschanged = () => {
        speechSynthesisRef.current.onvoiceschanged = null;
      };
    }

    try {
      // Get audio stream from microphone
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      streamRef.current = stream;

      // Setup MediaRecorder to capture audio
      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      });
      mediaRecorderRef.current = mediaRecorder;

      // Connect to WebSocket relay
      const wsUrl = `ws://localhost:3001/ws/voice?session=${business?.id || 'demo'}&business=${business?.id || 'demo'}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        console.log('✓ Voice WebSocket connected');
        setConnecting(false);
        setRecording(true);

        // Send audio chunks as we record
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };

        // Record with 500ms chunks for streaming
        mediaRecorder.start(500);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'partial') {
          partialBufferRef.current = data.text;
          setPartialTranscript(data.text);
          setConfidence(data.confidence || 0);
        } else if (data.type === 'transcript' || data.type === 'final') {
          setTranscript(data.text);
          setPartialTranscript('');
          if (onTranscript) onTranscript(data.text);
        } else if (data.type === 'agent_response') {
          // Agent has responded — speak it and display
          setAgentThinking(false);
          setAgentResponse(data.text);
          
          // Add to conversation history
          setConversationHistory(prev => [...prev, {
            role: 'assistant',
            content: data.text,
            timestamp: new Date().toISOString()
          }]);
          
          // Speak the response
          speak(data.text);
        } else if (data.type === 'error') {
          setError(data.error || data.message);
          console.error('Voice error:', data.error || data.message);
          setAgentThinking(false);
        } else if (data.type === 'connected') {
          console.log('✓ Voice service connected');
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Connection error. Please try again.');
        setRecording(false);
        setAgentThinking(false);
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setRecording(false);
        setAgentThinking(false);
      };
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(err.message || 'Failed to access microphone');
      setConnecting(false);
    }
  };

  const stopRecording = async () => {
    setRecording(false);

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    // Send end-of-stream marker
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end' }));
      
      // Show agent is thinking
      if (transcript) {
        setAgentThinking(true);
        setConversationHistory(prev => [...prev, {
          role: 'user',
          content: transcript,
          timestamp: new Date().toISOString()
        }]);
      }
    }

    // Close WebSocket after a brief delay
    setTimeout(() => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }, 500);
  };

  // Manual trigger for agent response
  const requestAgentResponse = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && transcript) {
      wsRef.current.send(JSON.stringify({ type: 'get_ai_response' }));
      setAgentThinking(true);
    }
  };

  // Stop speech synthesis
  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-electric-violet/10 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-electric-violet" />
            </div>
            <div>
              <h2 className="font-montserrat font-medium text-[18px] text-midnight-ink">Orion Voice</h2>
              <p className="text-[11px] text-muted-ash">AI-powered voice assistant</p>
            </div>
          </div>
          <button onClick={stopAll} className="p-1 hover:bg-cloud-canvas rounded-lg transition-all">
            <X className="w-5 h-5 text-muted-ash" />
          </button>
        </div>

        {/* Visualization */}
        <div className="bg-cloud-canvas rounded-xl p-6 mb-6 min-h-[140px] flex flex-col items-center justify-center">
          {recording ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-electric-violet/20 flex items-center justify-center animate-pulse">
                    <Volume2 className="w-8 h-8 text-electric-violet" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-ping" />
                </div>
              </div>
              <p className="text-[13px] font-inter text-midnight-ink font-medium">Listening…</p>
              {confidence > 0 && (
                <p className="text-[11px] font-inter text-muted-ash mt-1">Confidence: {Math.round(confidence * 100)}%</p>
              )}
            </div>
          ) : agentThinking ? (
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-electric-violet animate-spin mx-auto mb-3" />
              <p className="text-[13px] font-inter text-midnight-ink">Orion is thinking…</p>
              <p className="text-[11px] text-muted-ash mt-1">Processing your request</p>
            </div>
          ) : connecting ? (
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-electric-violet animate-spin mx-auto mb-3" />
              <p className="text-[13px] font-inter text-midnight-ink">Connecting to voice service…</p>
            </div>
          ) : (
            <div className="text-center">
              <Mic className="w-8 h-8 text-muted-ash mx-auto mb-3" />
              <p className="text-[13px] font-inter text-midnight-ink">Tap to speak with Orion</p>
            </div>
          )}
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <p className="text-[12px] font-inter font-medium text-blue-700 mb-2 flex items-center gap-1">
              <Mic className="w-3 h-3" /> You said
            </p>
            <p className="text-[13px] font-inter text-blue-900">{transcript}</p>
          </div>
        )}

        {/* Partial Transcript */}
        {partialTranscript && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
            <p className="text-[12px] font-inter font-medium text-gray-500 mb-2">Listening…</p>
            <p className="text-[13px] font-inter text-gray-700 italic">{partialTranscript}</p>
          </div>
        )}

        {/* Agent Response */}
        {agentResponse && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-3.5 h-3.5 text-green-600" />
              <span className="text-[12px] font-inter font-medium text-green-700">Orion responded</span>
              <button 
                onClick={() => speak(agentResponse)}
                className="ml-auto p-1 hover:bg-green-100 rounded"
                title="Replay"
              >
                <Volume2 className="w-3.5 h-3.5 text-green-600" />
              </button>
            </div>
            <p className="text-[13px] font-inter text-green-900 leading-relaxed">{agentResponse}</p>
          </div>
        )}

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
            {conversationHistory.slice(-4).map((msg, i) => (
              <div 
                key={i}
                className={`text-[11px] p-2 rounded ${msg.role === 'user' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}
              >
                {msg.role === 'user' ? 'You' : 'Orion'}: {msg.content.substring(0, 100)}{msg.content.length > 100 ? '…' : ''}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-[12px] font-inter font-medium text-red-700">Error</p>
            <p className="text-[13px] font-inter text-red-900">{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={connecting}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-[13px] font-inter font-medium transition-all ${
              recording
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-electric-violet text-white hover:opacity-90'
            } disabled:opacity-50`}
          >
            {connecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting…
              </>
            ) : recording ? (
              <>
                <Square className="w-4 h-4" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Start Recording
              </>
            )}
          </button>

          {transcript && !agentResponse && !agentThinking && (
            <button
              onClick={requestAgentResponse}
              className="px-4 py-3 bg-green-500 text-white rounded-lg text-[13px] font-inter font-medium hover:bg-green-600 transition-all flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              Ask Orion
            </button>
          )}

          {agentResponse && (
            <button
              onClick={stopSpeaking}
              className="px-4 py-3 bg-cloud-canvas text-midnight-ink rounded-lg text-[13px] font-inter font-medium hover:bg-ghost-border transition-all"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={stopAll}
            className="px-4 py-3 bg-cloud-canvas text-midnight-ink rounded-lg text-[13px] font-inter font-medium hover:bg-ghost-border transition-all"
          >
            Close
          </button>
        </div>

        {/* Instructions */}
        <p className="text-[11px] font-inter text-muted-ash text-center mt-4">
          Click "Start Recording" to speak with Orion. Your voice will be transcribed and processed by AI.
        </p>
      </div>
    </div>
  );
}
