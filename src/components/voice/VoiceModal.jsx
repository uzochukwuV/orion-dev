/**
 * VoiceModal — Real-time voice transcription via Speechmatics WebSocket
 */

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, X, Loader2, Volume2 } from 'lucide-react';

export default function VoiceModal({ isOpen, onClose, businessId = 'demo', onTranscript }) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState(0);

  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const partialBufferRef = useRef('');

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const startRecording = async () => {
    setConnecting(true);
    setError(null);
    setTranscript('');
    setPartialTranscript('');
    partialBufferRef.current = '';

    try {
      // Get audio stream from microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup MediaRecorder to capture audio
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      // Connect to WebSocket relay
      const wsUrl = `ws://localhost:3001/ws/voice?session=${businessId}&business=${businessId}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        console.log('✓ WebSocket connected');
        setConnecting(false);
        setRecording(true);

        // Send audio chunks as we record
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
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
        } else if (data.type === 'final') {
          setTranscript(data.text);
          setPartialTranscript('');
          if (onTranscript) {
            onTranscript(data.text);
          }
        } else if (data.type === 'error') {
          setError(data.message);
          console.error('Transcription error:', data.message);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Connection error. Please try again.');
        setRecording(false);
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setRecording(false);
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

    // Close WebSocket gracefully
    if (wsRef.current) {
      // Send end-of-stream marker
      wsRef.current.send(JSON.stringify({ type: 'end' }));
      // Close after a brief delay to allow final transcript
      setTimeout(() => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      }, 500);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-montserrat font-medium text-[18px] text-midnight-ink">Voice Transcription</h2>
          <button onClick={onClose} className="p-1 hover:bg-cloud-canvas rounded-lg transition-all">
            <X className="w-5 h-5 text-muted-ash" />
          </button>
        </div>

        {/* Visualization */}
        <div className="bg-cloud-canvas rounded-xl p-6 mb-6 min-h-[120px] flex flex-col items-center justify-center">
          {recording ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <Volume2 className="w-8 h-8 text-electric-violet animate-pulse" />
              </div>
              <p className="text-[13px] font-inter text-midnight-ink font-medium">Listening…</p>
              {confidence > 0 && <p className="text-[11px] font-inter text-muted-ash mt-1">Confidence: {Math.round(confidence * 100)}%</p>}
            </div>
          ) : connecting ? (
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-electric-violet animate-spin mx-auto mb-3" />
              <p className="text-[13px] font-inter text-midnight-ink">Connecting to microphone…</p>
            </div>
          ) : (
            <div className="text-center">
              <Mic className="w-8 h-8 text-muted-ash mx-auto mb-3" />
              <p className="text-[13px] font-inter text-midnight-ink">Click record to start</p>
            </div>
          )}
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-[12px] font-inter font-medium text-green-700 mb-2">Final Transcript</p>
            <p className="text-[13px] font-inter text-green-900">{transcript}</p>
          </div>
        )}

        {/* Partial Transcript */}
        {partialTranscript && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-[12px] font-inter font-medium text-blue-700 mb-2">Listening…</p>
            <p className="text-[13px] font-inter text-blue-900 italic">{partialTranscript}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
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

          <button
            onClick={onClose}
            className="px-4 py-3 bg-cloud-canvas text-midnight-ink rounded-lg text-[13px] font-inter font-medium hover:bg-ghost-border transition-all"
          >
            Close
          </button>
        </div>

        {/* Instructions */}
        <p className="text-[11px] font-inter text-muted-ash text-center mt-4">
          Click "Start Recording" to begin voice input. Your speech will be transcribed in real-time.
        </p>
      </div>
    </div>
  );
}
