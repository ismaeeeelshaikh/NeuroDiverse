'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

interface AIAssistantProps {
  isOpen?: boolean;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen: propIsOpen = false }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(propIsOpen);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [speechConfig, setSpeechConfig] = useState<sdk.SpeechConfig | null>(null);
  const recognizerRef = useRef<sdk.SpeechRecognizer | null>(null);
  const synthesizerRef = useRef<sdk.SpeechSynthesizer | null>(null);

  useEffect(() => {
    // Initialize speech services
    const initializeSpeechServices = async () => {
      try {
        const subscriptionKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
        const region = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION;

        if (!subscriptionKey || !region) {
          console.error('Azure Speech Service credentials not found');
          return;
        }

        const config = sdk.SpeechConfig.fromSubscription(subscriptionKey, region);
        config.speechRecognitionLanguage = 'en-US';
        config.speechSynthesisLanguage = 'en-US';
        config.speechSynthesisVoiceName = 'en-US-JennyNeural';

        setSpeechConfig(config);

        // Initialize speech recognizer
        const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
        const recognizer = new sdk.SpeechRecognizer(config, audioConfig);

        recognizer.recognized = (s, e) => {
          if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
            const text = e.result.text.trim();
            if (text) {
              setTranscript(text);
              handleCommand(text);
            }
          }
        };

        recognizerRef.current = recognizer;

        // Initialize speech synthesizer
        const synthesizer = new sdk.SpeechSynthesizer(config);
        synthesizerRef.current = synthesizer;

      } catch (error) {
        console.error('Error initializing speech services:', error);
      }
    };

    initializeSpeechServices();

    return () => {
      // Cleanup
      if (recognizerRef.current) {
        recognizerRef.current.close();
      }
      if (synthesizerRef.current) {
        synthesizerRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (isListening && recognizerRef.current) {
      recognizerRef.current.startContinuousRecognitionAsync(
        () => console.log('Speech recognition started'),
        (error) => console.error('Error starting speech recognition:', error)
      );
    } else if (!isListening && recognizerRef.current) {
      recognizerRef.current.stopContinuousRecognitionAsync(
        () => console.log('Speech recognition stopped'),
        (error) => console.error('Error stopping speech recognition:', error)
      );
    }
  }, [isListening]);

  const speakText = async (text: string) => {
    if (!synthesizerRef.current) return;

    try {
      const result = await synthesizerRef.current.speakTextAsync(text);
      if (result) {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          console.log('Speech synthesis completed');
        } else {
          console.error('Speech synthesis canceled or failed');
        }
      }
    } catch (error) {
      console.error('Error synthesizing speech:', error);
    }
  };

  const handleCommand = async (command: string) => {
    const lowerCommand = command.toLowerCase();

    // Navigation commands
    if (lowerCommand.includes('open diary') || lowerCommand.includes('go to diary')) {
      router.push('/dashboard/diary');
      await speakText('Opening diary page');
    } else if (lowerCommand.includes('open music') || lowerCommand.includes('play music')) {
      router.push('/dashboard/music');
      await speakText('Opening music player');
    } else if (lowerCommand.includes('open meditation') || lowerCommand.includes('meditate')) {
      router.push('/dashboard/meditate');
      await speakText('Opening meditation page');
    } else if (lowerCommand.includes('go to dashboard') || lowerCommand.includes('show dashboard')) {
      router.push('/dashboard');
      await speakText('Going to dashboard');
    } else if (lowerCommand.includes('open chat') || lowerCommand.includes('start chat')) {
      router.push('/dashboard/chatbot');
      await speakText('Opening chat');
    }
    // Add more commands as needed
    else {
      // If no specific command is recognized, send to chat API
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ message: command })
        });

        const data = await response.json();
        if (data.response) {
          setResponse(data.response);
          await speakText(data.response);
        }
      } catch (error) {
        console.error('Error processing command:', error);
        await speakText('Sorry, I encountered an error processing your request.');
      }
    }
  };

  return (
    <>
      <motion.button
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-purple-600 text-white shadow-lg flex items-center justify-center z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-robot'} text-xl`}></i>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-44 right-6 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-50"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-purple-600 text-white p-4">
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-xs opacity-80">
                {isListening ? 'Listening...' : 'Click the microphone to start'}
              </p>
            </div>

            <div className="p-4">
              {transcript && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">You said:</p>
                  <p className="text-gray-800">{transcript}</p>
                </div>
              )}
              {response && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Response:</p>
                  <p className="text-gray-800">{response}</p>
                </div>
              )}
              <button
                onClick={() => setIsListening(!isListening)}
                className={`w-full py-2 px-4 rounded-lg transition-colors ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
              >
                <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'} mr-2`}></i>
                {isListening ? 'Stop Listening' : 'Start Listening'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant; 